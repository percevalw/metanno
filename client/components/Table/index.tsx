import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  KeyboardEvent,
  UIEvent,
  FocusEvent,
  useCallback,
  memo,
} from "react";
import { DndProvider, DndContext } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DataGrid, { CalculatedColumn, DataGridHandle, EditorProps, Row, RowRendererProps } from "react-data-grid";

import "./style.css";
import { makeModKeys, memoize } from "../../utils";

import HeaderRenderer from "../DraggableHeaderRenderer";
import { InputTag, SingleInputSuggest, MultiInputSuggest } from "../InputSuggest";
import BooleanInput from "../BooleanInput";
import { ColumnData, RowData, TableData, TableMethods } from "../../types";
import { getCurrentEvent, useEventCallback, useCachedReconcile } from "../../utils";

const ROW_HEIGHT = 25;
const HEADER_ROW_HEIGHT = 65;

function inputStopPropagation(event: KeyboardEvent<HTMLInputElement>) {
  const input = event.target as HTMLInputElement;
  const cursorPosition = input.selectionStart;

  if (event.key === "ArrowLeft" && cursorPosition > 0) {
    event.stopPropagation();
  }
  if (event.key === "ArrowRight" && cursorPosition < input.value.length) {
    event.stopPropagation();
  }
}

const SuggestionsContext = React.createContext<any>(undefined);
SuggestionsContext.displayName = "SuggestionsContext";
DndContext.displayName = "DndContext";

const setOnMapping = (mapping: Map<string, any> | { [key: string]: any }, key: string, value: any) => {
  if (mapping instanceof Map) {
    mapping.set(key, value);
  } else {
    mapping[key] = value;
  }
};


