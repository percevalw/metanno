import React, { forwardRef, KeyboardEvent, useLayoutEffect, useRef } from "react";
import { CalculatedColumn, EditorProps, HeaderRendererProps } from "react-data-grid";
import { SingleInputSuggest, MultiInputSuggest } from "../InputSuggest";
import { ColumnData, RowData, TableData } from "../../types";

// Let arrow keys move within the editor before the grid changes the selected cell
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

interface TableEditorState {
  inputRef: React.MutableRefObject<any>;
  inputValue: TableData["inputValue"];
  suggestions: TableData["suggestions"];
  columns: ColumnData[];
  getRowIndex(index: number): number;
  inputChanged(index: number, column: CalculatedColumn<RowData, RowData>): (value: any, cause: string) => void;
}

export const TableEditorContext = React.createContext<TableEditorState>(null!);

// Keep the editor mounted while table selection and column settings update around its draft
export const TableCellEditor = forwardRef(
  ({ row, rowIdx, column, onRowChange, onClose }: EditorProps<RowData, RowData>, ref: any) => {
    const state = React.useContext(TableEditorContext);
    const config = state.columns.find((config) => config.key === column.key)!;
    const Input = config.kind.startsWith("multi-") ? MultiInputSuggest : SingleInputSuggest;
    return (
      <Input
        ref={ref}
        row_id={state.getRowIndex(rowIdx)}
        inputRef={state.inputRef}
        value={row[column.key]}
        column={column.key}
        inputValue={state.inputValue}
        onInputChange={state.inputChanged(rowIdx, column)}
        suggestions={state.suggestions === undefined ? config.choices : state.suggestions}
        onRowChange={(update, index, commit) => onRowChange({ ...row, ...update }, rowIdx, commit)}
        onClose={onClose}
        hyperlink={config.kind.includes("hyperlink")}
      />
    );
  }
);

type TableFiltersContextValue = {
  filters: { [key: string]: string };
  onFilterChange: (columnKey: string, value: string) => void;
};

export const TableFiltersContext = React.createContext<TableFiltersContextValue | null>(null);
TableFiltersContext.displayName = "TableFiltersContext";

// Show the column name above its filter input, the grid header cell adds the column menu and reordering
// Keep the header component type stable as columns and filter values change
export function TableHeader({ column: gridColumn, isCellSelected }: HeaderRendererProps<RowData, RowData>) {
  const context = React.useContext(TableFiltersContext)!;
  const column = gridColumn as CalculatedColumn<RowData, RowData> & ColumnData;
  const inputRef = useRef<HTMLInputElement>(null);
  // Keyboard navigation onto the header moves focus into its filter input
  useLayoutEffect(() => {
    if (isCellSelected) inputRef.current?.focus({ preventScroll: true });
  }, [isCellSelected]);
  return (
    <div>
      <div className="metanno-table-header-name" title={String(column.name)}>
        {column.name}
      </div>
      {column.filterable ? (
        <div>
          <input
            ref={inputRef}
            tabIndex={isCellSelected ? 0 : -1}
            className="metanno-table-filter"
            placeholder={column.placeholder}
            value={context.filters?.[column.key] ?? ""}
            onChange={(event) => context.onFilterChange(column.key, event.target.value)}
            onKeyDown={inputStopPropagation}
          />
        </div>
      ) : null}
    </div>
  );
}
