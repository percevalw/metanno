import React from 'react';
import {DndProvider} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DataGrid, {Row, SelectColumn, EditorProps, RowRendererProps, CalculatedColumn, Column} from "react-data-grid";

import './style.css';
import {memoize} from '../../utils';

import DraggableHeaderRenderer from '../DraggableHeaderRenderer'
import MultiInputSuggest, {InputTag} from "../MultiInputSuggest";
import SingleInputSuggest from "../SingleInputSuggest";
import BooleanInput from "../BooleanInput";

type BaseColumn = { key: string, name: string, suggestions: string[], type: string, readonly: boolean };
type BaseRow = { [other: string]: any, highlighted: boolean };

class TableComponent extends React.Component<{
    id: string;
    rowKey: string;
    rows: BaseRow[];
    selectedRows: string[];
    columns: BaseColumn[];
    registerActions: () => void;
    onSelectedCellChange?: (row_idx: number, name: string) => void;
    onSelectedRowsChange?: (rows: BaseRow[]) => void;
    onClickCellContent?: (key: string) => void;
    onKeyPress?: () => void;
    onEnterRow?: () => void;
    onLeaveRow?: () => void;
    onCellChange?: (row_idx: number, col: string, value: any) => void;
}, {
    columnsOrder: string[],
    lastSelectedCell: { key: string, column: string }
}> {
    constructor(props) {
        super(props);
        this.state = {
            columnsOrder: props.columns.map(column => column.name),
            lastSelectedCell: null,
        };
    }

    checkCellChange = (row, column, isCellSelected) => {
        if (this.state.lastSelectedCell === null || isCellSelected && (this.state.lastSelectedCell.column !== column.key || this.state.lastSelectedCell.key !== row[this.props.rowKey])) {
            this.setState({...this.state, lastSelectedCell: {column: column.key, key: row[this.props.rowKey]}});

            const index = this.props.rows.map((someRow, i) => ({row: someRow, i})).filter(({row: someRow, i}) => someRow[this.props.rowKey] === row[this.props.rowKey])[0].i;
            this.props.onSelectedCellChange && this.props.onSelectedCellChange(index, column.key);
        }
    }

    buildFormatter = (type, readonly): Partial<Column<BaseRow, BaseRow>> => {
        switch (type) {
            case 'hyperlink':
                return {
                    editor: readonly ? null : (
                        React.forwardRef(({
                                              row,
                                              column,
                                              onRowChange,
                                              onClose
                                          }: EditorProps<BaseRow, BaseRow>,
                                          ref: any) => (
                            <SingleInputSuggest
                                ref={ref}
                                value={row[column.key]}
                                column={column}
                                // @ts-ignore
                                suggestions={column.suggestions}
                                onRowChange={onRowChange}
                                onClose={onClose}
                                hyperlink
                            />
                        ))),
                    formatter: ({row, column, isCellSelected}) => {
                        this.checkCellChange(row, column, isCellSelected);
                        return row[column.key] ?
                            <a onClick={() => this.props.onClickCellContent(row[column.key].key)}>{row[column.key].text}</a> : null
                    }
                };
            case 'multi-hyperlink':
                return {
                    editor: readonly ? null : React.forwardRef(({
                                                                    row,
                                                                    column,
                                                                    onRowChange,
                                                                    onClose
                                                                }: EditorProps<BaseRow, BaseRow>,
                                                                ref: any) => (
                        <MultiInputSuggest
                            ref={ref}
                            value={row[column.key]}
                            column={column}
                            // @ts-ignore
                            suggestions={column.suggestions}
                            onRowChange={onRowChange}
                            onClose={onClose}
                            hyperlink
                        />
                    )),
                    formatter: ({row, ...props}) => {
                        this.checkCellChange(row, props.column, props.isCellSelected)
                        return <InputTag autocontain readOnly {...props} hyperlink
                                         onClick={this.props.onClickCellContent}
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
                                          }: EditorProps<BaseRow, BaseRow>,
                                          ref: any) => (
                            <SingleInputSuggest
                                ref={ref}
                                value={row[column.key]}
                                column={column}
                                // @ts-ignore
                                suggestions={column.suggestions}
                                onRowChange={onRowChange}
                                onClose={onClose}
                            />
                        ))),
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
                                                                }: EditorProps<BaseRow, BaseRow>, ref: any) => (
                        <MultiInputSuggest
                            ref={ref}
                            value={row[column.key]}
                            column={column}
                            // @ts-ignore
                            suggestions={column.suggestions}
                            onRowChange={onRowChange}
                            onClose={onClose}
                        />
                    )),
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
                    }
                };
            default:
                return {};
        }
    };

    buildColumns = memoize(() => {
        const HeaderRenderer = (props) => {
            return <DraggableHeaderRenderer {...props} onColumnsReorder={this.onHeaderDrop}/>;
        };

        const columnObjects = this.props.columns.map(column => {
            const {formatter, editor, ...columnProps} = this.buildFormatter(column.type, column.readonly);
            return {
                [column.name]: {
                    ...{
                        key: column.name,
                        name: column.name,
                        draggable: true,
                        resizable: true,
                        editable: !!editor,
                        suggestions: column.suggestions,
                        editorOptions: {commitOnOutsideClick: false},
                    },
                    ...(formatter ? {formatter} : {}),
                    ...(!!editor ? {editor} : {}),
                    ...columnProps,
                    headerRenderer: HeaderRenderer
                },
            };
        });
        const nameToCol = Object.assign({}, ...columnObjects);
        return [{...SelectColumn, width: 50}, ...this.state.columnsOrder.map(name => nameToCol[name])];
    }, () => ({columns: this.props.columns, columnsOrder: this.state.columnsOrder}));

    onRowsChange = (newRows) => {
        const updatedRows = (
            newRows
                .map((newRow, i) => ({"oldRow": this.props.rows[i], "newRow": newRow, "i": i}))
                .filter(({newRow, oldRow}) => newRow !== oldRow)
        );
        if (updatedRows.length === 1) {
            const {newRow, oldRow, i} = updatedRows[0];
            const changedKeys = Object.keys(newRow).filter(key => newRow[key] !== oldRow[key]);
            this.props.onCellChange?.(i, changedKeys[0], newRow[changedKeys[0]]);
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

    onSelectedRowsChange = (rows) => {
        this.props.onSelectedRowsChange?.(Array.from(rows));
    };

    onSelectedCellChange = (row: BaseRow, column: CalculatedColumn<BaseRow, BaseRow>) => {
        this.props.onSelectedCellChange?.(row[this.props.rowKey], this.props.columns[column.idx].name);
    };

    renderRow = (props: RowRendererProps<BaseRow, BaseRow>) => {
        return <Row
            {...props}
            selectCell={props.selectCell}//>this.onSelectedCellChange}
            onMouseEnter={this.props.onEnterRow}
            onMouseLeave={this.props.onLeaveRow}
            className={props.row.highlighted ? 'metanno-row--highlighted' : ''}/>
    };

    rowKeyGetter = row => row[this.props.rowKey];

    render() {
        return (
            <div className={"metanno-table"}>
                <DndProvider backend={HTML5Backend}>
                    <DataGrid
                        /*enableCellSelect*/
                        /*closeEditorAfterExternalChange={false}*/
                        /*minColumnWidth={70}*/
                        /*height={this.props.height}*/
                        rowKeyGetter={this.rowKeyGetter}
                        rowHeight={25}
                        columns={this.buildColumns()}
                        rows={this.props.rows}
                        rowRenderer={this.renderRow}
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