export const Table = function Table(props: TableData & TableMethods) {
  const [columnsOrder, setColumnsOrder] = useState(props.columns.map((column) => column.key));
  const [position, setPosition] = useState<TableData["position"] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  // If filters are not controlled via props, we use local state
  const [localFilters, setLocalFilters] = useState<{ [key: string]: string }>({});
  const effectiveFilters = props.filters === undefined ? localFilters : props.filters;

  // Helper: convert relative row index (from DataGrid) to an absolute row index.
  const getAbsoluteRowIdx = useEventCallback((relativeIdx: number): number =>
    effectiveSubset !== undefined ? effectiveSubset[relativeIdx] : relativeIdx
  );

  const gridRef = useRef<DataGridHandle>(null);
  const inputRef = useRef<any>(null);
  const lastScrollTopRef = useRef(0);

  // --- Update subset when filters change ---
  const localSubset = useMemo(() => {
    if (props.autoFilter && effectiveFilters && (props.subset === undefined || props.onSubsetChange)) {
      const lowercaseFilters = memoize((filters: { [key: string]: string }) =>
        Object.fromEntries(
          Object.entries(filters)
            .filter(([key, value]) => value !== "")
            .map(([key, value]) => [key, value.toLowerCase()])
        )
      )(effectiveFilters);
      const newSubset = props.rows
        .map((row, idx) => ({ row, idx }))
        .filter(({ row }) =>
          Object.entries(lowercaseFilters).every(
            ([key, value]) =>
              row[key] !== undefined && row[key] !== null && row[key].toString().toLowerCase().includes(value)
          )
        )
        .map(({ idx }) => idx);
      props.onSubsetChange?.(newSubset);
      return newSubset;
    } else {
      return undefined;
    }
  }, [effectiveFilters, props.rows, props.autoFilter, props.filters]);
  const effectiveSubset = props.subset !== undefined ? props.subset : localSubset;

  // Update actions to work with absolute indices.
  useEffect(() => {
    if (props.actions) {
      setOnMapping(props.actions, "scroll_to_row", (absRowIdx: number) => {
        const relativeIdx = effectiveSubset ? effectiveSubset.indexOf(absRowIdx) : absRowIdx;
        if (relativeIdx !== -1) {
          gridRef.current?.scrollToRow(relativeIdx);
        }
      });
      setOnMapping(props.actions, "focus", () => {
        const input = inputRef.current?.input || inputRef.current;
        const event = getCurrentEvent();
        event.preventDefault();
        if (input) {
          input.focus();
        } else {
          gridRef.current?.element.focus();
        }
      });
    }
  }, [props.actions, props.rows, props.rowKey, effectiveSubset]);

  // Compute visibleRows using the effectiveSubset.
  // (We simply slice the props.rows array instead of decorating rows with an absolute index.)
  const visibleRows = useMemo(() => {
    if (effectiveSubset !== undefined) {
      return effectiveSubset.map((idx) => props.rows[idx]);
    }
    return props.rows;
  }, [props.rows, effectiveSubset]);

  const makeInputChangeHandler =
    (relativeRowIdx: number, column: ColumnData | CalculatedColumn<RowData, RowData>) => (value: any, cause: any) => {
      const absRowIdx = getAbsoluteRowIdx(relativeRowIdx);
      props.onInputChange?.(absRowIdx, column.key, value, cause);
    };

  const onHeaderDrop = (source: string, target: string) => {
    const columnSourceIndex = columnsOrder.indexOf(source);
    const columnTargetIndex = columnsOrder.indexOf(target);
    const reorderedColumns = [...columnsOrder];
    reorderedColumns.splice(columnTargetIndex, 0, reorderedColumns.splice(columnSourceIndex, 1)[0]);
    setColumnsOrder(reorderedColumns);
  };

  const makeFilterInput = (column: ColumnData) =>
    column.filterable
      ? (inputProps: any) => (
          <input
            {...inputProps}
            className="metanno-table-filter"
            value={(effectiveFilters[column.key] as string) || ""}
            onChange={(e) => {
              const newFilters = {
                ...effectiveFilters,
                [column.key]: e.target.value,
              };
              props.onFiltersChange?.(newFilters, column.key);
              if (props.filters === undefined) {
                setLocalFilters((prev) => ({
                  ...prev,
                  [column.key]: e.target.value,
                }));
              }
            }}
            onKeyDown={inputStopPropagation}
          />
        )
      : null;

  const buildFormatter = (type: string, readonly: boolean, filterable: boolean) => {
    switch (type) {
      case "hyperlink":
        return {
          editor: readonly
            ? null
            : forwardRef(({ row, column, onRowChange, onClose, rowIdx }: EditorProps<RowData, RowData>, ref: any) => {
                const suggestions = React.useContext(SuggestionsContext);
                return (
                  <SingleInputSuggest
                    ref={ref}
                    // EditorProps provide rowIdx.
                    row_id={getAbsoluteRowIdx(rowIdx)}
                    inputRef={inputRef}
                    value={row[column.key]}
                    column={column.key}
                    inputValue={props.inputValue}
                    onInputChange={makeInputChangeHandler(rowIdx, column)}
                    suggestions={suggestions === undefined ? props.columns[column.idx].choices : suggestions}
                    onRowChange={onRowChange}
                    onClose={onClose}
                    hyperlink
                  />
                );
              }),
          headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
          headerRenderer: (p: any) => (
            <HeaderRenderer {...p} onColumnsReorder={onHeaderDrop}>
              {makeFilterInput(p.column)}
            </HeaderRenderer>
          ),
          formatter: ({ row, rowIdx, column }: { row: RowData; rowIdx: number; column: ColumnData }) => {
            const value = row[column.key];
            const text = value?.text || value;
            const href = value?.key || value;
            return value ? (
              <a
                onClick={(event) => {
                  const res = props.onClickCellContent?.(rowIdx, column.key, href);
                  if (res) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
              >
                {text}
              </a>
            ) : null;
          },
        };
      case "multi-hyperlink":
        return {
          editor: readonly
            ? null
            : forwardRef(({ row, rowIdx, column, onRowChange, onClose }: EditorProps<RowData, RowData>, ref: any) => {
                const suggestions = React.useContext(SuggestionsContext);
                return (
                  <MultiInputSuggest
                    ref={ref}
                    row_id={getAbsoluteRowIdx(rowIdx)}
                    inputRef={inputRef}
                    value={row[column.key]}
                    inputValue={props.inputValue}
                    column={column.key}
                    suggestions={suggestions === undefined ? props.columns[column.idx].choices : suggestions}
                    onRowChange={onRowChange}
                    onInputChange={makeInputChangeHandler(rowIdx, column)}
                    onClose={onClose}
                    hyperlink
                  />
                );
              }),
          headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
          headerRenderer: (p: any) => (
            <HeaderRenderer {...p} onColumnsReorder={onHeaderDrop}>
              {makeFilterInput(p.column)}
            </HeaderRenderer>
          ),
          formatter: ({ row, rowIdx, column }: any) => (
            <InputTag
              autocontain
              readOnly
              hyperlink
              onClick={(value: any) => props.onClickCellContent?.(rowIdx, column.key, value)}
              value={row[column.key]}
            />
          ),
        };
      case "text":
        return {
          editor: readonly
            ? null
            : forwardRef(({ row, column, rowIdx, onRowChange, onClose }: EditorProps<RowData, RowData>, ref: any) => {
                const suggestions = React.useContext(SuggestionsContext);
                return (
                  <SingleInputSuggest
                    ref={ref}
                    row_id={getAbsoluteRowIdx(rowIdx)}
                    inputRef={inputRef}
                    value={row[column.key]}
                    column={column.key}
                    inputValue={props.inputValue}
                    onInputChange={makeInputChangeHandler(rowIdx, column)}
                    suggestions={suggestions === undefined ? props.columns[column.idx].choices : suggestions}
                    onRowChange={onRowChange}
                    onClose={onClose}
                  />
                );
              }),
          headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
          headerRenderer: (p: any) => (
            <HeaderRenderer {...p} onColumnsReorder={onHeaderDrop}>
              {makeFilterInput(p.column)}
            </HeaderRenderer>
          ),
          formatter: ({ row, column }: any) => <span>{row[column.key]}</span>,
        };
      case "multi-text":
        return {
          editor: readonly
            ? null
            : forwardRef(({ row, rowIdx, column, onRowChange, onClose }: EditorProps<RowData, RowData>, ref: any) => {
                const suggestions = React.useContext(SuggestionsContext);
                return (
                  <MultiInputSuggest
                    ref={ref}
                    row_id={getAbsoluteRowIdx(rowIdx)}
                    inputRef={inputRef}
                    value={row[column.key]}
                    column={column.key}
                    inputValue={props.inputValue}
                    onInputChange={makeInputChangeHandler(rowIdx, column)}
                    suggestions={suggestions === undefined ? props.columns[column.idx].choices : suggestions}
                    onRowChange={onRowChange}
                    onClose={onClose}
                  />
                );
              }),
          headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
          headerRenderer: (p: any) => (
            <HeaderRenderer {...p} onColumnsReorder={onHeaderDrop}>
              {makeFilterInput(p.column)}
            </HeaderRenderer>
          ),
          formatter: (propsInner: any) => (
            <InputTag autocontain readOnly {...propsInner} value={propsInner.row[propsInner.column.key]} />
          ),
        };
      case "boolean":
        return {
          formatter: ({ row, rowIdx, column, onRowChange, isCellSelected }: any) => (
            <BooleanInput
              isCellSelected={isCellSelected}
              value={row[column.key]}
              onChange={(value: any) => onRowChange({ ...row, [column.key]: value })}
            />
          ),
          headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
          headerRenderer: (p: any) => (
            <HeaderRenderer {...p} onColumnsReorder={onHeaderDrop}>
              {makeFilterInput(p.column)}
            </HeaderRenderer>
          ),
        };
      case "button":
        return {
          formatter: ({ row, rowIdx, column }: any) => (
            <button onClick={() => props.onClickCellContent?.(rowIdx, column.key)}>{column.key}</button>
          ),
        };
      default:
        return {};
    }
  };

  const builtColumns = useMemo(() => {
    const columnObjects = props.columns.map((column) => {
      const { formatter, editor, ...columnProps } = buildFormatter(column.kind, !column.editable, column.filterable);
      return {
        [column.key]: {
          key: column.key,
          name: column.name,
          draggable: true,
          resizable: true,
          editable: !!editor,
          filterable: column.filterable,
          editorOptions: {
            commitOnOutsideClick: column.kind !== "hyperlink" && column.kind !== "multi-hyperlink",
          },
          ...(formatter ? { formatter } : {}),
          ...(editor ? { editor } : {}),
          ...columnProps,
        },
      };
    });
    const nameToCol = Object.assign({}, ...columnObjects);
    return columnsOrder.map((name) => nameToCol[name]);
  }, [props.columns, columnsOrder, effectiveFilters, props.inputValue]);

  const onRowsChange = useEventCallback((newRows: RowData[]) => {
    const updatedRows = newRows
      .map((newRow, relativeIdx) => {
        const absRowIdx = effectiveSubset ? effectiveSubset[relativeIdx] : relativeIdx;
        return { oldRow: visibleRows[relativeIdx], newRow, absRowIdx };
      })
      .filter(({ newRow, oldRow }) => newRow !== oldRow);
    if (updatedRows.length === 1) {
      const { newRow, oldRow, absRowIdx } = updatedRows[0];
      const changedKeys = Object.keys(newRow).filter((key) => newRow[key] !== oldRow[key]);
      props.onCellChange?.(absRowIdx, changedKeys[0], newRow[changedKeys[0]]);
    }
  });

  // We create a custom memoized MetannoRow, but don't make it depend on highlightedRows as it would cause
  // complete re-renders whenever the highlightedRows change, as the react component itself would be different.
  // Also, having it aide (and not in renderRow) let us only re-create the event handlers when the props (ie p.rowIdx) change.
  // Instead, we trigger re-renders via props computed in renderRow.
  const MetannoRow = useMemo(
    () =>
      memo(
        forwardRef((p: RowRendererProps<RowData, RowData>, ref: any) => (
          <Row
            {...p}
            ref={ref}
            onMouseEnter={(event) => props.onMouseEnterRow?.(getAbsoluteRowIdx(p.rowIdx), makeModKeys(event))}
            onMouseLeave={(event) => props.onMouseLeaveRow?.(getAbsoluteRowIdx(p.rowIdx), makeModKeys(event))}
            className={`metanno-row ${p.className}`}
          />
        ))
      ),
    [props.onMouseEnterRow, props.onMouseLeaveRow]
  );

  const renderRow = useCallback(
    (p: RowRendererProps<RowData, RowData>) => (
      <MetannoRow
        {...p}
        className={props.highlightedRows?.includes(p.row[props.rowKey]) ? "metanno-row--highlighted" : ""}
      />
    ),
    [props.highlightedRows, props.rowKey]
  );

  const rowKeyGetter = useCallback((row: any) => row[props.rowKey], [props.rowKey]);

  const handlePositionChange = useEventCallback(
    ({
      idx,
      rowIdx,
      mode,
      cause = "key",
    }: {
      idx: number | null;
      rowIdx: number | null;
      mode: "EDIT" | "SELECT";
      cause?: string;
    }) => {
      const absoluteRowIdx = rowIdx !== null && rowIdx >= 0 ? getAbsoluteRowIdx(rowIdx) : null;
      const col = idx !== null && idx >= 0 ? columnsOrder[idx] : null;
      props.onPositionChange?.(absoluteRowIdx, col, mode, cause);
      if (props.position === undefined) {
        setPosition({
          row_idx: absoluteRowIdx,
          col: col,
          mode,
        });
      }
    }
  );

  const getPositionIndices = useCachedReconcile((positionParam: any) => {
    if (!positionParam) return undefined;
    const { row_idx, col, mode } = positionParam;
    const relativeRowIdx = row_idx === null ? -1 : effectiveSubset ? effectiveSubset.indexOf(row_idx) : row_idx;
    const idx = col ? columnsOrder.findIndex((name) => col === name) : -2;
    return { rowIdx: relativeRowIdx, idx, mode };
  });

  const onBlur = useEventCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    const effectivePosition = props.position !== undefined ? props.position : position;
    if (effectivePosition?.mode === "EDIT") return;
    handlePositionChange({
      idx: null,
      rowIdx: null,
      mode: "SELECT",
      cause: "blur",
    });
  });

  const handleScrollBottom = useEventCallback((event: UIEvent<HTMLDivElement>) => {
    const currentTarget = event.currentTarget;
    const isGoingDown = currentTarget.scrollTop > lastScrollTopRef.current;
    const approachesBottom =
      currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight * 2;
    lastScrollTopRef.current = currentTarget.scrollTop;

    if (isLoading || !approachesBottom || !isGoingDown || !props.onScrollBottom) {
      return;
    }
    setIsLoading(true);
    const result = props.onScrollBottom(event);
    if (result instanceof Promise) {
      result.then(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    (inputRef.current?.input || inputRef.current)?.focus();
  });

  const headerRowHeight = props.columns.some((col) => col.filterable) ? HEADER_ROW_HEIGHT : ROW_HEIGHT;

  const selectedPosition = getPositionIndices(props.position !== undefined ? props.position : position);

  return (
    <SuggestionsContext.Provider value={props.suggestions}>
      <div className="metanno-table" style={props.style} onBlur={onBlur}>
        <DndProvider backend={HTML5Backend}>
          <DataGrid
            ref={gridRef}
            rowKeyGetter={rowKeyGetter}
            rowHeight={ROW_HEIGHT}
            selectedPosition={selectedPosition}
            columns={builtColumns}
            rows={visibleRows}
            rowRenderer={renderRow}
            headerRowHeight={headerRowHeight}
            onRowsChange={onRowsChange}
            onSelectedPositionChange={handlePositionChange}
            onScroll={handleScrollBottom}
          />
        </DndProvider>
      </div>
    </SuggestionsContext.Provider>
  );
};
