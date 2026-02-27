"use strict";
(self["webpackChunkmetanno"] = self["webpackChunkmetanno"] || []).push([["submodules_react-data-grid_lib_bundle_js"],{

/***/ "./submodules/react-data-grid/lib/bundle.js"
/*!**************************************************!*\
  !*** ./submodules/react-data-grid/lib/bundle.js ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Row: () => (/* binding */ RowWithRef),
/* harmony export */   SELECT_COLUMN_KEY: () => (/* binding */ SELECT_COLUMN_KEY),
/* harmony export */   SelectCellFormatter: () => (/* binding */ SelectCellFormatter),
/* harmony export */   SelectColumn: () => (/* binding */ SelectColumn),
/* harmony export */   SortableHeaderCell: () => (/* binding */ SortableHeaderCell),
/* harmony export */   TextEditor: () => (/* binding */ TextEditor),
/* harmony export */   ToggleGroupFormatter: () => (/* binding */ ToggleGroupFormatter),
/* harmony export */   ValueFormatter: () => (/* binding */ ValueFormatter),
/* harmony export */   "default": () => (/* binding */ DataGrid$1),
/* harmony export */   useRowSelection: () => (/* binding */ useRowSelection)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var clsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! clsx */ "./submodules/react-data-grid/node_modules/clsx/dist/clsx.m.js");
/* harmony import */ var _babel_runtime_helpers_extends__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/extends */ "./submodules/react-data-grid/node_modules/@babel/runtime/helpers/esm/extends.js");




function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$e = "@media (prefers-color-scheme:light){.rnvodz5700-beta7{--color:#000;--border-color:#ddd;--summary-border-color:#aaa;--background-color:#fff;--header-background-color:#f9f9f9;--row-hover-background-color:#f5f5f5;--row-selected-background-color:#dbecfa;--row-selected-hover-background-color:#c9e3f8;--checkbox-color:#005194;--checkbox-focus-color:#61b8ff;--checkbox-disabled-border-color:#ccc;--checkbox-disabled-background-color:#ddd}}@media (prefers-color-scheme:dark){.rnvodz5700-beta7{--color:#ddd;--border-color:#444;--summary-border-color:#555;--background-color:#212121;--header-background-color:#1b1b1b;--row-hover-background-color:#171717;--row-selected-background-color:#1a73bc;--row-selected-hover-background-color:#1768ab;--checkbox-color:#94cfff;--checkbox-focus-color:#c7e6ff;--checkbox-disabled-border-color:#000;--checkbox-disabled-background-color:#333}}.rnvodz5700-beta7.rdg-dark,:root[data-theme=dark] .rnvodz5700-beta7{--color-scheme:dark;--color:#ddd;--border-color:#444;--summary-border-color:#555;--background-color:#212121;--header-background-color:#1b1b1b;--row-hover-background-color:#171717;--row-selected-background-color:#1a73bc;--row-selected-hover-background-color:#1768ab;--checkbox-color:#94cfff;--checkbox-focus-color:#c7e6ff;--checkbox-disabled-border-color:#000;--checkbox-disabled-background-color:#333}.rnvodz5700-beta7.rdg-light,:root[data-theme=light] .rnvodz5700-beta7{--color-scheme:light;--color:#000;--border-color:#ddd;--summary-border-color:#aaa;--background-color:#fff;--header-background-color:#f9f9f9;--row-hover-background-color:#f5f5f5;--row-selected-background-color:#dbecfa;--row-selected-hover-background-color:#c9e3f8;--checkbox-color:#005194;--checkbox-focus-color:#61b8ff;--checkbox-disabled-border-color:#ccc;--checkbox-disabled-background-color:#ddd}.rnvodz5700-beta7{--selection-color:#66afe9;--font-size:1rem;background-color:var(--background-color);border:1px solid var(--border-color);box-sizing:border-box;color:var(--color);color-scheme:var(--color-scheme,light dark);contain:strict;contain:size layout style paint;content-visibility:auto;direction:ltr;font-size:var(--font-size);height:350px;overflow:auto;user-select:none}@supports not (contain:strict){.rnvodz5700-beta7{position:relative;z-index:0}}.rnvodz5700-beta7 *,.rnvodz5700-beta7 :after,.rnvodz5700-beta7 :before{box-sizing:inherit}.vlqv91k700-beta7.r1upfr80700-beta7{cursor:move}";
styleInject(css_248z$e,{"insertAt":"top"});

const root = "rnvodz5700-beta7";
const rootClassname = `rdg ${root}`;
const viewportDragging = "vlqv91k700-beta7";
const viewportDraggingClassname = `rdg-viewport-dragging ${viewportDragging}`;

const useLayoutEffect = typeof window === 'undefined' ? react__WEBPACK_IMPORTED_MODULE_0__.useEffect : react__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect;

const ActiveContext = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createContext({
  current: false
});
ActiveContext.displayName = 'ActiveContext';
const useActiveElement = gridRef => {
  const activeRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(document.activeElement === gridRef.current);
  const handleFocusIn = () => {
    activeRef.current = true;
  };
  const handleFocusOut = () => {
    activeRef.current = true;
  };
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const gridElement = gridRef.current;
    if (!gridElement) return;
    gridElement.addEventListener('focusin', handleFocusIn);
    gridElement.addEventListener('focusout', handleFocusOut);
    return () => {
      gridElement.removeEventListener('focusin', handleFocusIn);
      gridElement.removeEventListener('focusout', handleFocusOut);
    };
  }, []);
  return activeRef;
};

function useFocusRef(isSelected) {
  const ref = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const activeRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(ActiveContext);
  useLayoutEffect(() => {
    var _ref$current;
    if (!isSelected) return;
    if (activeRef.current) (_ref$current = ref.current) === null || _ref$current === void 0 ? void 0 : _ref$current.focus({
      preventScroll: true
    });
  }, [isSelected]);
  return {
    ref,
    tabIndex: isSelected ? 0 : -1
  };
}

var css_248z$d = ".c4l3n6v700-beta7{align-items:center;cursor:pointer;display:flex;inset:0;justify-content:center;margin-right:1px;position:absolute}.c1bikpmb700-beta7{all:unset;margin:0;width:0}.c1eyot7g700-beta7{background-color:var(--background-color);border:2px solid var(--border-color);content:\"\";height:20px;width:20px}.c1bikpmb700-beta7:checked+.c1eyot7g700-beta7{background-color:var(--checkbox-color);box-shadow:inset 0 0 0 4px var(--background-color)}.c1bikpmb700-beta7:focus+.c1eyot7g700-beta7{border-color:var(--checkbox-focus-color)}.c1jlcvp4700-beta7{cursor:default}.c1jlcvp4700-beta7 .c1eyot7g700-beta7{background-color:var(--checkbox-disabled-background-color);border-color:var(--checkbox-disabled-border-color)}";
styleInject(css_248z$d,{"insertAt":"top"});

const checkboxLabel = "c4l3n6v700-beta7";
const checkboxLabelClassname = `rdg-checkbox-label ${checkboxLabel}`;
const checkboxInput = "c1bikpmb700-beta7";
const checkboxInputClassname = `rdg-checkbox-input ${checkboxInput}`;
const checkbox = "c1eyot7g700-beta7";
const checkboxClassname = `rdg-checkbox ${checkbox}`;
const checkboxLabelDisabled = "c1jlcvp4700-beta7";
const checkboxLabelDisabledClassname = `rdg-checkbox-label-disabled ${checkboxLabelDisabled}`;
function SelectCellFormatter({
  value,
  isCellSelected,
  disabled,
  onClick,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}) {
  const {
    ref,
    tabIndex
  } = useFocusRef(isCellSelected);
  function handleChange(e) {
    onChange(e.target.checked, e.nativeEvent.shiftKey);
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", {
    className: (0,clsx__WEBPACK_IMPORTED_MODULE_1__["default"])(checkboxLabelClassname, disabled && checkboxLabelDisabledClassname)
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ref: ref,
    type: "checkbox",
    tabIndex: tabIndex,
    className: checkboxInputClassname,
    disabled: disabled,
    checked: value,
    onChange: handleChange,
    onClick: onClick
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: checkboxClassname
  }));
}

function ValueFormatter(props) {
  try {
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, props.row[props.column.key]);
  } catch {
    return null;
  }
}

var css_248z$c = ".g1vzro7t700-beta7{outline:none}.c1fsqdic700-beta7{stroke:currentColor;stroke-width:1.5px;fill:transparent;margin-left:4px;vertical-align:middle}.c1fsqdic700-beta7>path{transition:d .1s}";
styleInject(css_248z$c,{"insertAt":"top"});

const groupCellContent = "g1vzro7t700-beta7";
const groupCellContentClassname = `rdg-group-cell-content ${groupCellContent}`;
const caret = "c1fsqdic700-beta7";
const caretClassname = `rdg-caret ${caret}`;
function ToggleGroupFormatter({
  groupKey,
  isExpanded,
  isCellSelected,
  toggleGroup
}) {
  const {
    ref,
    tabIndex
  } = useFocusRef(isCellSelected);
  function handleKeyDown({
    key
  }) {
    if (key === 'Enter') {
      toggleGroup();
    }
  }
  const d = isExpanded ? 'M1 1 L 7 7 L 13 1' : 'M1 7 L 7 1 L 13 7';
  return (
    /*#__PURE__*/
    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
      ref: ref,
      className: groupCellContentClassname,
      tabIndex: tabIndex,
      onKeyDown: handleKeyDown
    }, groupKey, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("svg", {
      viewBox: "0 0 14 8",
      width: "14",
      height: "8",
      className: caretClassname,
      "aria-hidden": true
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("path", {
      d: d
    })))
  );
}

const RowSelectionContext = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(undefined);
RowSelectionContext.displayName = 'RowSelectionContext';
const RowSelectionProvider = RowSelectionContext.Provider;
const RowSelectionChangeContext = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)(undefined);
RowSelectionChangeContext.displayName = 'RowSelectionChangeContext';
const RowSelectionChangeProvider = RowSelectionChangeContext.Provider;
function useRowSelection() {
  const rowSelectionContext = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(RowSelectionContext);
  const rowSelectionChangeContext = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(RowSelectionChangeContext);
  if (rowSelectionContext === undefined || rowSelectionChangeContext === undefined) {
    throw new Error('useRowSelection must be used within DataGrid cells');
  }
  return [rowSelectionContext, rowSelectionChangeContext];
}

var css_248z$b = ".cj343x0700-beta7{background-color:inherit;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color);contain:strict;contain:size layout style paint;outline:none;overflow:hidden;overflow:clip;padding:0 8px;text-overflow:ellipsis;white-space:nowrap}.cj343x0700-beta7[aria-selected=true]{box-shadow:inset 0 0 0 2px var(--selection-color)}.csofj7r700-beta7{position:sticky;z-index:1}.ch2wcw8700-beta7{box-shadow:2px 0 5px -2px hsla(0,0%,53%,.3)}";
styleInject(css_248z$b,{"insertAt":"top"});

const cell = "cj343x0700-beta7";
const cellClassname = `rdg-cell ${cell}`;
const cellFrozen = "csofj7r700-beta7";
const cellFrozenClassname = `rdg-cell-frozen ${cellFrozen}`;
const cellFrozenLast = "ch2wcw8700-beta7";
const cellFrozenLastClassname = `rdg-cell-frozen-last ${cellFrozenLast}`;

function getColSpan(column, lastFrozenColumnIndex, args) {
  const colSpan = typeof column.colSpan === 'function' ? column.colSpan(args) : 1;
  if (Number.isInteger(colSpan) && colSpan > 1 && (!column.frozen || column.idx + colSpan - 1 <= lastFrozenColumnIndex)) {
    return colSpan;
  }
  return undefined;
}

function stopPropagation(event) {
  event.stopPropagation();
}

