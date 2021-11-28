import React, {useCallback} from 'react';
import {DndProvider} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DataGrid, {Row, SelectColumn, EditorProps, RowRendererProps, CalculatedColumn, FormatterProps} from "react-data-grid";
//import "react-data-grid/dist/react-data-grid.css";

import './style.css';
import {memoize, isEqual} from '../../utils';

import DraggableHeaderRenderer from '../DraggableHeaderRenderer'
import MultiInputSuggest, {InputTag} from "../MultiInputSuggest";
import SingleInputSuggest from "../SingleInputSuggest";

type BaseColumn = { key: string, name: string, suggestions: string[], type: string, readonly: boolean };
type BaseRow = { [other: string]: any, highlighted: boolean };
type EditorPropsWithRef<TRow, TSummary> = EditorProps<TRow, TSummary> & { ref: any }

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
}> {
    constructor(props) {
        super(props);
        this.state = {
            columnsOrder: props.columns.map(column => column.name),
        };
    }

    buildFormatter = (type, readonly): {
        formatter?: React.ComponentType<FormatterProps<BaseRow, BaseRow>>,
        editor?: React.ComponentType<EditorProps<BaseRow, BaseRow>>,
    } => {
        switch (type) {
            case 'hyperlink':
                return {
                    editor: readonly ? null : (
                        React.forwardRef(({
                                              row,
                                              column,
                                              onRowChange,
                                              onClose}: EditorProps<BaseRow, BaseRow>,
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
                    formatter: ({row, column}) => {
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
                                                                    onClose}: EditorProps<BaseRow, BaseRow>,
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
                    formatter: ({row, ...props}) => (
                        <InputTag autocontain readOnly {...props} hyperlink
                                  onClick={this.props.onClickCellContent}
                                  value={row[props.column.key]}/>)
                };
            case 'text':
                return {
                    editor: readonly ? null : (
                        React.forwardRef(({
                                              row,
                                              column,
                                              onRowChange,
                                              onClose}: EditorProps<BaseRow, BaseRow>,
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
                    formatter: ({row, ...props}) => <span>{row[props.column.key]}</span>,
                };
            case 'multi-text':
                return {
                    editor: readonly ? null : React.forwardRef(({
                                                                    row,
                                                                    column,
                                                                    onRowChange,
                                                                    onClose}: EditorProps<BaseRow, BaseRow>, ref: any) => (
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
                    formatter: (props) => (
                        <InputTag
                            autocontain
                            readOnly
                            {...props}
                            value={props.row[props.column.key]}
                        />)
                };
            case 'numeric':
            default:
                return {};
        }
    };

    buildColumns = memoize(() => {
        const HeaderRenderer = (props) => {
            return <DraggableHeaderRenderer {...props} onColumnsReorder={this.onHeaderDrop}/>;
        };

        const columnObjects = this.props.columns.map(column => {
            const {formatter, editor} = this.buildFormatter(column.type, column.readonly);
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
