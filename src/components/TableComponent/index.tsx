import React from 'react';
import {DndProvider} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DataGrid, {CalculatedColumn, DataGridHandle, EditorProps, Row, RowRendererProps, SelectColumn} from "react-data-grid";

import './style.css';
import {makeModKeys, memoize} from '../../utils';

import HeaderRenderer from '../DraggableHeaderRenderer'
import MultiInputSuggest, {InputTag} from "../MultiInputSuggest";
import SingleInputSuggest from "../SingleInputSuggest";
import BooleanInput from "../BooleanInput";
import {RowData, TableData, TableMethods} from "../../types";


function inputStopPropagation(event: React.KeyboardEvent<HTMLInputElement>) {
    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.stopPropagation();
    }
}

const getIdx = (items: { [key: string]: any }[], value: any, key: string = "id"): number => {
    for (let i = 0; i < items.length; i++) {
        if (items[i][key] === value) {
            return i;
        }
    }
}

class TableComponent extends React.Component<{ id: string; } & TableData & TableMethods, {
    columnsOrder: string[],
    lastSelectedCell: { key: string, column: string }
}> {
    private readonly gridRef: React.MutableRefObject<DataGridHandle>;
    private readonly inputRef: React.RefObject<any>;

    constructor(props) {
        super(props);
        this.state = {
            columnsOrder: props.columns.map(column => column.name),
            lastSelectedCell: null,
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
            focus_input: () => {
                const input = this.inputRef.current?.input || this.inputRef.current
                if (input) {
                    input.focus();
                }
            },
            select_cell: (row_id: string, col: string, edit: boolean) => {
                setTimeout(() => {
                    this.gridRef.current.element.focus();
                    this.gridRef.current.selectCell({
                        idx: getIdx(this.props.columns, col, 'name') + 1,
                        rowIdx: getIdx(this.props.rows, row_id, this.props.rowKey),
                    }, edit);
                }, 30);
            },
        });
    }

    checkCellChange = (row, column, isCellSelected) => {
        if (isCellSelected && (this.state.lastSelectedCell === null || (this.state.lastSelectedCell.column !== column.key || this.state.lastSelectedCell.key !== row[this.props.rowKey]))) {
            this.setState({...this.state, lastSelectedCell: {column: column.key, key: row[this.props.rowKey]}});

            this.props.onSelectedCellChange && this.props.onSelectedCellChange(row[this.props.rowKey], column.key);
        }
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
                    formatter: ({row, column, isCellSelected}) => {
                        this.checkCellChange(row, column, isCellSelected);
                        return row[column.key] ?
                            <a onClick={() => this.props.onClickCellContent(row[this.props.rowKey], column.key)}>{row[column.key].text}</a> : null
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
                        this.checkCellChange(row, props.column, props.isCellSelected)
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
                        this.checkCellChange(row, props.column, props.isCellSelected)
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
                        this.checkCellChange(props.row, props.column, props.isCellSelected)
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
                        this.checkCellChange(row, column, isCellSelected);
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
                        this.checkCellChange(row, column, isCellSelected);
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
        return [{...SelectColumn, width: 50}, ...this.state.columnsOrder.map(name => nameToCol[name])];
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

    onSelectedCellChange = (row: RowData, column: CalculatedColumn<RowData, RowData>) => {
        this.props.onSelectedCellChange?.(row[this.props.rowKey], this.props.columns[column.idx].name);
    };

    renderRow = (props: RowRendererProps<RowData, RowData>) => {
        return <Row
            {...props}
            selectCell={props.selectCell}//>this.onSelectedCellChange}
            onMouseEnter={(event) => this.handleMouseEnterRow(event, props.row[this.props.rowKey])}
            onMouseLeave={(event) => this.handleMouseLeaveRow(event, props.row[this.props.rowKey])}
            className={this.props.highlightedRows.includes(props.row[this.props.rowKey]) ? 'metanno-row--highlighted' : ''}/>
    };

    rowKeyGetter = row => row[this.props.rowKey];

    onBlur = () => {
        if (this.gridRef?.current && this.inputRef.current === null)
            (this.gridRef?.current as any).selectCell({
                idx: -1,
                rowIdx: -2,
            }, false);
    }

    render() {
        return (
            <div className={"metanno-table"} onBlur={this.onBlur}>
                <DndProvider backend={HTML5Backend}>
                    <DataGrid
                        ref={this.gridRef}
                        rowKeyGetter={this.rowKeyGetter}
                        rowHeight={25}
                        columns={this.buildColumns()}
                        rows={this.props.rows}
                        rowRenderer={this.renderRow}
                        headerRowHeight={this.props.columns.some(col => col.filterable) ? 65 : undefined}
                        selectedRows={new Set(this.props.selectedRows)}
                        onSelectedRowsChange={this.onSelectedRowsChange}
                        onRowsChange={this.onRowsChange}
                    />
                </DndProvider>
            </div>
        );
    }
}

export default TableComponent;