const nonInputKeys = new Set(['Unidentified', 'Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'FnLock', 'Meta', 'NumLock', 'ScrollLock', 'Shift', 'Tab', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', 'Insert', 'ContextMenu', 'Escape', 'Pause', 'Play', 'PrintScreen', 'F1', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']);
function isCtrlKeyHeldDown(e) {
  return (e.ctrlKey || e.metaKey) && e.key !== 'Control';
}
function isDefaultCellInput(event) {
  return !nonInputKeys.has(event.key);
}
function onEditorNavigation({
  key,
  target
}) {
  if (key === 'Tab' && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return target.matches('.rdg-editor-container > :only-child, .rdg-editor-container > label:only-child > :only-child');
  }
  return false;
}

function isSelectedCellEditable({
  selectedPosition,
  columns,
  rows,
  isGroupRow
}) {
  const column = columns[selectedPosition.idx];
  const row = rows[selectedPosition.rowIdx];
  return !isGroupRow(row) && isCellEditable(column, row);
}
function isCellEditable(column, row) {
  return column.editor != null && !column.rowGroup && (typeof column.editable === 'function' ? column.editable(row) : column.editable) !== false;
}
function getSelectedCellColSpan({
  rows,
  summaryRows,
  rowIdx,
  lastFrozenColumnIndex,
  column,
  isGroupRow
}) {
  if (rowIdx === -1) {
    return getColSpan(column, lastFrozenColumnIndex, {
      type: 'HEADER'
    });
  }
  if (rowIdx >= 0 && rowIdx < rows.length) {
    const row = rows[rowIdx];
    if (!isGroupRow(row)) {
      return getColSpan(column, lastFrozenColumnIndex, {
        type: 'ROW',
        row
      });
    }
    return undefined;
  }
  if (summaryRows) {
    return getColSpan(column, lastFrozenColumnIndex, {
      type: 'SUMMARY',
      row: summaryRows[rowIdx - rows.length]
    });
  }
  return undefined;
}
function getNextSelectedCellPosition({
  cellNavigationMode,
  columns,
  colSpanColumns,
  rows,
  summaryRows,
  minRowIdx,
  maxRowIdx,
  currentPosition: {
    idx: currentIdx
  },
  nextPosition,
  lastFrozenColumnIndex,
  isCellWithinBounds,
  isGroupRow
}) {
  let {
    idx: nextIdx,
    rowIdx: nextRowIdx
  } = nextPosition;
  const setColSpan = moveRight => {
    if (nextRowIdx >= 0 && nextRowIdx < rows.length) {
      const row = rows[nextRowIdx];
      if (isGroupRow(row)) return;
    }
    for (const column of colSpanColumns) {
      const colIdx = column.idx;
      if (colIdx > nextIdx) break;
      const colSpan = getSelectedCellColSpan({
        rows,
        summaryRows,
        rowIdx: nextRowIdx,
        lastFrozenColumnIndex,
        column,
        isGroupRow
      });
      if (colSpan && nextIdx > colIdx && nextIdx < colSpan + colIdx) {
        nextIdx = colIdx + (moveRight ? colSpan : 0);
        break;
      }
    }
  };
  if (isCellWithinBounds(nextPosition)) {
    setColSpan(nextIdx - currentIdx > 0);
  }
  if (cellNavigationMode !== 'NONE') {
    const columnsCount = columns.length;
    const isAfterLastColumn = nextIdx === columnsCount;
    const isBeforeFirstColumn = nextIdx === -1;
    if (isAfterLastColumn) {
      if (cellNavigationMode === 'CHANGE_ROW') {
        const isLastRow = nextRowIdx === maxRowIdx;
        if (!isLastRow) {
          nextIdx = 0;
          nextRowIdx += 1;
        }
      } else {
        nextIdx = 0;
      }
    } else if (isBeforeFirstColumn) {
      if (cellNavigationMode === 'CHANGE_ROW') {
        const isFirstRow = nextRowIdx === minRowIdx;
        if (!isFirstRow) {
          nextRowIdx -= 1;
          nextIdx = columnsCount - 1;
        }
      } else {
        nextIdx = columnsCount - 1;
      }
      setColSpan(false);
    }
  }
  return {
    idx: nextIdx,
    rowIdx: nextRowIdx
  };
}
function canExitGrid({
  cellNavigationMode,
  maxColIdx,
  minRowIdx,
  maxRowIdx,
  selectedPosition: {
    rowIdx,
    idx
  },
  shiftKey
}) {
  if (cellNavigationMode === 'NONE' || cellNavigationMode === 'CHANGE_ROW') {
    const atLastCellInRow = idx === maxColIdx;
    const atFirstCellInRow = idx === 0;
    const atLastRow = rowIdx === maxRowIdx;
    const atFirstRow = rowIdx === minRowIdx;
    return shiftKey ? atFirstCellInRow && atFirstRow : atLastCellInRow && atLastRow;
  }
  return false;
}

const {
  min,
  max,
  floor,
  sign
} = Math;
function assertIsValidKeyGetter(keyGetter) {
  if (typeof keyGetter !== 'function') {
    throw new Error('Please specify the rowKeyGetter prop to use selection');
  }
}
function getCellStyle(column, colSpan) {
  return {
    gridColumnStart: column.idx + 1,
    gridColumnEnd: colSpan !== undefined ? `span ${colSpan}` : undefined,
    left: column.frozen ? `var(--frozen-left-${column.idx})` : undefined
  };
}
function getCellClassname(column, ...extraClasses) {
  return (0,clsx__WEBPACK_IMPORTED_MODULE_1__["default"])(cellClassname, ...extraClasses, column.frozen && cellFrozenClassname, column.isLastFrozenColumn && cellFrozenLastClassname);
}

const SELECT_COLUMN_KEY = 'select-row';
function SelectFormatter(props) {
  const [isRowSelected, onRowSelectionChange] = useRowSelection();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SelectCellFormatter, {
    "aria-label": "Select",
    isCellSelected: props.isCellSelected,
    value: isRowSelected,
    onClick: stopPropagation,
    onChange: (checked, isShiftClick) => {
      onRowSelectionChange({
        row: props.row,
        checked,
        isShiftClick
      });
    }
  });
}
function SelectGroupFormatter(props) {
  const [isRowSelected, onRowSelectionChange] = useRowSelection();
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SelectCellFormatter, {
    "aria-label": "Select Group",
    isCellSelected: props.isCellSelected,
    value: isRowSelected,
    onChange: checked => {
      onRowSelectionChange({
        row: props.row,
        checked,
        isShiftClick: false
      });
    },
    onClick: stopPropagation
  });
}
const SelectColumn = {
  key: SELECT_COLUMN_KEY,
  name: '',
  width: 35,
  maxWidth: 35,
  resizable: false,
  sortable: false,
  frozen: true,
  headerRenderer(props) {
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SelectCellFormatter, {
      "aria-label": "Select All",
      isCellSelected: props.isCellSelected,
      value: props.allRowsSelected,
      onChange: props.onAllRowsSelectionChange,
      onClick: stopPropagation
    });
  },
  formatter: SelectFormatter,
  groupFormatter: SelectGroupFormatter
};

function useCalculatedColumns({
  rawColumns,
  columnWidths,
  viewportWidth,
  scrollLeft,
  defaultColumnOptions,
  rawGroupBy,
  enableVirtualization
}) {
  var _defaultColumnOptions, _defaultColumnOptions2, _defaultColumnOptions3, _defaultColumnOptions4;
  const minColumnWidth = (_defaultColumnOptions = defaultColumnOptions === null || defaultColumnOptions === void 0 ? void 0 : defaultColumnOptions.minWidth) !== null && _defaultColumnOptions !== void 0 ? _defaultColumnOptions : 80;
  const defaultFormatter = (_defaultColumnOptions2 = defaultColumnOptions === null || defaultColumnOptions === void 0 ? void 0 : defaultColumnOptions.formatter) !== null && _defaultColumnOptions2 !== void 0 ? _defaultColumnOptions2 : ValueFormatter;
  const defaultSortable = (_defaultColumnOptions3 = defaultColumnOptions === null || defaultColumnOptions === void 0 ? void 0 : defaultColumnOptions.sortable) !== null && _defaultColumnOptions3 !== void 0 ? _defaultColumnOptions3 : false;
  const defaultResizable = (_defaultColumnOptions4 = defaultColumnOptions === null || defaultColumnOptions === void 0 ? void 0 : defaultColumnOptions.resizable) !== null && _defaultColumnOptions4 !== void 0 ? _defaultColumnOptions4 : false;
  const {
    columns,
    colSpanColumns,
    lastFrozenColumnIndex,
    groupBy
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    const groupBy = [];
    let lastFrozenColumnIndex = -1;
    const columns = rawColumns.map(rawColumn => {
      var _rawGroupBy$includes, _rawColumn$sortable, _rawColumn$resizable, _rawColumn$formatter;
      const rowGroup = (_rawGroupBy$includes = rawGroupBy === null || rawGroupBy === void 0 ? void 0 : rawGroupBy.includes(rawColumn.key)) !== null && _rawGroupBy$includes !== void 0 ? _rawGroupBy$includes : false;
      const frozen = rowGroup || rawColumn.frozen || false;
      const column = {
        ...rawColumn,
        idx: 0,
        frozen,
        isLastFrozenColumn: false,
        rowGroup,
        sortable: (_rawColumn$sortable = rawColumn.sortable) !== null && _rawColumn$sortable !== void 0 ? _rawColumn$sortable : defaultSortable,
        resizable: (_rawColumn$resizable = rawColumn.resizable) !== null && _rawColumn$resizable !== void 0 ? _rawColumn$resizable : defaultResizable,
        formatter: (_rawColumn$formatter = rawColumn.formatter) !== null && _rawColumn$formatter !== void 0 ? _rawColumn$formatter : defaultFormatter
      };
      if (rowGroup) {
        column.groupFormatter ??= ToggleGroupFormatter;
      }
      if (frozen) {
        lastFrozenColumnIndex++;
      }
      return column;
    });
    columns.sort(({
      key: aKey,
      frozen: frozenA
    }, {
      key: bKey,
      frozen: frozenB
    }) => {
      if (aKey === SELECT_COLUMN_KEY) return -1;
      if (bKey === SELECT_COLUMN_KEY) return 1;
      if (rawGroupBy !== null && rawGroupBy !== void 0 && rawGroupBy.includes(aKey)) {
        if (rawGroupBy.includes(bKey)) {
          return rawGroupBy.indexOf(aKey) - rawGroupBy.indexOf(bKey);
        }
        return -1;
      }
      if (rawGroupBy !== null && rawGroupBy !== void 0 && rawGroupBy.includes(bKey)) return 1;
      if (frozenA) {
        if (frozenB) return 0;
        return -1;
      }
      if (frozenB) return 1;
      return 0;
    });
    const colSpanColumns = [];
    columns.forEach((column, idx) => {
      column.idx = idx;
      if (column.rowGroup) {
        groupBy.push(column.key);
      }
      if (column.colSpan != null) {
        colSpanColumns.push(column);
      }
    });
    if (lastFrozenColumnIndex !== -1) {
      columns[lastFrozenColumnIndex].isLastFrozenColumn = true;
    }
    return {
      columns,
      colSpanColumns,
      lastFrozenColumnIndex,
      groupBy
    };
  }, [rawColumns, defaultFormatter, defaultResizable, defaultSortable, rawGroupBy]);
  const {
    layoutCssVars,
    totalColumnWidth,
    totalFrozenColumnWidth,
    columnMetrics
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    const columnMetrics = new Map();
    let left = 0;
    let totalColumnWidth = 0;
    let totalFrozenColumnWidth = 0;
    let templateColumns = '';
    let allocatedWidth = 0;
    let unassignedColumnsCount = 0;
    for (const column of columns) {
      let width = getSpecifiedWidth(column, columnWidths, viewportWidth);
      if (width === undefined) {
        unassignedColumnsCount++;
      } else {
        width = clampColumnWidth(width, column, minColumnWidth);
        allocatedWidth += width;
        columnMetrics.set(column, {
          width,
          left: 0
        });
      }
    }
    const unallocatedWidth = viewportWidth - allocatedWidth;
    const unallocatedColumnWidth = unallocatedWidth / unassignedColumnsCount;
    for (const column of columns) {
      let width;
      if (columnMetrics.has(column)) {
        const columnMetric = columnMetrics.get(column);
        columnMetric.left = left;
        ({
          width
        } = columnMetric);
      } else {
        width = clampColumnWidth(unallocatedColumnWidth, column, minColumnWidth);
        columnMetrics.set(column, {
          width,
          left
        });
      }
      totalColumnWidth += width;
      left += width;
      templateColumns += `${width}px `;
    }
    if (lastFrozenColumnIndex !== -1) {
      const columnMetric = columnMetrics.get(columns[lastFrozenColumnIndex]);
      totalFrozenColumnWidth = columnMetric.left + columnMetric.width;
    }
    const layoutCssVars = {
      '--template-columns': templateColumns
    };
    for (let i = 0; i <= lastFrozenColumnIndex; i++) {
      const column = columns[i];
      layoutCssVars[`--frozen-left-${column.idx}`] = `${columnMetrics.get(column).left}px`;
    }
    return {
      layoutCssVars,
      totalColumnWidth,
      totalFrozenColumnWidth,
      columnMetrics
    };
  }, [columnWidths, columns, viewportWidth, minColumnWidth, lastFrozenColumnIndex]);
  const [colOverscanStartIdx, colOverscanEndIdx] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    if (!enableVirtualization) {
      return [0, columns.length - 1];
    }
    const viewportLeft = scrollLeft + totalFrozenColumnWidth;
    const viewportRight = scrollLeft + viewportWidth;
    const lastColIdx = columns.length - 1;
    const firstUnfrozenColumnIdx = min(lastFrozenColumnIndex + 1, lastColIdx);
    if (viewportLeft >= viewportRight) {
      return [firstUnfrozenColumnIdx, firstUnfrozenColumnIdx];
    }
    let colVisibleStartIdx = firstUnfrozenColumnIdx;
    while (colVisibleStartIdx < lastColIdx) {
      const {
        left,
        width
      } = columnMetrics.get(columns[colVisibleStartIdx]);
      if (left + width > viewportLeft) {
        break;
      }
      colVisibleStartIdx++;
    }
    let colVisibleEndIdx = colVisibleStartIdx;
    while (colVisibleEndIdx < lastColIdx) {
      const {
        left,
        width
      } = columnMetrics.get(columns[colVisibleEndIdx]);
      if (left + width >= viewportRight) {
        break;
      }
      colVisibleEndIdx++;
    }
    const colOverscanStartIdx = max(firstUnfrozenColumnIdx, colVisibleStartIdx - 1);
    const colOverscanEndIdx = min(lastColIdx, colVisibleEndIdx + 1);
    return [colOverscanStartIdx, colOverscanEndIdx];
  }, [columnMetrics, columns, lastFrozenColumnIndex, scrollLeft, totalFrozenColumnWidth, viewportWidth, enableVirtualization]);
  return {
    columns,
    colSpanColumns,
    colOverscanStartIdx,
    colOverscanEndIdx,
    layoutCssVars,
    columnMetrics,
    totalColumnWidth,
    lastFrozenColumnIndex,
    totalFrozenColumnWidth,
    groupBy
  };
}
function getSpecifiedWidth({
  key,
  width
}, columnWidths, viewportWidth) {
  if (columnWidths.has(key)) {
    return columnWidths.get(key);
  }
  if (typeof width === 'number') {
    return width;
  }
  if (typeof width === 'string' && /^\d+%$/.test(width)) {
    return floor(viewportWidth * parseInt(width, 10) / 100);
  }
  return undefined;
}
function clampColumnWidth(width, {
  minWidth,
  maxWidth
}, minColumnWidth) {
  width = max(width, minWidth !== null && minWidth !== void 0 ? minWidth : minColumnWidth);
  if (typeof maxWidth === 'number') {
    return min(width, maxWidth);
  }
  return width;
}

