import React from "react";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import DataGrid, {
    DataGridHandle,
    EditorProps,
    Row,
    RowRendererProps,
} from "react-data-grid";

import "./style.css";
import {cachedReconcile, makeModKeys, memoize} from "../../utils";

import HeaderRenderer from "../DraggableHeaderRenderer";
import MultiInputSuggest, {InputTag} from "../MultiInputSuggest";
import SingleInputSuggest from "../SingleInputSuggest";
import BooleanInput from "../BooleanInput";
import {ColumnData, RowData, TableData, TableMethods} from "../../types";
import {getCurrentEvent} from "../../utils";

const ROW_HEIGHT = 25;
const HEADER_ROW_HEIGHT = 65;

function inputStopPropagation(event: React.KeyboardEvent<HTMLInputElement>) {
    if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.stopPropagation();
    }
}

export class TableComponent extends React.Component<
    TableData & TableMethods,
    {
        columnsOrder: string[];
        position?: TableData["position"];
        inputValue?: any;
        isLoading: boolean;
        filters: { [key: string]: string }
    }
> {
    public static defaultProps = {
        highlightedRows: [],
        filters: {},
    };

    private readonly gridRef: React.MutableRefObject<DataGridHandle>;
    private readonly inputRef: React.RefObject<any>;
    private lastScrollTop: number = 0;

    constructor(props) {
        super(props);
        this.state = {
            columnsOrder: props.columns.map((column) => column.key),
            position: undefined,
            inputValue: undefined,
            isLoading: false,
            filters: {},
        };
        this.gridRef = React.createRef();
        this.inputRef = React.createRef();

        if (props.actions) {
            props.actions.scroll_to_row = (row_id) => {
                for (let i = 0; i < this.props.rows.length; i++) {
                    if (this.props.rows[i][this.props.rowKey] === row_id) {
                        this.gridRef.current?.scrollToRow(i);
                    }
                }
            };
            props.actions.focus = () => {
                const input = this.inputRef.current?.input || this.inputRef.current;
                const event = getCurrentEvent();
                event.preventDefault();
                if (input) {
                    input.focus();
                } else {
                    this.gridRef.current?.element.focus();
                }
            };
        }
    }

    handleMouseEnterRow = (event, row_id) => {
        this.props.onMouseEnterRow?.(row_id, makeModKeys(event));
    };

    handleMouseLeaveRow = (event, row_id) => {
        this.props.onMouseLeaveRow?.(row_id, makeModKeys(event));
    };

    makeInputChangeHandler = (row, column) => (value, cause) => {
        this.props.onInputChange?.(
            row[this.props.rowKey],
            column.key,
            value,
            cause
        );
        if (this.props.inputValue === undefined) {
            this.setState({
                ...this.state,
                inputValue: value,
            })
        }
    }

    makeFilterInput = (column: ColumnData) =>
        // @ts-ignore
        column.filterable
            ? (inputProps) => (
                <input
                    {...inputProps}
                    className="metanno-table-filter"
                    value={(this.props.filters === undefined ? this.state.filters : this.props.filters)[column.key]}
                    onChange={(e) => {
                        const newFilters = {
                            ...this.props.filters === undefined ? this.state.filters : this.props.filters,
                            [column.key]: e.target.value,
                        };
                        this.props.onFiltersChange?.(newFilters, column.key);
                        if (this.props.filters === undefined) {
                            this.setState({
                                ...this.state,
                                filters: {
                                    ...this.state.filters,
                                    [column.key]: e.target.value,
                                }
                            });
                        }
                    }}
                    onKeyDown={inputStopPropagation}
                />
            )
            : null;

    buildFormatter = (type, readonly, filterable) => {
        switch (type) {
            case "hyperlink":
                return {
                    editor: readonly
                        ? null
                        : React.forwardRef(
                            (
                                {
                                    row,
                                    column,
                                    onRowChange,
                                    onClose,
                                }: EditorProps<RowData, RowData>,
                                ref: any
                            ) => (
                                <SingleInputSuggest
                                    ref={ref}
                                    row_id={row[this.props.rowKey]}
                                    inputRef={this.inputRef}
                                    value={row[column.key]}
                                    column={column.key}
                                    inputValue={this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue}
                                    onInputChange={this.makeInputChangeHandler(row, column)}
                                    suggestions={this.props.suggestions}
                                    onRowChange={onRowChange}
                                    onClose={onClose}
                                    hyperlink
                                />
                            )
                        ),
                    headerCellClass: filterable
                        ? "metanno-table-header-filter"
                        : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement>
                            {...p}
                            onColumnsReorder={this.onHeaderDrop}
                        >{this.makeFilterInput(p.column)}</HeaderRenderer>
                    ),
                    formatter: ({row, column}) => {
                        return row[column.key] ? (
                            <a
                                onClick={() =>
                                    this.props.onClickCellContent?.(
                                        row[this.props.rowKey],
                                        column.key,
                                        row[column.key].key
                                    )
                                }
                            >
                                {row[column.key].text}
                            </a>
                        ) : null;
                    },
                };
            case "multi-hyperlink":
                return {
                    editor: readonly
                        ? null
                        : React.forwardRef(
                            (
                                {
                                    row,
                                    column,
                                    onRowChange,
                                    onClose,
                                }: EditorProps<RowData, RowData>,
                                ref: any
                            ) => (
                                <MultiInputSuggest
                                    ref={ref}
                                    row_id={row[this.props.rowKey]}
                                    inputRef={this.inputRef}
                                    value={row[column.key]}
                                    inputValue={this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue}
                                    column={column.key}
                                    suggestions={this.props.suggestions}
                                    onRowChange={onRowChange}
                                    onInputChange={this.makeInputChangeHandler(row, column)}
                                    onClose={onClose}
                                    hyperlink
                                />
                            )
                        ),
                    headerCellClass: filterable
                        ? "metanno-table-header-filter"
                        : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement>
                            {...p}
                            onColumnsReorder={this.onHeaderDrop}
                        >{this.makeFilterInput(p.column)}</HeaderRenderer>
                    ),
                    formatter: ({row, ...props}) => {
                        return (
                            <InputTag
                                autocontain
                                readOnly
                                {...props}
                                hyperlink
                                onClick={(value) =>
                                    this.props.onClickCellContent?.(
                                        row[this.props.rowKey],
                                        props.column.key,
                                        value
                                    )
                                }
                                value={row[props.column.key]}
                            />
                        );
                    },
                };
            case "text":
                return {
                    editor: readonly
                        ? null
                        : React.forwardRef(
                            (
                                {
                                    row,
                                    column,
                                    onRowChange,
                                    onClose,
                                }: EditorProps<RowData, RowData>,
                                ref: any
                            ) => (
                                <SingleInputSuggest
                                    ref={ref}
                                    row_id={row[this.props.rowKey]}
                                    inputRef={this.inputRef}
                                    value={row[column.key]}
                                    column={column.key}
                                    inputValue={this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue}
                                    onInputChange={this.makeInputChangeHandler(row, column)}
                                    suggestions={this.props.suggestions}
                                    onRowChange={onRowChange}
                                    onClose={onClose}
                                />
                            )
                        ),
                    headerCellClass: filterable
                        ? "metanno-table-header-filter"
                        : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement>
                            {...p}
                            onColumnsReorder={this.onHeaderDrop}
                        >{this.makeFilterInput(p.column)}</HeaderRenderer>
                    ),
                    formatter: ({row, ...props}) => {
                        return <span>{row[props.column.key]}</span>;
                    },
                };
            case "multi-text":
                return {
                    editor: readonly
                        ? null
                        : React.forwardRef(
                            (
                                {
                                    row,
                                    column,
                                    onRowChange,
                                    onClose,
                                }: EditorProps<RowData, RowData>,
                                ref: any
                            ) => (
                                <MultiInputSuggest
                                    ref={ref}
                                    row_id={row[this.props.rowKey]}
                                    inputRef={this.inputRef}
                                    value={row[column.key]}
                                    column={column.key}
                                    inputValue={this.props.inputValue === undefined ? this.state.inputValue : this.props.inputValue}
                                    onInputChange={this.makeInputChangeHandler(row, column)}
                                    suggestions={this.props.suggestions}
                                    onRowChange={onRowChange}
                                    onClose={onClose}
                                />
                            )
                        ),
                    headerCellClass: filterable
                        ? "metanno-table-header-filter"
                        : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement>
                            {...p}
                            onColumnsReorder={this.onHeaderDrop}
                        >{this.makeFilterInput(p.column)}</HeaderRenderer>
                    ),
                    formatter: (props) => {
                        return (
                            <InputTag
                                autocontain
                                readOnly
                                {...props}
                                value={props.row[props.column.key]}
                            />
                        );
                    },
                };
            case "boolean":
                return {
                    formatter: ({row, column, onRowChange, isCellSelected}) => {
                        return (
                            <BooleanInput
                                isCellSelected={isCellSelected}
                                value={row[column.key]}
                                onChange={(value) =>
                                    onRowChange({...row, [column.key]: value})
                                }
                            />
                        );
                    },
                    headerCellClass: filterable
                        ? "metanno-table-header-filter"
                        : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement>
                            {...p}
                            onColumnsReorder={this.onHeaderDrop}
                        >{this.makeFilterInput(p.column)}</HeaderRenderer>
                    ),
                };
            case "button":
                return {
                    formatter: ({row, column, isCellSelected}) => {
                        return (
                            <button
                                onClick={() =>
                                    this.props.onClickCellContent?.(
                                        row[this.props.rowKey],
                                        column.key
                                    )
                                }
                            >
                                {column.key}
                            </button>
                        );
                    },
                };
            default:
                return {};
        }
    };

    buildColumns = memoize(
        () => {
            const columnObjects = this.props.columns.map((column) => {
                const {formatter, editor, ...columnProps} = this.buildFormatter(
                    column.type,
                    !column.editable,
                    column.filterable
                );
                return {
                    [column.key]: {
                        ...{
                            key: column.key,
                            name: column.name,
                            draggable: true,
                            resizable: true,
                            editable: !!editor,
                            filterable: column.filterable,
                            editorOptions: {
                                commitOnOutsideClick:
                                    column.type !== "hyperlink" &&
                                    column.type !== "multi-hyperlink",
                            },
                        },
                        ...(formatter ? {formatter} : {}),
                        ...(!!editor ? {editor} : {}),
                        ...columnProps,
                    },
                };
            });
            const nameToCol = Object.assign({}, ...columnObjects);
            return [...this.state.columnsOrder.map((name) => nameToCol[name])];
        },
        () => ({
            columns: this.props.columns,
            columnsOrder: this.state.columnsOrder,
            filters: this.props.filters,
        })
    );

    onRowsChange = (newRows) => {
        const updatedRows = newRows
            .map((newRow, i) => ({oldRow: this.props.rows[i], newRow: newRow}))
            .filter(({newRow, oldRow}) => newRow !== oldRow);
        if (updatedRows.length === 1) {
            const {newRow, oldRow} = updatedRows[0];
            const changedKeys = Object.keys(newRow).filter(
                (key) => newRow[key] !== oldRow[key]
            );
            this.props.onCellChange?.(
                oldRow[this.props.rowKey],
                changedKeys[0],
                newRow[changedKeys[0]]
            );
        }
    };

    onHeaderDrop = (source, target) => {
        const columnSourceIndex = this.state.columnsOrder.indexOf(source);
        const columnTargetIndex = this.state.columnsOrder.indexOf(target);

        const reorderedColumns = [...this.state.columnsOrder];
        reorderedColumns.splice(
            columnTargetIndex,
            0,
            reorderedColumns.splice(columnSourceIndex, 1)[0]
        );

        this.setState((state) => ({...state, columnsOrder: []}));
        this.setState((state) => ({...state, columnsOrder: reorderedColumns}));
    };

    renderRow = (props: RowRendererProps<RowData, RowData>) => {
        return (
            <Row
                {...props}
                onMouseEnter={(event) =>
                    this.handleMouseEnterRow(event, props.row[this.props.rowKey])
                }
                onMouseLeave={(event) =>
                    this.handleMouseLeaveRow(event, props.row[this.props.rowKey])
                }
                className={
                    this.props.highlightedRows.includes(props.row[this.props.rowKey])
                        ? "metanno-row--highlighted"
                        : ""
                }
            />
        );
    };

    rowKeyGetter = (row) => row[this.props.rowKey];

    onBlur = (event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        if ((this.props.position === undefined ? this.state.position : this.props.position)?.mode === "EDIT") return;
        this.handlePositionChange?.({idx: null, rowIdx: null, mode: "SELECT", cause: "blur"});
    };

    handlePositionChange = ({idx, rowIdx, mode, cause = "key"}) => {
        this.props.onPositionChange?.(
            (rowIdx !== null && rowIdx >= 0) ? this.props.rows[rowIdx][this.props.rowKey] : null,
            (idx !== null && idx >= 0) ? this.state.columnsOrder[idx] : null,
            mode,
            cause
        );
        if (this.props.position === undefined) {
            this.setState({
                ...this.state,
                position: {
                    row_id:
                        (rowIdx !== null && rowIdx >= 0) ? this.props.rows[rowIdx][this.props.rowKey] : null,
                    col: (idx !== null && idx >= 0) ? this.state.columnsOrder[idx] : null,
                    mode,
                },
            });
        }
    };

    getPositionIndices = cachedReconcile((position) => {
        if (!position) {
            return undefined;
        }
        const {row_id, col, mode} = position || {
            row_id: null,
            col: null,
            mode: "SELECT",
        };
        const row_idx =
            row_id === null
                ? -1
                : row_id !== undefined
                    ? this.props.rows.findIndex((row) => row[this.props.rowKey] === row_id)
                    : -2;
        const col_idx = col
            ? this.state.columnsOrder.findIndex((name) => col === name)
            : -2;
        return {
            rowIdx: row_idx,
            idx: col_idx,
            mode,
        };
    });

    handleScrollBottom = (event: React.UIEvent<HTMLDivElement>) => {
        const currentTarget = event.currentTarget;
        const isGoingDown = currentTarget.scrollTop > this.lastScrollTop;
        const approachesBottom =
            currentTarget.scrollTop + 10 >=
            currentTarget.scrollHeight - currentTarget.clientHeight * 2;
        this.lastScrollTop = currentTarget.scrollTop;

        if (
            this.state.isLoading ||
            !approachesBottom ||
            !isGoingDown ||
            !this.props.onScrollBottom
        ) {
            return;
        }
        this.setState({...this.state, isLoading: true});

        const result = this.props.onScrollBottom(event);

        if (result instanceof Promise) {
            result.then(() => this.setState({...this.state, isLoading: false}));
        } else {
            this.setState({...this.state, isLoading: false});
        }
    };

    render() {
        (this.inputRef.current?.input || this.inputRef.current)?.focus();

        const headerRowHeight = this.props.columns.some((col) => col.filterable)
            ? HEADER_ROW_HEIGHT
            : ROW_HEIGHT;

        const tableHeight = Math.min(
            headerRowHeight + ROW_HEIGHT * Math.max(this.props.rows.length, 1),
            300
        );

        return (
            <div
                className={"metanno-table"}
                style={{"--min-height": `${tableHeight}px`} as React.CSSProperties}
                onBlur={this.onBlur}
            >
                <DndProvider backend={HTML5Backend}>
                    <DataGrid
                        ref={this.gridRef}
                        rowKeyGetter={this.rowKeyGetter}
                        rowHeight={ROW_HEIGHT}
                        selectedPosition={this.getPositionIndices(
                            this.props.position !== undefined
                                ? this.props.position
                                : this.state.position
                        )}
                        columns={this.buildColumns()}
                        rows={this.props.rows}
                        rowRenderer={this.renderRow}
                        headerRowHeight={headerRowHeight}
                        onRowsChange={this.onRowsChange}
                        onSelectedPositionChange={this.handlePositionChange}
                        onScroll={this.handleScrollBottom}
                    />
                </DndProvider>
            </div>
        );
    }
}
