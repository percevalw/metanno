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
  useImperativeHandle,
} from "react";
import { DndProvider, DndContext } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import DataGrid, {
  CalculatedColumn,
  DataGridHandle,
  EditorProps,
  Row,
  RowRendererProps,
} from "react-data-grid";

import "./style.css";
import { makeModKeys, memoize } from "../../utils";

import HeaderRenderer from "../DraggableHeaderRenderer";
import {
  InputTag,
  SingleInputSuggest,
  MultiInputSuggest,
} from "../InputSuggest";
import BooleanInput from "../BooleanInput";
import { ColumnData, RowData, TableData, TableMethods } from "../../types";
import {
  getCurrentEvent,
  useEventCallback,
  useCachedReconcile,
} from "../../utils";

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

type TableFiltersContextValue = {
  filters: { [key: string]: string };
  onFilterChange: (columnKey: string, value: string) => void;
};

const TableFiltersContext = React.createContext<TableFiltersContextValue | null>(
  null
);
TableFiltersContext.displayName = "TableFiltersContext";

const TableFilterInput = memo(function TableFilterInput({
  columnKey,
  inputProps,
}: {
  columnKey: string;
  inputProps: any;
}) {
  const filtersContext = React.useContext(TableFiltersContext);
  const filterValue = filtersContext?.filters?.[columnKey];

  return (
    <input
      {...inputProps}
      className="metanno-table-filter"
      value={(filterValue as string) || ""}
      onChange={(e) => filtersContext?.onFilterChange(columnKey, e.target.value)}
      onKeyDown={inputStopPropagation}
    />
  );
});