function useGridDimensions() {
  const gridRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const [gridWidth, setGridWidth] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(1);
  const [gridHeight, setGridHeight] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(1);
  useLayoutEffect(() => {
    const {
      ResizeObserver
    } = window;
    if (ResizeObserver == null) return;
    const resizeObserver = new ResizeObserver(() => {
      const {
        clientWidth,
        clientHeight
      } = gridRef.current;
      setGridWidth(clientWidth - (devicePixelRatio % 1 === 0 ? 0 : 1));
      setGridHeight(clientHeight);
    });
    resizeObserver.observe(gridRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  return [gridRef, gridWidth, gridHeight];
}

function useLatestFunc(fn) {
  const ref = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(fn);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    ref.current = fn;
  });
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((...args) => {
    ref.current(...args);
  }, []);
}

function useRovingCellRef(isSelected) {
  const ref = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const isChildFocused = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(false);
  const [, forceRender] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({});
  const activeRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(ActiveContext);
  useLayoutEffect(() => {
    var _ref$current;
    if (!isSelected) {
      isChildFocused.current = false;
      return;
    }
    if (isChildFocused.current) {
      forceRender({});
      return;
    }
    if (activeRef.current) (_ref$current = ref.current) === null || _ref$current === void 0 ? void 0 : _ref$current.focus();
  }, [isSelected]);
  function onFocus(event) {
    if (event.target !== ref.current) {
      isChildFocused.current = true;
    }
  }
  const isFocused = isSelected && !isChildFocused.current;
  return {
    ref,
    tabIndex: isFocused ? 0 : -1,
    onFocus
  };
}

var css_248z$a = ".r1v67ork700-beta7{outline:none}.r1v67ork700-beta7:after{box-shadow:inset 0 0 0 2px var(--selection-color);content:\"\";inset:0;pointer-events:none;position:absolute;z-index:2}.r1v67ork700-beta7>.cj343x0700-beta7:first-child{box-shadow:inset 2px 0 0 0 var(--selection-color)}";
styleInject(css_248z$a,{"insertAt":"top"});

const rowSelected = "r1v67ork700-beta7";
const rowSelectedClassname = `rdg-row-selected ${rowSelected}`;
function useRovingRowRef(selectedCellIdx) {
  const isSelected = selectedCellIdx === -1;
  return {
    className: isSelected ? rowSelectedClassname : undefined
  };
}

function useViewportColumns({
  columns,
  colSpanColumns,
  rows,
  summaryRows,
  colOverscanStartIdx,
  colOverscanEndIdx,
  lastFrozenColumnIndex,
  rowOverscanStartIdx,
  rowOverscanEndIdx,
  isGroupRow
}) {
  const startIdx = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    if (colOverscanStartIdx === 0) return 0;
    let startIdx = colOverscanStartIdx;
    const updateStartIdx = (colIdx, colSpan) => {
      if (colSpan !== undefined && colIdx + colSpan > colOverscanStartIdx) {
        startIdx = colIdx;
        return true;
      }
      return false;
    };
    for (const column of colSpanColumns) {
      const colIdx = column.idx;
      if (colIdx >= startIdx) break;
      if (updateStartIdx(colIdx, getColSpan(column, lastFrozenColumnIndex, {
        type: 'HEADER'
      }))) {
        break;
      }
      for (let rowIdx = rowOverscanStartIdx; rowIdx <= rowOverscanEndIdx; rowIdx++) {
        const row = rows[rowIdx];
        if (isGroupRow(row)) continue;
        if (updateStartIdx(colIdx, getColSpan(column, lastFrozenColumnIndex, {
          type: 'ROW',
          row
        }))) {
          break;
        }
      }
      if (summaryRows != null) {
        for (const row of summaryRows) {
          if (updateStartIdx(colIdx, getColSpan(column, lastFrozenColumnIndex, {
            type: 'SUMMARY',
            row
          }))) {
            break;
          }
        }
      }
    }
    return startIdx;
  }, [rowOverscanStartIdx, rowOverscanEndIdx, rows, summaryRows, colOverscanStartIdx, lastFrozenColumnIndex, colSpanColumns, isGroupRow]);
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    const viewportColumns = [];
    for (let colIdx = 0; colIdx <= colOverscanEndIdx; colIdx++) {
      const column = columns[colIdx];
      if (colIdx < startIdx && !column.frozen) continue;
      viewportColumns.push(column);
    }
    return viewportColumns;
  }, [startIdx, colOverscanEndIdx, columns]);
}

function isReadonlyArray(arr) {
  return Array.isArray(arr);
}
function useViewportRows({
  rawRows,
  rowHeight,
  clientHeight,
  scrollTop,
  groupBy,
  rowGrouper,
  expandedGroupIds,
  enableVirtualization
}) {
  const [groupedRows, rowsCount] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    if (groupBy.length === 0 || rowGrouper == null) return [undefined, rawRows.length];
    const groupRows = (rows, [groupByKey, ...remainingGroupByKeys], startRowIndex) => {
      let groupRowsCount = 0;
      const groups = {};
      for (const [key, childRows] of Object.entries(rowGrouper(rows, groupByKey))) {
        const [childGroups, childRowsCount] = remainingGroupByKeys.length === 0 ? [childRows, childRows.length] : groupRows(childRows, remainingGroupByKeys, startRowIndex + groupRowsCount + 1);
        groups[key] = {
          childRows,
          childGroups,
          startRowIndex: startRowIndex + groupRowsCount
        };
        groupRowsCount += childRowsCount + 1;
      }
      return [groups, groupRowsCount];
    };
    return groupRows(rawRows, groupBy, 0);
  }, [groupBy, rowGrouper, rawRows]);
  const [rows, isGroupRow] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    const allGroupRows = new Set();
    if (!groupedRows) return [rawRows, isGroupRow];
    const flattenedRows = [];
    const expandGroup = (rows, parentId, level) => {
      if (isReadonlyArray(rows)) {
        flattenedRows.push(...rows);
        return;
      }
      Object.keys(rows).forEach((groupKey, posInSet, keys) => {
        var _expandedGroupIds$has;
        const id = parentId !== undefined ? `${parentId}__${groupKey}` : groupKey;
        const isExpanded = (_expandedGroupIds$has = expandedGroupIds === null || expandedGroupIds === void 0 ? void 0 : expandedGroupIds.has(id)) !== null && _expandedGroupIds$has !== void 0 ? _expandedGroupIds$has : false;
        const {
          childRows,
          childGroups,
          startRowIndex
        } = rows[groupKey];
        const groupRow = {
          id,
          parentId,
          groupKey,
          isExpanded,
          childRows,
          level,
          posInSet,
          startRowIndex,
          setSize: keys.length
        };
        flattenedRows.push(groupRow);
        allGroupRows.add(groupRow);
        if (isExpanded) {
          expandGroup(childGroups, id, level + 1);
        }
      });
    };
    expandGroup(groupedRows, undefined, 0);
    return [flattenedRows, isGroupRow];
    function isGroupRow(row) {
      return allGroupRows.has(row);
    }
  }, [expandedGroupIds, groupedRows, rawRows]);
  const {
    totalRowHeight,
    getRowTop,
    getRowHeight,
    findRowIdx
  } = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    if (typeof rowHeight === 'number') {
      return {
        totalRowHeight: rowHeight * rows.length,
        getRowTop: rowIdx => rowIdx * rowHeight,
        getRowHeight: () => rowHeight,
        findRowIdx: offset => floor(offset / rowHeight)
      };
    }
    let totalRowHeight = 0;
    const rowPositions = rows.map(row => {
      const currentRowHeight = isGroupRow(row) ? rowHeight({
        type: 'GROUP',
        row
      }) : rowHeight({
        type: 'ROW',
        row
      });
      const position = {
        top: totalRowHeight,
        height: currentRowHeight
      };
      totalRowHeight += currentRowHeight;
      return position;
    });
    const validateRowIdx = rowIdx => {
      return max(0, min(rows.length - 1, rowIdx));
    };
    return {
      totalRowHeight,
      getRowTop: rowIdx => rowPositions[validateRowIdx(rowIdx)].top,
      getRowHeight: rowIdx => rowPositions[validateRowIdx(rowIdx)].height,
      findRowIdx(offset) {
        let start = 0;
        let end = rowPositions.length - 1;
        while (start <= end) {
          const middle = start + floor((end - start) / 2);
          const currentOffset = rowPositions[middle].top;
          if (currentOffset === offset) return middle;
          if (currentOffset < offset) {
            start = middle + 1;
          } else if (currentOffset > offset) {
            end = middle - 1;
          }
          if (start > end) return end;
        }
        return 0;
      }
    };
  }, [isGroupRow, rowHeight, rows]);
  let rowOverscanStartIdx = 0;
  let rowOverscanEndIdx = rows.length - 1;
  if (enableVirtualization) {
    const overscanThreshold = 4;
    const rowVisibleStartIdx = findRowIdx(scrollTop);
    const rowVisibleEndIdx = findRowIdx(scrollTop + clientHeight);
    rowOverscanStartIdx = max(0, rowVisibleStartIdx - overscanThreshold);
    rowOverscanEndIdx = min(rows.length - 1, rowVisibleEndIdx + overscanThreshold);
  }
  return {
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    rows,
    rowsCount,
    totalRowHeight,
    isGroupRow,
    getRowTop,
    getRowHeight,
    findRowIdx
  };
}

var css_248z$9 = ".h1j9yp5q700-beta7{cursor:pointer;display:flex}.h1j9yp5q700-beta7:focus{outline:none}.h1e6at1o700-beta7{flex-grow:1;overflow:hidden;overflow:clip;text-overflow:ellipsis}.a1t8izji700-beta7{fill:currentColor}.a1t8izji700-beta7>path{transition:d .1s}";
styleInject(css_248z$9,{"insertAt":"top"});

const headerSortCell = "h1j9yp5q700-beta7";
const headerSortCellClassname = `rdg-header-sort-cell ${headerSortCell}`;
const headerSortName = "h1e6at1o700-beta7";
const headerSortNameClassname = `rdg-header-sort-name ${headerSortName}`;
const arrow = "a1t8izji700-beta7";
const arrowClassname = `rdg-sort-arrow ${arrow}`;
function SortableHeaderCell({
  onSort,
  sortDirection,
  priority,
  children,
  isCellSelected
}) {
  const {
    ref,
    tabIndex
  } = useFocusRef(isCellSelected);
  function handleKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onSort(event.ctrlKey || event.metaKey);
    }
  }
  function handleClick(event) {
    onSort(event.ctrlKey || event.metaKey);
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    ref: ref,
    tabIndex: tabIndex,
    className: headerSortCellClassname,
    onClick: handleClick,
    onKeyDown: handleKeyDown
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", {
    className: headerSortNameClassname
  }, children), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, sortDirection !== undefined && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("svg", {
    viewBox: "0 0 12 8",
    width: "12",
    height: "8",
    className: arrowClassname,
    "aria-hidden": true
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("path", {
    d: sortDirection === 'ASC' ? 'M0 8 6 0 12 8' : 'M0 0 6 8 12 0'
  })), priority));
}

var css_248z$8 = ".c6l2wv1700-beta7{touch-action:none}.c6l2wv1700-beta7:after{bottom:0;content:\"\";cursor:col-resize;position:absolute;right:0;top:0;width:10px}";
styleInject(css_248z$8,{"insertAt":"top"});

