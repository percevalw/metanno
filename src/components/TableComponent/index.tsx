import React from 'react';
import {DndProvider} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DataGrid, {SelectCellFormatter, DataGridHandle, EditorProps, Row, RowRendererProps, SelectColumn} from "react-data-grid";

import './style.css';
import {cachedReconcile, makeModKeys, memoize} from '../../utils';

import HeaderRenderer from '../DraggableHeaderRenderer'
import MultiInputSuggest, {InputTag} from "../MultiInputSuggest";
import SingleInputSuggest from "../SingleInputSuggest";
import BooleanInput from "../BooleanInput";
import {RowData, TableData, TableMethods} from "../../types";
import {getCurrentEvent} from "../../current_event";


function inputStopPropagation(event: React.KeyboardEvent<HTMLInputElement>) {
    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.stopPropagation();
    }
}

class TableComponent extends React.Component<{ id: string; } & TableData & TableMethods, {
    columnsOrder: string[],
}> {
    private readonly gridRef: React.MutableRefObject<DataGridHandle>;
    private readonly inputRef: React.RefObject<any>;

    constructor(props) {
        super(props);
        this.state = {
            columnsOrder: props.columns.map(column => column.name),
        };
        this.gridRef = React.createRef();
        this.inputRef = React.createRef();

        props.registerActions({
            scroll_to_row: (row_id) => {
                for (let i = 0; i < this.props.rows.length; i++) {
                    if (this.props.rows[i][this.props.rowKey] === row_id) {
                        this.gridRef.current?.scrollToRow(i);
                    }
                }
            },
            focus: () => {
                const input = this.inputRef.current?.input || this.inputRef.current;
                const event = getCurrentEvent();
                event.preventDefault();
                if (input) {
                    input.focus();
                }
                else {
                    this.gridRef.current?.element.focus();
                }
            },
        });
    }

    handleMouseEnterRow = (event, row_id) => {
        this.props.onMouseEnterRow && this.props.onMouseEnterRow(row_id, makeModKeys(event));
    };

    handleMouseLeaveRow = (event, row_id) => {
        this.props.onMouseLeaveRow && this.props.onMouseLeaveRow(row_id, makeModKeys(event));
    };


    buildFormatter = (type, readonly, filterable) => {
        switch (type) {
            case 'hyperlink':
                return {
                    editor: readonly ? null : (
                        React.forwardRef(({
                                              row,
                                              column,
                                              onRowChange,
                                              onClose
                                          }: EditorProps<RowData, RowData>,
                                          ref: any) => (
                            <SingleInputSuggest
                                ref={ref}
                                row_id={row[this.props.rowKey]}
                                inputRef={this.inputRef}
                                value={row[column.key]}
                                column={column.key}

                                inputValue={this.props.inputValue}
                                onInputChange={(value, cause) => this.props.onInputChange(row[this.props.rowKey], column.key, value, cause)}
                                suggestions={this.props.suggestions}
                                onRowChange={onRowChange}
                                onClose={onClose}
                                hyperlink
                            />
                        ))),
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement> {...p} onColumnsReorder={this.onHeaderDrop}>
                            {
                                // @ts-ignore
                                p.column.filterable ? (inputProps) => (
                                    <input
                                        {...inputProps}
                                        className="metanno-table-filter"
                                        value={this.props.filters[p.column.key]}
                                        onChange={(e) => this.props.onFiltersChange(p.column.key, e.target.value)}
                                        onKeyDown={inputStopPropagation}
                                    />
                                ) : null}
                        </HeaderRenderer>),
                    formatter: ({row, column}) => {
                        return row[column.key] ?
                            <a onClick={() => this.props.onClickCellContent(row[this.props.rowKey], column.key, row[column.key].key)}>{row[column.key].text}</a> : null
                    }
                };
            case 'multi-hyperlink':
                return {
                    editor: readonly ? null : React.forwardRef(({
                                                                    row,
                                                                    column,
                                                                    onRowChange,
                                                                    onClose
                                                                }: EditorProps<RowData, RowData>,
                                                                ref: any) => (
                        <MultiInputSuggest
                            ref={ref}
                            row_id={row[this.props.rowKey]}
                            inputRef={this.inputRef}
                            value={row[column.key]}
                            inputValue={this.props.inputValue}
                            column={column.key}
                            suggestions={this.props.suggestions}
                            onRowChange={onRowChange}
                            onInputChange={(value, cause) => this.props.onInputChange(row[this.props.rowKey], column.key, value, cause)}
                            onClose={onClose}
                            hyperlink
                        />
                    )),
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement> {...p} onColumnsReorder={this.onHeaderDrop}>
                            {
                                // @ts-ignore
                                p.column.filterable ? (inputProps) => (
                                    <input
                                        {...inputProps}
                                        className="metanno-table-filter"
                                        value={this.props.filters[p.column.key]}
                                        onChange={(e) => this.props.onFiltersChange(p.column.key, e.target.value)}
                                        onKeyDown={inputStopPropagation}
                                    />
                                ) : null}
                        </HeaderRenderer>),
                    formatter: ({row, ...props}) => {
                        return <InputTag autocontain readOnly {...props} hyperlink
                                         onClick={(value) => this.props.onClickCellContent(row[this.props.rowKey], props.column.key, value)}
                                         value={row[props.column.key]}/>
                    }
                };
            case 'text':
                return {
                    editor: readonly ? null : (
                        React.forwardRef(({
                                              row,
                                              column,
                                              onRowChange,
                                              onClose
                                          }: EditorProps<RowData, RowData>,
                                          ref: any) => (
                            <SingleInputSuggest
                                ref={ref}
                                row_id={row[this.props.rowKey]}
                                inputRef={this.inputRef}
                                value={row[column.key]}
                                column={column.key}
                                inputValue={this.props.inputValue}
                                onInputChange={(value, cause) => this.props.onInputChange(row[this.props.rowKey], column.key, value, cause)}
                                suggestions={this.props.suggestions}
                                onRowChange={onRowChange}
                                onClose={onClose}
                            />
                        ))),
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement> {...p} onColumnsReorder={this.onHeaderDrop}>
                            {
                                // @ts-ignore
                                p.column.filterable ? (inputProps) => (
                                    <input
                                        {...inputProps}
                                        className="metanno-table-filter"
                                        value={this.props.filters[p.column.key]}
                                        onChange={(e) => this.props.onFiltersChange(p.column.key, e.target.value)}
                                        onKeyDown={inputStopPropagation}
                                    />
                                ) : null}
                        </HeaderRenderer>),
                    formatter: ({row, ...props}) => {
                        return <span>{row[props.column.key]}</span>
                    },
                };
            case 'multi-text':
                return {
                    editor: readonly ? null : React.forwardRef(({
                                                                    row,
                                                                    column,
                                                                    onRowChange,
                                                                    onClose
                                                                }: EditorProps<RowData, RowData>, ref: any) => (
                        <MultiInputSuggest
                            ref={ref}
                            row_id={row[this.props.rowKey]}
                            inputRef={this.inputRef}
                            value={row[column.key]}
                            column={column.key}
                            inputValue={this.props.inputValue}
                            onInputChange={(value, cause) => this.props.onInputChange(row[this.props.rowKey], column.key, value, cause)}
                            suggestions={this.props.suggestions}
                            onRowChange={onRowChange}
                            onClose={onClose}
                        />
                    )),
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement> {...p} onColumnsReorder={this.onHeaderDrop}>
                            {
                                // @ts-ignore
                                p.column.filterable ? (inputProps) => (
                                    <input
                                        {...inputProps}
                                        className="metanno-table-filter"
                                        value={this.props.filters[p.column.key]}
                                        onChange={(e) => this.props.onFiltersChange(p.column.key, e.target.value)}
                                        onKeyDown={inputStopPropagation}
                                    />
                                ) : null}
                        </HeaderRenderer>),
                    formatter: (props) => {
                        return <InputTag
                            autocontain
                            readOnly
                            {...props}
                            value={props.row[props.column.key]}
                        />
                    }
                };
            case 'boolean':
                return {
                    formatter: ({
                                    row,
                                    column,
                                    onRowChange,
                                    isCellSelected,
                                }) => {
                        return <BooleanInput
                            isCellSelected={isCellSelected}
                            value={row[column.key]}
                            onChange={value => onRowChange({...row, [column.key]: value})}
                        />;
                    },
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: (p) => (
                        <HeaderRenderer<RowData, unknown, HTMLInputElement> {...p} onColumnsReorder={this.onHeaderDrop}>
                            {
                                // @ts-ignore
                                p.column.filterable ? (inputProps) => (
                                    <input
                                        {...inputProps}
                                        className="metanno-table-filter"
                                        value={this.props.filters[p.column.key]}
                                        onChange={(e) => this.props.onFiltersChange(p.column.key, e.target.value)}
                                        onKeyDown={inputStopPropagation}
                                    />
                                ) : null}
                        </HeaderRenderer>),
                };
            case 'button':
                return {
                    formatter: ({row, column, isCellSelected}) => {
                        return <button onClick={() => this.props.onClickCellContent(row[this.props.rowKey], column.key)}>{column.key}</button>
                    }
                }
            default:
                return {};
        }
    };

    buildColumns = memoize(() => {
        const columnObjects = this.props.columns.map(column => {
            const {formatter, editor, ...columnProps} = this.buildFormatter(column.type, !column.mutable, column.filterable);
            return {
                [column.name]: {
                    ...{
                        key: column.name,
                        name: column.name,
                        draggable: true,
                        resizable: true,
                        editable: !!editor,
                        filterable: column.filterable,
                        editorOptions: {commitOnOutsideClick: column.type !== "hyperlink" && column.type !== "multi-hyperlink"},
                    },
                    ...(formatter ? {formatter} : {}),
                    ...(!!editor ? {editor} : {}),
                    ...columnProps,
                },
            };
        });
        const nameToCol = Object.assign({}, ...columnObjects);
        return [...this.state.columnsOrder.map(name => nameToCol[name])];
    }, () => ({columns: this.props.columns, columnsOrder: this.state.columnsOrder, filters: this.props.filters}));

    onRowsChange = (newRows) => {
        const updatedRows = (
            newRows
                .map((newRow, i) => ({"oldRow": this.props.rows[i], "newRow": newRow}))
                .filter(({newRow, oldRow}) => newRow !== oldRow)
        );
        if (updatedRows.length === 1) {
            const {newRow, oldRow} = updatedRows[0];
            const changedKeys = Object.keys(newRow).filter(key => newRow[key] !== oldRow[key]);
            this.props.onCellChange?.(oldRow[this.props.rowKey], changedKeys[0], newRow[changedKeys[0]]);
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

        this.setState(state => ({...state, columnsOrder: []}));
        this.setState(state => ({...state, columnsOrder: reorderedColumns}));
    };

    onSelectedRowsChange = (row_ids: Set<string>) => {
        this.props.onSelectedRowsChange?.(Array.from(row_ids));
    };

    renderRow = (props: RowRendererProps<RowData, RowData>) => {
        return <Row
            {...props}
            onMouseEnter={(event) => this.handleMouseEnterRow(event, props.row[this.props.rowKey])}
            onMouseLeave={(event) => this.handleMouseLeaveRow(event, props.row[this.props.rowKey])}
            className={this.props.highlightedRows.includes(props.row[this.props.rowKey]) ? 'metanno-row--highlighted' : ''}/>
    };

    rowKeyGetter = row => row[this.props.rowKey];

    onBlur = (event) => {
        if (event.currentTarget.contains(event.relatedTarget))
            return
        if (this.props.selectedPosition?.mode === "EDIT")
            return
        this.props.onSelectedPositionChange(
            null,
            null,
            "SELECT",
            "blur",
        );
    }

    handleSelectedPositionChange = ({idx, rowIdx, mode, cause="key"}) => {
        this.props.onSelectedPositionChange(
            rowIdx >= 0 ? this.props.rows[rowIdx][this.props.rowKey] : null,
            idx >= 0 ? this.state.columnsOrder[idx] : null,
            mode,
            cause,
        )
    }

    getSelectedPositionIndices = cachedReconcile((selectedPosition) => {
        const {row_id, col, mode} = selectedPosition || {row_id: null, col: null, mode: 'SELECT'};
        const row_idx = row_id === null ? -1 : row_id ? this.props.rows.findIndex(row => row[this.props.rowKey] === row_id) : -2;
        const col_idx = col ? this.state.columnsOrder.findIndex(name => col === name) : -2;
        return {
            rowIdx: row_idx,
            idx: col_idx,
            mode,
        }
    })

    render() {
        (this.inputRef.current?.input || this.inputRef.current)?.focus();

        return (
            <div className={"metanno-table"} onBlur={this.onBlur}>
                <DndProvider backend={HTML5Backend}>
                    <DataGrid
                        ref={this.gridRef}
                        rowKeyGetter={this.rowKeyGetter}
                        rowHeight={25}
                        selectedPosition={this.getSelectedPositionIndices(this.props.selectedPosition)}
                        onSelectedPositionChange={this.handleSelectedPositionChange}
                        columns={this.buildColumns()}
                        rows={this.props.rows}
                        rowRenderer={this.renderRow}
                        headerRowHeight={this.props.columns.some(col => col.filterable) ? 65 : undefined}
                        // selectedRows={new Set(this.props.selectedRows)}
                        // onSelectedRowsChange={this.onSelectedRowsChange}
                        onRowsChange={this.onRowsChange}
                    />
                </DndProvider>
            </div>
        );
    }
}

export default TableComponent;
