import React, { forwardRef, useState, useRef, useLayoutEffect, useEffect, useImperativeHandle, useCallback, createElement } from 'react';
import clsx from 'clsx';
import { useGridDimensions, useViewportColumns, useViewportRows } from 'react-data-grid/lib/hooks';
import EventBus from 'react-data-grid/lib/EventBus';
import HeaderRow from 'react-data-grid/lib/HeaderRow';
import FilterRow from 'react-data-grid/lib/FilterRow';
import Row from 'react-data-grid/lib/Row';
import GroupRowRenderer from 'react-data-grid/lib/GroupRow';
import SummaryRow from 'react-data-grid/lib/SummaryRow';
import { assertIsValidKey, getColumnScrollPosition, getNextSelectedCellPosition, isSelectedCellEditable, canExitGrid, isCtrlKeyHeldDown, isDefaultCellInput } from 'react-data-grid/lib/utils';
import { CellNavigationMode, UpdateActions } from 'react-data-grid/lib/enums';
import isEqual from 'react-fast-compare';

/**
 * Main API Component to render a data grid of rows and columns
 *
 * @example
 *
 * <DataGrid columns={columns} rows={rows} />
 */
function DataGrid({
// Grid and data Props
                      columns: rawColumns, rows: rawRows, summaryRows, rowKey, onRowsUpdate, onRowsChange,
// Dimensions props
                      rowHeight = 35, headerRowHeight = rowHeight, headerFiltersHeight = 45,
// Feature props
                      selectedRows, onSelectedRowsChange, sortColumn, sortDirection, onSort, filters, onFiltersChange, defaultColumnOptions, groupBy: rawGroupBy, rowGrouper, expandedGroupIds, onExpandedGroupIdsChange,
// Custom renderers
                      rowRenderer: RowRenderer = Row, emptyRowsRenderer,
// Event props
                      onRowClick, onScroll, onColumnResize, onSelectedCellChange, onCheckCellIsEditable, onSelectedPositionChange,
// Toggles and modes
                      enableFilters = false, enableCellCopyPaste = false, enableCellDragAndDrop = false, cellNavigationMode = CellNavigationMode.NONE, closeEditorAfterExternalChange = true,
// Miscellaneous
                      editorPortalTarget = document.body, className, style, rowClass,
// ARIA
                      'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy }, ref) {
    /**
     * states
     */
    const [eventBus] = useState(() => new EventBus());
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [dismissNextCommit, setDismissNextCommit] = useState(false);
    const [columnWidths, setColumnWidths] = useState(() => new Map());
    const [selectedPosition, setSelectedPosition] = useState({ idx: -1, rowIdx: -1, mode: 'SELECT' });
    const [copiedPosition, setCopiedPosition] = useState(null);
    const [isDragging, setDragging] = useState(false);
    const [draggedOverRowIdx, setOverRowIdx] = useState(undefined);
    const setDraggedOverRowIdx = useCallback((rowIdx) => {
        setOverRowIdx(rowIdx);
        latestDraggedOverRowIdx.current = rowIdx;
    }, []);
    /**
     * refs
     */
    const focusSinkRef = useRef(null);
    const prevSelectedPosition = useRef(selectedPosition);
    const latestDraggedOverRowIdx = useRef(draggedOverRowIdx);
    const lastSelectedRowIdx = useRef(-1);
    const isCellFocusable = useRef(false);
    /**
     * computed values
     */
    const [gridRef, gridWidth, gridHeight] = useGridDimensions();
    const headerRowsCount = enableFilters ? 2 : 1;
    const summaryRowsCount = summaryRows?.length ?? 0;
    const totalHeaderHeight = headerRowHeight + (enableFilters ? headerFiltersHeight : 0);
    const clientHeight = gridHeight - totalHeaderHeight - summaryRowsCount * rowHeight;
    const isSelectable = selectedRows !== undefined && onSelectedRowsChange !== undefined;
    const { columns, viewportColumns, totalColumnWidth, lastFrozenColumnIndex, totalFrozenColumnWidth, groupBy } = useViewportColumns({
        rawColumns,
        columnWidths,
        scrollLeft,
        viewportWidth: gridWidth,
        defaultColumnOptions,
        rawGroupBy,
        rowGrouper
    });
    const { rowOverscanStartIdx, rowOverscanEndIdx, rows, rowsCount, isGroupRow } = useViewportRows({
        rawRows,
        groupBy,
        rowGrouper,
        rowHeight,
        clientHeight,
        scrollTop,
        expandedGroupIds
    });
    const hasGroups = groupBy.length > 0 && rowGrouper;
    const minColIdx = hasGroups ? -1 : 0;
    if (hasGroups) {
        // Cell drag is not supported on a treegrid
        enableCellDragAndDrop = false;
    }
    /**
     * effects
     */
    useLayoutEffect(() => {
        if (selectedPosition === prevSelectedPosition.current || selectedPosition.mode === 'EDIT' || !isCellWithinBounds(selectedPosition))
            return;
        prevSelectedPosition.current = selectedPosition;
        scrollToCell(selectedPosition);
        if (isCellFocusable.current) {
            isCellFocusable.current = false;
            return;
        }
        focusSinkRef.current.focus();
    });
    useEffect(() => {
        if (!onSelectedRowsChange)
            return;
        const handleRowSelectionChange = ({ rowIdx, checked, isShiftClick }) => {
            assertIsValidKey(rowKey);
            const newSelectedRows = new Set(selectedRows);
            const row = rows[rowIdx];
            if (isGroupRow(row)) {
                for (const childRow of row.childRows) {
                    if (checked) {
                        newSelectedRows.add(childRow[rowKey]);
                    }
                    else {
                        newSelectedRows.delete(childRow[rowKey]);
                    }
                }
                onSelectedRowsChange(newSelectedRows);
                return;
            }
            const rowId = row[rowKey];
            if (checked) {
                newSelectedRows.add(rowId);
                const previousRowIdx = lastSelectedRowIdx.current;
                lastSelectedRowIdx.current = rowIdx;
                if (isShiftClick && previousRowIdx !== -1 && previousRowIdx !== rowIdx) {
                    const step = Math.sign(rowIdx - previousRowIdx);
                    for (let i = previousRowIdx + step; i !== rowIdx; i += step) {
                        const row = rows[i];
                        if (isGroupRow(row))
                            continue;
                        newSelectedRows.add(row[rowKey]);
                    }
                }
            }
            else {
                newSelectedRows.delete(rowId);
                lastSelectedRowIdx.current = -1;
            }
            onSelectedRowsChange(newSelectedRows);
        };
        return eventBus.subscribe('SELECT_ROW', handleRowSelectionChange);
    }, [eventBus, isGroupRow, onSelectedRowsChange, rowKey, rows, selectedRows]);
    useEffect(() => {
        return eventBus.subscribe('SELECT_CELL', selectCell);
    });
    useEffect(() => {
        if (!onExpandedGroupIdsChange)
            return;
        const toggleGroup = (expandedGroupId) => {
            const newExpandedGroupIds = new Set(expandedGroupIds);
            if (newExpandedGroupIds.has(expandedGroupId)) {
                newExpandedGroupIds.delete(expandedGroupId);
            }
            else {
                newExpandedGroupIds.add(expandedGroupId);
            }
            onExpandedGroupIdsChange(newExpandedGroupIds);
        };
        return eventBus.subscribe('TOGGLE_GROUP', toggleGroup);
    }, [eventBus, expandedGroupIds, onExpandedGroupIdsChange]);
    useImperativeHandle(ref, () => ({
        scrollToColumn(idx) {
            scrollToCell({ idx });
        },
        scrollToRow(rowIdx) {
            const { current } = gridRef;
            if (!current)
                return;
            current.scrollTop = rowIdx * rowHeight;
        },
        selectCell
    }));
    /**
     * event handlers
     */
    function handleKeyDown(event) {
        const { key } = event;
        const row = rows[selectedPosition.rowIdx];
        if (enableCellCopyPaste
            && isCtrlKeyHeldDown(event)
            && isCellWithinBounds(selectedPosition)
            && !isGroupRow(row)
            && selectedPosition.idx !== -1) {
            // key may be uppercase `C` or `V`
            const lowerCaseKey = key.toLowerCase();
            if (lowerCaseKey === 'c') {
                handleCopy();
                return;
            }
            if (lowerCaseKey === 'v') {
                handlePaste();
                return;
            }
        }
        if (isCellWithinBounds(selectedPosition)
            && isGroupRow(row)
            && selectedPosition.idx === -1
            && (
                // Collapse the current group row if it is focused and is in expanded state
                (key === 'ArrowLeft' && row.isExpanded)
                // Expand the current group row if it is focused and is in collapsed state
                || (key === 'ArrowRight' && !row.isExpanded))) {
            event.preventDefault(); // Prevents scrolling
            eventBus.dispatch('TOGGLE_GROUP', row.id);
            return;
        }
        switch (event.key) {
            case 'Escape':
                setCopiedPosition(null);
                closeEditor();
                return;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'Tab':
            case 'Home':
            case 'End':
            case 'PageUp':
            case 'PageDown':
                navigate(event);
                break;
            default:
                handleCellInput(event);
                break;
        }
    }
    function handleFocus() {
        isCellFocusable.current = true;
    }
    function handleScroll(event) {
        const { scrollTop, scrollLeft } = event.currentTarget;
        setScrollTop(scrollTop);
        setScrollLeft(scrollLeft);
        onScroll?.(event);
    }
    const handleColumnResize = useCallback((column, width) => {
        const newColumnWidths = new Map(columnWidths);
        newColumnWidths.set(column.key, width);
        setColumnWidths(newColumnWidths);
        onColumnResize?.(column.idx, width);
    }, [columnWidths, onColumnResize]);
    function getRawRowIdx(rowIdx) {
        return hasGroups ? rawRows.indexOf(rows[rowIdx]) : rowIdx;
    }
    function handleCommit({ cellKey, rowIdx, updated }, ) {
        console.log("handleCommit", dismissNextCommit)
        if (dismissNextCommit) {
            setDismissNextCommit(false);
            return;
        }
        rowIdx = getRawRowIdx(rowIdx);
        onRowsUpdate?.({
            cellKey,
            fromRow: rowIdx,
            toRow: rowIdx,
            updated,
            action: UpdateActions.CELL_UPDATE
        });
        closeEditor();
    }
    function commitEditor2Changes() {
        if (columns[selectedPosition.idx]?.editor2 === undefined
            || selectedPosition.mode === 'SELECT'
            || selectedPosition.row === selectedPosition.originalRow) {
            return;
        }
        const updatedRows = [...rawRows];
        updatedRows[getRawRowIdx(selectedPosition.rowIdx)] = selectedPosition.row;
        onRowsChange?.(updatedRows);
    }
    function handleCopy() {
        const { idx, rowIdx } = selectedPosition;
        const rawRowIdx = getRawRowIdx(rowIdx);
        const value = rawRows[rawRowIdx][columns[idx].key];
        setCopiedPosition({ idx, rowIdx, value });
    }
    function handlePaste() {
        if (copiedPosition === null
            || !isCellEditable(selectedPosition)
            || (copiedPosition.idx === selectedPosition.idx && copiedPosition.rowIdx === selectedPosition.rowIdx)) {
            return;
        }
        const fromRow = getRawRowIdx(copiedPosition.rowIdx);
        const fromCellKey = columns[copiedPosition.idx].key;
        const toRow = getRawRowIdx(selectedPosition.rowIdx);
        const cellKey = columns[selectedPosition.idx].key;
        onRowsUpdate?.({
            cellKey,
            fromRow,
            toRow,
            updated: { [cellKey]: copiedPosition.value },
            action: UpdateActions.COPY_PASTE,
            fromCellKey
        });
    }
    function handleCellInput(event) {
        if (!isCellWithinBounds(selectedPosition))
            return;
        const row = rows[selectedPosition.rowIdx];
        if (isGroupRow(row))
            return;
        const { key } = event;
        const column = columns[selectedPosition.idx];
        if (selectedPosition.mode === 'EDIT') {
            if (key === 'Enter') {
                // Custom editors can listen for the event and stop propagation to prevent commit
                commitEditor2Changes();
                closeEditor();
            }
            return;
        }
        column.editorOptions?.onCellKeyDown?.(event);
        if (event.isDefaultPrevented())
            return;
        if (isCellEditable(selectedPosition) && isDefaultCellInput(event)) {
            setSelectedPosition(({ idx, rowIdx }) => ({
                idx,
                rowIdx,
                key,
                mode: 'EDIT',
                row,
                originalRow: row
            }));
        }
    }
    function handleDragEnd() {
        if (latestDraggedOverRowIdx.current === undefined)
            return;
        const { idx, rowIdx } = selectedPosition;
        const column = columns[idx];
        const cellKey = column.key;
        const value = rawRows[rowIdx][cellKey];
        onRowsUpdate?.({
            cellKey,
            fromRow: rowIdx,
            toRow: latestDraggedOverRowIdx.current,
            updated: { [cellKey]: value },
            action: UpdateActions.CELL_DRAG
        });
        setDraggedOverRowIdx(undefined);
    }
    function handleMouseDown(event) {
        if (event.buttons !== 1)
            return;
        setDragging(true);
        window.addEventListener('mouseover', onMouseOver);
        window.addEventListener('mouseup', onMouseUp);
        function onMouseOver(event) {
            // Trigger onMouseup in edge cases where we release the mouse button but `mouseup` isn't triggered,
            // for example when releasing the mouse button outside the iframe the grid is rendered in.
            // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
            if (event.buttons !== 1)
                onMouseUp();
        }
        function onMouseUp() {
            window.removeEventListener('mouseover', onMouseOver);
            window.removeEventListener('mouseup', onMouseUp);
            setDragging(false);
            handleDragEnd();
        }
    }
    function handleDoubleClick(event) {
        event.stopPropagation();
        const column = columns[selectedPosition.idx];
        const cellKey = column.key;
        const value = rawRows[selectedPosition.rowIdx][cellKey];
        onRowsUpdate?.({
            cellKey,
            fromRow: selectedPosition.rowIdx,
            toRow: rawRows.length - 1,
            updated: { [cellKey]: value },
            action: UpdateActions.COLUMN_FILL
        });
    }
    function handleRowChange(row, commitChanges) {
        if (selectedPosition.mode === 'SELECT')
            return;
        if (commitChanges) {
            const updatedRows = [...rawRows];
            updatedRows[getRawRowIdx(selectedPosition.rowIdx)] = row;
            onRowsChange?.(updatedRows);
            closeEditor();
        }
        else {
            setSelectedPosition(position => ({ ...position, row }));
        }
    }
    function handleOnClose(commitChanges) {
        if (commitChanges) {
            commitEditor2Changes();
        }
        closeEditor();
    }
    /**
     * utils
     */
    useEffect(() => {
        onSelectedPositionChange && onSelectedPositionChange(selectedPosition)
    }, [selectedPosition]);

    function isCellWithinBounds({ idx, rowIdx }) {
        return rowIdx >= 0 && rowIdx < rows.length && idx >= minColIdx && idx < columns.length;
    }
    function isCellEditable(position) {
        return isCellWithinBounds(position)
            && isSelectedCellEditable({ columns, rows, selectedPosition: position, onCheckCellIsEditable, isGroupRow });
    }
    function selectCell(position, enableEditor = false) {
        if (!isCellWithinBounds(position))
            return;
        commitEditor2Changes();
        if (enableEditor && isCellEditable(position)) {
            const row = rows[position.rowIdx];
            setSelectedPosition({ ...position, mode: 'EDIT', key: null, row, originalRow: row });
        }
        else {
            setSelectedPosition({ ...position, mode: 'SELECT' });
        }
        onSelectedCellChange?.({ ...position });
    }
    function closeEditor() {
        if (selectedPosition.mode === 'SELECT')
            return;
        setSelectedPosition(({ idx, rowIdx }) => ({ idx, rowIdx, mode: 'SELECT' }));
    }
    function scrollToCell({ idx, rowIdx }) {
        const { current } = gridRef;
        if (!current)
            return;
        if (typeof idx === 'number' && idx > lastFrozenColumnIndex) {
            const { clientWidth } = current;
            const { left, width } = columns[idx];
            const isCellAtLeftBoundary = left < scrollLeft + width + totalFrozenColumnWidth;
            const isCellAtRightBoundary = left + width > clientWidth + scrollLeft;
            if (isCellAtLeftBoundary || isCellAtRightBoundary) {
                const newScrollLeft = getColumnScrollPosition(columns, idx, scrollLeft, clientWidth);
                current.scrollLeft = scrollLeft + newScrollLeft;
            }
        }
        if (typeof rowIdx === 'number') {
            if (rowIdx * rowHeight < scrollTop) {
                // at top boundary, scroll to the row's top
                current.scrollTop = rowIdx * rowHeight;
            }
            else if ((rowIdx + 1) * rowHeight > scrollTop + clientHeight) {
                // at bottom boundary, scroll the next row's top to the bottom of the viewport
                current.scrollTop = (rowIdx + 1) * rowHeight - clientHeight;
            }
        }
    }
    function getNextPosition(key, ctrlKey, shiftKey) {
        const { idx, rowIdx } = selectedPosition;
        const row = rows[rowIdx];
        const isRowSelected = isCellWithinBounds(selectedPosition) && idx === -1;
        // If a group row is focused, and it is collapsed, move to the parent group row (if there is one).
        if (key === 'ArrowLeft'
            && isRowSelected
            && isGroupRow(row)
            && !row.isExpanded
            && row.level !== 0) {
            let parentRowIdx = -1;
            for (let i = selectedPosition.rowIdx - 1; i >= 0; i--) {
                const parentRow = rows[i];
                if (isGroupRow(parentRow) && parentRow.id === row.parentId) {
                    parentRowIdx = i;
                    break;
                }
            }
            if (parentRowIdx !== -1) {
                return { idx, rowIdx: parentRowIdx };
            }
        }
        switch (key) {
            case 'ArrowUp':
                return { idx, rowIdx: rowIdx - 1 };
            case 'ArrowDown':
                return { idx, rowIdx: rowIdx + 1 };
            case 'ArrowLeft':
                return { idx: idx - 1, rowIdx };
            case 'ArrowRight':
                return { idx: idx + 1, rowIdx };
            case 'Tab':
                if (selectedPosition.idx === -1 && selectedPosition.rowIdx === -1) {
                    return shiftKey ? { idx: columns.length - 1, rowIdx: rows.length - 1 } : { idx: 0, rowIdx: 0 };
                }
                return { idx: idx + (shiftKey ? -1 : 1), rowIdx };
            case 'Home':
                // If row is selected then move focus to the first row
                if (isRowSelected)
                    return { idx, rowIdx: 0 };
                return ctrlKey ? { idx: 0, rowIdx: 0 } : { idx: 0, rowIdx };
            case 'End':
                // If row is selected then move focus to the last row.
                if (isRowSelected)
                    return { idx, rowIdx: rows.length - 1 };
                return ctrlKey ? { idx: columns.length - 1, rowIdx: rows.length - 1 } : { idx: columns.length - 1, rowIdx };
            case 'PageUp':
                return { idx, rowIdx: rowIdx - Math.floor(clientHeight / rowHeight) };
            case 'PageDown':
                return { idx, rowIdx: rowIdx + Math.floor(clientHeight / rowHeight) };
            default:
                return selectedPosition;
        }
    }
    function navigate(event) {
        const { key, shiftKey } = event;
        const ctrlKey = isCtrlKeyHeldDown(event);
        let nextPosition = getNextPosition(key, ctrlKey, shiftKey);
        let mode = cellNavigationMode;
        if (key === 'Tab') {
            // If we are in a position to leave the grid, stop editing but stay in that cell
            if (canExitGrid({ shiftKey, cellNavigationMode, columns, rowsCount: rows.length, selectedPosition })) {
                // Allow focus to leave the grid so the next control in the tab order can be focused
                return;
            }
            mode = cellNavigationMode === CellNavigationMode.NONE
                ? CellNavigationMode.CHANGE_ROW
                : cellNavigationMode;
        }
        // Do not allow focus to leave
        event.preventDefault();
        nextPosition = getNextSelectedCellPosition({
            columns,
            rowsCount: rows.length,
            cellNavigationMode: mode,
            nextPosition
        });
        selectCell(nextPosition);
    }
    function getDraggedOverCellIdx(currentRowIdx) {
        if (draggedOverRowIdx === undefined)
            return;
        const { rowIdx } = selectedPosition;
        const isDraggedOver = rowIdx < draggedOverRowIdx
            ? rowIdx < currentRowIdx && currentRowIdx <= draggedOverRowIdx
            : rowIdx > currentRowIdx && currentRowIdx >= draggedOverRowIdx;
        return isDraggedOver ? selectedPosition.idx : undefined;
    }
    function getSelectedCellProps(rowIdx) {
        if (selectedPosition.rowIdx !== rowIdx)
            return;
        if (selectedPosition.mode === 'EDIT') {
            return {
                mode: 'EDIT',
                idx: selectedPosition.idx,
                onKeyDown: handleKeyDown,
                editorPortalTarget,
                editorContainerProps: {
                    rowHeight,
                    scrollLeft,
                    scrollTop,
                    firstEditorKeyPress: selectedPosition.key,
                    onCommit: handleCommit,
                    onCommitCancel: closeEditor
                },
                editor2Props: {
                    rowHeight,
                    row: selectedPosition.row,
                    onRowChange: handleRowChange,
                    onClose: handleOnClose
                }
            };
        }
        return {
            mode: 'SELECT',
            idx: selectedPosition.idx,
            onFocus: handleFocus,
            onKeyDown: handleKeyDown,
            dragHandleProps: enableCellDragAndDrop && isCellEditable(selectedPosition)
                ? { onMouseDown: handleMouseDown, onDoubleClick: handleDoubleClick }
                : undefined
        };
    }
    function getViewportRows() {
        const rowElements = [];
        let startRowIndex = 0;
        for (let rowIdx = rowOverscanStartIdx; rowIdx <= rowOverscanEndIdx; rowIdx++) {
            const row = rows[rowIdx];
            const top = rowIdx * rowHeight + totalHeaderHeight;
            if (isGroupRow(row)) {
                ({ startRowIndex } = row);
                rowElements.push(React.createElement(GroupRowRenderer, { "aria-level": row.level + 1, "aria-setsize": row.setSize, "aria-posinset": row.posInSet + 1, "aria-rowindex": headerRowsCount + startRowIndex + 1, key: row.id, id: row.id, groupKey: row.groupKey, viewportColumns: viewportColumns, childRows: row.childRows, rowIdx: rowIdx, top: top, level: row.level, isExpanded: row.isExpanded, selectedCellIdx: selectedPosition.rowIdx === rowIdx ? selectedPosition.idx : undefined, isRowSelected: isSelectable && row.childRows.every(cr => selectedRows?.has(cr[rowKey])), eventBus: eventBus, onFocus: selectedPosition.rowIdx === rowIdx ? handleFocus : undefined, onKeyDown: selectedPosition.rowIdx === rowIdx ? handleKeyDown : undefined }));
                continue;
            }
            startRowIndex++;
            let key = hasGroups ? startRowIndex : rowIdx;
            let isRowSelected = false;
            if (rowKey !== undefined) {
                const rowId = row[rowKey];
                isRowSelected = selectedRows?.has(rowId) ?? false;
                if (typeof rowId === 'string' || typeof rowId === 'number') {
                    key = rowId;
                }
            }
            rowElements.push(React.createElement(RowRenderer, { "aria-rowindex": headerRowsCount + (hasGroups ? startRowIndex : rowIdx) + 1, "aria-selected": isSelectable ? isRowSelected : undefined, key: key, rowIdx: rowIdx, row: row, viewportColumns: viewportColumns, eventBus: eventBus, isRowSelected: isRowSelected, onRowClick: onRowClick, rowClass: rowClass, top: top, copiedCellIdx: copiedPosition?.rowIdx === rowIdx ? copiedPosition.idx : undefined, draggedOverCellIdx: getDraggedOverCellIdx(rowIdx), setDraggedOverRowIdx: isDragging ? setDraggedOverRowIdx : undefined, selectedCellProps: getSelectedCellProps(rowIdx) }));
        }
        return rowElements;
    }
    // Reset the positions if the current values are no longer valid. This can happen if a column or row is removed
    if (selectedPosition.idx >= columns.length || selectedPosition.rowIdx >= rows.length) {
        setSelectedPosition({ idx: -1, rowIdx: -1, mode: 'SELECT' });
        setCopiedPosition(null);
        setDraggedOverRowIdx(undefined);
    }
    if (selectedPosition.mode === 'EDIT' && rows[selectedPosition.rowIdx] !== selectedPosition.originalRow) {
        // Discard changes if rows are updated from outside
        if (closeEditorAfterExternalChange)
            closeEditor();
        else {
            !dismissNextCommit && setDismissNextCommit(true);
            console.log("setDismissNextCommit true | before:", dismissNextCommit)
        }
        setSelectedPosition({...selectedPosition, originalRow: rows[selectedPosition.rowIdx]});
    }

    return (React.createElement("div", { role: hasGroups ? 'treegrid' : 'grid', "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, "aria-describedby": ariaDescribedBy, "aria-multiselectable": isSelectable ? true : undefined, "aria-colcount": columns.length, "aria-rowcount": headerRowsCount + rowsCount + summaryRowsCount, className: clsx('rdg', { 'rdg-viewport-dragging': isDragging }, className), style: {
                ...style,
                '--header-row-height': `${headerRowHeight}px`,
                '--filter-row-height': `${headerFiltersHeight}px`,
                '--row-width': `${totalColumnWidth}px`,
                '--row-height': `${rowHeight}px`
            }, ref: gridRef, onScroll: handleScroll },
        React.createElement(HeaderRow, { rowKey: rowKey, rows: rawRows, columns: viewportColumns, onColumnResize: handleColumnResize, allRowsSelected: selectedRows?.size === rawRows.length, onSelectedRowsChange: onSelectedRowsChange, sortColumn: sortColumn, sortDirection: sortDirection, onSort: onSort }),
        enableFilters && (React.createElement(FilterRow, { columns: viewportColumns, filters: filters, onFiltersChange: onFiltersChange })),
        rows.length === 0 && emptyRowsRenderer ? createElement(emptyRowsRenderer) : (React.createElement(React.Fragment, null,
            React.createElement("div", { ref: focusSinkRef, tabIndex: 0, className: "rdg-focus-sink", onKeyDown: handleKeyDown }),
            React.createElement("div", { style: { height: Math.max(rows.length * rowHeight, clientHeight) } }),
            getViewportRows(),
            summaryRows?.map((row, rowIdx) => (React.createElement(SummaryRow, { "aria-rowindex": headerRowsCount + rowsCount + rowIdx + 1, key: rowIdx, rowIdx: rowIdx, row: row, bottom: rowHeight * (summaryRows.length - 1 - rowIdx), viewportColumns: viewportColumns })))))));
}
export default forwardRef(DataGrid);
//# sourceMappingURL=DataGrid.js.map

// TODO: add changeMode method, and externalChangeClosesEditor flag