const cellResizable = "c6l2wv1700-beta7";
const cellResizableClassname = `rdg-cell-resizable ${cellResizable}`;
function HeaderCell({
  column,
  colSpan,
  isCellSelected,
  onColumnResize,
  allRowsSelected,
  onAllRowsSelectionChange,
  sortColumns,
  onSortColumnsChange,
  selectCell,
  shouldFocusGrid
}) {
  const {
    ref,
    tabIndex,
    onFocus
  } = useRovingCellRef(isCellSelected);
  const sortIndex = sortColumns === null || sortColumns === void 0 ? void 0 : sortColumns.findIndex(sort => sort.columnKey === column.key);
  const sortColumn = sortIndex !== undefined && sortIndex > -1 ? sortColumns[sortIndex] : undefined;
  const sortDirection = sortColumn === null || sortColumn === void 0 ? void 0 : sortColumn.direction;
  const priority = sortColumn !== undefined && sortColumns.length > 1 ? sortIndex + 1 : undefined;
  const ariaSort = sortDirection && !priority ? sortDirection === 'ASC' ? 'ascending' : 'descending' : undefined;
  const className = getCellClassname(column, column.headerCellClass, column.resizable && cellResizableClassname);
  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      return;
    }
    const {
      currentTarget,
      pointerId
    } = event;
    const {
      right
    } = currentTarget.getBoundingClientRect();
    const offset = right - event.clientX;
    if (offset > 11) {
      return;
    }
    function onPointerMove(event) {
      const width = event.clientX + offset - currentTarget.getBoundingClientRect().left;
      if (width > 0) {
        onColumnResize(column, width);
      }
    }
    function onLostPointerCapture() {
      currentTarget.removeEventListener('pointermove', onPointerMove);
      currentTarget.removeEventListener('lostpointercapture', onLostPointerCapture);
    }
    currentTarget.setPointerCapture(pointerId);
    currentTarget.addEventListener('pointermove', onPointerMove);
    currentTarget.addEventListener('lostpointercapture', onLostPointerCapture);
  }
  function onSort(ctrlClick) {
    if (onSortColumnsChange == null) return;
    const {
      sortDescendingFirst
    } = column;
    if (sortColumn === undefined) {
      const nextSort = {
        columnKey: column.key,
        direction: sortDescendingFirst ? 'DESC' : 'ASC'
      };
      onSortColumnsChange(sortColumns && ctrlClick ? [...sortColumns, nextSort] : [nextSort]);
    } else {
      let nextSortColumn;
      if (sortDescendingFirst && sortDirection === 'DESC' || !sortDescendingFirst && sortDirection === 'ASC') {
        nextSortColumn = {
          columnKey: column.key,
          direction: sortDirection === 'ASC' ? 'DESC' : 'ASC'
        };
      }
      if (ctrlClick) {
        const nextSortColumns = [...sortColumns];
        if (nextSortColumn) {
          nextSortColumns[sortIndex] = nextSortColumn;
        } else {
          nextSortColumns.splice(sortIndex, 1);
        }
        onSortColumnsChange(nextSortColumns);
      } else {
        onSortColumnsChange(nextSortColumn ? [nextSortColumn] : []);
      }
    }
  }
  function onClick() {
    selectCell(column.idx);
  }
  function handleFocus(event) {
    onFocus(event);
    if (shouldFocusGrid) {
      selectCell(0);
    }
  }
  function getCell() {
    if (column.headerRenderer) {
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(column.headerRenderer, {
        column: column,
        sortDirection: sortDirection,
        priority: priority,
        onSort: onSort,
        allRowsSelected: allRowsSelected,
        onAllRowsSelectionChange: onAllRowsSelectionChange,
        isCellSelected: isCellSelected
      });
    }
    if (column.sortable) {
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SortableHeaderCell, {
        onSort: onSort,
        sortDirection: sortDirection,
        priority: priority,
        isCellSelected: isCellSelected
      }, column.name);
    }
    return column.name;
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    role: "columnheader",
    "aria-colindex": column.idx + 1,
    "aria-selected": isCellSelected,
    "aria-sort": ariaSort,
    "aria-colspan": colSpan,
    ref: ref,
    tabIndex: shouldFocusGrid ? 0 : tabIndex,
    className: className,
    style: getCellStyle(column, colSpan),
    onFocus: handleFocus,
    onClick: onClick,
    onPointerDown: column.resizable ? onPointerDown : undefined
  }, getCell());
}

var css_248z$7 = ".h10tskcx700-beta7{background-color:var(--header-background-color);contain:strict;contain:size layout style paint;display:grid;font-weight:700;grid-template-columns:var(--template-columns);grid-template-rows:var(--header-row-height);height:var(--header-row-height);line-height:var(--header-row-height);outline:none;position:sticky;top:0;width:var(--row-width);z-index:3}.h10tskcx700-beta7[aria-selected=true]{box-shadow:inset 0 0 0 2px var(--selection-color)}";
styleInject(css_248z$7,{"insertAt":"top"});