export const Table = function Table({
  primaryKey,
  rows,
  selection,
  multiSelectionMode,
  filters,
  columns,
  autoFilter,
  subset,
  onSubsetChange,
  handle,
  onInputChange,
  inputValue,
  onMouseEnterRow,
  onMouseLeaveRow,
  onMouseHoverRow,
  highlightedRows,
  style,
  onFiltersChange,
  onSelectionChange,
  onCellChange,
  onScrollBottom,
  onClickCellContent,
  suggestions,
}: TableData & TableMethods) {
  const [columnsOrder, setColumnsOrder] = useState(
    columns.map((column) => column.key)
  );
  const [localSelection, setLocalSelection] = useState<
    TableData["selection"] | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  // If filters are not controlled via props, we use local state
  const [localFilters, setLocalFilters] = useState<{ [key: string]: string }>(
    {}
  );
  const currentHoveredRow = useRef<number | null>(null);
  const effectiveFilters = filters === undefined ? localFilters : filters;
  const controlledSelection = selection;

  // Helper: convert relative row index (from DataGrid) to an absolute row index.
  const getAbsoluteRowIdx = useEventCallback((relativeIdx: number): number =>
    effectiveSubset !== undefined ? effectiveSubset[relativeIdx] : relativeIdx
  );

  const gridRef = useRef<DataGridHandle>(null);
  const inputRef = useRef<any>(null);
  const lastScrollTopRef = useRef(0);

  // Keep rows in a ref to have always the latest version in event handlers
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Update subset when filters change
  const localSubset = useMemo(() => {
    if (
      autoFilter &&
      effectiveFilters &&
      (subset === undefined || onSubsetChange)
    ) {
      const lowercaseFilters = memoize((filters: { [key: string]: string }) =>
        Object.fromEntries(
          Object.entries(filters)
            .filter(([key, value]) => value !== "")
            .map(([key, value]) => [key, value.toLowerCase()])
        )
      )(effectiveFilters);
      const newSubset = rows
        .map((row, idx) => ({ row, idx }))
        .filter(({ row }) =>
          Object.entries(lowercaseFilters).every(
            ([key, value]) =>
              row[key] === undefined ||
              (row[key] !== null &&
                row[key].toString().toLowerCase().includes(value))
          )
        )
        .map(({ idx }) => idx);
      onSubsetChange?.(newSubset);
      return newSubset;
    } else {
      return undefined;
    }
  }, [effectiveFilters, rows, autoFilter, filters]);
  const effectiveSubset = subset !== undefined ? subset : localSubset;

  const handleFilterChange = useEventCallback((columnKey: string, value: string) => {
    const newFilters = {
      ...effectiveFilters,
      [columnKey]: value,
    };
    onFiltersChange?.(newFilters, columnKey);
    if (filters === undefined) {
      setLocalFilters((prev) => ({
        ...prev,
        [columnKey]: value,
      }));
    }
  });

  const filtersContextValue = useMemo(
    () => ({
      filters: effectiveFilters,
      onFilterChange: handleFilterChange,
    }),
    [effectiveFilters, handleFilterChange]
  );

  // Update actions to work with absolute indices.
  useImperativeHandle(
    handle,
    () => ({
      scroll_to_row_idx: (absRowIdx: number) => {
        const relativeIdx = effectiveSubset
          ? effectiveSubset.indexOf(absRowIdx)
          : absRowIdx;
        if (relativeIdx !== -1) {
          gridRef.current?.scrollToRow(relativeIdx);
        }
      },
      scroll_to_row_id: (key: string) => {
        if (!primaryKey) return;
        const absRowIdx = rowsRef.current.findIndex((row) => row[primaryKey] === key);
        const relativeIdx = effectiveSubset
          ? effectiveSubset.indexOf(absRowIdx)
          : absRowIdx;
        if (relativeIdx !== -1) {
          gridRef.current?.scrollToRow(relativeIdx);
        }
      },
      focus: () => {
        const input = inputRef.current?.input || inputRef.current;
        const event = getCurrentEvent();
        event.preventDefault();
        if (input) {
          input.focus();
        } else {
          gridRef.current?.element.focus();
        }
      },
    }),
    [handle, primaryKey, effectiveSubset]
  );

  // Compute visibleRows using the effectiveSubset.
  // (We simply slice the rows array instead of decorating rows with an absolute index.)
  const visibleRows = useMemo(() => {
    if (effectiveSubset !== undefined) {
      return effectiveSubset.map((idx) => rows[idx]);
    }
    return rows;
  }, [rows, effectiveSubset]);

  const makeInputChangeHandler =
    (
      relativeRowIdx: number,
      column: ColumnData | CalculatedColumn<RowData, RowData>
    ) =>
    (value: any, cause: any) => {
      const absRowIdx = getAbsoluteRowIdx(relativeRowIdx);
      onInputChange?.(
        primaryKey && absRowIdx !== null ? rowsRef.current[absRowIdx][primaryKey] : null,
        absRowIdx,
        column.key,
        value,
        cause
      );
    };

  const onHeaderDrop = (source: string, target: string) => {
    const columnSourceIndex = columnsOrder.indexOf(source);
    const columnTargetIndex = columnsOrder.indexOf(target);
    const reorderedColumns = [...columnsOrder];
    reorderedColumns.splice(
      columnTargetIndex,
      0,
      reorderedColumns.splice(columnSourceIndex, 1)[0]
    );
    setColumnsOrder(reorderedColumns);
  };

  const makeFilterInput = (column: ColumnData) =>
    column.filterable
      ? (inputProps: any) => (
          <TableFilterInput inputProps={inputProps} columnKey={column.key} />
        )
      : null;

  const buildFormatter = (
    type: string,
    readonly: boolean,
    filterable: boolean
  ) => {
    switch (type) {
      case "hyperlink":
        return {
          editor: readonly
            ? null
            : forwardRef(
                (
                  {
                    row,
                    column,
                    onRowChange,
                    onClose,
                    rowIdx,
                  }: EditorProps<RowData, RowData>,
                  ref: any
                ) => {
                  const suggestions = React.useContext(SuggestionsContext);
                  return (
                    <SingleInputSuggest
                      ref={ref}
                      // EditorProps provide rowIdx.
                      row_id={getAbsoluteRowIdx(rowIdx)}
                      inputRef={inputRef}
                      value={row[column.key]}
                      column={column.key}
                      inputValue={inputValue}
                      onInputChange={makeInputChangeHandler(rowIdx, column)}
                      suggestions={
                        suggestions === undefined
                          ? columns[column.idx].choices
                          : suggestions
                      }
                      onRowChange={onRowChange}
                      onClose={onClose}
                      hyperlink
                    />
                  );
                }
              ),
          headerCellClass: filterable
            ? "metanno-table-header-filter"
            : undefined,
          headerRenderer: (p: any) => (
            <HeaderRenderer {...p} onColumnsReorder={onHeaderDrop}>
              {makeFilterInput(p.column)}
            </HeaderRenderer>
          ),
          formatter: ({
            row,
            rowIdx,
            column,
          }: {
            row: RowData;
            rowIdx: number;
            column: ColumnData;
          }) => {
            const value = row[column.key];
            const text = value?.text || value;
            const href = value?.key || value;
            return value ? (
              <a
                onClick={(event) => {
                  const res = onClickCellContent?.(
                    primaryKey ? row[primaryKey] : null,
                    rowIdx,
                    column.key,
                    href
                  );
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
            : forwardRef(
                (
                  {
                    row,
                    rowIdx,
                    column,
                    onRowChange,
                    onClose,
                  }: EditorProps<RowData, RowData>,
                  ref: any
                ) => {
                  const suggestions = React.useContext(SuggestionsContext);
                  return (
                    <MultiInputSuggest
                      ref={ref}
                      row_id={getAbsoluteRowIdx(rowIdx)}
                      inputRef={inputRef}
                      value={row[column.key]}
                      inputValue={inputValue}
                      column={column.key}
                      suggestions={
                        suggestions === undefined
                          ? columns[column.idx].choices
                          : suggestions
                      }
                      onRowChange={onRowChange}
                      onInputChange={makeInputChangeHandler(rowIdx, column)}
                      onClose={onClose}
                      hyperlink
                    />
                  );
                }
              ),
          headerCellClass: filterable
            ? "metanno-table-header-filter"
            : undefined,
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
              onClick={(value: any) =>
                onClickCellContent?.(
                  primaryKey ? row[primaryKey] : null,
                  rowIdx,
                  column.key,
                  value
                )
              }
              value={row[column.key]}
            />
          ),
        };
      case "text":
        return {
          editor: readonly
            ? null
            : forwardRef(
                (
                  {
                    row,
                    column,
                    rowIdx,
                    onRowChange,
                    onClose,
                  }: EditorProps<RowData, RowData>,
                  ref: any
                ) => {
                  const suggestions = React.useContext(SuggestionsContext);
                  return (
                    <SingleInputSuggest
                      ref={ref}
                      row_id={getAbsoluteRowIdx(rowIdx)}
                      inputRef={inputRef}
                      value={row[column.key]}
                      column={column.key}
                      inputValue={inputValue}
                      onInputChange={makeInputChangeHandler(rowIdx, column)}
                      suggestions={
                        suggestions === undefined
                          ? columns[column.idx].choices
                          : suggestions
                      }
                      onRowChange={onRowChange}
                      onClose={onClose}
                    />
                  );
                }
              ),
          headerCellClass: filterable
            ? "metanno-table-header-filter"
            : undefined,
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
            : forwardRef(
                (
                  {
                    row,
                    rowIdx,
                    column,
                    onRowChange,
                    onClose,
                  }: EditorProps<RowData, RowData>,
                  ref: any
                ) => {
                  const suggestions = React.useContext(SuggestionsContext);
                  return (
                    <MultiInputSuggest
                      ref={ref}
                      row_id={getAbsoluteRowIdx(rowIdx)}
                      inputRef={inputRef}
                      value={row[column.key]}
                      column={column.key}
                      inputValue={inputValue}
                      onInputChange={makeInputChangeHandler(rowIdx, column)}
                      suggestions={
                        suggestions === undefined
                          ? columns[column.idx].choices
                          : suggestions
                      }
                      onRowChange={onRowChange}
                      onClose={onClose}
                    />
                  );
                }
              ),
          headerCellClass: filterable
            ? "metanno-table-header-filter"
            : undefined,
          headerRenderer: (p: any) => (
            <HeaderRenderer {...p} onColumnsReorder={onHeaderDrop}>
              {makeFilterInput(p.column)}
            </HeaderRenderer>
          ),
          formatter: (propsInner: any) => (
            <InputTag
              autocontain
              readOnly
              {...propsInner}
              value={propsInner.row[propsInner.column.key]}
            />
          ),
        };
      case "boolean":
        return {
          formatter: ({
            row,
            rowIdx,
            column,
            onRowChange,
            isCellSelected,
          }: any) => (
            <BooleanInput
              isCellSelected={isCellSelected}
              value={row[column.key]}
              onChange={(value: any) =>
                onRowChange({ ...row, [column.key]: value })
              }
            />
          ),
          headerCellClass: filterable
            ? "metanno-table-header-filter"
            : undefined,
          headerRenderer: (p: any) => (
            <HeaderRenderer {...p} onColumnsReorder={onHeaderDrop}>
              {makeFilterInput(p.column)}
            </HeaderRenderer>
          ),
        };
      case "button":
        return {
          formatter: ({ row, rowIdx, column }: any) => (
            <button
              onClick={() =>
                onClickCellContent?.(
                  primaryKey && rowIdx !== null ? rowsRef.current[rowIdx][primaryKey] : null,
                  rowIdx,
                  column.key
                )
              }
            >
              {column.key}
            </button>
          ),
        };
      default:
        return {};
    }
  };

  const builtColumns = useMemo(() => {
    const columnObjects = columns.map((column) => {
      const { formatter, editor, ...columnProps } = buildFormatter(
        column.kind,
        !column.editable,
        column.filterable
      );
      return {
        [column.key]: {
          key: column.key,
          name: column.name,
          draggable: true,
          resizable: true,
          editable: !!editor,
          filterable: column.filterable,
          editorOptions: {
            commitOnOutsideClick:
              column.kind !== "hyperlink" && column.kind !== "multi-hyperlink",
          },
          ...(formatter ? { formatter } : {}),
          ...(editor ? { editor } : {}),
          ...columnProps,
        },
      };
    });
    const nameToCol = Object.assign({}, ...columnObjects);
    return columnsOrder.map((name) => nameToCol[name]);
  }, [columns, columnsOrder, inputValue]);

  const onRowsChange = useEventCallback((newRows: RowData[]) => {
    const updatedRows = newRows
      .map((newRow, relativeIdx) => {
        const absRowIdx = effectiveSubset
          ? effectiveSubset[relativeIdx]
          : relativeIdx;
        return { oldRow: visibleRows[relativeIdx], newRow, absRowIdx };
      })
      .filter(({ newRow, oldRow }) => newRow !== oldRow);
    if (updatedRows.length === 1) {
      const { newRow, oldRow, absRowIdx } = updatedRows[0];
      const changedKeys = Object.keys(newRow).filter(
        (key) => newRow[key] !== oldRow[key]
      );
      onCellChange?.(
        primaryKey ? oldRow[primaryKey] : null,
        absRowIdx,
        changedKeys[0],
        newRow[changedKeys[0]]
      );
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
            onMouseEnter={(event) => {
              const rowIdx = getAbsoluteRowIdx(p.rowIdx);
              if (currentHoveredRow.current === rowIdx) {
                return;
              }
              onMouseEnterRow?.(
                primaryKey ? rowsRef.current[rowIdx][primaryKey] : null,
                rowIdx,
                makeModKeys(event)
              );
              onMouseHoverRow?.(
                primaryKey ? rowsRef.current[rowIdx][primaryKey] : null,
                rowIdx,
                makeModKeys(event)
              );
              if (currentHoveredRow.current !== null) {
                onMouseLeaveRow?.(
                  rowsRef.current[currentHoveredRow.current][primaryKey],
                  currentHoveredRow.current,
                  makeModKeys(event)
                );
              }
              currentHoveredRow.current = rowIdx;
            }}
            onMouseLeave={(event) => {
              const rowIdx = getAbsoluteRowIdx(p.rowIdx);
              setTimeout(() => {
                if (currentHoveredRow.current === rowIdx) {
                  onMouseLeaveRow?.(
                    primaryKey ? rowsRef.current[currentHoveredRow.current][primaryKey] : null,
                    currentHoveredRow.current,
                    makeModKeys(event)
                  );
                  onMouseHoverRow?.(null, null, makeModKeys(event));
                  currentHoveredRow.current = null;
                }
              }, 50);
            }}
            className={`metanno-row ${p.className}`}
          />
        ))
      ),
    [onMouseEnterRow, onMouseLeaveRow]
  );

  const renderRow = useCallback(
    (p: RowRendererProps<RowData, RowData>) => (
      <MetannoRow
        {...p}
        className={
          primaryKey && highlightedRows?.includes(p.row[primaryKey])
            ? "metanno-row--highlighted"
            : ""
        }
      />
    ),
    [highlightedRows, primaryKey]
  );

  const rowKeyGetter = useCallback((row: any) => row[primaryKey], [primaryKey]);
  type GridSelectionRange = {
    rowIdx: number;
  };
  type GridSelection = {
    rowIdx: number;
    idx: number;
    mode: "EDIT" | "SELECT";
    ranges?: readonly GridSelectionRange[];
  };

  const handleSelectionChange = useEventCallback(
    ({
      idx,
      rowIdx,
      mode,
      ranges,
      cause = "key",
    }: {
      idx: number | null;
      rowIdx: number | null;
      mode: "EDIT" | "SELECT";
      ranges?: { rowIdx: number }[];
      cause?: string;
    }) => {
      const absoluteRowIdx =
        rowIdx !== null && rowIdx >= 0 ? getAbsoluteRowIdx(rowIdx) : null;
      const hasAbsoluteRowIdx =
        absoluteRowIdx !== null &&
        absoluteRowIdx !== undefined &&
        absoluteRowIdx >= 0;
      const col = idx !== null && idx >= 0 ? columnsOrder[idx] : null;
      const relativeRangeRows =
        Array.isArray(ranges) && ranges.length > 0
          ? ranges.map((range) => range.rowIdx)
          : hasAbsoluteRowIdx
          ? [rowIdx as number]
          : [];
      const absoluteSelectedRows = Array.from(
        new Set(
          relativeRangeRows
            .filter((relativeRowIdx) => relativeRowIdx >= 0)
            .map((relativeRowIdx) => getAbsoluteRowIdx(relativeRowIdx))
            .filter(
              (absoluteIdx) => absoluteIdx !== null && absoluteIdx !== undefined && absoluteIdx >= 0
            )
        )
      );
      const rowId =
        primaryKey && hasAbsoluteRowIdx
          ? rowsRef.current[absoluteRowIdx]?.[primaryKey] ?? null
          : null;
      const absoluteRanges = absoluteSelectedRows.map((selectedRowIdx) => ({
        row_idx: selectedRowIdx,
      }));
      onSelectionChange?.(
        rowId,
        hasAbsoluteRowIdx ? absoluteRowIdx : null,
        col,
        mode,
        cause,
        absoluteRanges
      );
      if (controlledSelection === undefined) {
        setLocalSelection({
          row_idx: hasAbsoluteRowIdx ? absoluteRowIdx : null,
          col: col,
          mode,
          ranges: absoluteRanges,
        });
      }
    }
  );

  const getSelectionIndices = useCachedReconcile(
    (selectionParam: TableData["selection"] | undefined): GridSelection | undefined => {
    if (!selectionParam) return undefined;
    const { row_idx, col, mode, ranges } = selectionParam;
    const hasRowSelection = row_idx !== null && row_idx !== undefined && row_idx >= 0;
    const relativeRowIdx = hasRowSelection
      ? effectiveSubset
        ? effectiveSubset.indexOf(row_idx)
        : row_idx
      : -2;
    const absoluteSelectedRows =
      Array.isArray(ranges) && ranges.length > 0
        ? ranges.map((range) => range.row_idx)
        : hasRowSelection && relativeRowIdx >= 0
        ? [row_idx]
        : [];
    const relativeSelectedRows = Array.from(
      new Set(
        absoluteSelectedRows
          .map((absoluteRowIdx: number) =>
            effectiveSubset ? effectiveSubset.indexOf(absoluteRowIdx) : absoluteRowIdx
          )
          .filter((relativeIdx: number) => relativeIdx >= 0)
      )
    );
    const idx = col ? columnsOrder.findIndex((name) => col === name) : -1;
    return {
      rowIdx: relativeRowIdx,
      idx,
      mode,
      ranges: relativeSelectedRows.map((relativeRow) => ({ rowIdx: relativeRow })),
    };
    }
  );

  const onBlur = useEventCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    const effectiveSelection =
      controlledSelection !== undefined ? controlledSelection : localSelection;
    if (effectiveSelection?.mode === "EDIT") return;
    if (effectiveSelection == null) return;
    const ranges =
      Array.isArray(effectiveSelection.ranges) && effectiveSelection.ranges.length > 0
        ? effectiveSelection.ranges
            .map((range) => {
              const absoluteRowIdx = range?.row_idx;
              if (
                absoluteRowIdx === null ||
                absoluteRowIdx === undefined ||
                absoluteRowIdx < 0
              ) {
                return null;
              }
              const relativeRowIdx = effectiveSubset
                ? effectiveSubset.indexOf(absoluteRowIdx)
                : absoluteRowIdx;
              if (relativeRowIdx < 0) return null;
              return { rowIdx: relativeRowIdx };
            })
            .filter((range): range is { rowIdx: number } => range !== null)
        : undefined;

    handleSelectionChange({
      idx: null,
      rowIdx: null,
      mode: "SELECT",
      cause: "blur",
      ranges,
    });
  });

  const handleScrollBottom = useEventCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const currentTarget = event.currentTarget;
      const isGoingDown = currentTarget.scrollTop > lastScrollTopRef.current;
      const approachesBottom =
        currentTarget.scrollTop + 10 >=
        currentTarget.scrollHeight - currentTarget.clientHeight * 2;
      lastScrollTopRef.current = currentTarget.scrollTop;

      if (isLoading || !approachesBottom || !isGoingDown || !onScrollBottom) {
        return;
      }
      setIsLoading(true);
      const result = onScrollBottom(event);
      if (result instanceof Promise) {
        result.then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  );

  useEffect(() => {
    (inputRef.current?.input || inputRef.current)?.focus();
  });

  const headerRowHeight = columns.some((col) => col.filterable)
    ? HEADER_ROW_HEIGHT
    : ROW_HEIGHT;

  const selectedSelection =
    getSelectionIndices(
      controlledSelection !== undefined ? controlledSelection : localSelection
    ) ?? {
      rowIdx: -2,
      idx: -1,
      mode: "SELECT",
    };

  return (
    <SuggestionsContext.Provider value={suggestions}>
      <TableFiltersContext.Provider value={filtersContextValue}>
        <div className="metanno-table" style={style} onBlur={onBlur}>
          <DndProvider backend={HTML5Backend}>
            <DataGrid
              ref={gridRef}
              rowKeyGetter={rowKeyGetter}
              rowHeight={ROW_HEIGHT}
              selection={selectedSelection}
              multiSelectionMode={multiSelectionMode}
              columns={builtColumns}
              rows={visibleRows}
              rowRenderer={renderRow}
              headerRowHeight={headerRowHeight}
              onRowsChange={onRowsChange}
              onSelectionChange={handleSelectionChange}
              onScroll={handleScrollBottom}
            />
          </DndProvider>
        </div>
      </TableFiltersContext.Provider>
    </SuggestionsContext.Provider>
  );
};
