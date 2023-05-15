import React, {useCallback} from "react";
import {useSelector} from "react-redux";
import TableComponent from "../../components/TableComponent";
import Toolbar from "../../components/ToolBar";
import Loading from "../../components/Loading";
import {cachedReconcile} from "../../utils";
import {PyTableData, TableMethods, ToolbarData, ToolbarMethods} from "../../types";

const TableContainer = ({
     id,
     stateId,
     className,

     onKeyPress,
     onClickCellContent,
     onPositionChange,
     registerActions,
     onFiltersChange,
     onMouseEnterRow,
     onMouseLeaveRow,
     onButtonPress,
     onCellChange,
     onInputChange,
     selectState,
 }: {
    id: string;
    stateId: string;
    className?: string,
    selectState: (/*state: object, id: string*/) => PyTableData;
} & TableMethods & ToolbarMethods) => {
    const {
        rows,
        row_key,
        columns,
        buttons,
        loading,
        input_value,
        filters,
        suggestions,
        position,
        highlighted_rows,
    } = useSelector(useCallback(cachedReconcile(
        (state: object): PyTableData & ToolbarData & {loading: boolean}  => {
            let derived = null;
            if (selectState && state && state[stateId]) {
                derived = selectState()
            }

            return (derived
                ? {
                    rows: [],
                    columns: [],
                    rowKey: '',
                    buttons: [],
                    styles: [],
                    filters: {},
                    suggestions: [],
                    position: {},
                    highlighted_rows: [],
                    input_value: undefined,

                    ...derived, loading: false
                }
                : {loading: true})
        }),
        [id, selectState],
    ));

    if (loading) {
        return (
            <div className={"container is-loading"}>
                <Loading/>
            </div>);
    }
    return (
        <div className={`container ${buttons.length > 0 ? "has-toolbar" : ''} ${className}`}>
            {buttons.length > 0
                ? <Toolbar
                    buttons={buttons}
                    onButtonPress={idx => onButtonPress(idx)}/>
                : null}

            <TableComponent
                id={id}
                rows={rows}
                highlightedRows={highlighted_rows}
                columns={columns}
                filters={filters}
                rowKey={row_key}
                inputValue={input_value}
                suggestions={suggestions}
                position={position}

                onKeyPress={onKeyPress}
                onMouseEnterRow={onMouseEnterRow}
                onMouseLeaveRow={onMouseLeaveRow}
                onFiltersChange={onFiltersChange}
                onPositionChange={onPositionChange}
                onClickCellContent={onClickCellContent}
                onCellChange={onCellChange}
                onInputChange={onInputChange}
                registerActions={registerActions}
            />
        </div>
    )
};

export default TableContainer;