const headerRow = "h10tskcx700-beta7";
const headerRowClassname = `rdg-header-row ${headerRow}`;
function HeaderRow({
  columns,
  allRowsSelected,
  onAllRowsSelectionChange,
  onColumnResize,
  sortColumns,
  onSortColumnsChange,
  lastFrozenColumnIndex,
  selectedCellIdx,
  selectCell,
  shouldFocusGrid
}) {
  const {
    className
  } = useRovingRowRef(selectedCellIdx);
  const cells = [];
  for (let index = 0; index < columns.length; index++) {
    const column = columns[index];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, {
      type: 'HEADER'
    });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }
    cells.push(/*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(HeaderCell, {
      key: column.key,
      column: column,
      colSpan: colSpan,
      isCellSelected: selectedCellIdx === column.idx,
      onColumnResize: onColumnResize,
      allRowsSelected: allRowsSelected,
      onAllRowsSelectionChange: onAllRowsSelectionChange,
      onSortColumnsChange: onSortColumnsChange,
      sortColumns: sortColumns,
      selectCell: selectCell,
      shouldFocusGrid: shouldFocusGrid && index === 0
    }));
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    role: "row",
    "aria-rowindex": 1,
    tabIndex: selectedCellIdx === -1 ? 0 : -1,
    className: (0,clsx__WEBPACK_IMPORTED_MODULE_1__["default"])(headerRowClassname, className)
  }, cells);
}
const HeaderRow$1 = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.memo)(HeaderRow);

var css_248z$6 = ".c6ra8a3700-beta7,.cq910m0700-beta7{background-color:#ccf}.cq910m0700-beta7.c6ra8a3700-beta7{background-color:#99f}.cjdi1s6700-beta7{background-color:rgba(0,120,215,.15)}";
styleInject(css_248z$6,{"insertAt":"top"});

const cellCopied = "c6ra8a3700-beta7";
const cellCopiedClassname = `rdg-cell-copied ${cellCopied}`;
const cellDraggedOver = "cq910m0700-beta7";
const cellDraggedOverClassname = `rdg-cell-dragged-over ${cellDraggedOver}`;
const cellRangeSelected = "cjdi1s6700-beta7";
const cellRangeSelectedClassname = `rdg-cell-range-selected ${cellRangeSelected}`;
function Cell({
  column,
  colSpan,
  isCellSelected,
  isCellWithinSelectionRange,
  isCopied,
  isDraggedOver,
  row,
  rowIdx,
  dragHandle,
  onRowClick,
  onRowDoubleClick,
  onRowChange,
  selectCell,
  ...props
}) {
  const {
    ref,
    tabIndex,
    onFocus
  } = useRovingCellRef(isCellSelected);
  const {
    cellClass
  } = column;
  const className = getCellClassname(column, typeof cellClass === 'function' ? cellClass(row) : cellClass, isCopied && cellCopiedClassname, isDraggedOver && cellDraggedOverClassname, isCellWithinSelectionRange && cellRangeSelectedClassname);
  function selectCellWrapper(openEditor, extendSelection) {
    selectCell(row, column, openEditor, extendSelection);
  }
  function handleClick(event) {
    var _column$editorOptions;
    const editOnClick = (_column$editorOptions = column.editorOptions) === null || _column$editorOptions === void 0 ? void 0 : _column$editorOptions.editOnClick;
    const selectionHandledOnMouseDown = event.nativeEvent.rdgSelectionHandledOnMouseDown;
    if (editOnClick || !selectionHandledOnMouseDown) {
      selectCellWrapper(editOnClick, event.shiftKey);
    }
    onRowClick === null || onRowClick === void 0 ? void 0 : onRowClick(row, column);
  }
  function handleContextMenu() {
    selectCellWrapper();
  }
  function handleDoubleClick() {
    selectCellWrapper(true);
    onRowDoubleClick === null || onRowDoubleClick === void 0 ? void 0 : onRowDoubleClick(row, column);
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", (0,_babel_runtime_helpers_extends__WEBPACK_IMPORTED_MODULE_2__["default"])({
    role: "gridcell",
    "aria-colindex": column.idx + 1,
    "aria-selected": isCellSelected,
    "aria-colspan": colSpan,
    "aria-readonly": !isCellEditable(column, row) || undefined,
    "data-idx": column.idx,
    "data-rowidx": rowIdx,
    ref: ref,
    tabIndex: tabIndex,
    className: className,
    style: getCellStyle(column, colSpan),
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
    onContextMenu: handleContextMenu,
    onFocus: onFocus
  }, props), !column.rowGroup && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(column.formatter, {
    column: column,
    row: row,
    rowIdx: rowIdx,
    isCellSelected: isCellSelected,
    onRowChange: onRowChange
  }), dragHandle));
}
const Cell$1 = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.memo)(Cell);

var css_248z$5 = ".r1upfr80700-beta7{background-color:var(--background-color);contain:strict;contain:size layout style paint;display:grid;grid-template-columns:var(--template-columns);grid-template-rows:var(--row-height);height:var(--row-height);left:0;line-height:var(--row-height);position:absolute;width:var(--row-width)}.r1upfr80700-beta7:hover{background-color:var(--row-hover-background-color)}.r1upfr80700-beta7[aria-selected=true]{background-color:var(--row-selected-background-color)}.r1upfr80700-beta7[aria-selected=true]:hover{background-color:var(--row-selected-hover-background-color)}";
styleInject(css_248z$5,{"insertAt":"top"});

const row = "r1upfr80700-beta7";
const rowClassname = `rdg-row ${row}`;

function Row({
  className,
  rowIdx,
  selectedCellIdx,
  selectedCellRange,
  isRowSelected,
  copiedCellIdx,
  draggedOverCellIdx,
  lastFrozenColumnIndex,
  row,
  viewportColumns,
  selectedCellEditor,
  selectedCellDragHandle,
  onRowClick,
  onRowDoubleClick,
  rowClass,
  setDraggedOverRowIdx,
  onMouseEnter,
  top,
  height,
  onRowChange,
  selectCell,
  ...props
}, ref) {
  const {
    className: rovingClassName
  } = useRovingRowRef(selectedCellIdx);
  const handleRowChange = useLatestFunc(newRow => {
    onRowChange(rowIdx, newRow);
  });
  function handleDragEnter(event) {
    setDraggedOverRowIdx === null || setDraggedOverRowIdx === void 0 ? void 0 : setDraggedOverRowIdx(rowIdx);
    onMouseEnter === null || onMouseEnter === void 0 ? void 0 : onMouseEnter(event);
  }
  className = (0,clsx__WEBPACK_IMPORTED_MODULE_1__["default"])(rowClassname, `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`, rovingClassName, rowClass === null || rowClass === void 0 ? void 0 : rowClass(row), className);
  const cells = [];
  for (let index = 0; index < viewportColumns.length; index++) {
    const column = viewportColumns[index];
    const {
      idx
    } = column;
    const colSpan = getColSpan(column, lastFrozenColumnIndex, {
      type: 'ROW',
      row
    });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }
    const isCellSelected = selectedCellIdx === idx;
    const isCellWithinSelectionRange = selectedCellRange != null && idx >= selectedCellRange.startIdx && idx <= selectedCellRange.endIdx;
    if (isCellSelected && selectedCellEditor) {
      cells.push(selectedCellEditor);
    } else {
      cells.push(/*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Cell$1, {
        key: column.key,
        column: column,
        colSpan: colSpan,
        row: row,
        rowIdx: rowIdx,
        isCopied: copiedCellIdx === idx,
        isDraggedOver: draggedOverCellIdx === idx,
        isCellSelected: isCellSelected,
        isCellWithinSelectionRange: isCellWithinSelectionRange,
        dragHandle: isCellSelected ? selectedCellDragHandle : undefined,
        onRowClick: onRowClick,
        onRowDoubleClick: onRowDoubleClick,
        onRowChange: handleRowChange,
        selectCell: selectCell
      }));
    }
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RowSelectionProvider, {
    value: isRowSelected
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", (0,_babel_runtime_helpers_extends__WEBPACK_IMPORTED_MODULE_2__["default"])({
    role: "row",
    tabIndex: selectedCellIdx === -1 ? 0 : -1,
    className: className,
    onMouseEnter: handleDragEnter,
    style: {
      top,
      '--row-height': `${height}px`
    }
  }, props), cells));
}
const RowWithRef = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)(Row);

function GroupCell({
  id,
  groupKey,
  childRows,
  isExpanded,
  isCellSelected,
  column,
  row,
  groupColumnIndex,
  toggleGroup: toggleGroupWrapper
}) {
  const {
    ref,
    tabIndex,
    onFocus
  } = useRovingCellRef(isCellSelected);
  function toggleGroup() {
    toggleGroupWrapper(id);
  }
  const isLevelMatching = column.rowGroup && groupColumnIndex === column.idx;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    role: "gridcell",
    "aria-colindex": column.idx + 1,
    "aria-selected": isCellSelected,
    ref: ref,
    tabIndex: tabIndex,
    key: column.key,
    className: getCellClassname(column),
    style: {
      ...getCellStyle(column),
      cursor: isLevelMatching ? 'pointer' : 'default'
    },
    onClick: isLevelMatching ? toggleGroup : undefined,
    onFocus: onFocus
  }, (!column.rowGroup || groupColumnIndex === column.idx) && column.groupFormatter && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(column.groupFormatter, {
    groupKey: groupKey,
    childRows: childRows,
    column: column,
    row: row,
    isExpanded: isExpanded,
    isCellSelected: isCellSelected,
    toggleGroup: toggleGroup
  }));
}
const GroupCell$1 = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.memo)(GroupCell);

var css_248z$4 = ".g1yxluv3700-beta7:not([aria-selected=true]){background-color:var(--header-background-color)}.g1yxluv3700-beta7>.cj343x0700-beta7:not(:last-child):not(.ch2wcw8700-beta7){border-right:none}";
styleInject(css_248z$4,{"insertAt":"top"});

const groupRow = "g1yxluv3700-beta7";
const groupRowClassname = `rdg-group-row ${groupRow}`;
function GroupedRow({
  id,
  groupKey,
  viewportColumns,
  childRows,
  rowIdx,
  row,
  top,
  height,
  level,
  isExpanded,
  selectedCellIdx,
  isRowSelected,
  selectGroup,
  toggleGroup,
  ...props
}) {
  const {
    className
  } = useRovingRowRef(selectedCellIdx);
  const idx = viewportColumns[0].key === SELECT_COLUMN_KEY ? level + 1 : level;
  function handleSelectGroup() {
    selectGroup(rowIdx);
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RowSelectionProvider, {
    value: isRowSelected
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", (0,_babel_runtime_helpers_extends__WEBPACK_IMPORTED_MODULE_2__["default"])({
    role: "row",
    "aria-level": level,
    "aria-expanded": isExpanded,
    tabIndex: selectedCellIdx === -1 ? 0 : -1,
    className: (0,clsx__WEBPACK_IMPORTED_MODULE_1__["default"])(rowClassname, groupRowClassname, `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`, className),
    onClick: handleSelectGroup,
    style: {
      top,
      '--row-height': `${height}px`
    }
  }, props), viewportColumns.map(column => /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(GroupCell$1, {
    key: column.key,
    id: id,
    groupKey: groupKey,
    childRows: childRows,
    isExpanded: isExpanded,
    isCellSelected: selectedCellIdx === column.idx,
    column: column,
    row: row,
    groupColumnIndex: idx,
    toggleGroup: toggleGroup
  }))));
}
const GroupRowRenderer = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.memo)(GroupedRow);

function SummaryCell({
  column,
  colSpan,
  row,
  isCellSelected,
  selectCell
}) {
  const {
    ref,
    tabIndex,
    onFocus
  } = useRovingCellRef(isCellSelected);
  const {
    summaryFormatter: SummaryFormatter,
    summaryCellClass
  } = column;
  const className = getCellClassname(column, typeof summaryCellClass === 'function' ? summaryCellClass(row) : summaryCellClass);
  function onClick() {
    selectCell(row, column);
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    role: "gridcell",
    "aria-colindex": column.idx + 1,
    "aria-colspan": colSpan,
    "aria-selected": isCellSelected,
    ref: ref,
    tabIndex: tabIndex,
    className: className,
    style: getCellStyle(column, colSpan),
    onClick: onClick,
    onFocus: onFocus
  }, SummaryFormatter && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SummaryFormatter, {
    column: column,
    row: row,
    isCellSelected: isCellSelected
  }));
}
const SummaryCell$1 = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.memo)(SummaryCell);

var css_248z$3 = ".skuhp55700-beta7.r1upfr80700-beta7{grid-template-rows:var(--summary-row-height);height:var(--summary-row-height);line-height:var(--summary-row-height);position:sticky;z-index:3}.sf8l5ub700-beta7>.cj343x0700-beta7{border-top:2px solid var(--summary-border-color)}";
styleInject(css_248z$3,{"insertAt":"top"});

const summaryRow = "skuhp55700-beta7";
const summaryRowBorderClassname = "sf8l5ub700-beta7";
const summaryRowClassname = `rdg-summary-row ${summaryRow}`;
function SummaryRow({
  rowIdx,
  row,
  viewportColumns,
  bottom,
  lastFrozenColumnIndex,
  selectedCellIdx,
  selectCell,
  'aria-rowindex': ariaRowIndex
}) {
  const {
    className
  } = useRovingRowRef(selectedCellIdx);
  const cells = [];
  for (let index = 0; index < viewportColumns.length; index++) {
    const column = viewportColumns[index];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, {
      type: 'SUMMARY',
      row
    });
    if (colSpan !== undefined) {
      index += colSpan - 1;
    }
    const isCellSelected = selectedCellIdx === column.idx;
    cells.push(/*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SummaryCell$1, {
      key: column.key,
      column: column,
      colSpan: colSpan,
      row: row,
      isCellSelected: isCellSelected,
      selectCell: selectCell
    }));
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    role: "row",
    "aria-rowindex": ariaRowIndex,
    tabIndex: selectedCellIdx === -1 ? 0 : -1,
    className: (0,clsx__WEBPACK_IMPORTED_MODULE_1__["default"])(rowClassname, `rdg-row-${rowIdx % 2 === 0 ? 'even' : 'odd'}`, summaryRowClassname, className, rowIdx === 0 && summaryRowBorderClassname),
    style: {
      bottom
    }
  }, cells);
}
const SummaryRow$1 = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.memo)(SummaryRow);

var css_248z$2 = ".cis5rrm700-beta7.rdg-cell{padding:0}";
styleInject(css_248z$2,{"insertAt":"top"});

const cellEditing = "cis5rrm700-beta7";
function EditCell({
  column,
  colSpan,
  row,
  rowIdx,
  onRowChange,
  onClose
}) {
  var _column$editorOptions, _column$editorOptions2, _column$editorOptions3;
  const frameRequestRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)();
  const commitOnOutsideClick = ((_column$editorOptions = column.editorOptions) === null || _column$editorOptions === void 0 ? void 0 : _column$editorOptions.commitOnOutsideClick) !== false;
  const commitOnOutsideMouseDown = useLatestFunc(() => {
    onRowChange(row, rowIdx, true);
  });
  function cancelFrameRequest() {
    cancelAnimationFrame(frameRequestRef.current);
  }
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!commitOnOutsideClick) return;
    function onWindowCaptureMouseDown() {
      frameRequestRef.current = requestAnimationFrame(commitOnOutsideMouseDown);
    }
    addEventListener('mousedown', onWindowCaptureMouseDown, {
      capture: true
    });
    return () => {
      removeEventListener('mousedown', onWindowCaptureMouseDown, {
        capture: true
      });
      cancelFrameRequest();
    };
  }, [commitOnOutsideClick, commitOnOutsideMouseDown]);
  const {
    cellClass
  } = column;
  const className = getCellClassname(column, 'rdg-editor-container', typeof cellClass === 'function' ? cellClass(row) : cellClass, !((_column$editorOptions2 = column.editorOptions) !== null && _column$editorOptions2 !== void 0 && _column$editorOptions2.renderFormatter) && cellEditing);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    role: "gridcell",
    "aria-colindex": column.idx + 1,
    "aria-colspan": colSpan,
    "aria-selected": true,
    className: className,
    style: getCellStyle(column, colSpan),
    onMouseDownCapture: commitOnOutsideClick ? cancelFrameRequest : undefined
  }, column.editor != null && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(column.editor, {
    column: column,
    row: row,
    rowIdx: rowIdx,
    onRowChange: onRowChange,
    onClose: onClose
  }), ((_column$editorOptions3 = column.editorOptions) === null || _column$editorOptions3 === void 0 ? void 0 : _column$editorOptions3.renderFormatter) && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(column.formatter, {
    column: column,
    row: row,
    rowIdx: rowIdx,
    isCellSelected: true,
    onRowChange: onRowChange
  })));
}

var css_248z$1 = ".c1w9bbhr700-beta7{background-color:var(--selection-color);bottom:0;cursor:move;height:8px;position:absolute;right:0;width:8px}.c1w9bbhr700-beta7:hover{background-color:var(--background-color);border:2px solid var(--selection-color);height:16px;width:16px}";
styleInject(css_248z$1,{"insertAt":"top"});

const cellDragHandle = "c1w9bbhr700-beta7";
const cellDragHandleClassname = `rdg-cell-drag-handle ${cellDragHandle}`;
function DragHandle({
  rows,
  columns,
  selectedPosition,
  latestDraggedOverRowIdx,
  isCellEditable,
  onRowsChange,
  onFill,
  setDragging,
  setDraggedOverRowIdx
}) {
  function handleMouseDown(event) {
    if (event.buttons !== 1) return;
    setDragging(true);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mouseup', onMouseUp);
    function onMouseOver(event) {
      if (event.buttons !== 1) onMouseUp();
    }
    function onMouseUp() {
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseup', onMouseUp);
      setDragging(false);
      handleDragEnd();
    }
  }
  function handleDragEnd() {
    const overRowIdx = latestDraggedOverRowIdx.current;
    if (overRowIdx === undefined) return;
    const {
      rowIdx
    } = selectedPosition;
    const startRowIndex = rowIdx < overRowIdx ? rowIdx + 1 : overRowIdx;
    const endRowIndex = rowIdx < overRowIdx ? overRowIdx + 1 : rowIdx;
    updateRows(startRowIndex, endRowIndex);
    setDraggedOverRowIdx(undefined);
  }
  function handleDoubleClick(event) {
    event.stopPropagation();
    updateRows(selectedPosition.rowIdx + 1, rows.length);
  }
  function updateRows(startRowIdx, endRowIdx) {
    const {
      idx,
      rowIdx
    } = selectedPosition;
    const column = columns[idx];
    const sourceRow = rows[rowIdx];
    const updatedRows = [...rows];
    const indexes = [];
    for (let i = startRowIdx; i < endRowIdx; i++) {
      if (isCellEditable({
        rowIdx: i,
        idx
      })) {
        const updatedRow = onFill({
          columnKey: column.key,
          sourceRow,
          targetRow: rows[i]
        });
        if (updatedRow !== rows[i]) {
          updatedRows[i] = updatedRow;
          indexes.push(i);
        }
      }
    }
    if (indexes.length > 0) {
      onRowsChange === null || onRowsChange === void 0 ? void 0 : onRowsChange(updatedRows, {
        indexes,
        column
      });
    }
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: cellDragHandleClassname,
    onMouseDown: handleMouseDown,
    onDoubleClick: handleDoubleClick
  });
}

const initialPosition = {
  idx: -1,
  rowIdx: -2,
  mode: 'SELECT'
};
function DataGrid({
  columns: rawColumns,
  rows: rawRows,
  summaryRows,
  rowKeyGetter,
  onRowsChange,
  rowHeight,
  headerRowHeight: rawHeaderRowHeight,
  summaryRowHeight: rawSummaryRowHeight,
  selectedRows,
  onSelectedRowsChange,
  sortColumns,
  onSortColumnsChange,
  defaultColumnOptions,
  groupBy: rawGroupBy,
  rowGrouper,
  expandedGroupIds,
  onExpandedGroupIdsChange,
  selection: selectionProp,
  onSelectionChange,
  onRowClick,
  onRowDoubleClick,
  onScroll,
  onColumnResize,
  onFill,
  onPaste,
  multiSelectionMode = false,
  cellNavigationMode: rawCellNavigationMode,
  enableVirtualization,
  rowRenderer,
  noRowsFallback,
  className,
  style,
  rowClass,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'data-testid': testId
}, ref) {
  var _summaryRows$length;
  rowHeight ??= 35;
  const headerRowHeight = rawHeaderRowHeight !== null && rawHeaderRowHeight !== void 0 ? rawHeaderRowHeight : typeof rowHeight === 'number' ? rowHeight : 35;
  const summaryRowHeight = rawSummaryRowHeight !== null && rawSummaryRowHeight !== void 0 ? rawSummaryRowHeight : typeof rowHeight === 'number' ? rowHeight : 35;
  const RowRenderer = rowRenderer !== null && rowRenderer !== void 0 ? rowRenderer : Row;
  const cellNavigationMode = rawCellNavigationMode !== null && rawCellNavigationMode !== void 0 ? rawCellNavigationMode : 'NONE';
  enableVirtualization ??= true;
  const [internalSelection, setInternalSelection] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(selectionProp !== null && selectionProp !== void 0 ? selectionProp : initialPosition);
  const isSelectionControlled = selectionProp != null;
  const selectedPosition = selectionProp !== null && selectionProp !== void 0 ? selectionProp : internalSelection;
  const [scrollTop, setScrollTop] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [scrollLeft, setScrollLeft] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [columnWidths, setColumnWidths] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(() => new Map());
  const [copiedCell, setCopiedCell] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [selectedCellRange, setSelectedCellRange] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const [isDragging, setDragging] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [draggedOverRowIdx, setOverRowIdx] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(undefined);
  const prevSelectedPosition = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(selectedPosition);
  const latestDraggedOverRowIdx = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(draggedOverRowIdx);
  const lastSelectedRowIdx = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(-1);
  const selectedCellRangeAnchorRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(undefined);
  const isMouseSelectingRangeRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(false);
  const wasSelectionHandledOnMouseDownRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(false);
  const [gridRef, gridWidth, gridHeight] = useGridDimensions();
  const headerRowsCount = 1;
  const summaryRowsCount = (_summaryRows$length = summaryRows === null || summaryRows === void 0 ? void 0 : summaryRows.length) !== null && _summaryRows$length !== void 0 ? _summaryRows$length : 0;
  const clientHeight = gridHeight - headerRowHeight - summaryRowsCount * summaryRowHeight;
  const isSelectable = selectedRows != null && onSelectedRowsChange != null;
  const isHeaderRowSelected = selectedPosition.rowIdx === -1;
  const activeRef = useActiveElement(gridRef);
  const allRowsSelected = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    const {
      length
    } = rawRows;
    return length !== 0 && selectedRows != null && rowKeyGetter != null && selectedRows.size >= length && rawRows.every(row => selectedRows.has(rowKeyGetter(row)));
  }, [rawRows, selectedRows, rowKeyGetter]);
  const {
    columns,
    colSpanColumns,
    colOverscanStartIdx,
    colOverscanEndIdx,
    layoutCssVars,
    columnMetrics,
    totalColumnWidth,
    lastFrozenColumnIndex,
    totalFrozenColumnWidth,
    groupBy
  } = useCalculatedColumns({
    rawColumns,
    columnWidths,
    scrollLeft,
    viewportWidth: gridWidth,
    defaultColumnOptions,
    rawGroupBy: rowGrouper ? rawGroupBy : undefined,
    enableVirtualization
  });
  const {
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    rows,
    rowsCount,
    totalRowHeight,
    isGroupRow,
    getRowTop,
    getRowHeight,
    findRowIdx
  } = useViewportRows({
    rawRows,
    groupBy,
    rowGrouper,
    rowHeight,
    clientHeight,
    scrollTop,
    expandedGroupIds,
    enableVirtualization
  });
  const viewportColumns = useViewportColumns({
    columns,
    colSpanColumns,
    colOverscanStartIdx,
    colOverscanEndIdx,
    lastFrozenColumnIndex,
    rowOverscanStartIdx,
    rowOverscanEndIdx,
    rows,
    summaryRows,
    isGroupRow
  });
  const hasGroups = groupBy.length > 0 && typeof rowGrouper === 'function';
  const minColIdx = hasGroups ? -1 : 0;
  const maxColIdx = columns.length - 1;
  const minRowIdx = -1;
  const maxRowIdx = headerRowsCount + rows.length + summaryRowsCount - 2;
  const selectedCellIsWithinSelectionBounds = isCellWithinSelectionBounds(selectedPosition);
  const selectedCellIsWithinViewportBounds = isCellWithinViewportBounds(selectedPosition);
  function isCellWithinSelectedRange(position, range) {
    const {
      idx,
      rowIdx
    } = position;
    return idx >= range.startIdx && idx <= range.endIdx && rowIdx >= range.startRowIdx && rowIdx <= range.endRowIdx;
  }
  function areSelectedCellRangesEqual(firstRange, secondRange) {
    if (firstRange === secondRange) return true;
    if (firstRange == null || secondRange == null) return false;
    return firstRange.startIdx === secondRange.startIdx && firstRange.endIdx === secondRange.endIdx && firstRange.startRowIdx === secondRange.startRowIdx && firstRange.endRowIdx === secondRange.endRowIdx;
  }
  function getSingleCellRange(position) {
    if (!isCellWithinViewportBounds(position)) return undefined;
    return {
      startIdx: position.idx,
      endIdx: position.idx,
      startRowIdx: position.rowIdx,
      endRowIdx: position.rowIdx
    };
  }
  function getCellRange(startPosition, endPosition) {
    if (!isCellWithinViewportBounds(startPosition) || !isCellWithinViewportBounds(endPosition)) {
      return undefined;
    }
    return {
      startIdx: Math.min(startPosition.idx, endPosition.idx),
      endIdx: Math.max(startPosition.idx, endPosition.idx),
      startRowIdx: Math.min(startPosition.rowIdx, endPosition.rowIdx),
      endRowIdx: Math.max(startPosition.rowIdx, endPosition.rowIdx)
    };
  }
  function getRangesFromRange(range, fallbackPosition) {
    if (range == null) {
      return isRowIdxWithinViewportBounds(fallbackPosition.rowIdx) ? [{
        rowIdx: fallbackPosition.rowIdx
      }] : [];
    }
    const startRowIdx = Math.max(range.startRowIdx, 0);
    const endRowIdx = Math.min(range.endRowIdx, rows.length - 1);
    if (startRowIdx > endRowIdx) return [];
    const ranges = [];
    for (let rowIdx = startRowIdx; rowIdx <= endRowIdx; rowIdx++) {
      ranges.push({
        rowIdx
      });
    }
    return ranges;
  }
  function getControlledSelectedRows() {
    const fromRanges = Array.isArray(selectedPosition.ranges) ? selectedPosition.ranges.map(range => range === null || range === void 0 ? void 0 : range.rowIdx).filter(rowIdx => Number.isInteger(rowIdx)) : [];
    return fromRanges.filter(rowIdx => isRowIdxWithinViewportBounds(rowIdx));
  }
  function getSelectedRangeForRow(rowIdx) {
    if (selectedCellRange == null || rowIdx < selectedCellRange.startRowIdx || rowIdx > selectedCellRange.endRowIdx) {
      return undefined;
    }
    return {
      startIdx: selectedCellRange.startIdx,
      endIdx: selectedCellRange.endIdx
    };
  }
  function notifySelectionChange(nextSelectedPosition, range) {
    const ranges = getRangesFromRange(range, nextSelectedPosition);
    const nextSelection = {
      ...nextSelectedPosition,
      ranges
    };
    if (!isSelectionControlled) {
      setInternalSelection(nextSelection);
    }
    onSelectionChange === null || onSelectionChange === void 0 ? void 0 : onSelectionChange(nextSelection);
  }
  const selectRowLatest = useLatestFunc(selectRow);
  const selectAllRowsLatest = useLatestFunc(selectAllRows);
  const handleFormatterRowChangeLatest = useLatestFunc(updateRow);
  const selectViewportCellLatest = useLatestFunc((row, column, enableEditor) => {
    const rowIdx = rows.indexOf(row);
    selectCell({
      rowIdx,
      idx: column.idx
    }, enableEditor);
  });
  const selectGroupLatest = useLatestFunc(rowIdx => {
    selectCell({
      rowIdx,
      idx: -1
    });
  });
  const selectHeaderCellLatest = useLatestFunc(idx => {
    selectCell({
      rowIdx: -1,
      idx
    });
  });
  const selectSummaryCellLatest = useLatestFunc((summaryRow, column) => {
    const rowIdx = summaryRows.indexOf(summaryRow) + headerRowsCount + rows.length - 1;
    selectCell({
      rowIdx,
      idx: column.idx
    });
  });
  const toggleGroupLatest = useLatestFunc(toggleGroup);
  useLayoutEffect(() => {
    if (!selectedCellIsWithinSelectionBounds || selectedPosition === prevSelectedPosition.current || selectedPosition.mode === 'EDIT') {
      return;
    }
    prevSelectedPosition.current = selectedPosition;
    scrollToCell(selectedPosition);
  });
  useLayoutEffect(() => {
    if (!selectedCellIsWithinViewportBounds) {
      selectedCellRangeAnchorRef.current = undefined;
      setSelectedCellRange(undefined);
      return;
    }
    const currentPosition = {
      idx: selectedPosition.idx,
      rowIdx: selectedPosition.rowIdx
    };
    const controlledSelectedRows = getControlledSelectedRows();
    if (controlledSelectedRows.length > 0) {
      const startRowIdx = Math.min(...controlledSelectedRows);
      const endRowIdx = max(...controlledSelectedRows);
      const hasMultiRowSelection = controlledSelectedRows.length > 1;
      const anchorPosition = selectedCellRangeAnchorRef.current && isCellWithinViewportBounds(selectedCellRangeAnchorRef.current) ? selectedCellRangeAnchorRef.current : currentPosition;
      const startIdx = multiSelectionMode === 'rows' && hasMultiRowSelection ? minColIdx : Math.min(anchorPosition.idx, currentPosition.idx);
      const endIdx = multiSelectionMode === 'rows' && hasMultiRowSelection ? maxColIdx : max(anchorPosition.idx, currentPosition.idx);
      const nextRange = {
        startIdx,
        endIdx,
        startRowIdx,
        endRowIdx
      };
      setSelectedCellRange(previousRange => {
        if (areSelectedCellRangesEqual(previousRange, nextRange)) {
          return previousRange;
        }
        return nextRange;
      });
      return;
    }
    setSelectedCellRange(previousRange => {
      if (previousRange != null && isCellWithinSelectedRange(currentPosition, previousRange)) {
        return previousRange;
      }
      selectedCellRangeAnchorRef.current = currentPosition;
      return getSingleCellRange(currentPosition);
    });
  }, [selectedCellIsWithinViewportBounds, multiSelectionMode, minColIdx, maxColIdx, selectedPosition.idx, selectedPosition.rowIdx, selectedPosition.ranges]);
  useLayoutEffect(() => {
    function stopMouseSelectingRange() {
      isMouseSelectingRangeRef.current = false;
    }
    document.addEventListener('mouseup', stopMouseSelectingRange);
    return () => {
      document.removeEventListener('mouseup', stopMouseSelectingRange);
    };
  }, []);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useImperativeHandle)(ref, () => ({
    element: gridRef.current,
    scrollToColumn(idx) {
      scrollToCell({
        idx
      });
    },
    scrollToRow(rowIdx) {
      const {
        current
      } = gridRef;
      if (!current) return;
      current.scrollTo({
        top: getRowTop(rowIdx),
        behavior: 'smooth'
      });
    },
    selectCell
  }));
  const handleColumnResize = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((column, width) => {
    setColumnWidths(columnWidths => {
      const newColumnWidths = new Map(columnWidths);
      newColumnWidths.set(column.key, width);
      return newColumnWidths;
    });
    onColumnResize === null || onColumnResize === void 0 ? void 0 : onColumnResize(column.idx, width);
  }, [onColumnResize]);
  const setDraggedOverRowIdx = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(rowIdx => {
    setOverRowIdx(rowIdx);
    latestDraggedOverRowIdx.current = rowIdx;
  }, []);
  function selectRow({
    row,
    checked,
    isShiftClick
  }) {
    if (!onSelectedRowsChange) return;
    assertIsValidKeyGetter(rowKeyGetter);
    const newSelectedRows = new Set(selectedRows);
    if (isGroupRow(row)) {
      for (const childRow of row.childRows) {
        const rowKey = rowKeyGetter(childRow);
        if (checked) {
          newSelectedRows.add(rowKey);
        } else {
          newSelectedRows.delete(rowKey);
        }
      }
      onSelectedRowsChange(newSelectedRows);
      return;
    }
    const rowKey = rowKeyGetter(row);
    if (checked) {
      newSelectedRows.add(rowKey);
      const previousRowIdx = lastSelectedRowIdx.current;
      const rowIdx = rows.indexOf(row);
      lastSelectedRowIdx.current = rowIdx;
      if (isShiftClick && previousRowIdx !== -1 && previousRowIdx !== rowIdx) {
        const step = sign(rowIdx - previousRowIdx);
        for (let i = previousRowIdx + step; i !== rowIdx; i += step) {
          const row = rows[i];
          if (isGroupRow(row)) continue;
          newSelectedRows.add(rowKeyGetter(row));
        }
      }
    } else {
      newSelectedRows.delete(rowKey);
      lastSelectedRowIdx.current = -1;
    }
    onSelectedRowsChange(newSelectedRows);
  }
  function selectAllRows(checked) {
    if (!onSelectedRowsChange) return;
    assertIsValidKeyGetter(rowKeyGetter);
    const newSelectedRows = new Set(selectedRows);
    for (const row of rawRows) {
      const rowKey = rowKeyGetter(row);
      if (checked) {
        newSelectedRows.add(rowKey);
      } else {
        newSelectedRows.delete(rowKey);
      }
    }
    onSelectedRowsChange(newSelectedRows);
  }
  function toggleGroup(expandedGroupId) {
    if (!onExpandedGroupIdsChange) return;
    const newExpandedGroupIds = new Set(expandedGroupIds);
    if (newExpandedGroupIds.has(expandedGroupId)) {
      newExpandedGroupIds.delete(expandedGroupId);
    } else {
      newExpandedGroupIds.add(expandedGroupId);
    }
    onExpandedGroupIdsChange(newExpandedGroupIds);
  }
  function handleKeyDown(event) {
    if (!(event.target instanceof Element)) return;
    const isCellEvent = event.target.closest('.rdg-cell') !== null;
    const isRowEvent = hasGroups && event.target.matches('.rdg-row, .rdg-header-row');
    if (!isCellEvent && !isRowEvent) return;
    const {
      key,
      keyCode
    } = event;
    const {
      rowIdx
    } = selectedPosition;
    if (selectedCellIsWithinViewportBounds && onPaste != null && isCtrlKeyHeldDown(event) && !isGroupRow(rows[rowIdx]) && selectedPosition.mode === 'SELECT') {
      const cKey = 67;
      const vKey = 86;
      if (keyCode === cKey) {
        handleCopy();
        return;
      }
      if (keyCode === vKey) {
        handlePaste();
        return;
      }
    }
    if (isRowIdxWithinViewportBounds(rowIdx)) {
      const row = rows[rowIdx];
      if (isGroupRow(row) && selectedPosition.idx === -1 && (key === 'ArrowLeft' && row.isExpanded || key === 'ArrowRight' && !row.isExpanded)) {
        event.preventDefault();
        toggleGroup(row.id);
        return;
      }
    }
    switch (event.key) {
      case 'Escape':
        setCopiedCell(null);
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
  function handleScroll(event) {
    const {
      scrollTop,
      scrollLeft
    } = event.currentTarget;
    setScrollTop(scrollTop);
    setScrollLeft(scrollLeft);
    onScroll === null || onScroll === void 0 ? void 0 : onScroll(event);
  }
  function getCellPositionFromTarget(target) {
    if (!(target instanceof Element)) return;
    const cell = target.closest('[role="gridcell"]');
    if (cell == null) return;
    const idx = Number(cell.getAttribute('data-idx'));
    const rowIdx = Number(cell.getAttribute('data-rowidx'));
    if (!Number.isInteger(idx) || !Number.isInteger(rowIdx)) return;
    return {
      idx,
      rowIdx
    };
  }
  function handleGridMouseDownCapture(event) {
    wasSelectionHandledOnMouseDownRef.current = false;
    if (event.button !== 0 || selectedPosition.mode === 'EDIT' || isDragging) return;
    const mouseDownCellPosition = getCellPositionFromTarget(event.target);
    if (mouseDownCellPosition == null) return;
    isMouseSelectingRangeRef.current = true;
    wasSelectionHandledOnMouseDownRef.current = true;
    selectCell(mouseDownCellPosition, false, event.shiftKey);
  }
  function handleGridMouseOverCapture(event) {
    if (!isMouseSelectingRangeRef.current || selectedPosition.mode === 'EDIT' || isDragging) return;
    if ((event.buttons & 1) !== 1) {
      isMouseSelectingRangeRef.current = false;
      return;
    }
    const mouseOverCellPosition = getCellPositionFromTarget(event.target);
    if (mouseOverCellPosition == null) return;
    selectCell(mouseOverCellPosition, false, true);
  }
  function handleGridClickCapture(event) {
    event.nativeEvent.rdgSelectionHandledOnMouseDown = wasSelectionHandledOnMouseDownRef.current;
    wasSelectionHandledOnMouseDownRef.current = false;
  }
  function handleGridMouseUpCapture() {
    isMouseSelectingRangeRef.current = false;
  }
  function getRawRowIdx(rowIdx) {
    return hasGroups ? rawRows.indexOf(rows[rowIdx]) : rowIdx;
  }
  function updateRow(rowIdx, row) {
    if (typeof onRowsChange !== 'function') return;
    const rawRowIdx = getRawRowIdx(rowIdx);
    if (row === rawRows[rawRowIdx]) return;
    const updatedRows = [...rawRows];
    updatedRows[rawRowIdx] = row;
    onRowsChange(updatedRows, {
      indexes: [rawRowIdx],
      column: columns[selectedPosition.idx]
    });
  }
  function commitEditorChanges() {
    var _columns$selectedPosi;
    if (((_columns$selectedPosi = columns[selectedPosition.idx]) === null || _columns$selectedPosi === void 0 ? void 0 : _columns$selectedPosi.editor) == null || selectedPosition.mode === 'SELECT') {
      return;
    }
    updateRow(selectedPosition.rowIdx, rawRows[getRawRowIdx(selectedPosition.rowIdx)]);
  }
  function handleCopy() {
    const {
      idx,
      rowIdx
    } = selectedPosition;
    setCopiedCell({
      row: rawRows[getRawRowIdx(rowIdx)],
      columnKey: columns[idx].key
    });
  }
  function handlePaste() {
    if (!onPaste || !onRowsChange || copiedCell === null || !isCellEditable(selectedPosition)) {
      return;
    }
    const {
      idx,
      rowIdx
    } = selectedPosition;
    const targetRow = rawRows[getRawRowIdx(rowIdx)];
    const updatedTargetRow = onPaste({
      sourceRow: copiedCell.row,
      sourceColumnKey: copiedCell.columnKey,
      targetRow,
      targetColumnKey: columns[idx].key
    });
    updateRow(rowIdx, updatedTargetRow);
  }
  function handleCellInput(event) {
    var _column$editorOptions, _column$editorOptions2;
    if (!selectedCellIsWithinViewportBounds) return;
    const row = rows[selectedPosition.rowIdx];
    if (isGroupRow(row)) return;
    const {
      key,
      shiftKey
    } = event;
    if (selectedPosition.mode === 'EDIT') {
      if (key === 'Enter') {
        commitEditorChanges();
        closeEditor();
      }
      return;
    }
    if (isSelectable && shiftKey && key === ' ') {
      assertIsValidKeyGetter(rowKeyGetter);
      const rowKey = rowKeyGetter(row);
      selectRow({
        row,
        checked: !selectedRows.has(rowKey),
        isShiftClick: false
      });
      event.preventDefault();
      return;
    }
    const column = columns[selectedPosition.idx];
    (_column$editorOptions = column.editorOptions) === null || _column$editorOptions === void 0 ? void 0 : (_column$editorOptions2 = _column$editorOptions.onCellKeyDown) === null || _column$editorOptions2 === void 0 ? void 0 : _column$editorOptions2.call(_column$editorOptions, event);
    if (event.isDefaultPrevented()) return;
    if (isCellEditable(selectedPosition) && isDefaultCellInput(event)) {
      notifySelectionChange({
        idx: selectedPosition.idx,
        rowIdx: selectedPosition.rowIdx,
        mode: 'EDIT'
      }, selectedCellRange);
    }
  }
  function handleEditorRowChange(row, rowIdx, commitChanges) {
    if (selectedPosition.mode === 'SELECT') return;
    if (commitChanges) {
      updateRow(selectedPosition.rowIdx, row);
      closeEditor();
    } else {
      notifySelectionChange(selectedPosition, selectedCellRange);
    }
  }
  function handleOnClose(commitChanges) {
    if (commitChanges) {
      commitEditorChanges();
    }
    closeEditor();
  }
  function isColIdxWithinSelectionBounds(idx) {
    return idx >= minColIdx && idx <= maxColIdx;
  }
  function isRowIdxWithinViewportBounds(rowIdx) {
    return rowIdx >= 0 && rowIdx < rows.length;
  }
  function isCellWithinSelectionBounds({
    idx,
    rowIdx
  }) {
    return rowIdx >= minRowIdx && rowIdx <= maxRowIdx && isColIdxWithinSelectionBounds(idx);
  }
  function isCellWithinViewportBounds({
    idx,
    rowIdx
  }) {
    return isRowIdxWithinViewportBounds(rowIdx) && isColIdxWithinSelectionBounds(idx);
  }
  function isCellEditable(position) {
    return isCellWithinViewportBounds(position) && isSelectedCellEditable({
      columns,
      rows,
      selectedPosition: position,
      isGroupRow
    });
  }
  function selectCell(position, enableEditor, extendSelection = false) {
    if (!isCellWithinSelectionBounds(position)) return;
    commitEditorChanges();
    let nextSelectedCellRange;
    if (isCellWithinViewportBounds(position)) {
      if (extendSelection) {
        var _getCellRange;
        const anchorPosition = selectedCellRangeAnchorRef.current && isCellWithinViewportBounds(selectedCellRangeAnchorRef.current) ? selectedCellRangeAnchorRef.current : isCellWithinViewportBounds(selectedPosition) ? {
          idx: selectedPosition.idx,
          rowIdx: selectedPosition.rowIdx
        } : position;
        selectedCellRangeAnchorRef.current = anchorPosition;
        nextSelectedCellRange = (_getCellRange = getCellRange(anchorPosition, position)) !== null && _getCellRange !== void 0 ? _getCellRange : getSingleCellRange(position);
      } else {
        selectedCellRangeAnchorRef.current = position;
        nextSelectedCellRange = getSingleCellRange(position);
      }
    } else {
      selectedCellRangeAnchorRef.current = undefined;
      nextSelectedCellRange = undefined;
    }
    setSelectedCellRange(nextSelectedCellRange);
    if (enableEditor && isCellEditable(position)) {
      notifySelectionChange({
        ...position,
        mode: 'EDIT'
      }, nextSelectedCellRange);
      return;
    }
    if (selectedPosition.mode !== 'SELECT' || selectedPosition.idx !== position.idx || selectedPosition.rowIdx !== position.rowIdx || !areSelectedCellRangesEqual(selectedCellRange, nextSelectedCellRange)) {
      notifySelectionChange({
        ...position,
        mode: 'SELECT'
      }, nextSelectedCellRange);
    }
  }
  function closeEditor() {
    if (selectedPosition.mode === 'SELECT') return;
    notifySelectionChange({
      idx: selectedPosition.idx,
      rowIdx: selectedPosition.rowIdx,
      mode: 'SELECT'
    }, selectedCellRange);
  }
  function scrollToCell({
    idx,
    rowIdx
  }) {
    const {
      current
    } = gridRef;
    if (!current) return;
    if (typeof idx === 'number' && idx > lastFrozenColumnIndex) {
      rowIdx ??= selectedPosition.rowIdx;
      if (!(typeof rowIdx !== 'undefined' && isCellWithinSelectionBounds({
        rowIdx,
        idx
      }))) return;
      const {
        clientWidth
      } = current;
      const column = columns[idx];
      const {
        left,
        width
      } = columnMetrics.get(column);
      let right = left + width;
      const colSpan = getSelectedCellColSpan({
        rows,
        summaryRows,
        rowIdx,
        lastFrozenColumnIndex,
        column,
        isGroupRow
      });
      if (colSpan !== undefined) {
        const {
          left,
          width
        } = columnMetrics.get(columns[column.idx + colSpan - 1]);
        right = left + width;
      }
      const isCellAtLeftBoundary = left < scrollLeft + totalFrozenColumnWidth;
      const isCellAtRightBoundary = right > clientWidth + scrollLeft;
      if (isCellAtLeftBoundary) {
        current.scrollLeft = left - totalFrozenColumnWidth;
      } else if (isCellAtRightBoundary) {
        current.scrollLeft = right - clientWidth;
      }
    }
    if (typeof rowIdx === 'number' && isRowIdxWithinViewportBounds(rowIdx)) {
      const rowTop = getRowTop(rowIdx);
      const rowHeight = getRowHeight(rowIdx);
      if (rowTop < scrollTop) {
        current.scrollTop = rowTop;
      } else if (rowTop + rowHeight > scrollTop + clientHeight) {
        current.scrollTop = rowTop + rowHeight - clientHeight;
      }
    }
  }
  function getNextPosition(key, ctrlKey, shiftKey) {
    const {
      idx,
      rowIdx
    } = selectedPosition;
    const row = rows[rowIdx];
    const isRowSelected = selectedCellIsWithinSelectionBounds && idx === -1;
    if (key === 'ArrowLeft' && isRowSelected && isGroupRow(row) && !row.isExpanded && row.level !== 0) {
      let parentRowIdx = -1;
      for (let i = selectedPosition.rowIdx - 1; i >= 0; i--) {
        const parentRow = rows[i];
        if (isGroupRow(parentRow) && parentRow.id === row.parentId) {
          parentRowIdx = i;
          break;
        }
      }
      if (parentRowIdx !== -1) {
        return {
          idx,
          rowIdx: parentRowIdx
        };
      }
    }
    switch (key) {
      case 'ArrowUp':
        return {
          idx,
          rowIdx: rowIdx - 1
        };
      case 'ArrowDown':
        return {
          idx,
          rowIdx: rowIdx + 1
        };
      case 'ArrowLeft':
        return {
          idx: idx - 1,
          rowIdx
        };
      case 'ArrowRight':
        return {
          idx: idx + 1,
          rowIdx
        };
      case 'Tab':
        return {
          idx: idx + (shiftKey ? -1 : 1),
          rowIdx
        };
      case 'Home':
        if (isRowSelected) return {
          idx,
          rowIdx: 0
        };
        return {
          idx: 0,
          rowIdx: ctrlKey ? minRowIdx : rowIdx
        };
      case 'End':
        if (isRowSelected) return {
          idx,
          rowIdx: rows.length - 1
        };
        return {
          idx: maxColIdx,
          rowIdx: ctrlKey ? maxRowIdx : rowIdx
        };
      case 'PageUp':
        {
          if (selectedPosition.rowIdx === minRowIdx) return selectedPosition;
          const nextRowY = getRowTop(rowIdx) + getRowHeight(rowIdx) - clientHeight;
          return {
            idx,
            rowIdx: nextRowY > 0 ? findRowIdx(nextRowY) : 0
          };
        }
      case 'PageDown':
        {
          if (selectedPosition.rowIdx >= rows.length) return selectedPosition;
          const nextRowY = getRowTop(rowIdx) + clientHeight;
          return {
            idx,
            rowIdx: nextRowY < totalRowHeight ? findRowIdx(nextRowY) : rows.length - 1
          };
        }
      default:
        return selectedPosition;
    }
  }
  function navigate(event) {
    if (selectedPosition.mode === 'EDIT') {
      var _columns$selectedPosi2, _columns$selectedPosi3;
      const onNavigation = (_columns$selectedPosi2 = (_columns$selectedPosi3 = columns[selectedPosition.idx].editorOptions) === null || _columns$selectedPosi3 === void 0 ? void 0 : _columns$selectedPosi3.onNavigation) !== null && _columns$selectedPosi2 !== void 0 ? _columns$selectedPosi2 : onEditorNavigation;
      if (!onNavigation(event)) return;
    }
    const {
      key,
      shiftKey
    } = event;
    let mode = cellNavigationMode;
    if (key === 'Tab') {
      if (canExitGrid({
        shiftKey,
        cellNavigationMode,
        maxColIdx,
        minRowIdx,
        maxRowIdx,
        selectedPosition
      })) {
        commitEditorChanges();
        return;
      }
      mode = cellNavigationMode === 'NONE' ? 'CHANGE_ROW' : cellNavigationMode;
    }
    event.preventDefault();
    const ctrlKey = isCtrlKeyHeldDown(event);
    const nextPosition = getNextPosition(key, ctrlKey, shiftKey);
    if (nextPosition.rowIdx === selectedPosition.rowIdx && nextPosition.idx === selectedPosition.idx) {
      return;
    }
    const nextSelectedCellPosition = getNextSelectedCellPosition({
      columns,
      colSpanColumns,
      rows,
      summaryRows,
      minRowIdx,
      maxRowIdx,
      lastFrozenColumnIndex,
      cellNavigationMode: mode,
      currentPosition: selectedPosition,
      nextPosition,
      isCellWithinBounds: isCellWithinSelectionBounds,
      isGroupRow
    });
    selectCell(nextSelectedCellPosition, false, shiftKey && key !== 'Tab');
  }
  function getDraggedOverCellIdx(currentRowIdx) {
    if (draggedOverRowIdx === undefined) return;
    const {
      rowIdx
    } = selectedPosition;
    const isDraggedOver = rowIdx < draggedOverRowIdx ? rowIdx < currentRowIdx && currentRowIdx <= draggedOverRowIdx : rowIdx > currentRowIdx && currentRowIdx >= draggedOverRowIdx;
    return isDraggedOver ? selectedPosition.idx : undefined;
  }
  function getDragHandle(rowIdx) {
    if (selectedPosition.rowIdx !== rowIdx || selectedPosition.mode === 'EDIT' || hasGroups || onFill == null) {
      return;
    }
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(DragHandle, {
      rows: rawRows,
      columns: columns,
      selectedPosition: selectedPosition,
      isCellEditable: isCellEditable,
      latestDraggedOverRowIdx: latestDraggedOverRowIdx,
      onRowsChange: onRowsChange,
      onFill: onFill,
      setDragging: setDragging,
      setDraggedOverRowIdx: setDraggedOverRowIdx
    });
  }
  function getCellEditor(rowIdx) {
    if (selectedPosition.rowIdx !== rowIdx || selectedPosition.mode === 'SELECT') return;
    const {
      idx
    } = selectedPosition;
    const column = columns[idx];
    const row = rawRows[getRawRowIdx(rowIdx)];
    const colSpan = getColSpan(column, lastFrozenColumnIndex, {
      type: 'ROW',
      row
    });
    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(EditCell, {
      key: column.key,
      column: column,
      colSpan: colSpan,
      row: row,
      rowIdx: rowIdx,
      onRowChange: handleEditorRowChange,
      onClose: handleOnClose
    });
  }
  function getViewportRows() {
    const rowElements = [];
    let startRowIndex = 0;
    const {
      idx: selectedIdx,
      rowIdx: selectedRowIdx
    } = selectedPosition;
    const rangeRowSet = multiSelectionMode === 'rows' ? new Set(getControlledSelectedRows()) : new Set();
    const hasCursor = selectedRowIdx >= 0 && selectedIdx >= 0;
    const isRowsRangeSelectionActive = multiSelectionMode === 'rows' && (rangeRowSet.size > 1 || rangeRowSet.size > 0 && !hasCursor);
    const startRowIdx = selectedCellIsWithinViewportBounds && selectedRowIdx < rowOverscanStartIdx ? rowOverscanStartIdx - 1 : rowOverscanStartIdx;
    const endRowIdx = selectedCellIsWithinViewportBounds && selectedRowIdx > rowOverscanEndIdx ? rowOverscanEndIdx + 1 : rowOverscanEndIdx;
    for (let viewportRowIdx = startRowIdx; viewportRowIdx <= endRowIdx; viewportRowIdx++) {
      const isRowOutsideViewport = viewportRowIdx === rowOverscanStartIdx - 1 || viewportRowIdx === rowOverscanEndIdx + 1;
      const rowIdx = isRowOutsideViewport ? selectedRowIdx : viewportRowIdx;
      let rowColumns = viewportColumns;
      const selectedColumn = columns[selectedIdx];
      if (selectedColumn !== undefined) {
        if (isRowOutsideViewport) {
          rowColumns = [selectedColumn];
        } else if (selectedRowIdx === rowIdx && !viewportColumns.includes(selectedColumn)) {
          rowColumns = selectedIdx > viewportColumns[viewportColumns.length - 1].idx ? [...viewportColumns, selectedColumn] : [...viewportColumns.slice(0, lastFrozenColumnIndex + 1), selectedColumn, ...viewportColumns.slice(lastFrozenColumnIndex + 1)];
        }
      }
      const row = rows[rowIdx];
      const top = getRowTop(rowIdx) + headerRowHeight;
      if (isGroupRow(row)) {
        ({
          startRowIndex
        } = row);
        const isRangeRowSelected = isRowsRangeSelectionActive && rangeRowSet.has(rowIdx);
        const isGroupRowSelected = isRangeRowSelected || isSelectable && row.childRows.every(cr => selectedRows.has(rowKeyGetter(cr)));
        rowElements.push(/*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(GroupRowRenderer, {
          "aria-level": row.level + 1,
          "aria-setsize": row.setSize,
          "aria-posinset": row.posInSet + 1,
          "aria-rowindex": headerRowsCount + startRowIndex + 1,
          "aria-selected": isGroupRowSelected ? true : undefined,
          key: row.id,
          id: row.id,
          groupKey: row.groupKey,
          viewportColumns: rowColumns,
          childRows: row.childRows,
          rowIdx: rowIdx,
          row: row,
          top: top,
          height: getRowHeight(rowIdx),
          level: row.level,
          isExpanded: row.isExpanded,
          selectedCellIdx: selectedRowIdx === rowIdx ? selectedIdx : undefined,
          isRowSelected: isGroupRowSelected,
          selectGroup: selectGroupLatest,
          toggleGroup: toggleGroupLatest
        }));
        continue;
      }
      startRowIndex++;
      let key;
      let isRowSelected = isRowsRangeSelectionActive && rangeRowSet.has(rowIdx);
      if (typeof rowKeyGetter === 'function') {
        var _selectedRows$has;
        key = rowKeyGetter(row);
        isRowSelected ||= (_selectedRows$has = selectedRows === null || selectedRows === void 0 ? void 0 : selectedRows.has(key)) !== null && _selectedRows$has !== void 0 ? _selectedRows$has : false;
      } else {
        key = hasGroups ? startRowIndex : rowIdx;
      }
      rowElements.push(RowRenderer({
        "aria-rowindex": headerRowsCount + (hasGroups ? startRowIndex : rowIdx) + 1,
        "aria-selected": isRowSelected ? true : undefined,
        key: key,
        rowIdx: rowIdx,
        row: row,
        viewportColumns: rowColumns,
        isRowSelected: isRowSelected,
        onRowClick: onRowClick,
        onRowDoubleClick: onRowDoubleClick,
        rowClass: rowClass,
        top: top,
        height: getRowHeight(rowIdx),
        copiedCellIdx: copiedCell !== null && copiedCell.row === row ? columns.findIndex(c => c.key === copiedCell.columnKey) : undefined,
        selectedCellRange: isRowsRangeSelectionActive ? undefined : getSelectedRangeForRow(rowIdx),
        selectedCellIdx: selectedRowIdx === rowIdx ? selectedIdx : undefined,
        draggedOverCellIdx: getDraggedOverCellIdx(rowIdx),
        setDraggedOverRowIdx: isDragging ? setDraggedOverRowIdx : undefined,
        lastFrozenColumnIndex: lastFrozenColumnIndex,
        onRowChange: handleFormatterRowChangeLatest,
        selectCell: selectViewportCellLatest,
        selectedCellDragHandle: getDragHandle(rowIdx),
        selectedCellEditor: getCellEditor(rowIdx)
      }));
    }
    return rowElements;
  }
  if (selectedPosition.idx > maxColIdx || selectedPosition.rowIdx > maxRowIdx) {
    notifySelectionChange(initialPosition, undefined);
    setDraggedOverRowIdx(undefined);
  }
  return (
    /*#__PURE__*/
    react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ActiveContext.Provider, {
      value: activeRef
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      role: hasGroups ? 'treegrid' : 'grid',
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-multiselectable": isSelectable || multiSelectionMode === 'rows' ? true : undefined,
      "aria-colcount": columns.length,
      "aria-rowcount": headerRowsCount + rowsCount + summaryRowsCount,
      className: (0,clsx__WEBPACK_IMPORTED_MODULE_1__["default"])(rootClassname, className, isDragging && viewportDraggingClassname),
      style: {
        ...style,
        '--header-row-height': `${headerRowHeight}px`,
        '--row-width': `${totalColumnWidth}px`,
        '--summary-row-height': `${summaryRowHeight}px`,
        ...layoutCssVars
      },
      ref: gridRef,
      onScroll: handleScroll,
      onKeyDown: handleKeyDown,
      onMouseDownCapture: handleGridMouseDownCapture,
      onMouseOverCapture: handleGridMouseOverCapture,
      onClickCapture: handleGridClickCapture,
      onMouseUpCapture: handleGridMouseUpCapture,
      "data-testid": testId
    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(HeaderRow$1, {
      columns: viewportColumns,
      onColumnResize: handleColumnResize,
      allRowsSelected: allRowsSelected,
      onAllRowsSelectionChange: selectAllRowsLatest,
      sortColumns: sortColumns,
      onSortColumnsChange: onSortColumnsChange,
      lastFrozenColumnIndex: lastFrozenColumnIndex,
      selectedCellIdx: isHeaderRowSelected ? selectedPosition.idx : undefined,
      selectCell: selectHeaderCellLatest,
      shouldFocusGrid: !selectedCellIsWithinSelectionBounds
    }), rows.length === 0 && noRowsFallback ? noRowsFallback : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
      style: {
        height: max(totalRowHeight, clientHeight)
      }
    }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(RowSelectionChangeProvider, {
      value: selectRowLatest
    }, getViewportRows()), summaryRows === null || summaryRows === void 0 ? void 0 : summaryRows.map((row, rowIdx) => {
      const isSummaryRowSelected = selectedPosition.rowIdx === headerRowsCount + rows.length + rowIdx - 1;
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(SummaryRow$1, {
        "aria-rowindex": headerRowsCount + rowsCount + rowIdx + 1,
        key: rowIdx,
        rowIdx: rowIdx,
        row: row,
        bottom: summaryRowHeight * (summaryRows.length - 1 - rowIdx),
        viewportColumns: viewportColumns,
        lastFrozenColumnIndex: lastFrozenColumnIndex,
        selectedCellIdx: isSummaryRowSelected ? selectedPosition.idx : undefined,
        selectCell: selectSummaryCellLatest
      });
    }))))
  );
}
const DataGrid$1 = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)(DataGrid);

