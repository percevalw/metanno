import React, {useCallback} from "react";
import PropTypes from "prop-types";
import {connect, useSelector} from "react-redux";
import TableComponent from "../../components/TableComponent";
import Toolbar from "../../components/Toolbar";
import Loading from "../../components/Loading";
import {memoize} from "../../utils";
import cachedReconcile from "../../reconcile";

const TableEditor = ({
                         id,

                         onKeyPress,
                         onClickCellContent,
                         onSelectedCellChange,
                         registerActions,
                         onSelectedRowsChange,
                         onButtonPress,
                         onCellChange,
                         className,
                         selectEditorState,
                     }) => {
    const {
        rows,
        columns,
        rowKey,
        buttons,
        loading,
        selectedCells,
        styles,
        selectedRows,
    } = useSelector(useCallback(cachedReconcile(
        state => {
            const derived = selectEditorState(state, id);
            return (derived
                ? {
                    rows: [],
                    columns: [],
                    rowKey: '',
                    buttons: [],
                    selectedCells: [],
                    styles: [],
                    selectedRows: [], ...derived,
                    loading: false
                }
                : {loading: true})
        }),
        //? {...state.editors[id], loading: false} : {loading: true}),
        state => state,
        true
        //), []
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
                selectedRows={selectedRows}
                columns={columns}
                rowKey={rowKey}
                styles={styles}
                selectedCells={selectedCells}

                onKeyPress={onKeyPress}
                onSelectedRowsChange={onSelectedRowsChange}
                onSelectedCellChange={onSelectedCellChange}
                onClickCellContent={onClickCellContent}
                onCellChange={onCellChange}
                registerActions={registerActions}
            />
        </div>
    )
};

export default TableEditor;

TableEditor.propTypes = {
    id: PropTypes.string,
    rowKey: PropTypes.string,
    onKeyPress: PropTypes.func,
    onClickCellContent: PropTypes.func,
    onSelectedCellChange: PropTypes.func,
    onSelectedRowsChange: PropTypes.func,
    onEnterCell: PropTypes.func,
    onLeaveCell: PropTypes.func,
    onSelectCells: PropTypes.func,
    registerActions: PropTypes.func,
    onCellChange: PropTypes.func,
    className: PropTypes.string,
    selectEditorState: PropTypes.func,
};