var css_248z = ".t1u15qzo700-beta7{appearance:none;background-color:var(--background-color);border:2px solid #ccc;box-sizing:border-box;color:var(--color);font-family:inherit;font-size:var(--font-size);height:100%;padding:0 6px;vertical-align:top;width:100%}.t1u15qzo700-beta7:focus{border-color:var(--selection-color);outline:none}.t1u15qzo700-beta7::placeholder{color:#999;opacity:1}";
styleInject(css_248z,{"insertAt":"top"});

const textEditor = "t1u15qzo700-beta7";
const textEditorClassname = `rdg-text-editor ${textEditor}`;
function autoFocusAndSelect(input) {
  input === null || input === void 0 ? void 0 : input.focus();
  input === null || input === void 0 ? void 0 : input.select();
}
function TextEditor({
  row,
  rowIdx,
  column,
  onRowChange,
  onClose
}) {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", {
    className: textEditorClassname,
    ref: autoFocusAndSelect,
    value: row[column.key],
    onChange: event => onRowChange({
      ...row,
      [column.key]: event.target.value
    }, rowIdx),
    onBlur: () => onClose(true)
  });
}




/***/ },

/***/ "./submodules/react-data-grid/node_modules/@babel/runtime/helpers/esm/extends.js"
/*!***************************************************************************************!*\
  !*** ./submodules/react-data-grid/node_modules/@babel/runtime/helpers/esm/extends.js ***!
  \***************************************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _extends)
/* harmony export */ });
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}


/***/ },

/***/ "./submodules/react-data-grid/node_modules/clsx/dist/clsx.m.js"
/*!*********************************************************************!*\
  !*** ./submodules/react-data-grid/node_modules/clsx/dist/clsx.m.js ***!
  \*********************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony export clsx */
function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e))for(t=0;t<e.length;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);else for(t in e)e[t]&&(n&&(n+=" "),n+=t);return n}function clsx(){for(var e,t,f=0,n="";f<arguments.length;)(e=arguments[f++])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (clsx);

/***/ }

}]);
//# sourceMappingURL=submodules_react-data-grid_lib_bundle_js.0784b9029f61c84c43a9.js.map