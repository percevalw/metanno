"use strict";
(self["webpackChunkmetanno"] = self["webpackChunkmetanno"] || []).push([["client_style_css-client_dist-globals_ts"],{

/***/ "./client/components/AnnotatedImage/index.tsx":
/*!****************************************************!*\
  !*** ./client/components/AnnotatedImage/index.tsx ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnnotatedImage: () => (/* binding */ AnnotatedImage)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_konva__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-konva */ "webpack/sharing/consume/default/react-konva/react-konva");
/* harmony import */ var react_konva__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_konva__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var use_image__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! use-image */ "webpack/sharing/consume/default/use-image/use-image");
/* harmony import */ var use_image__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(use_image__WEBPACK_IMPORTED_MODULE_3__);
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};




var AnnotatedImage = function (props) {
    var _a = __read(use_image__WEBPACK_IMPORTED_MODULE_3___default()(props.image), 1), img = _a[0];
    var groupRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    var imageRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    var containerRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    var _b = __read((0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
        width: 800,
        height: 600,
    }), 2), containerSize = _b[0], setContainerSize = _b[1];
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
        if (!containerRef.current)
            return;
        var observer = new ResizeObserver(function (entries) {
            var e_1, _a;
            try {
                for (var entries_1 = __values(entries), entries_1_1 = entries_1.next(); !entries_1_1.done; entries_1_1 = entries_1.next()) {
                    var entry = entries_1_1.value;
                    setContainerSize({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height,
                    });
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (entries_1_1 && !entries_1_1.done && (_a = entries_1.return)) _a.call(entries_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
        observer.observe(containerRef.current);
        return function () { return observer.disconnect(); };
    }, []);
    var scale = 1;
    var offsetX = 0;
    var offsetY = 0;
    if (img) {
        scale = Math.min(containerSize.width / img.width, containerSize.height / img.height);
        offsetX = (containerSize.width - img.width * scale) / 2;
        offsetY = (containerSize.height - img.height * scale) / 2;
    }
    var makeModKeys = function (event) {
        var modKeys = [];
        if (event.shiftKey)
            modKeys.push("Shift");
        if (event.ctrlKey)
            modKeys.push("Ctrl");
        if (event.altKey)
            modKeys.push("Alt");
        if (event.metaKey)
            modKeys.push("Meta");
        return modKeys;
    };
    var handleKeyPress = function (e) {
        if (props.onKeyPress) {
            props.onKeyPress(e.key, makeModKeys(e));
        }
    };
    var _c = __read((0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false), 2), isSelecting = _c[0], setIsSelecting = _c[1];
    var _d = __read((0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    }), 2), selectionRect = _d[0], setSelectionRect = _d[1];
    var selectionStartRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    var handleMouseDown = function (e) {
        var _a;
        if (e.cancelBubble || ((_a = e.evt) === null || _a === void 0 ? void 0 : _a.cancelBubble))
            return; // Prevent further events if already handled
        if (!groupRef.current)
            return;
        var pos = groupRef.current.getRelativePointerPosition();
        selectionStartRef.current = pos;
        setIsSelecting(true);
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    };
    var handleMouseMove = function (e) {
        var _a;
        if (e.cancelBubble || ((_a = e.evt) === null || _a === void 0 ? void 0 : _a.cancelBubble))
            return; // Prevent further events if already handled
        if (!isSelecting)
            return;
        if (!groupRef.current)
            return;
        var pos = groupRef.current.getRelativePointerPosition();
        var start = selectionStartRef.current;
        if (!start)
            return;
        setSelectionRect({
            x: Math.min(start.x, pos.x),
            y: Math.min(start.y, pos.y),
            width: Math.abs(pos.x - start.x),
            height: Math.abs(pos.y - start.y),
        });
    };
    var handleMouseUp = function (e) {
        var _a;
        if (e.cancelBubble || ((_a = e.evt) === null || _a === void 0 ? void 0 : _a.cancelBubble))
            return; // Prevent further events if already handled
        if (isSelecting) {
            setIsSelecting(false);
            if (props.onMouseSelect && selectionRect.width > 0 && selectionRect.height > 0) {
                var modKeys = makeModKeys(e.evt);
                // Create a shape for the selection (using 'rect' type)
                var shape = {
                    type: "rect",
                    points: [
                        selectionRect.x,
                        selectionRect.y,
                        selectionRect.width,
                        selectionRect.height,
                    ],
                };
                props.onMouseSelect(modKeys, [shape]);
                e.evt.cancelBubble = true; // Prevent further onClick from being triggered
                e.cancelBubble = true; // Prevent onClick from being triggered
            }
            setSelectionRect({ x: 0, y: 0, width: 0, height: 0 });
        }
    };
    var handleClick = function (e, index) {
        var _a;
        if (e.cancelBubble || ((_a = e.evt) === null || _a === void 0 ? void 0 : _a.cancelBubble))
            return; // Prevent further events if already handled
        if (props.onClick) {
            props.onClick(index === undefined ? null : index, makeModKeys(e));
            e.evt.cancelBubble = true; // Prevent further onClick from being triggered
            e.cancelBubble = true; // Prevent further onClick from being triggered
        }
    };
    var handleAnnotationMouseEnter = function (e, index) {
        var _a;
        if (e.cancelBubble || ((_a = e.evt) === null || _a === void 0 ? void 0 : _a.cancelBubble))
            return; // Prevent further events if already handled
        if (props.onMouseEnterShape) {
            props.onMouseEnterShape(index, makeModKeys(e));
        }
    };
    var handleAnnotationMouseLeave = function (e, index) {
        var _a;
        if (e.cancelBubble || ((_a = e.evt) === null || _a === void 0 ? void 0 : _a.cancelBubble))
            return; // Prevent further events if already handled
        if (props.onMouseLeaveShape) {
            props.onMouseLeaveShape(index, makeModKeys(e));
        }
    };
    var renderAnnotation = function (annotation, index) {
        var style = __assign({ strokeColor: "red", strokeWidth: 2, fillColor: "transparent", opacity: 1.0, shape: "rect", align: "center", verticalAlign: "middle", fontSize: 14 }, ((typeof annotation.style !== "string"
            ? annotation.style
            : props.annotationStyles[annotation.style]) || {}));
        // Render the annotation shape
        var shapeComponent = null;
        var bbox;
        if (style.shape === "polygon") {
            shapeComponent = ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Line, { points: annotation.points, closed: true, stroke: style.strokeColor, strokeWidth: style.strokeWidth, fill: style.fillColor, opacity: style.opacity, onClick: function (e) { return handleClick(e, index); }, onMouseEnter: function (e) { return handleAnnotationMouseEnter(e, index); }, onMouseLeave: function (e) { return handleAnnotationMouseLeave(e, index); } }));
            var pts = annotation.points;
            var xs = pts.filter(function (_, i) { return i % 2 === 0; });
            var ys = pts.filter(function (_, i) { return i % 2 === 1; });
            bbox = {
                x: Math.min.apply(Math, __spreadArray([], __read(xs), false)),
                y: Math.min.apply(Math, __spreadArray([], __read(ys), false)),
                width: Math.max.apply(Math, __spreadArray([], __read(xs), false)) - Math.min.apply(Math, __spreadArray([], __read(xs), false)),
                height: Math.max.apply(Math, __spreadArray([], __read(ys), false)) - Math.min.apply(Math, __spreadArray([], __read(ys), false)),
            };
        }
        else {
            // Fallback to rectangle
            shapeComponent = ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Rect, { x: annotation.points[0], y: annotation.points[1], width: annotation.points[2], height: annotation.points[3], stroke: style.strokeColor, strokeWidth: style.strokeWidth, fill: style.fillColor, opacity: style.opacity, onClick: function (e) { return handleClick(e, index); }, onMouseEnter: function (e) { return handleAnnotationMouseEnter(e, index); }, onMouseLeave: function (e) { return handleAnnotationMouseLeave(e, index); } }));
            bbox = {
                x: annotation.points[0],
                y: annotation.points[1],
                width: annotation.points[2],
                height: annotation.points[3],
            };
        }
        var labelComponent = null;
        if (annotation.label) {
            var padding = 5;
            labelComponent = ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Text, { text: annotation.label, fontSize: 14, x: bbox.x + padding, y: bbox.y + padding, width: bbox.width - 2 * padding, height: bbox.height - 2 * padding, fill: style.textColor || "black", align: style.align, verticalAlign: style.verticalAlign, listening: false }));
        }
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Group, { children: [shapeComponent, labelComponent] }, "annotation-".concat(index)));
    };
    var renderSelectionShape = function (shape, index) {
        if (shape.type === "rect") {
            return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Rect, { x: shape.points[0], y: shape.points[1], width: shape.points[2], height: shape.points[3], fill: "#89BCFA99", stroke: "#89BCFA", strokeWidth: 1 }, "selection-".concat(index)));
        }
        else if (shape.type === "polygon") {
            return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Line, { points: shape.points, closed: true, stroke: "blue", strokeWidth: 1, dash: [4, 4] }, "selection-".concat(index)));
        }
        return null;
    };
    return (
    // A focusable container so that key events are captured
    (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { tabIndex: 0, onKeyDown: handleKeyPress, style: __assign({ width: "100%", height: "100%", overflow: "hidden", outline: "none" }, props.style), ref: containerRef, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Stage, { width: containerSize.width, height: containerSize.height, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Layer, { x: offsetX, y: offsetY, scaleX: scale, scaleY: scale, onClick: handleClick, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Group, { ref: groupRef, onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, children: [img && (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Image, { image: img, ref: imageRef }), props.annotations.map(function (annotation, index) {
                            return renderAnnotation(annotation, index);
                        }), props.mouseSelection.map(function (shape, index) {
                            return renderSelectionShape(shape, index);
                        }), isSelecting && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_konva__WEBPACK_IMPORTED_MODULE_2__.Rect, { x: selectionRect.x, y: selectionRect.y, width: selectionRect.width, height: selectionRect.height, fill: "#89BCFA99", stroke: "#89BCFA", strokeWidth: 1 }))] }) }) }) }));
};
AnnotatedImage.defaultProps = {
    annotations: [],
    mouseSelection: [],
    annotationStyles: {},
};


/***/ }),

/***/ "./client/components/AnnotatedText/index.tsx":
/*!***************************************************!*\
  !*** ./client/components/AnnotatedText/index.tsx ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnnotatedText: () => (/* binding */ AnnotatedText)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _tokenize__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tokenize */ "./client/components/AnnotatedText/tokenize.tsx");
/* harmony import */ var color__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! color */ "webpack/sharing/consume/default/color/color");
/* harmony import */ var color__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(color__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils */ "./client/utils/index.ts");
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./style.css */ "./client/components/AnnotatedText/style.css");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};






var toLuminance = function (color, y) {
    // This is mostly used to adapt to light/dark mode
    if (y === void 0) { y = 0.6; }
    var _a = __read(__spreadArray(__spreadArray([], __read(color.rgb().color), false), [color.alpha], false), 4), r = _a[0], g = _a[1], b = _a[2], a = _a[3];
    // let y = ((0.299 * r) + ( 0.587 * g) + ( 0.114 * b)) / 255;
    var i = ((0.596 * r) + (-0.275 * g) + (-0.321 * b)) / 255;
    var q = ((0.212 * r) + (-0.523 * g) + (0.311 * b)) / 255;
    r = (y + (0.956 * i) + (0.621 * q)) * 255;
    g = (y + (-0.272 * i) + (-0.647 * q)) * 255;
    b = (y + (-1.105 * i) + (1.702 * q)) * 255;
    // bounds-checking
    if (r < 0) {
        r = 0;
    }
    else if (r > 255) {
        r = 255;
    }
    ;
    if (g < 0) {
        g = 0;
    }
    else if (g > 255) {
        g = 255;
    }
    ;
    if (b < 0) {
        b = 0;
    }
    else if (b > 255) {
        b = 255;
    }
    ;
    return color__WEBPACK_IMPORTED_MODULE_3___default().rgb(r, g, b).alpha(a);
};
var processStyle = function (_a) {
    var color = _a.color, shape = _a.shape, autoNestingLayout = _a.autoNestingLayout, labelPosition = _a.labelPosition, rest = __rest(_a, ["color", "shape", "autoNestingLayout", "labelPosition"]);
    var colorObject, strongerColor;
    try {
        colorObject = color__WEBPACK_IMPORTED_MODULE_3___default()(color).alpha(0.8);
    }
    catch (e) {
        colorObject = color__WEBPACK_IMPORTED_MODULE_3___default()('lightgray');
    }
    var backgroundColor, textColor;
    if (colorObject.isLight()) {
        textColor = '#000000de';
        backgroundColor = colorObject.lighten(0.02).toString();
        strongerColor = colorObject.darken(0.05).toString();
    }
    else {
        textColor = '#ffffffde';
        backgroundColor = colorObject.darken(0.02).toString();
        strongerColor = colorObject.lighten(0.05).toString();
    }
    return {
        base: __assign({ 'borderColor': color, 'backgroundColor': shape === 'underline' ? 'transparent' : backgroundColor, 'color': shape === 'underline' ? undefined : textColor }, rest),
        highlighted: __assign({ 'borderColor': strongerColor, 'backgroundColor': backgroundColor, 'color': textColor }, rest),
        autoNestingLayout: autoNestingLayout,
        labelPosition: labelPosition,
        shape: shape,
    };
};
// Create your Styles. Remember, since React-JSS uses the default preset,
// most plugins are available without further configuration needed.
var Token = react__WEBPACK_IMPORTED_MODULE_1___default().memo(function (_a) {
    var _b, _c, _d, _e;
    var text = _a.text, begin = _a.begin, end = _a.end, isFirstTokenOfChunk = _a.isFirstTokenOfChunk, isLastTokenOfChunk = _a.isLastTokenOfChunk, tokenIndexInChunk = _a.tokenIndexInChunk, token_annotations = _a.token_annotations, refs = _a.refs, styles = _a.styles, mouseElements = _a.mouseElements;
    var lastAnnotation = token_annotations[0];
    var labelIdx = { box: 0, underline: 0 };
    var nLabels = {
        box: 0,
        underline: 0,
    };
    var shape;
    var zIndices = {};
    token_annotations.forEach(function (a) {
        var _a;
        if (a.mouseSelected)
            return;
        if (a.highlighted > lastAnnotation.highlighted || a.highlighted === lastAnnotation.highlighted && a.depth > lastAnnotation.depth) {
            lastAnnotation = a;
        }
        if (a.isFirstTokenOfSpan && a.label)
            if (((_a = styles[a.style]) === null || _a === void 0 ? void 0 : _a.shape) !== 'underline') {
                nLabels.box++;
            }
            else {
                nLabels.underline++;
            }
        zIndices[a.id] = a.zIndex;
    });
    var annotations = [];
    var verticalOffset = 0;
    var _loop_1 = function (annotation_i) {
        var annotation = token_annotations[annotation_i];
        var isUnderline = ((_b = styles === null || styles === void 0 ? void 0 : styles[annotation.style]) === null || _b === void 0 ? void 0 : _b.shape) === 'underline';
        if (annotation.mouseSelected) {
            annotations.push((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "mention_token mouse_selected" }, "mouse-selection"));
        }
        else {
            verticalOffset = annotation.depth * 3 - 2;
            annotations.push((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { id: "span-".concat(begin, "-").concat(end), 
                // @ts-ignore
                span_key: annotation.id, ref: function (element) {
                    if (element) {
                        mouseElements.current["".concat(annotation.id, "-span-").concat(annotation_i, "-").concat(tokenIndexInChunk)] = element;
                    }
                    else {
                        delete mouseElements.current["".concat(annotation.id, "-span-").concat(annotation_i, "-").concat(tokenIndexInChunk)];
                    }
                    if (isFirstTokenOfChunk && refs[annotation.id]) {
                        refs[annotation.id].current = element;
                    }
                }, className: "mention_token mention_".concat(isUnderline && !annotation.highlighted ? 'underline' : 'box', "\n                               ").concat(annotation.highlighted ? 'highlighted' : '', "\n                               ").concat(annotation.selected ? 'selected' : '', "\n                               ").concat(isFirstTokenOfChunk && !annotation.openleft ? 'closedleft' : "", "\n                               ").concat(isLastTokenOfChunk && !annotation.openright ? 'closedright' : ""), style: __assign({ top: (isUnderline && !annotation.highlighted) ? undefined : verticalOffset, bottom: verticalOffset, zIndex: annotation.zIndex + 2 + (annotation.highlighted ? 50 : 0) }, (_c = styles === null || styles === void 0 ? void 0 : styles[annotation.style]) === null || _c === void 0 ? void 0 : _c[annotation.highlighted ? 'highlighted' : 'base']) }, "annotation-".concat(annotation_i)));
        }
    };
    for (var annotation_i = 0; annotation_i < token_annotations.length; annotation_i++) {
        _loop_1(annotation_i);
    }
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", { className: "text-chunk", 
        // @ts-ignore
        span_begin: begin, children: [annotations, (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-chunk-content", 
                // @ts-ignore
                style: { color: (_e = (_d = styles === null || styles === void 0 ? void 0 : styles[lastAnnotation === null || lastAnnotation === void 0 ? void 0 : lastAnnotation.style]) === null || _d === void 0 ? void 0 : _d[(lastAnnotation === null || lastAnnotation === void 0 ? void 0 : lastAnnotation.highlighted) ? 'highlighted' : 'base']) === null || _e === void 0 ? void 0 : _e.color }, children: text }), isFirstTokenOfChunk && token_annotations.map(function (annotation, annotation_i) {
                var _a;
                var _b, _c, _d;
                if (annotation.isFirstTokenOfSpan && annotation.label) {
                    shape = ((_b = styles[annotation.style]) === null || _b === void 0 ? void 0 : _b.shape) || 'box';
                    var verticalOffset_1 = annotation.depth * 2.5 - 2;
                    var isUnderline = shape === 'underline';
                    labelIdx[shape] += 1;
                    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "label ".concat((annotation.highlighted || annotation.selected) ? 'highlighted' : ''), ref: function (element) {
                            if (element) {
                                mouseElements.current["".concat(annotation.id, "-label-").concat(annotation_i)] = element;
                            }
                            else {
                                delete mouseElements.current["".concat(annotation.id, "-label-").concat(annotation_i)];
                            }
                        }, 
                        // @ts-ignore
                        span_key: annotation.id, style: (_a = {
                                borderColor: (_d = (_c = styles === null || styles === void 0 ? void 0 : styles[annotation === null || annotation === void 0 ? void 0 : annotation.style]) === null || _c === void 0 ? void 0 : _c[(annotation === null || annotation === void 0 ? void 0 : annotation.highlighted) ? 'highlighted' : 'base']) === null || _d === void 0 ? void 0 : _d.borderColor
                            },
                            _a[isUnderline ? 'bottom' : 'top'] = -9 + verticalOffset_1,
                            _a.left = (nLabels[shape] - labelIdx[shape]) * 6 + (shape === 'box' ? -1 : 2),
                            // Labels are above every text entity overlay, except when this entity is highlighted
                            _a.zIndex = 50 + annotation.zIndex + (annotation.highlighted ? 50 : 0),
                            _a), children: annotation.label.toUpperCase() }, annotation.id));
                }
            })] }));
});
var Line = react__WEBPACK_IMPORTED_MODULE_1___default().memo(function (_a) {
    var index = _a.index, styles = _a.styles, tokens = _a.tokens, spansRef = _a.spansRef, handleMouseEnterSpan = _a.handleMouseEnterSpan, handleMouseLeaveSpan = _a.handleMouseLeaveSpan, handleClickSpan = _a.handleClickSpan, divRef = _a.divRef;
    var hoveredKeys = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(new Set());
    var elements = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)({});
    var onMouseMove = function (e) {
        if (!elements || !hoveredKeys)
            return;
        var hitElements = Object.values(elements.current).map(function (element) {
            if (!element)
                return;
            var rect = element.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                (e.clientY >= rect.top && e.clientY <= rect.bottom)) {
                return element; //.getAttribute("span_key");
            }
        }).filter(function (e) { return !!e; });
        var newSet = new Set(hitElements.map(function (e) { return e.getAttribute("span_key"); }));
        // @ts-ignore
        hoveredKeys.current.forEach(function (x) { return !newSet.has(x) && handleMouseLeaveSpan(e, x); });
        // @ts-ignore
        newSet.forEach(function (x) { return !hoveredKeys.current.has(x) && handleMouseEnterSpan(e, x); });
        hoveredKeys.current = newSet;
    };
    /*onMouseEnter={(event) => token_annotations.map(annotation => handleMouseEnterSpan(event, annotation.id))}*/
    var onMouseLeave = function (event) {
        if (!hoveredKeys)
            return;
        // @ts-ignore
        hoveredKeys.current.forEach(function (x) { return handleMouseLeaveSpan(event, x); });
        hoveredKeys.current.clear();
    };
    var onMouseUp = function (e) {
        var hitElements = Object.values(elements.current).map(function (element) {
            if (!element)
                return;
            var rect = element.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                (e.clientY >= rect.top && e.clientY <= rect.bottom)
            //&& (e.className.includes("underline")
            //    ? (e.clientY <= rect.bottom)
            //    : (e.clientY >= rect.top && e.clientY <= rect.bottom))
            ) {
                return element; //.getAttribute("span_key");
            }
        }).filter(function (e) { return !!e; });
        if (hitElements.length > 1) {
            hitElements = hitElements.filter(function (element) {
                var rect = element.getBoundingClientRect();
                return element.className.includes("underline")
                    ? (e.clientY <= rect.bottom)
                    : (e.clientY >= rect.top && e.clientY <= rect.bottom);
            }).sort(function (a, b) { return Number.parseInt(a.style.zIndex) - Number.parseInt(b.style.zIndex); });
        }
        if (hitElements.length > 0) {
            handleClickSpan(e, hitElements[0].getAttribute("span_key"));
        }
    };
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { ref: divRef, className: "line", onMouseMove: onMouseMove, onMouseLeave: onMouseLeave, onMouseUp: onMouseUp, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "line-number", children: index }, "line-number"), tokens.map(function (token) { return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Token, __assign({}, token, { refs: spansRef, styles: styles, mouseElements: elements })); })] }));
});
var setOnMapping = function (mapping, key, value) {
    if (mapping instanceof Map) {
        mapping.set(key, value);
    }
    else {
        mapping[key] = value;
    }
};
/**
 * A React component for rendering text with annotations and spans.
 *
 * @param {TextData} props.text The text content to display.
 * @param {TextAnnotation[]} props.spans An array of text annotations.
 * @param {TextAnnotationStyle} props.annotationStyles Styles for annotations.
 * @param {Function} [props.onMouseSelect] Callback for mouse selection events.
 * @param {Function} [props.onClickSpan] Callback for click events on spans.
 * @param {Function} [props.onMouseEnterSpan] Callback for mouse enter events on spans.
 * @param {Function} [props.onMouseLeaveSpan] Callback for mouse leave events on spans.
 * @param {CSSProperties} [props.style] Custom styles for the component.
 */
var AnnotatedText = /** @class */ (function (_super) {
    __extends(AnnotatedText, _super);
    function AnnotatedText(props) {
        var _this = _super.call(this, props) || this;
        _this.handleKeyUp = function (event) {
            var _a, _b;
            // if (event.metaKey || event.key === 'Meta' || event.shiftKey || event.key === 'Shift') {
            //     return;
            // }
            var key = event.key;
            if (key === 'Spacebar' || key === " ") {
                key = " ";
            }
            var spans = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getDocumentSelectedRanges)();
            (_b = (_a = _this.props).onKeyPress) === null || _b === void 0 ? void 0 : _b.call(_a, key, __spreadArray(__spreadArray([], __read(_this.props.mouseSelection), false), __read(spans), false), (0,_utils__WEBPACK_IMPORTED_MODULE_4__.makeModKeys)(event));
        };
        _this.handleKeyDown = function (event) {
            if (event.key === 'Spacebar' || event.key === " ") {
                event.preventDefault();
            }
        };
        _this.handleMouseUp = function (event) {
            var _a, _b, _c, _d;
            if (event.type === "mouseup") {
                var spans = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getDocumentSelectedRanges)();
                window.getSelection().removeAllRanges();
                if (spans.length > 0) {
                    //this.props.onMouseSelect([...this.props.mouse_selection, ...spans]);
                    (_b = (_a = _this.props).onMouseSelect) === null || _b === void 0 ? void 0 : _b.call(_a, spans, (0,_utils__WEBPACK_IMPORTED_MODULE_4__.makeModKeys)(event));
                }
                else {
                    (_d = (_c = _this.props).onMouseSelect) === null || _d === void 0 ? void 0 : _d.call(_c, [], (0,_utils__WEBPACK_IMPORTED_MODULE_4__.makeModKeys)(event));
                }
            }
        };
        _this.handleClickSpan = function (event, span_id) {
            var _a, _b;
            (_b = (_a = _this.props).onClickSpan) === null || _b === void 0 ? void 0 : _b.call(_a, span_id, (0,_utils__WEBPACK_IMPORTED_MODULE_4__.makeModKeys)(event));
            /*event.stopPropagation();
            event.preventDefault();*/
        };
        _this.handleMouseEnterSpan = function (event, span_id) {
            var _a, _b;
            (_b = (_a = _this.props).onMouseEnterSpan) === null || _b === void 0 ? void 0 : _b.call(_a, span_id, (0,_utils__WEBPACK_IMPORTED_MODULE_4__.makeModKeys)(event));
        };
        _this.handleMouseLeaveSpan = function (event, span_id) {
            var _a, _b;
            (_b = (_a = _this.props).onMouseLeaveSpan) === null || _b === void 0 ? void 0 : _b.call(_a, span_id, (0,_utils__WEBPACK_IMPORTED_MODULE_4__.makeModKeys)(event));
        };
        if (props.actions) {
            // Problem: props.actions may be an object OR a mapping, I don't know when it is which
            setOnMapping(props.actions, "scroll_to_line", function (line, behavior) {
                var _a;
                if (behavior === void 0) { behavior = 'smooth'; }
                if (line >= 0 && line < _this.linesRef.length && _this.linesRef[line]) {
                    (_a = _this.linesRef[line].current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: behavior, block: 'center' });
                }
            });
            setOnMapping(props.actions, "scroll_to_span", function (span_id, behavior) {
                if (behavior === void 0) { behavior = 'smooth'; }
                setTimeout(function () {
                    var _a;
                    if (_this.spansRef[span_id]) {
                        (_a = _this.spansRef[span_id].current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: behavior, block: 'center' });
                    }
                }, 10);
            });
            setOnMapping(props.actions, "clear_current_mouse_selection", function () {
                window.getSelection().removeAllRanges();
            });
        }
        _this.linesRef = [];
        _this.spansRef = {};
        _this.containerRef = react__WEBPACK_IMPORTED_MODULE_1___default().createRef();
        _this.previousSelectedSpans = "";
        _this.tokenize = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.cachedReconcile)(_tokenize__WEBPACK_IMPORTED_MODULE_2__["default"]);
        _this.processStyles = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.memoize)(function (styles) { return Object.assign.apply(Object, __spreadArray([{}], __read(Object.keys(styles).map(function (key) {
            var _a;
            return (_a = {}, _a[key] = processStyle(styles[key]), _a);
        })), false)); });
        return _this;
    }
    AnnotatedText.prototype.render = function () {
        var _this = this;
        var styles = this.processStyles(this.props.annotationStyles);
        var text = this.props.text || "";
        var newSelectedSpans = JSON.stringify(this.props.spans.filter(function (span) { return span.selected; }).map(function (span) { return span.id; }));
        if (newSelectedSpans != this.previousSelectedSpans) {
            document.documentElement.style.setProperty("--blink-animation", '');
            setTimeout(function () {
                document.documentElement.style.setProperty("--blink-animation", 'blink .5s step-end infinite alternate');
            }, 1);
            this.previousSelectedSpans = newSelectedSpans;
        }
        var _a = this.tokenize(__spreadArray(__spreadArray([], __read(this.props.mouseSelection.map(function (span) { return (__assign(__assign({}, span), { 'mouseSelected': true })); })), false), __read(this.props.spans), false), text, styles), lines = _a.lines, ids = _a.ids;
        // Define the right number of references
        for (var line_i = this.linesRef.length; line_i < lines.length; line_i++) {
            this.linesRef.push(react__WEBPACK_IMPORTED_MODULE_1___default().createRef());
        }
        this.linesRef = this.linesRef.slice(0, lines.length);
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__.replaceObject)(this.spansRef, Object.fromEntries(ids.map(function (id) {
            return [id, _this.spansRef[id] || react__WEBPACK_IMPORTED_MODULE_1___default().createRef()];
        })));
        // Return jsx elements
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "metanno-text-view", ref: this.containerRef, onMouseUp: this.handleMouseUp, onKeyDown: this.handleKeyDown, onKeyUp: this.handleKeyUp, tabIndex: 0, style: this.props.style, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text", children: lines.map(function (tokens, lineIndex) {
                    return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Line, { divRef: _this.linesRef[lineIndex], spansRef: _this.spansRef, index: lineIndex, tokens: tokens, styles: styles, handleMouseEnterSpan: _this.handleMouseEnterSpan, handleMouseLeaveSpan: _this.handleMouseLeaveSpan, handleClickSpan: _this.handleClickSpan }, lineIndex);
                }) }) }));
    };
    AnnotatedText.defaultProps = {
        spans: [],
        mouseSelection: [],
        text: "",
        annotationStyles: {},
    };
    return AnnotatedText;
}((react__WEBPACK_IMPORTED_MODULE_1___default().Component)));



/***/ }),

/***/ "./client/components/AnnotatedText/style.css":
/*!***************************************************!*\
  !*** ./client/components/AnnotatedText/style.css ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./style.css */ "./node_modules/css-loader/dist/cjs.js!./client/components/AnnotatedText/style.css");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./client/components/AnnotatedText/tokenize.tsx":
/*!******************************************************!*\
  !*** ./client/components/AnnotatedText/tokenize.tsx ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ tokenize)
/* harmony export */ });
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
function chunkText(spans, text) {
    // Find the minimum text split indices, ie the entities boundaries + split each new chunk into tokens
    var indices = [];
    for (var span_i = 0; span_i < spans.length; span_i++) {
        var begin_1 = spans[span_i].begin;
        var end_1 = spans[span_i].end;
        indices.push(begin_1, end_1);
    }
    indices.push(0, text.length);
    indices = __spreadArray([], __read(new Set(indices)), false).sort(function (a, b) { return a - b; });
    var text_chunks = [];
    var begin, end, text_slice;
    for (var indice_i = 1; indice_i < indices.length; indice_i++) {
        begin = indices[indice_i - 1];
        end = indices[indice_i];
        text_slice = text.slice(begin, end);
        text_chunks.push({
            begin: indices[indice_i - 1],
            end: indices[indice_i],
            label: null,
            token_annotations: [],
            text: text_slice,
        });
    }
    return text_chunks;
}
/**
 * Compute the layout properties of each token depending on the spans that contain it
 * To compute the depth (annotation top-bottom offsets) of box and underline annotations,
 * we iterate over spans (left to right) and find out which tokens are contained within each span.
 * For each of these tokens, we take a depth that has not been assigned to another annotation
 * and propagate it to the tokens of the span.
 *
 * To obtain underline depths, we have to reverse those depths (-1, -2, ... instead of 1, 2, 3)
 * To know which value to substract (it is not just multiplying by -1), we must cluster underlined
 * tokens together and detect the biggest depth.
 *
 * @param text_chunks
 * @param spans
 * @param styles
 */
function styleTextChunks_(text_chunks, spans, styles, outset) {
    if (outset === void 0) { outset = true; }
    var isNot = function (filled) { return !filled; };
    var outsetCluster = new Set();
    var rightMostOffset = 0;
    var adjustDepths = function () {
        var maxDepth = Math.max.apply(Math, __spreadArray([], __read(Array.from(outsetCluster).map(function (text_chunk_i) {
            return Math.max.apply(Math, __spreadArray([], __read(text_chunks[text_chunk_i].token_annotations
                .filter(function (annotation) { return !annotation.mouseSelected; })
                .map(function (annotation) { return annotation.depth; })), false)) || 0;
        })), false)) + 1;
        var offsetDepth = Math.floor(maxDepth / 2);
        outsetCluster.forEach(function (text_chunk_i) {
            text_chunks[text_chunk_i].token_annotations.forEach(function (annotation) {
                var _a;
                if (outset || ((_a = styles === null || styles === void 0 ? void 0 : styles[annotation.style]) === null || _a === void 0 ? void 0 : _a.shape) === "underline") {
                    annotation.depth = annotation.depth - offsetDepth;
                }
            });
        });
    };
    spans.forEach(function (_a, span_i) {
        var e_1, _b;
        var _c, _d, _e, _f;
        var begin = _a.begin, end = _a.end, label = _a.label, style = _a.style, rest = __rest(_a, ["begin", "end", "label", "style"]);
        style = style || label;
        var newDepth = null, newZIndex = null;
        if (!rest.mouseSelected) {
            if (begin >= rightMostOffset) {
                adjustDepths();
                outsetCluster.clear();
                rightMostOffset = end;
            }
            else if (rightMostOffset < end) {
                rightMostOffset = end;
            }
        }
        for (var text_chunk_i = 0; text_chunk_i < text_chunks.length; text_chunk_i++) {
            if (text_chunks[text_chunk_i].begin < end &&
                begin < text_chunks[text_chunk_i].end) {
                outsetCluster.add(text_chunk_i);
                if (text_chunks[text_chunk_i].begin === begin) {
                    text_chunks[text_chunk_i].label = label;
                }
                if (newDepth === null &&
                    !rest.mouseSelected &&
                    ((_c = styles[style]) === null || _c === void 0 ? void 0 : _c.autoNestingLayout) !== false) {
                    var missingInsetDepths = [undefined];
                    var missingOutsetDepths = [undefined];
                    var missingZIndices = [undefined];
                    try {
                        for (var _g = (e_1 = void 0, __values(text_chunks[text_chunk_i].token_annotations)), _h = _g.next(); !_h.done; _h = _g.next()) {
                            var _j = _h.value, depth = _j.depth, zIndex = _j.zIndex, mouseSelected = _j.mouseSelected, tokenStyle = _j.style;
                            if (!mouseSelected) {
                                (((_d = styles[tokenStyle]) === null || _d === void 0 ? void 0 : _d.shape) === "underline"
                                    ? missingOutsetDepths
                                    : missingInsetDepths)[depth] = true;
                                missingZIndices[zIndex] = true;
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    newDepth = (((_e = styles[style]) === null || _e === void 0 ? void 0 : _e.shape) === "underline"
                        ? missingOutsetDepths
                        : missingInsetDepths).findIndex(isNot);
                    if (newDepth === -1) {
                        newDepth = (((_f = styles[style]) === null || _f === void 0 ? void 0 : _f.shape) === "underline"
                            ? missingOutsetDepths
                            : missingInsetDepths).length;
                    }
                    newZIndex = missingZIndices.findIndex(isNot);
                    if (newZIndex === -1) {
                        newZIndex = missingZIndices.length;
                    }
                }
                var annotation = __assign({ depth: newDepth, openleft: text_chunks[text_chunk_i].begin !== begin, openright: text_chunks[text_chunk_i].end !== end, label: label, isFirstTokenOfSpan: text_chunks[text_chunk_i].begin === begin, style: style, zIndex: newZIndex }, rest);
                text_chunks[text_chunk_i].token_annotations.unshift(annotation);
            }
        }
    });
    adjustDepths();
}
/**
 * Split text chunks into multiple lines, each composed of a subset of the total text chunks
 * @param text_chunks: text chunks obtained by the `segment` function
 */
function tokenizeTextChunks(text_chunks) {
    var current_line = [];
    var all_lines = [];
    var tokens = [];
    for (var i = 0; i < text_chunks.length; i++) {
        var text_chunk = text_chunks[i];
        var begin = text_chunk.begin;
        var token_annotations = text_chunk.token_annotations;
        tokens =
            text_chunk.text.length > 0 // && token_annotations.length > 0
                ? text_chunk.text
                    .match(/\n|[^ \n]+|[ ]+/g)
                    .filter(function (text) { return text.length > 0; })
                : [text_chunk.text];
        var offset_in_text_chunk = 0;
        for (var token_i = 0; token_i < tokens.length; token_i++) {
            var span_begin = begin + offset_in_text_chunk;
            var span_end = begin + offset_in_text_chunk + tokens[token_i].length;
            if (tokens[token_i] === "\n") {
                all_lines.push(current_line);
                current_line = [];
            }
            else {
                current_line.push({
                    text: tokens[token_i],
                    key: "".concat(span_begin, "-").concat(span_end),
                    begin: span_begin,
                    end: span_end,
                    tokenIndexInChunk: token_i,
                    token_annotations: token_annotations,
                    isFirstTokenOfChunk: token_i === 0,
                    isLastTokenOfChunk: token_i === tokens.length - 1,
                });
            }
            offset_in_text_chunk += tokens[token_i].length;
        }
    }
    if (current_line.length > 0 ||
        (tokens.length && tokens[tokens.length - 1] === "\n")) {
        all_lines.push(current_line);
    }
    return all_lines;
}
function tokenize(spans, text, styles) {
    // Sort the original spans to display by:
    // 1. mouseSelected spans first
    // 2. begin (left to right)
    // 3. end (right to left)
    // ie leftmost biggest spans first
    spans = spans
        .sort(function (_a, _b) {
        var begin_a = _a.begin, end_a = _a.end, mouseSelected_a = _a.mouseSelected;
        var begin_b = _b.begin, end_b = _b.end, mouseSelected_b = _b.mouseSelected;
        return mouseSelected_a === mouseSelected_b
            ? begin_a !== begin_b
                ? begin_a - begin_b
                : end_b - end_a
            : mouseSelected_a
                ? -1
                : 1;
    })
        .map(function (span) { return (__assign(__assign({}, span), { text: text.slice(span.begin, span.end) })); });
    var text_chunks = chunkText(spans, text);
    styleTextChunks_(text_chunks, spans, styles);
    var ids = spans.map(function (span) { return span.id; });
    var linesOfTokens = tokenizeTextChunks(text_chunks);
    return { lines: linesOfTokens, ids: ids }; //.filter(({ token_annotations }) => token_annotations.length > 0);
}


/***/ }),

/***/ "./client/components/BooleanInput/index.tsx":
/*!**************************************************!*\
  !*** ./client/components/BooleanInput/index.tsx ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ BooleanInput)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./style.css */ "./client/components/BooleanInput/style.css");



var checkboxLabel = "c1w6d5eo700-beta7";
var checkboxLabelClassname = "rdg-checkbox-label ".concat(checkboxLabel);
var checkboxInput = "c1h7iz8d700-beta7";
var checkboxInputClassname = "rdg-checkbox-input ".concat(checkboxInput);
var checkbox = "cc79ydj700-beta7";
var checkboxClassname = "rdg-checkbox ".concat(checkbox);
var checkboxLabelDisabled = "c1e5jt0b700-beta7";
var checkboxLabelDisabledClassname = "rdg-checkbox-label-disabled ".concat(checkboxLabelDisabled);
var useLayoutEffect = typeof window === 'undefined' ? react__WEBPACK_IMPORTED_MODULE_1__.useEffect : react__WEBPACK_IMPORTED_MODULE_1__.useLayoutEffect;
function useFocusRef(isSelected) {
    var ref = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    useLayoutEffect(function () {
        var _ref$current;
        if (!isSelected)
            return;
        (_ref$current = ref.current) == null ? void 0 : _ref$current.focus({
            preventScroll: true
        });
    }, [isSelected]);
    return {
        ref: ref,
        tabIndex: isSelected ? 0 : -1
    };
}
function BooleanInput(_a) {
    var value = _a.value, isCellSelected = _a.isCellSelected, disabled = _a.disabled, onClick = _a.onClick, onChange = _a.onChange, ariaLabel = _a["aria-label"], ariaLabelledBy = _a["aria-labelledby"];
    var _b = useFocusRef(isCellSelected), ref = _b.ref, tabIndex = _b.tabIndex;
    function handleChange(e) {
        onChange(e.target.checked, e.nativeEvent.shiftKey);
    }
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: 'rdg-checkbox-container', children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "".concat(checkboxLabelClassname, " ").concat(disabled ? checkboxLabelDisabledClassname : ''), children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ref: ref, type: "checkbox", tabIndex: tabIndex, className: checkboxInputClassname, disabled: disabled, checked: value, onChange: handleChange }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: checkboxClassname })] }) }));
}


/***/ }),

/***/ "./client/components/BooleanInput/style.css":
/*!**************************************************!*\
  !*** ./client/components/BooleanInput/style.css ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./style.css */ "./node_modules/css-loader/dist/cjs.js!./client/components/BooleanInput/style.css");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./client/components/DraggableHeaderRenderer/index.tsx":
/*!*************************************************************!*\
  !*** ./client/components/DraggableHeaderRenderer/index.tsx ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony export useFocusRef */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_dnd__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-dnd */ "webpack/sharing/consume/default/react-dnd/react-dnd");
/* harmony import */ var react_dnd__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_dnd__WEBPACK_IMPORTED_MODULE_2__);
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};



function useCombinedRefs() {
    var refs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        refs[_i] = arguments[_i];
    }
    return (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (handle) {
        var e_1, _a;
        try {
            for (var refs_1 = __values(refs), refs_1_1 = refs_1.next(); !refs_1_1.done; refs_1_1 = refs_1.next()) {
                var ref = refs_1_1.value;
                if (typeof ref === 'function') {
                    ref(handle);
                }
                else if (ref !== null && 'current' in ref) {
                    ref.current = handle;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (refs_1_1 && !refs_1_1.done && (_a = refs_1.return)) _a.call(refs_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }, refs);
}
function useFocusRef(isSelected) {
    var ref = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useLayoutEffect)(function () {
        var _a;
        if (!isSelected)
            return;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus({ preventScroll: true });
    }, [isSelected]);
    return {
        ref: ref,
        tabIndex: isSelected ? 0 : -1
    };
}
function HeaderRenderer(_a) {
    var isCellSelected = _a.isCellSelected, column = _a.column, children = _a.children, onColumnsReorder = _a.onColumnsReorder;
    var _b = useFocusRef(isCellSelected), ref = _b.ref, tabIndex = _b.tabIndex;
    var _c = __read((0,react_dnd__WEBPACK_IMPORTED_MODULE_2__.useDrag)({
        type: 'METANNO_COLUMN_DRAG',
        item: { key: column.key },
        collect: function (monitor) { return ({
            isDragging: !!monitor.isDragging()
        }); }
    }), 2), isDragging = _c[0].isDragging, drag = _c[1];
    var _d = __read((0,react_dnd__WEBPACK_IMPORTED_MODULE_2__.useDrop)({
        accept: 'METANNO_COLUMN_DRAG',
        // @ts-ignore
        drop: function (_a) {
            var key = _a.key;
            onColumnsReorder(key, column.key);
        },
        collect: function (monitor) { return ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop()
        }); }
    }), 2), isOver = _d[0].isOver, drop = _d[1];
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { ref: useCombinedRefs(drag, drop), style: {
            opacity: isDragging ? 0.5 : 1,
            backgroundColor: isOver ? '#ececec' : 'transparent',
            cursor: 'move'
        }, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { children: column.name }), children ? (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [" ", children({ ref: ref, tabIndex: tabIndex }), " "] }) : null] }));
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (HeaderRenderer);


/***/ }),

/***/ "./client/components/InputSuggest/index.tsx":
/*!**************************************************!*\
  !*** ./client/components/InputSuggest/index.tsx ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InputTag: () => (/* binding */ InputTag),
/* harmony export */   MultiInputSuggest: () => (/* binding */ MultiInputSuggest),
/* harmony export */   SingleInputSuggest: () => (/* binding */ SingleInputSuggest)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_autosuggest__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-autosuggest */ "webpack/sharing/consume/default/react-autosuggest/react-autosuggest");
/* harmony import */ var react_autosuggest__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_autosuggest__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./style.css */ "./client/components/InputSuggest/style.css");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};





var EMPTY_ARRAY = [];
function get_text(value) {
    return typeof value === "string"
        ? value
        : value && value.text
            ? value.text
            : "";
}
var InputTag = function (_a) {
    var value = _a.value, _b = _a.inputProps, inputProps = _b === void 0 ? {} : _b, _c = _a.autocontain, autocontain = _c === void 0 ? false : _c, _d = _a.readOnly, readOnly = _d === void 0 ? false : _d, _e = _a.hyperlink, hyperlink = _e === void 0 ? false : _e, _f = _a.onRemoveTag, onRemoveTag = _f === void 0 ? null : _f, _g = _a.onClick, onClick = _g === void 0 ? null : _g;
    var res = ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "input-tag ".concat(readOnly ? "" : "editable"), children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("ul", { className: "input-tag__tags", children: [value.map(function (tag, i) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("li", { children: [hyperlink ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", { onClick: function () { return onClick(tag.key); }, children: tag.text })) : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: tag })), readOnly ? null : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { type: "button", onClick: function () { return !!onRemoveTag && onRemoveTag(i); }, children: "\u2715" }))] }, i)); }), readOnly ? null : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("li", { className: "input-tag__tags__input", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", __assign({ autoFocus: true, type: "text" }, inputProps)) }))] }) }));
    if (autocontain) {
        return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "input-tag-container", children: res });
    }
    return res;
};
var SingleInputSuggest = /** @class */ (function (_super) {
    __extends(SingleInputSuggest, _super);
    function SingleInputSuggest(props) {
        var _this = _super.call(this, props) || this;
        _this.onInputChange = function (event, _a) {
            var _b;
            var _c, _d;
            var newValue = _a.newValue, method = _a.method;
            if (method === "click") {
                _this.props.onRowChange((_b = {}, _b[_this.props.column] = newValue, _b), _this.props.row_id, true);
                _this.props.onClose();
            }
            else {
                _this.setState(function (prev) { return ({
                    inputValue: newValue,
                }); });
                (_d = (_c = _this.props).onInputChange) === null || _d === void 0 ? void 0 : _d.call(_c, newValue, method);
                if (method === "type") {
                    _this.lastTypedValue = get_text(newValue);
                }
            }
        };
        _this.inputKeyDown = function (event) {
            var _a;
            var stop = false;
            if (event.key === "Tab" || event.key === "Enter") {
                var inputValue = _this.props.inputValue === undefined
                    ? _this.state.inputValue
                    : _this.props.inputValue;
                if (!_this.props.hyperlink || typeof inputValue === "object") {
                    _this.props.onRowChange((_a = {}, _a[_this.props.column] = inputValue, _a), _this.props.row_id, true);
                }
            }
            else if (["ArrowUp", "ArrowDown"].includes(event.key) &&
                _this.props.suggestions) {
                stop = true;
            }
            else if (["Escape"].includes(event.key)) {
                _this.props.onClose();
            }
            if (stop) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        _this.onAutoSuggestRef = function (ref) {
            _this.autoSuggestRef = ref;
            if (_this.props.inputRef) {
                _this.props.inputRef.current = ref ? ref.input : null;
                if (ref) {
                    ref.input.focus();
                    if (ref && ref.input && typeof ref.input.select === "function") {
                        ref.input.select();
                    }
                }
            }
            _this.updateHighlightedSuggestion();
        };
        _this.updateHighlightedSuggestion = function () {
            if (!_this.autoSuggestRef) {
                return;
            }
            var valueText = get_text(_this.props.value);
            var allSuggestions = _this.getFilteredSuggestions();
            var firstMatchingSuggestion = allSuggestions.flatMap(function (s, i) {
                return valueText == get_text(s) ? [i] : EMPTY_ARRAY;
            })[0];
            if (firstMatchingSuggestion !== undefined) {
                _this.autoSuggestRef.setState({
                    highlightedSectionIndex: null,
                    highlightedSuggestionIndex: firstMatchingSuggestion,
                    highlightedSuggestion: allSuggestions[firstMatchingSuggestion],
                });
            }
        };
        _this.renderSuggestion = function (suggestion) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { children: _this.props.hyperlink ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", { onClick: function () { var _a, _b; return (_b = (_a = _this.props).onClick) === null || _b === void 0 ? void 0 : _b.call(_a, suggestion.key); }, children: suggestion.text })) : (suggestion) })); };
        _this.renderInput = function (_a) {
            var hyperlink = _a.hyperlink, inputProps = __rest(_a, ["hyperlink"]);
            return hyperlink ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", { children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", __assign({}, inputProps)) })) : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", __assign({}, inputProps)));
        };
        _this.onSuggestionsFetchRequested = function () { };
        _this.onSuggestionsClearRequested = function () { };
        _this.state = {
            inputValue: props.value,
        };
        _this.lastTypedValue = null;
        _this.autoSuggestRef = null;
        return _this;
    }
    SingleInputSuggest.prototype.componentDidMount = function () {
        var _this = this;
        this.setState({ inputValue: this.props.value });
        this.props.onInputChange(this.props.value, "mount");
        setTimeout(function () {
            var _a;
            var container = (_a = _this.autoSuggestRef) === null || _a === void 0 ? void 0 : _a.suggestionsContainer;
            if (container &&
                typeof container.scrollIntoView === "function") {
                container.scrollIntoView({ block: "nearest" });
            }
        }, 0);
    };
    SingleInputSuggest.prototype.componentWillUnmount = function () {
        this.setState({ inputValue: null });
        this.props.onInputChange(null, "unmount");
    };
    SingleInputSuggest.prototype.getFilteredSuggestions = function () {
        var _this = this;
        var allSuggestions = this.props.suggestions instanceof Function
            ? this.props.suggestions(this.lastTypedValue)
            : this.props.suggestions || [];
        if (!this.lastTypedValue) {
            return allSuggestions;
        }
        var filtered = allSuggestions.filter(function (s) {
            return get_text(s).toLowerCase().includes(_this.lastTypedValue.toLowerCase());
        });
        return filtered.length === 0 ? allSuggestions : filtered;
    };
    SingleInputSuggest.prototype.render = function () {
        var inputProps = {
            placeholder: "Type here",
            value: get_text(this.props.inputValue === undefined
                ? this.state.inputValue
                : this.props.inputValue),
            onChange: this.onInputChange,
            onKeyDown: this.inputKeyDown,
            hyperlink: this.props.hyperlink,
        };
        var filteredSuggestions = this.getFilteredSuggestions();
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { onKeyDown: function (event) { return event.defaultPrevented && event.stopPropagation(); }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)((react_autosuggest__WEBPACK_IMPORTED_MODULE_2___default()), { ref: this.onAutoSuggestRef, alwaysRenderSuggestions: true, onSuggestionsFetchRequested: this.onSuggestionsFetchRequested, onSuggestionsClearRequested: this.onSuggestionsClearRequested, suggestions: filteredSuggestions, renderInputComponent: this.renderInput, getSuggestionValue: function (val) { return val; }, renderSuggestion: this.renderSuggestion, inputProps: inputProps }) }));
    };
    SingleInputSuggest.defaultProps = {
        hyperlink: false,
        suggestions: [],
    };
    return SingleInputSuggest;
}((react__WEBPACK_IMPORTED_MODULE_1___default().Component)));

var MultiInputSuggest = /** @class */ (function (_super) {
    __extends(MultiInputSuggest, _super);
    function MultiInputSuggest(props) {
        var _this = _super.call(this, props) || this;
        _this.onInputChange = function (event, _a) {
            var _b, _c;
            var newValue = _a.newValue, method = _a.method;
            var newTags = __spreadArray([], __read((_this.getInputValue() || [])), false);
            newTags[newTags.length - 1] = newValue;
            _this.setState(function (prev) { return ({
                inputValue: newTags,
            }); });
            (_c = (_b = _this.props).onInputChange) === null || _c === void 0 ? void 0 : _c.call(_b, newTags, method);
            if (method === "type") {
                _this.lastTypedValue = get_text(newValue);
            }
        };
        _this.removeTag = function (i) {
            var _a, _b;
            var inputValue = _this.props.inputValue === undefined
                ? _this.state.inputValue
                : _this.props.inputValue;
            var newTags = __spreadArray([], __read((inputValue || [])), false);
            newTags.splice(i, 1);
            _this.setState({ inputValue: newTags });
            (_b = (_a = _this.props).onInputChange) === null || _b === void 0 ? void 0 : _b.call(_a, newTags, "remove");
        };
        _this.addTag = function () {
            var inputValue = _this.props.inputValue === undefined
                ? _this.state.inputValue
                : _this.props.inputValue;
            var newTags = __spreadArray([], __read((inputValue || [])), false);
            newTags.push("");
            _this.setState({ inputValue: newTags });
            _this.props.onInputChange(newTags, "add");
        };
        _this.inputKeyDown = function (event) {
            var _a, _b;
            var commit = false;
            var val = event.target.value;
            var inputValue = _this.getInputValue();
            if ((event.key === "Tab" || event.key === "Enter") && val) {
                _this.addTag();
                _this.needsInputScroll = true;
                event.preventDefault();
                event.stopPropagation();
            }
            else if (event.key === "Backspace" && !val) {
                _this.removeTag(inputValue.length - 1);
            }
            else if (!!_this.props.suggestions &&
                ["ArrowUp", "ArrowDown"].includes(event.key)) {
                commit = false;
            }
            else if ([
                "Enter",
                "Tab",
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
            ].includes(event.key)) {
                commit = true;
            }
            else if (["Escape"].includes(event.key)) {
                _this.props.onClose();
            }
            if (commit) {
                if (_this.getEditedValue() === "") {
                    _this.props.onRowChange((_a = {}, _a[_this.props.column] = inputValue.slice(0, inputValue.length - 1), _a), _this.props.row_id, true);
                }
                else {
                    _this.props.onRowChange((_b = {}, _b[_this.props.column] = inputValue, _b), _this.props.row_id, true);
                }
            }
        };
        _this.onAutoSuggestRef = function (ref) {
            _this.autoSuggestRef = ref;
            if (_this.props.inputRef) {
                _this.props.inputRef.current = ref ? ref.input : null;
                if (ref) {
                    ref.input.focus();
                    if (ref && ref.input && typeof ref.input.select === "function") {
                        ref.input.select();
                    }
                }
            }
        };
        _this.renderSuggestion = function (suggestion) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { children: _this.props.hyperlink ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", { onClick: function () {
                    var _a, _b;
                    return (_b = (_a = _this.props).onClick) === null || _b === void 0 ? void 0 : _b.call(_a, _this.props.row_id, _this.props.column, suggestion.key);
                }, children: suggestion.text })) : (suggestion) })); };
        _this.renderInput = function (_a) {
            var hyperlink = _a.hyperlink, inputProps = __rest(_a, ["hyperlink"]);
            var inputValue = _this.getInputValue();
            return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(InputTag, { value: inputValue.slice(0, inputValue.length - 1), inputProps: inputProps, onRemoveTag: _this.removeTag, hyperlink: !!hyperlink }));
        };
        _this.onSuggestionsFetchRequested = function () { };
        _this.onSuggestionsClearRequested = function () { };
        _this.state = {
            inputValue: props.value,
        };
        _this.needsInputScroll = false;
        _this.lastTypedValue = null;
        return _this;
    }
    MultiInputSuggest.prototype.getInputValue = function () {
        var inputValue = this.props.inputValue === undefined
            ? this.state.inputValue
            : this.props.inputValue;
        return Array.isArray(inputValue) ? inputValue : [];
    };
    MultiInputSuggest.prototype.getEditedValue = function () {
        var inputValue = this.props.inputValue === undefined
            ? this.state.inputValue
            : this.props.inputValue;
        return Array.isArray(inputValue) ? inputValue[inputValue.length - 1] : null;
    };
    MultiInputSuggest.prototype.componentDidMount = function () {
        var _this = this;
        this.setState({ inputValue: __spreadArray(__spreadArray([], __read(this.props.value), false), [""], false) });
        this.props.onInputChange(__spreadArray(__spreadArray([], __read(this.props.value), false), [""], false), "mount");
        setTimeout(function () {
            var _a;
            var container = (_a = _this.autoSuggestRef) === null || _a === void 0 ? void 0 : _a.suggestionsContainer;
            if (container &&
                typeof container.scrollIntoView === "function") {
                container.scrollIntoView({ block: "nearest" });
            }
        }, 0);
    };
    MultiInputSuggest.prototype.componentWillUnmount = function () {
        this.setState({ inputValue: null });
        this.props.onInputChange(null, "unmount");
    };
    MultiInputSuggest.prototype.getFilteredSuggestions = function () {
        var _this = this;
        var allSuggestions = Array.isArray(this.props.suggestions)
            ? this.props.suggestions
            : this.props.suggestions(this.lastTypedValue);
        if (!this.lastTypedValue) {
            return allSuggestions;
        }
        var filtered = allSuggestions.filter(function (s) {
            return get_text(s).toLowerCase().includes(_this.lastTypedValue.toLowerCase());
        });
        return filtered.length === 0 ? allSuggestions : filtered;
    };
    MultiInputSuggest.prototype.render = function () {
        var inputValue = get_text(this.getEditedValue());
        var inputProps = {
            placeholder: "Type here",
            value: inputValue,
            onChange: this.onInputChange,
            onKeyDown: this.inputKeyDown,
            hyperlink: this.props.hyperlink,
        };
        var filteredSuggestions = this.getFilteredSuggestions();
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { onKeyDown: function (event) { return event.defaultPrevented && event.stopPropagation(); }, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)((react_autosuggest__WEBPACK_IMPORTED_MODULE_2___default()), { ref: this.onAutoSuggestRef, alwaysRenderSuggestions: true, suggestions: filteredSuggestions, onSuggestionsFetchRequested: this.onSuggestionsFetchRequested, onSuggestionsClearRequested: this.onSuggestionsClearRequested, renderInputComponent: this.renderInput, getSuggestionValue: function (val) { return val; }, renderSuggestion: this.renderSuggestion, inputProps: inputProps }) }));
    };
    MultiInputSuggest.prototype.componentDidUpdate = function () {
        if (this.needsInputScroll &&
            this.props.inputRef &&
            this.props.inputRef.current) {
            this.props.inputRef.current.scrollIntoView({
                behavior: "smooth",
            });
        }
        this.needsInputScroll = false;
    };
    MultiInputSuggest.defaultProps = {
        hyperlink: false,
        suggestions: [],
    };
    return MultiInputSuggest;
}((react__WEBPACK_IMPORTED_MODULE_1___default().Component)));



/***/ }),

/***/ "./client/components/InputSuggest/style.css":
/*!**************************************************!*\
  !*** ./client/components/InputSuggest/style.css ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./style.css */ "./node_modules/css-loader/dist/cjs.js!./client/components/InputSuggest/style.css");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./client/components/Table/index.tsx":
/*!*******************************************!*\
  !*** ./client/components/Table/index.tsx ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Table: () => (/* binding */ Table)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_dnd__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-dnd */ "webpack/sharing/consume/default/react-dnd/react-dnd");
/* harmony import */ var react_dnd__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_dnd__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_dnd_html5_backend__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-dnd-html5-backend */ "webpack/sharing/consume/default/react-dnd-html5-backend/react-dnd-html5-backend");
/* harmony import */ var react_dnd_html5_backend__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_dnd_html5_backend__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_data_grid__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react-data-grid */ "webpack/sharing/consume/default/react-data-grid/react-data-grid");
/* harmony import */ var react_data_grid__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_data_grid__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./style.css */ "./client/components/Table/style.css");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../utils */ "./client/utils/index.ts");
/* harmony import */ var _DraggableHeaderRenderer__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../DraggableHeaderRenderer */ "./client/components/DraggableHeaderRenderer/index.tsx");
/* harmony import */ var _InputSuggest__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../InputSuggest */ "./client/components/InputSuggest/index.tsx");
/* harmony import */ var _BooleanInput__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../BooleanInput */ "./client/components/BooleanInput/index.tsx");
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};











var ROW_HEIGHT = 25;
var HEADER_ROW_HEIGHT = 65;
function inputStopPropagation(event) {
    var input = event.target;
    var cursorPosition = input.selectionStart;
    if (event.key === "ArrowLeft" && cursorPosition > 0) {
        event.stopPropagation();
    }
    if (event.key === "ArrowRight" && cursorPosition < input.value.length) {
        event.stopPropagation();
    }
}
var SuggestionsContext = react__WEBPACK_IMPORTED_MODULE_1___default().createContext(undefined);
SuggestionsContext.displayName = "SuggestionsContext";
react_dnd__WEBPACK_IMPORTED_MODULE_2__.DndContext.displayName = "DndContext";
var setOnMapping = function (mapping, key, value) {
    if (mapping instanceof Map) {
        mapping.set(key, value);
    }
    else {
        mapping[key] = value;
    }
};
var Table = function Table(props) {
    var _a = __read((0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(props.columns.map(function (column) { return column.key; })), 2), columnsOrder = _a[0], setColumnsOrder = _a[1];
    var _b = __read((0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(undefined), 2), position = _b[0], setPosition = _b[1];
    var _c = __read((0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false), 2), isLoading = _c[0], setIsLoading = _c[1];
    // If filters are not controlled via props, we use local state
    var _d = __read((0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({}), 2), localFilters = _d[0], setLocalFilters = _d[1];
    var effectiveFilters = props.filters === undefined ? localFilters : props.filters;
    // Helper: convert relative row index (from DataGrid) to an absolute row index.
    var getAbsoluteRowIdx = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.useEventCallback)(function (relativeIdx) {
        return effectiveSubset !== undefined ? effectiveSubset[relativeIdx] : relativeIdx;
    });
    var gridRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    var inputRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    var lastScrollTopRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(0);
    // --- Update subset when filters change ---
    var localSubset = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
        var _a;
        if (props.autoFilter && effectiveFilters && (props.subset === undefined || props.onSubsetChange)) {
            var lowercaseFilters_1 = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.memoize)(function (filters) {
                return Object.fromEntries(Object.entries(filters)
                    .filter(function (_a) {
                    var _b = __read(_a, 2), key = _b[0], value = _b[1];
                    return value !== "";
                })
                    .map(function (_a) {
                    var _b = __read(_a, 2), key = _b[0], value = _b[1];
                    return [key, value.toLowerCase()];
                }));
            })(effectiveFilters);
            var newSubset = props.rows
                .map(function (row, idx) { return ({ row: row, idx: idx }); })
                .filter(function (_a) {
                var row = _a.row;
                return Object.entries(lowercaseFilters_1).every(function (_a) {
                    var _b = __read(_a, 2), key = _b[0], value = _b[1];
                    return row[key] !== undefined && row[key] !== null && row[key].toString().toLowerCase().includes(value);
                });
            })
                .map(function (_a) {
                var idx = _a.idx;
                return idx;
            });
            (_a = props.onSubsetChange) === null || _a === void 0 ? void 0 : _a.call(props, newSubset);
            return newSubset;
        }
        else {
            return undefined;
        }
    }, [effectiveFilters, props.rows, props.autoFilter, props.filters]);
    var effectiveSubset = props.subset !== undefined ? props.subset : localSubset;
    // Update actions to work with absolute indices.
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
        if (props.actions) {
            setOnMapping(props.actions, "scroll_to_row", function (absRowIdx) {
                var _a;
                var relativeIdx = effectiveSubset ? effectiveSubset.indexOf(absRowIdx) : absRowIdx;
                if (relativeIdx !== -1) {
                    (_a = gridRef.current) === null || _a === void 0 ? void 0 : _a.scrollToRow(relativeIdx);
                }
            });
            setOnMapping(props.actions, "focus", function () {
                var _a, _b;
                var input = ((_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.input) || inputRef.current;
                var event = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.getCurrentEvent)();
                event.preventDefault();
                if (input) {
                    input.focus();
                }
                else {
                    (_b = gridRef.current) === null || _b === void 0 ? void 0 : _b.element.focus();
                }
            });
        }
    }, [props.actions, props.rows, props.rowKey, effectiveSubset]);
    // Compute visibleRows using the effectiveSubset.
    // (We simply slice the props.rows array instead of decorating rows with an absolute index.)
    var visibleRows = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
        if (effectiveSubset !== undefined) {
            return effectiveSubset.map(function (idx) { return props.rows[idx]; });
        }
        return props.rows;
    }, [props.rows, effectiveSubset]);
    var makeInputChangeHandler = function (relativeRowIdx, column) { return function (value, cause) {
        var _a;
        var absRowIdx = getAbsoluteRowIdx(relativeRowIdx);
        (_a = props.onInputChange) === null || _a === void 0 ? void 0 : _a.call(props, absRowIdx, column.key, value, cause);
    }; };
    var onHeaderDrop = function (source, target) {
        var columnSourceIndex = columnsOrder.indexOf(source);
        var columnTargetIndex = columnsOrder.indexOf(target);
        var reorderedColumns = __spreadArray([], __read(columnsOrder), false);
        reorderedColumns.splice(columnTargetIndex, 0, reorderedColumns.splice(columnSourceIndex, 1)[0]);
        setColumnsOrder(reorderedColumns);
    };
    var makeFilterInput = function (column) {
        return column.filterable
            ? function (inputProps) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", __assign({}, inputProps, { className: "metanno-table-filter", value: effectiveFilters[column.key] || "", onChange: function (e) {
                    var _a;
                    var _b;
                    var newFilters = __assign(__assign({}, effectiveFilters), (_a = {}, _a[column.key] = e.target.value, _a));
                    (_b = props.onFiltersChange) === null || _b === void 0 ? void 0 : _b.call(props, newFilters, column.key);
                    if (props.filters === undefined) {
                        setLocalFilters(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a[column.key] = e.target.value, _a)));
                        });
                    }
                }, onKeyDown: inputStopPropagation }))); }
            : null;
    };
    var buildFormatter = function (type, readonly, filterable) {
        switch (type) {
            case "hyperlink":
                return {
                    editor: readonly
                        ? null
                        : (0,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)(function (_a, ref) {
                            var row = _a.row, column = _a.column, onRowChange = _a.onRowChange, onClose = _a.onClose, rowIdx = _a.rowIdx;
                            var suggestions = react__WEBPACK_IMPORTED_MODULE_1___default().useContext(SuggestionsContext);
                            return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_InputSuggest__WEBPACK_IMPORTED_MODULE_8__.SingleInputSuggest, { ref: ref, 
                                // EditorProps provide rowIdx.
                                row_id: getAbsoluteRowIdx(rowIdx), inputRef: inputRef, value: row[column.key], column: column.key, inputValue: props.inputValue, onInputChange: makeInputChangeHandler(rowIdx, column), suggestions: suggestions === undefined ? props.columns[column.idx].choices : suggestions, onRowChange: onRowChange, onClose: onClose, hyperlink: true }));
                        }),
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: function (p) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_DraggableHeaderRenderer__WEBPACK_IMPORTED_MODULE_7__["default"], __assign({}, p, { onColumnsReorder: onHeaderDrop, children: makeFilterInput(p.column) }))); },
                    formatter: function (_a) {
                        var row = _a.row, rowIdx = _a.rowIdx, column = _a.column;
                        var value = row[column.key];
                        var text = (value === null || value === void 0 ? void 0 : value.text) || value;
                        var href = (value === null || value === void 0 ? void 0 : value.key) || value;
                        return value ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("a", { onClick: function (event) {
                                var _a;
                                var res = (_a = props.onClickCellContent) === null || _a === void 0 ? void 0 : _a.call(props, rowIdx, column.key, href);
                                if (res) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }
                            }, children: text })) : null;
                    },
                };
            case "multi-hyperlink":
                return {
                    editor: readonly
                        ? null
                        : (0,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)(function (_a, ref) {
                            var row = _a.row, rowIdx = _a.rowIdx, column = _a.column, onRowChange = _a.onRowChange, onClose = _a.onClose;
                            var suggestions = react__WEBPACK_IMPORTED_MODULE_1___default().useContext(SuggestionsContext);
                            return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_InputSuggest__WEBPACK_IMPORTED_MODULE_8__.MultiInputSuggest, { ref: ref, row_id: getAbsoluteRowIdx(rowIdx), inputRef: inputRef, value: row[column.key], inputValue: props.inputValue, column: column.key, suggestions: suggestions === undefined ? props.columns[column.idx].choices : suggestions, onRowChange: onRowChange, onInputChange: makeInputChangeHandler(rowIdx, column), onClose: onClose, hyperlink: true }));
                        }),
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: function (p) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_DraggableHeaderRenderer__WEBPACK_IMPORTED_MODULE_7__["default"], __assign({}, p, { onColumnsReorder: onHeaderDrop, children: makeFilterInput(p.column) }))); },
                    formatter: function (_a) {
                        var row = _a.row, rowIdx = _a.rowIdx, column = _a.column;
                        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_InputSuggest__WEBPACK_IMPORTED_MODULE_8__.InputTag, { autocontain: true, readOnly: true, hyperlink: true, onClick: function (value) { var _a; return (_a = props.onClickCellContent) === null || _a === void 0 ? void 0 : _a.call(props, rowIdx, column.key, value); }, value: row[column.key] }));
                    },
                };
            case "text":
                return {
                    editor: readonly
                        ? null
                        : (0,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)(function (_a, ref) {
                            var row = _a.row, column = _a.column, rowIdx = _a.rowIdx, onRowChange = _a.onRowChange, onClose = _a.onClose;
                            var suggestions = react__WEBPACK_IMPORTED_MODULE_1___default().useContext(SuggestionsContext);
                            return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_InputSuggest__WEBPACK_IMPORTED_MODULE_8__.SingleInputSuggest, { ref: ref, row_id: getAbsoluteRowIdx(rowIdx), inputRef: inputRef, value: row[column.key], column: column.key, inputValue: props.inputValue, onInputChange: makeInputChangeHandler(rowIdx, column), suggestions: suggestions === undefined ? props.columns[column.idx].choices : suggestions, onRowChange: onRowChange, onClose: onClose }));
                        }),
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: function (p) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_DraggableHeaderRenderer__WEBPACK_IMPORTED_MODULE_7__["default"], __assign({}, p, { onColumnsReorder: onHeaderDrop, children: makeFilterInput(p.column) }))); },
                    formatter: function (_a) {
                        var row = _a.row, column = _a.column;
                        return (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: row[column.key] });
                    },
                };
            case "multi-text":
                return {
                    editor: readonly
                        ? null
                        : (0,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)(function (_a, ref) {
                            var row = _a.row, rowIdx = _a.rowIdx, column = _a.column, onRowChange = _a.onRowChange, onClose = _a.onClose;
                            var suggestions = react__WEBPACK_IMPORTED_MODULE_1___default().useContext(SuggestionsContext);
                            return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_InputSuggest__WEBPACK_IMPORTED_MODULE_8__.MultiInputSuggest, { ref: ref, row_id: getAbsoluteRowIdx(rowIdx), inputRef: inputRef, value: row[column.key], column: column.key, inputValue: props.inputValue, onInputChange: makeInputChangeHandler(rowIdx, column), suggestions: suggestions === undefined ? props.columns[column.idx].choices : suggestions, onRowChange: onRowChange, onClose: onClose }));
                        }),
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: function (p) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_DraggableHeaderRenderer__WEBPACK_IMPORTED_MODULE_7__["default"], __assign({}, p, { onColumnsReorder: onHeaderDrop, children: makeFilterInput(p.column) }))); },
                    formatter: function (propsInner) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_InputSuggest__WEBPACK_IMPORTED_MODULE_8__.InputTag, __assign({ autocontain: true, readOnly: true }, propsInner, { value: propsInner.row[propsInner.column.key] }))); },
                };
            case "boolean":
                return {
                    formatter: function (_a) {
                        var row = _a.row, rowIdx = _a.rowIdx, column = _a.column, onRowChange = _a.onRowChange, isCellSelected = _a.isCellSelected;
                        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_BooleanInput__WEBPACK_IMPORTED_MODULE_9__["default"], { isCellSelected: isCellSelected, value: row[column.key], onChange: function (value) {
                                var _a;
                                return onRowChange(__assign(__assign({}, row), (_a = {}, _a[column.key] = value, _a)));
                            } }));
                    },
                    headerCellClass: filterable ? "metanno-table-header-filter" : undefined,
                    headerRenderer: function (p) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_DraggableHeaderRenderer__WEBPACK_IMPORTED_MODULE_7__["default"], __assign({}, p, { onColumnsReorder: onHeaderDrop, children: makeFilterInput(p.column) }))); },
                };
            case "button":
                return {
                    formatter: function (_a) {
                        var row = _a.row, rowIdx = _a.rowIdx, column = _a.column;
                        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: function () { var _a; return (_a = props.onClickCellContent) === null || _a === void 0 ? void 0 : _a.call(props, rowIdx, column.key); }, children: column.key }));
                    },
                };
            default:
                return {};
        }
    };
    var builtColumns = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
        var columnObjects = props.columns.map(function (column) {
            var _a;
            var _b = buildFormatter(column.kind, !column.editable, column.filterable), formatter = _b.formatter, editor = _b.editor, columnProps = __rest(_b, ["formatter", "editor"]);
            return _a = {},
                _a[column.key] = __assign(__assign(__assign({ key: column.key, name: column.name, draggable: true, resizable: true, editable: !!editor, filterable: column.filterable, editorOptions: {
                        commitOnOutsideClick: column.kind !== "hyperlink" && column.kind !== "multi-hyperlink",
                    } }, (formatter ? { formatter: formatter } : {})), (editor ? { editor: editor } : {})), columnProps),
                _a;
        });
        var nameToCol = Object.assign.apply(Object, __spreadArray([{}], __read(columnObjects), false));
        return columnsOrder.map(function (name) { return nameToCol[name]; });
    }, [props.columns, columnsOrder, effectiveFilters, props.inputValue]);
    var onRowsChange = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.useEventCallback)(function (newRows) {
        var _a;
        var updatedRows = newRows
            .map(function (newRow, relativeIdx) {
            var absRowIdx = effectiveSubset ? effectiveSubset[relativeIdx] : relativeIdx;
            return { oldRow: visibleRows[relativeIdx], newRow: newRow, absRowIdx: absRowIdx };
        })
            .filter(function (_a) {
            var newRow = _a.newRow, oldRow = _a.oldRow;
            return newRow !== oldRow;
        });
        if (updatedRows.length === 1) {
            var _b = updatedRows[0], newRow_1 = _b.newRow, oldRow_1 = _b.oldRow, absRowIdx = _b.absRowIdx;
            var changedKeys = Object.keys(newRow_1).filter(function (key) { return newRow_1[key] !== oldRow_1[key]; });
            (_a = props.onCellChange) === null || _a === void 0 ? void 0 : _a.call(props, absRowIdx, changedKeys[0], newRow_1[changedKeys[0]]);
        }
    });
    // We create a custom memoized MetannoRow, but don't make it depend on highlightedRows as it would cause
    // complete re-renders whenever the highlightedRows change, as the react component itself would be different.
    // Also, having it aide (and not in renderRow) let us only re-create the event handlers when the props (ie p.rowIdx) change.
    // Instead, we trigger re-renders via props computed in renderRow.
    var MetannoRow = (0,react__WEBPACK_IMPORTED_MODULE_1__.useMemo)(function () {
        return (0,react__WEBPACK_IMPORTED_MODULE_1__.memo)((0,react__WEBPACK_IMPORTED_MODULE_1__.forwardRef)(function (p, ref) { return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_data_grid__WEBPACK_IMPORTED_MODULE_4__.Row, __assign({}, p, { ref: ref, onMouseEnter: function (event) { var _a; return (_a = props.onMouseEnterRow) === null || _a === void 0 ? void 0 : _a.call(props, getAbsoluteRowIdx(p.rowIdx), (0,_utils__WEBPACK_IMPORTED_MODULE_6__.makeModKeys)(event)); }, onMouseLeave: function (event) { var _a; return (_a = props.onMouseLeaveRow) === null || _a === void 0 ? void 0 : _a.call(props, getAbsoluteRowIdx(p.rowIdx), (0,_utils__WEBPACK_IMPORTED_MODULE_6__.makeModKeys)(event)); }, className: "metanno-row ".concat(p.className) }))); }));
    }, [props.onMouseEnterRow, props.onMouseLeaveRow]);
    var renderRow = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (p) {
        var _a;
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(MetannoRow, __assign({}, p, { className: ((_a = props.highlightedRows) === null || _a === void 0 ? void 0 : _a.includes(p.row[props.rowKey])) ? "metanno-row--highlighted" : "" })));
    }, [props.highlightedRows, props.rowKey]);
    var rowKeyGetter = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(function (row) { return row[props.rowKey]; }, [props.rowKey]);
    var handlePositionChange = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.useEventCallback)(function (_a) {
        var _b;
        var idx = _a.idx, rowIdx = _a.rowIdx, mode = _a.mode, _c = _a.cause, cause = _c === void 0 ? "key" : _c;
        var absoluteRowIdx = rowIdx !== null && rowIdx >= 0 ? getAbsoluteRowIdx(rowIdx) : null;
        var col = idx !== null && idx >= 0 ? columnsOrder[idx] : null;
        (_b = props.onPositionChange) === null || _b === void 0 ? void 0 : _b.call(props, absoluteRowIdx, col, mode, cause);
        if (props.position === undefined) {
            setPosition({
                row_idx: absoluteRowIdx,
                col: col,
                mode: mode,
            });
        }
    });
    var getPositionIndices = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.useCachedReconcile)(function (positionParam) {
        if (!positionParam)
            return undefined;
        var row_idx = positionParam.row_idx, col = positionParam.col, mode = positionParam.mode;
        var relativeRowIdx = row_idx === null ? -1 : effectiveSubset ? effectiveSubset.indexOf(row_idx) : row_idx;
        var idx = col ? columnsOrder.findIndex(function (name) { return col === name; }) : -2;
        return { rowIdx: relativeRowIdx, idx: idx, mode: mode };
    });
    var onBlur = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.useEventCallback)(function (event) {
        if (event.currentTarget.contains(event.relatedTarget))
            return;
        var effectivePosition = props.position !== undefined ? props.position : position;
        if ((effectivePosition === null || effectivePosition === void 0 ? void 0 : effectivePosition.mode) === "EDIT")
            return;
        handlePositionChange({
            idx: null,
            rowIdx: null,
            mode: "SELECT",
            cause: "blur",
        });
    });
    var handleScrollBottom = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.useEventCallback)(function (event) {
        var currentTarget = event.currentTarget;
        var isGoingDown = currentTarget.scrollTop > lastScrollTopRef.current;
        var approachesBottom = currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight * 2;
        lastScrollTopRef.current = currentTarget.scrollTop;
        if (isLoading || !approachesBottom || !isGoingDown || !props.onScrollBottom) {
            return;
        }
        setIsLoading(true);
        var result = props.onScrollBottom(event);
        if (result instanceof Promise) {
            result.then(function () { return setIsLoading(false); });
        }
        else {
            setIsLoading(false);
        }
    });
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(function () {
        var _a, _b;
        (_b = (((_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.input) || inputRef.current)) === null || _b === void 0 ? void 0 : _b.focus();
    });
    var headerRowHeight = props.columns.some(function (col) { return col.filterable; }) ? HEADER_ROW_HEIGHT : ROW_HEIGHT;
    var selectedPosition = getPositionIndices(props.position !== undefined ? props.position : position);
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(SuggestionsContext.Provider, { value: props.suggestions, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "metanno-table", style: props.style, onBlur: onBlur, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react_dnd__WEBPACK_IMPORTED_MODULE_2__.DndProvider, { backend: react_dnd_html5_backend__WEBPACK_IMPORTED_MODULE_3__.HTML5Backend, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)((react_data_grid__WEBPACK_IMPORTED_MODULE_4___default()), { ref: gridRef, rowKeyGetter: rowKeyGetter, rowHeight: ROW_HEIGHT, selectedPosition: selectedPosition, columns: builtColumns, rows: visibleRows, rowRenderer: renderRow, headerRowHeight: headerRowHeight, onRowsChange: onRowsChange, onSelectedPositionChange: handlePositionChange, onScroll: handleScrollBottom }) }) }) }));
};


/***/ }),

/***/ "./client/components/Table/style.css":
/*!*******************************************!*\
  !*** ./client/components/Table/style.css ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./style.css */ "./node_modules/css-loader/dist/cjs.js!./client/components/Table/style.css");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./client/components/index.ts":
/*!************************************!*\
  !*** ./client/components/index.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnnotatedImage: () => (/* reexport safe */ _AnnotatedImage__WEBPACK_IMPORTED_MODULE_2__.AnnotatedImage),
/* harmony export */   AnnotatedText: () => (/* reexport safe */ _AnnotatedText__WEBPACK_IMPORTED_MODULE_0__.AnnotatedText),
/* harmony export */   Table: () => (/* reexport safe */ _Table__WEBPACK_IMPORTED_MODULE_1__.Table)
/* harmony export */ });
/* harmony import */ var _AnnotatedText__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AnnotatedText */ "./client/components/AnnotatedText/index.tsx");
/* harmony import */ var _Table__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Table */ "./client/components/Table/index.tsx");
/* harmony import */ var _AnnotatedImage__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./AnnotatedImage */ "./client/components/AnnotatedImage/index.tsx");





/***/ }),

/***/ "./client/dist-globals.ts":
/*!********************************!*\
  !*** ./client/dist-globals.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components */ "./client/components/index.ts");

window.Metanno = { 'AnnotatedText': _components__WEBPACK_IMPORTED_MODULE_0__.AnnotatedText, 'Table': _components__WEBPACK_IMPORTED_MODULE_0__.Table, 'AnnotatedImage': _components__WEBPACK_IMPORTED_MODULE_0__.AnnotatedImage };


/***/ }),

/***/ "./client/style.css":
/*!**************************!*\
  !*** ./client/style.css ***!
  \**************************/
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./style.css */ "./node_modules/css-loader/dist/cjs.js!./client/style.css");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_style_css__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./client/utils/arrayEquals.ts":
/*!*************************************!*\
  !*** ./client/utils/arrayEquals.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony export arrayEquals */
var arrayEquals = function (a1, a2) {
    // https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript/7837725#7837725
    var i = a1.length;
    while (i--) {
        if (a1[i] !== a2[i])
            return false;
    }
    return true;
};


/***/ }),

/***/ "./client/utils/currentEvent.ts":
/*!**************************************!*\
  !*** ./client/utils/currentEvent.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCurrentEvent: () => (/* binding */ getCurrentEvent)
/* harmony export */ });
var currentEvent = {
    current: null,
};
document.addEventListener("click", setCurrentEvent, { capture: true });
document.addEventListener("mousedown", setCurrentEvent, { capture: true });
document.addEventListener("mouseup", setCurrentEvent, { capture: true });
function setCurrentEvent(event) {
    currentEvent.current = event;
}
function getCurrentEvent() {
    return currentEvent.current;
}


/***/ }),

/***/ "./client/utils/hooks.ts":
/*!*******************************!*\
  !*** ./client/utils/hooks.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useCachedReconcile: () => (/* binding */ useCachedReconcile),
/* harmony export */   useEventCallback: () => (/* binding */ useEventCallback)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _reconcile__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reconcile */ "./client/utils/reconcile.ts");
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};


function useEventCallback(callback) {
    var callbackRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(callback);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
        callbackRef.current = callback;
    });
    return (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return callbackRef.current.apply(callbackRef, __spreadArray([], __read(args), false));
    }, []);
}
/**
 * React-hook version of `cachedReconcile`.
 *
 * ```ts
 * const select = useCachedReconcile(
 *   (value: number) => ({ a: { subkey: 3 }, b: value })
 * );
 *
 * const res4 = select(4);
 * const res5 = select(5);
 * // res4 !== res5 (object identity changes)
 * // res4.a === res5.a (un-changed slice is preserved)
 * ```
 *
 * @param fn  — pure selector whose output you want to reconcile
 * @returns   — memoised selector that maximises referential equality
 */
function useCachedReconcile(fn) {
    var cacheRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
    var reconciledSelector = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var next = fn.apply(void 0, __spreadArray([], __read(args), false));
        var didReconcile = (0,_reconcile__WEBPACK_IMPORTED_MODULE_1__.internalReconcile)(next, cacheRef.current);
        if (!didReconcile)
            cacheRef.current = next;
        return cacheRef.current;
    }, [fn]);
    return reconciledSelector;
}


/***/ }),

/***/ "./client/utils/index.ts":
/*!*******************************!*\
  !*** ./client/utils/index.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cachedReconcile: () => (/* reexport safe */ _reconcile__WEBPACK_IMPORTED_MODULE_2__.cachedReconcile),
/* harmony export */   getCurrentEvent: () => (/* reexport safe */ _currentEvent__WEBPACK_IMPORTED_MODULE_6__.getCurrentEvent),
/* harmony export */   getDocumentSelectedRanges: () => (/* reexport safe */ _textRange__WEBPACK_IMPORTED_MODULE_4__.getDocumentSelectedRanges),
/* harmony export */   makeModKeys: () => (/* reexport safe */ _keyboard__WEBPACK_IMPORTED_MODULE_3__.makeModKeys),
/* harmony export */   memoize: () => (/* reexport safe */ _memoize__WEBPACK_IMPORTED_MODULE_0__.memoize),
/* harmony export */   replaceObject: () => (/* reexport safe */ _replaceObject__WEBPACK_IMPORTED_MODULE_1__.replaceObject),
/* harmony export */   useCachedReconcile: () => (/* reexport safe */ _hooks__WEBPACK_IMPORTED_MODULE_7__.useCachedReconcile),
/* harmony export */   useEventCallback: () => (/* reexport safe */ _hooks__WEBPACK_IMPORTED_MODULE_7__.useEventCallback)
/* harmony export */ });
/* harmony import */ var _memoize__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./memoize */ "./client/utils/memoize.ts");
/* harmony import */ var _replaceObject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./replaceObject */ "./client/utils/replaceObject.ts");
/* harmony import */ var _reconcile__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reconcile */ "./client/utils/reconcile.ts");
/* harmony import */ var _keyboard__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./keyboard */ "./client/utils/keyboard.ts");
/* harmony import */ var _textRange__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./textRange */ "./client/utils/textRange.ts");
/* harmony import */ var _arrayEquals__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./arrayEquals */ "./client/utils/arrayEquals.ts");
/* harmony import */ var _currentEvent__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./currentEvent */ "./client/utils/currentEvent.ts");
/* harmony import */ var _hooks__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./hooks */ "./client/utils/hooks.ts");










/***/ }),

/***/ "./client/utils/keyboard.ts":
/*!**********************************!*\
  !*** ./client/utils/keyboard.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   makeModKeys: () => (/* binding */ makeModKeys)
/* harmony export */ });
var makeModKeys = function (event) {
    var modkeys = [];
    if (event.shiftKey)
        modkeys.push("Shift");
    if (event.metaKey)
        modkeys.push("Meta");
    if (event.ctrlKey)
        modkeys.push("Control");
    return modkeys;
};


/***/ }),

/***/ "./client/utils/memoize.ts":
/*!*********************************!*\
  !*** ./client/utils/memoize.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   memoize: () => (/* binding */ memoize)
/* harmony export */ });
/* unused harmony export shallowCompare */
/* harmony import */ var react_fast_compare__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-fast-compare */ "webpack/sharing/consume/default/react-fast-compare/react-fast-compare");
/* harmony import */ var react_fast_compare__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_fast_compare__WEBPACK_IMPORTED_MODULE_0__);
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};


var shallowCompare = function (obj1, obj2) {
    return obj1 === obj2 ||
        (typeof obj1 === 'object' && typeof obj2 == 'object' &&
            obj1 !== null && obj2 !== null &&
            Object.keys(obj1).length === Object.keys(obj2).length &&
            Object.keys(obj1).every(function (key) { return obj2.hasOwnProperty(key) && obj1[key] === obj2[key]; }));
};
var memoize = function (factory, checkDeps, shallow, post) {
    if (checkDeps === void 0) { checkDeps = (function () {
        var rest = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            rest[_i] = arguments[_i];
        }
        return rest.length > 0 ? rest[0] : null;
    }); }
    if (shallow === void 0) { shallow = false; }
    if (post === void 0) { post = false; }
    var last = null;
    var cache = null;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (post) {
            var new_state = factory.apply(void 0, __spreadArray([], __read(args), false));
            if (!(shallow && shallowCompare(new_state, cache) || !shallow && react_fast_compare__WEBPACK_IMPORTED_MODULE_0___default()(new_state, cache))) {
                cache = new_state;
            }
            return cache;
        }
        else {
            var state = checkDeps.apply(void 0, __spreadArray([], __read(args), false));
            if (!(shallow && shallowCompare(last, state) && last !== null || !shallow && react_fast_compare__WEBPACK_IMPORTED_MODULE_0___default()(last, state) && last !== null)) {
                last = state;
                cache = factory.apply(void 0, __spreadArray([], __read(args), false));
            }
            return cache;
        }
    };
};


/***/ }),

/***/ "./client/utils/reconcile.ts":
/*!***********************************!*\
  !*** ./client/utils/reconcile.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cachedReconcile: () => (/* binding */ cachedReconcile),
/* harmony export */   internalReconcile: () => (/* binding */ internalReconcile)
/* harmony export */ });
/* unused harmony export reconcile */
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
function internalReconcile(a, b) {
    // 7.1. All identical values are equivalent, as determined by ===.
    if (a === b) {
        return true;
    }
    var typeA = typeof a;
    var typeB = typeof b;
    if (typeA !== typeB) {
        return false;
    }
    // 7.3. Other pairs that do not both pass typeof value == 'object', equivalence is determined by ==.
    if (!a || !b || (typeA !== "object" && typeB !== "object")) {
        return a == b; // eslint-disable-line eqeqeq
    }
    if (Object.isFrozen(a)) {
        return false;
    }
    var i, key;
    if ((a === null) || (b === null)) {
        return false;
    }
    var ka = Object.keys(a);
    var kb = Object.keys(b);
    var has_diff = ka.length !== kb.length;
    for (i = kb.length - 1; i >= 0; i--) {
        key = kb[i];
        if (internalReconcile(a[key], b[key])) {
            a[key] = b[key];
        }
        else {
            has_diff = true;
        }
    }
    return !has_diff;
}
function reconcile(a, b) {
    var reconciled = internalReconcile(a, b);
    return reconciled ? b : a;
}
/**
 * Reconciles the previous and the new output of a function call
 * to maximize referential equality (===) between any item of the output object
 * This allows React to quickly detect parts of the state that haven't changed
 * when the state selectors are monolithic blocks, as in our case.
 *
 * For instance
 * ```es6
 * func = cachedReconcile((value) => {a: {subkey: 3}, b: value})
 * res4 = func(4)
 * res5 = func(5)
 * res4 !== res5 (the object has changed)
 * res4['a'] === res5['a'] (but the 'a' entry has not)
 * ```
 * @param fn: Function whose output we want to cache
 */
function cachedReconcile(fn) {
    var cache = null;
    return (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var a = fn.apply(void 0, __spreadArray([], __read(args), false));
        var reconciled = internalReconcile(a, cache);
        cache = reconciled ? cache : a;
        return cache;
    });
}


/***/ }),

/***/ "./client/utils/replaceObject.ts":
/*!***************************************!*\
  !*** ./client/utils/replaceObject.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   replaceObject: () => (/* binding */ replaceObject)
/* harmony export */ });
var replaceObject = function (obj, new_obj) {
    Object.keys(obj).forEach(function (key) {
        delete obj[key];
    });
    Object.assign(obj, new_obj);
};


/***/ }),

/***/ "./client/utils/textRange.ts":
/*!***********************************!*\
  !*** ./client/utils/textRange.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDocumentSelectedRanges: () => (/* binding */ getDocumentSelectedRanges)
/* harmony export */ });
function getDocumentSelectedRanges() {
    var ranges = [];
    var range = null;
    var get_span_begin = function (range) {
        var _a;
        return (((_a = range === null || range === void 0 ? void 0 : range.getAttribute) === null || _a === void 0 ? void 0 : _a.call(range, "span_begin"))
            || range.parentElement.getAttribute("span_begin")
            || range.parentElement.parentElement.getAttribute("span_begin"));
    };
    if (window.getSelection) {
        var selection = window.getSelection();
        var begin = null, end = null;
        for (var i = 0; i < selection.rangeCount; i++) {
            range = selection.getRangeAt(i);
            var startContainerBegin = parseInt(
            // @ts-ignore
            get_span_begin(range.startContainer), 10);
            var endContainerBegin = parseInt(
            // @ts-ignore
            get_span_begin(range.endContainer), 10);
            if (!isNaN(startContainerBegin)) {
                if (!isNaN(begin) && begin !== null) {
                    begin = Math.min(begin, range.startOffset + startContainerBegin);
                }
                else {
                    begin = range.startOffset + startContainerBegin;
                }
            }
            if (!isNaN(endContainerBegin)) {
                if (!isNaN(begin) && begin !== null) {
                    end = Math.max(end, range.endOffset + endContainerBegin);
                }
                else {
                    end = range.endOffset + endContainerBegin;
                }
            }
        }
        if (!isNaN(begin) && begin !== null && !isNaN(end) && end !== null && begin !== end) {
            ranges.push({
                begin: begin,
                end: end,
            });
        }
        return ranges;
    }
    else { // @ts-ignore
        if (document.selection && document.selection.type !== "Control") {
        }
    }
    return ranges;
}


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./client/components/AnnotatedText/style.css":
/*!*****************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./client/components/AnnotatedText/style.css ***!
  \*****************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
___CSS_LOADER_EXPORT___.push([module.id, "@import url(//fonts.googleapis.com/css?family=Roboto+Mono&display=swap);"]);
___CSS_LOADER_EXPORT___.push([module.id, "@import url(//cdn.jsdelivr.net/npm/hack-font@3/build/web/hack.css);"]);
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".metanno-text-view:focus-visible {\n    outline: none;\n}\n\n.metanno-text-view .text {\n    /*background: var(--metanno-background-color);*/\n    font-family: var(--metanno-font-family);\n    font-size: var(--metanno-font-size);\n    padding-top: 10px;\n    padding-bottom: 5px;\n    line-height: 2.8em;\n    color: var(--metanno-color);\n    position: relative;\n\n    width: 100%;\n    overflow-x: hidden;\n}\n\n.metanno-text-view .line {\n    padding-left: 41px;\n    box-sizing: border-box;\n    width: 100%;\n}\n\n.metanno-text-view .line-number {\n    margin-left: -41px;\n    width: 0;\n    display: inline-block;\n    padding: 0 30px 0 11px;\n    color: #959da5;\n}\n\n.metanno-text-view .line-number,\n.metanno-text-view .label {\n    -webkit-touch-callout: none; /* iOS Safari */\n    -webkit-user-select: none; /* Safari */\n    -khtml-user-select: none; /* Konqueror HTML */\n    -moz-user-select: none; /* Old versions of Firefox */\n    -ms-user-select: none; /* Internet Explorer/Edge */\n    user-select: none; /* Non-prefixed version, currently supported by Chrome, Opera and Firefox */\n}\n\n.metanno-text-view .text-chunk {\n    word-break: break-word;\n    white-space: nowrap;\n    display: inline;\n    position: relative;\n}\n\n.metanno-text-view .text-chunk-content {\n    position: relative;\n    z-index: 1001;\n    white-space: pre-wrap;\n}\n\n.metanno-text-view .mention_token {\n    box-sizing: content-box;\n    border-radius: 0.0000001em;\n    display: inline-block;\n\n    pointer-events: none;\n    position: absolute;\n    background-color: var(--metanno-background-color);\n    border-color: var(--metanno-border-color);\n    left: 0px;\n    right: 0px;\n    border-width: 2px;\n    border-style: solid;\n    border-right-width: 0;\n    border-left-width: 0;\n}\n\n.metanno-text-view .label {\n    box-sizing: content-box;\n    position: absolute;\n    white-space: pre;\n    border-radius: 0.2em;\n    font-size: 0.65em;\n    padding: 0.5em 0.1em 0em;\n    background: var(--metanno-background-color);\n    line-height: 0em;\n    height: 0.4em;\n    pointer-events: none;\n    color: var(--metanno-color);\n    border: 2px solid;\n    border-color: var(--metanno-color);\n}\n\n.metanno-text-view .label.highlighted {\n    box-shadow: 0px 0px 4px 4px #e7c600;\n}\n\n.metanno-text-view .mention_token.mention_underline, .metanno-text-view .mention_token.mention_underline.closed_left, .metanno-text-view .mention_token.mention_underline.closed_right {\n    top: calc(100% - 3px);\n    border-top: 0;\n    border-top-left-radius: 0;\n    border-top-right-radius: 0;\n}\n\n.metanno-text-view .mention_token.closedleft {\n    left: -1px;\n    border-left-width: 2px;\n    border-top-left-radius: 2px;\n    border-bottom-left-radius: 2px;\n}\n\n.metanno-text-view .mention_token.closedright {\n    right: -1px;\n    border-right-width: 2px;\n    border-top-right-radius: 2px;\n    border-bottom-right-radius: 2px;\n}\n\n.metanno-text-view .mention_token.highlighted {\n    border-top-width: 4px;\n    border-bottom-width: 4px;\n}\n\n.metanno-text-view .mention_token.mention_underline, .metanno-text-view .mention_token.closedright.mention_underline, .metanno-text-view .mention_token.closedleft.mention_underline {\n    right: -2px;\n    border-top: 0;\n    border-top-left-radius: 0;\n    border-top-right-radius: 0;\n}\n\n.metanno-text-view .mention_token.closedleft.highlighted {\n    border-left-width: 4px;\n    left: -2px;\n}\n\n.metanno-text-view .mention_token.closedright.highlighted {\n    border-right-width: 4px;\n    right: -2px;\n}\n\n.metanno-text-view .mouse_selected {\n    background: rgba(137, 188, 250, 0.6); /*#b2d7ff88;*/\n    border: none;\n    min-height: 2.8em;\n    z-index: 1000;\n}\n\n/* Style only for Mozilla Firefox */\n@-moz-document url-prefix() {\n    .metanno-text-view .mouse_selected {\n        top: 0;\n        bottom: 0;\n        min-height: unset;\n    }\n}\n\n@keyframes blink {\n    from, to {\n        border-color: white\n    }\n    50% {\n        border-color: black\n    }\n}\n\n.metanno-text-view .mention_token.selected {\n    animation: var(--blink-animation);\n}\n", "",{"version":3,"sources":["webpack://./client/components/AnnotatedText/style.css"],"names":[],"mappings":"AAGA;IACI,aAAa;AACjB;;AAEA;IACI,+CAA+C;IAC/C,uCAAuC;IACvC,mCAAmC;IACnC,iBAAiB;IACjB,mBAAmB;IACnB,kBAAkB;IAClB,2BAA2B;IAC3B,kBAAkB;;IAElB,WAAW;IACX,kBAAkB;AACtB;;AAEA;IACI,kBAAkB;IAClB,sBAAsB;IACtB,WAAW;AACf;;AAEA;IACI,kBAAkB;IAClB,QAAQ;IACR,qBAAqB;IACrB,sBAAsB;IACtB,cAAc;AAClB;;AAEA;;IAEI,2BAA2B,EAAE,eAAe;IAC5C,yBAAyB,EAAE,WAAW;IACtC,wBAAwB,EAAE,mBAAmB;IAC7C,sBAAsB,EAAE,4BAA4B;IACpD,qBAAqB,EAAE,2BAA2B;IAClD,iBAAiB,EAAE,2EAA2E;AAClG;;AAEA;IACI,sBAAsB;IACtB,mBAAmB;IACnB,eAAe;IACf,kBAAkB;AACtB;;AAEA;IACI,kBAAkB;IAClB,aAAa;IACb,qBAAqB;AACzB;;AAEA;IACI,uBAAuB;IACvB,0BAA0B;IAC1B,qBAAqB;;IAErB,oBAAoB;IACpB,kBAAkB;IAClB,iDAAiD;IACjD,yCAAyC;IACzC,SAAS;IACT,UAAU;IACV,iBAAiB;IACjB,mBAAmB;IACnB,qBAAqB;IACrB,oBAAoB;AACxB;;AAEA;IACI,uBAAuB;IACvB,kBAAkB;IAClB,gBAAgB;IAChB,oBAAoB;IACpB,iBAAiB;IACjB,wBAAwB;IACxB,2CAA2C;IAC3C,gBAAgB;IAChB,aAAa;IACb,oBAAoB;IACpB,2BAA2B;IAC3B,iBAAiB;IACjB,kCAAkC;AACtC;;AAEA;IACI,mCAAmC;AACvC;;AAEA;IACI,qBAAqB;IACrB,aAAa;IACb,yBAAyB;IACzB,0BAA0B;AAC9B;;AAEA;IACI,UAAU;IACV,sBAAsB;IACtB,2BAA2B;IAC3B,8BAA8B;AAClC;;AAEA;IACI,WAAW;IACX,uBAAuB;IACvB,4BAA4B;IAC5B,+BAA+B;AACnC;;AAEA;IACI,qBAAqB;IACrB,wBAAwB;AAC5B;;AAEA;IACI,WAAW;IACX,aAAa;IACb,yBAAyB;IACzB,0BAA0B;AAC9B;;AAEA;IACI,sBAAsB;IACtB,UAAU;AACd;;AAEA;IACI,uBAAuB;IACvB,WAAW;AACf;;AAEA;IACI,oCAAoC,EAAE,aAAa;IACnD,YAAY;IACZ,iBAAiB;IACjB,aAAa;AACjB;;AAEA,mCAAmC;AACnC;IACI;QACI,MAAM;QACN,SAAS;QACT,iBAAiB;IACrB;AACJ;;AAEA;IACI;QACI;IACJ;IACA;QACI;IACJ;AACJ;;AAEA;IACI,iCAAiC;AACrC","sourcesContent":["@import url('//fonts.googleapis.com/css?family=Roboto+Mono&display=swap');\n@import url(\"//cdn.jsdelivr.net/npm/hack-font@3/build/web/hack.css\");\n\n.metanno-text-view:focus-visible {\n    outline: none;\n}\n\n.metanno-text-view .text {\n    /*background: var(--metanno-background-color);*/\n    font-family: var(--metanno-font-family);\n    font-size: var(--metanno-font-size);\n    padding-top: 10px;\n    padding-bottom: 5px;\n    line-height: 2.8em;\n    color: var(--metanno-color);\n    position: relative;\n\n    width: 100%;\n    overflow-x: hidden;\n}\n\n.metanno-text-view .line {\n    padding-left: 41px;\n    box-sizing: border-box;\n    width: 100%;\n}\n\n.metanno-text-view .line-number {\n    margin-left: -41px;\n    width: 0;\n    display: inline-block;\n    padding: 0 30px 0 11px;\n    color: #959da5;\n}\n\n.metanno-text-view .line-number,\n.metanno-text-view .label {\n    -webkit-touch-callout: none; /* iOS Safari */\n    -webkit-user-select: none; /* Safari */\n    -khtml-user-select: none; /* Konqueror HTML */\n    -moz-user-select: none; /* Old versions of Firefox */\n    -ms-user-select: none; /* Internet Explorer/Edge */\n    user-select: none; /* Non-prefixed version, currently supported by Chrome, Opera and Firefox */\n}\n\n.metanno-text-view .text-chunk {\n    word-break: break-word;\n    white-space: nowrap;\n    display: inline;\n    position: relative;\n}\n\n.metanno-text-view .text-chunk-content {\n    position: relative;\n    z-index: 1001;\n    white-space: pre-wrap;\n}\n\n.metanno-text-view .mention_token {\n    box-sizing: content-box;\n    border-radius: 0.0000001em;\n    display: inline-block;\n\n    pointer-events: none;\n    position: absolute;\n    background-color: var(--metanno-background-color);\n    border-color: var(--metanno-border-color);\n    left: 0px;\n    right: 0px;\n    border-width: 2px;\n    border-style: solid;\n    border-right-width: 0;\n    border-left-width: 0;\n}\n\n.metanno-text-view .label {\n    box-sizing: content-box;\n    position: absolute;\n    white-space: pre;\n    border-radius: 0.2em;\n    font-size: 0.65em;\n    padding: 0.5em 0.1em 0em;\n    background: var(--metanno-background-color);\n    line-height: 0em;\n    height: 0.4em;\n    pointer-events: none;\n    color: var(--metanno-color);\n    border: 2px solid;\n    border-color: var(--metanno-color);\n}\n\n.metanno-text-view .label.highlighted {\n    box-shadow: 0px 0px 4px 4px #e7c600;\n}\n\n.metanno-text-view .mention_token.mention_underline, .metanno-text-view .mention_token.mention_underline.closed_left, .metanno-text-view .mention_token.mention_underline.closed_right {\n    top: calc(100% - 3px);\n    border-top: 0;\n    border-top-left-radius: 0;\n    border-top-right-radius: 0;\n}\n\n.metanno-text-view .mention_token.closedleft {\n    left: -1px;\n    border-left-width: 2px;\n    border-top-left-radius: 2px;\n    border-bottom-left-radius: 2px;\n}\n\n.metanno-text-view .mention_token.closedright {\n    right: -1px;\n    border-right-width: 2px;\n    border-top-right-radius: 2px;\n    border-bottom-right-radius: 2px;\n}\n\n.metanno-text-view .mention_token.highlighted {\n    border-top-width: 4px;\n    border-bottom-width: 4px;\n}\n\n.metanno-text-view .mention_token.mention_underline, .metanno-text-view .mention_token.closedright.mention_underline, .metanno-text-view .mention_token.closedleft.mention_underline {\n    right: -2px;\n    border-top: 0;\n    border-top-left-radius: 0;\n    border-top-right-radius: 0;\n}\n\n.metanno-text-view .mention_token.closedleft.highlighted {\n    border-left-width: 4px;\n    left: -2px;\n}\n\n.metanno-text-view .mention_token.closedright.highlighted {\n    border-right-width: 4px;\n    right: -2px;\n}\n\n.metanno-text-view .mouse_selected {\n    background: rgba(137, 188, 250, 0.6); /*#b2d7ff88;*/\n    border: none;\n    min-height: 2.8em;\n    z-index: 1000;\n}\n\n/* Style only for Mozilla Firefox */\n@-moz-document url-prefix() {\n    .metanno-text-view .mouse_selected {\n        top: 0;\n        bottom: 0;\n        min-height: unset;\n    }\n}\n\n@keyframes blink {\n    from, to {\n        border-color: white\n    }\n    50% {\n        border-color: black\n    }\n}\n\n.metanno-text-view .mention_token.selected {\n    animation: var(--blink-animation);\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./client/components/BooleanInput/style.css":
/*!****************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./client/components/BooleanInput/style.css ***!
  \****************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".rdg-checkbox-container {\n    display: flex;\n    height: 100%;\n    align-items: center;\n    justify-content: center;\n}\n\n.rdg-checkbox-container > .rdg-checkbox-label {\n    position: relative;\n}\n", "",{"version":3,"sources":["webpack://./client/components/BooleanInput/style.css"],"names":[],"mappings":"AAAA;IACI,aAAa;IACb,YAAY;IACZ,mBAAmB;IACnB,uBAAuB;AAC3B;;AAEA;IACI,kBAAkB;AACtB","sourcesContent":[".rdg-checkbox-container {\n    display: flex;\n    height: 100%;\n    align-items: center;\n    justify-content: center;\n}\n\n.rdg-checkbox-container > .rdg-checkbox-label {\n    position: relative;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./client/components/InputSuggest/style.css":
/*!****************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./client/components/InputSuggest/style.css ***!
  \****************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".metanno-table .react-autosuggest__container, .metanno-table  .input-tag-container {\n    position: relative;\n    height: 100%;\n    margin: 0 auto;\n    display: flex;\n    align-items: center;\n}\n\n.rdg-cell.rdg-editor-container > div > .react-autosuggest__container {\n    padding-left: 8px;\n    padding-right: 8px;\n    background: transparent;\n    margin-right: 0px;\n    box-sizing: border-box;\n}\n\n.rdg-cell .react-autosuggest__input {\n    font-family: inherit;\n    border: none;\n    font-size: var(--font-size);\n    width: 100%;\n    height: 100%;\n    color: var(--color);\n    background: transparent;\n}\n\n.rdg-cell .react-autosuggest__input::-ms-clear {\n    display: none;\n}\n\n.rdg-cell .react-autosuggest__input--open {\n    border-bottom-left-radius: 0;\n    border-bottom-right-radius: 0;\n}\n\n.rdg-cell .react-autosuggest__input--focused {\n    outline: none;\n}\n\n.rdg-cell .react-autosuggest__suggestions-container {\n    display: none;\n}\n\n.rdg-cell.rdg-editor-container > div {\n    /*background: white;*/\n}\n\n.rdg-editor-container > div, .metanno-table .rdg-cell-value, .rdg-cell-value > div {\n    height: 100%;\n    width: 100%;\n}\n\n.rdg-editor-container > div > .react-autosuggest__container--open > .react-autosuggest__suggestions-container {\n    left: -1px;\n    right: 0px;\n}\n\n.rdg-cell .react-autosuggest__suggestions-container--open {\n    display: block;\n    position: absolute;\n    top: 100%;\n    min-width: 100%;\n    box-sizing: border-box;\n    border: 1px solid var(--border-color, #aaa);\n    background-color: var(--background-color, white);\n    /* font-family: 'Open Sans', sans-serif;\n    font-weight: 300;\n    font-size: 14px;*/\n    border-bottom-left-radius: 4PX;\n    border-bottom-right-radius: 4PX;\n    z-index: 2;\n    max-height: 200px;\n    overflow-y: auto;\n\n    overflow-y: scroll;\n    scrollbar-width: none; /* Firefox */\n    -ms-overflow-style: none; /* Internet Explorer 10+ */\n}\n\n.rdg-cell .react-autosuggest__suggestions-container--open::-webkit-scrollbar {\n    width: 0;\n    height: 0;\n}\n\n.rdg-cell .react-autosuggest__suggestions-list {\n    margin: 0;\n    padding: 0;\n    list-style-type: none;\n}\n\n.rdg-cell ul.react-autosuggest__suggestions-list {\n    margin-left: 0;\n}\n\n.rdg-cell ul > li.react-autosuggest__suggestion {\n    cursor: pointer;\n    padding: 0 8px;\n    margin-left: 0;\n    margin-bottom: 0;\n\n}\n\n.rdg-cell .react-autosuggest__suggestion--highlighted {\n    background-color: var(--row-hover-background-color, #ddd);\n}\n\n.rdg-cell .react-autosuggest__section-container {\n    border-top: 1px dashed #ccc;\n}\n\n.rdg-cell .react-autosuggest__section-container-first {\n    border-top: 0;\n}\n\n.rdg-cell .react-autosuggest__section-title {\n    padding: 10px 0 0 10px;\n    font-size: 12px;\n    color: #777;\n}\n\ndiv.input-tag {\n    display: flex;\n    flex-wrap: nowrap;\n    width: 100%;\n    /*padding: 2px;*/\n}\n\ndiv.input-tag input {\n    border: none;\n    width: 100%;\n    border-radius: 4PX;\n    -webkit-appearance: none;\n}\n\ndiv.input-tag input:focus {\n    outline: none;\n}\n\ndiv.input-tag > ul.input-tag__tags {\n    display: inline-flex;\n    flex-wrap: nowrap;\n    /*padding: 0 2px;*/\n    padding: 2px 8px;\n    margin: 0px -8px;\n    width: 100%;\n    overflow: scroll;\n    -ms-overflow-style: none;\n}\n\n/* Hide scrollbar for Chrome, Safari and Opera */\ndiv.input-tag > ul.input-tag__tags::-webkit-scrollbar {\n  display: none;\n}\n\n/* Hide scrollbar for IE and Edge */\n.example {\n}\n\ndiv.input-tag > ul.input-tag__tags > li {\n    align-items: center;\n    background: white;\n    border-radius: 2px;\n    color: black;\n    display: flex;\n    font-size: 14px;\n    line-height: 15px;\n    font-weight: 300;\n    list-style: none;\n    margin: 0 2px 0 0;\n    padding: 1px 5px;\n    position: relative;\n}\n\ndiv.input-tag > ul.input-tag__tags > li button {\n    align-items: center;\n    appearance: none;\n    background: #333333;\n    border: none;\n    border-radius: 50%;\n    color: white;\n    cursor: pointer;\n    display: inline-flex;\n    font-size: 10px;\n    height: 15px;\n    justify-content: center;\n    line-height: 0;\n    margin-left: 8px;\n    width: 15px;\n    flex: 0 0 15px;\n    padding: 0px;\n}\ndiv.input-tag > ul.input-tag__tags > li button:focus {\n    outline: none;\n}\n\n\ndiv.input-tag > ul.input-tag__tags > li:not(.input-tag__tags__input) {\n    border: 1px solid #b3b3b3;\n}\n\ndiv.input-tag > ul.input-tag__tags > li.input-tag__tags__input {\n    background: none;\n    flex-grow: 1;\n    flex-basis: 50%;\n    min-width: 60px;\n    flex-shrink: 0;\n    padding: 0;\n}\n", "",{"version":3,"sources":["webpack://./client/components/InputSuggest/style.css"],"names":[],"mappings":"AAAA;IACI,kBAAkB;IAClB,YAAY;IACZ,cAAc;IACd,aAAa;IACb,mBAAmB;AACvB;;AAEA;IACI,iBAAiB;IACjB,kBAAkB;IAClB,uBAAuB;IACvB,iBAAiB;IACjB,sBAAsB;AAC1B;;AAEA;IACI,oBAAoB;IACpB,YAAY;IACZ,2BAA2B;IAC3B,WAAW;IACX,YAAY;IACZ,mBAAmB;IACnB,uBAAuB;AAC3B;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,4BAA4B;IAC5B,6BAA6B;AACjC;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,qBAAqB;AACzB;;AAEA;IACI,YAAY;IACZ,WAAW;AACf;;AAEA;IACI,UAAU;IACV,UAAU;AACd;;AAEA;IACI,cAAc;IACd,kBAAkB;IAClB,SAAS;IACT,eAAe;IACf,sBAAsB;IACtB,2CAA2C;IAC3C,gDAAgD;IAChD;;qBAEiB;IACjB,8BAA8B;IAC9B,+BAA+B;IAC/B,UAAU;IACV,iBAAiB;IACjB,gBAAgB;;IAEhB,kBAAkB;IAClB,qBAAqB,EAAE,YAAY;IACnC,wBAAwB,EAAE,0BAA0B;AACxD;;AAEA;IACI,QAAQ;IACR,SAAS;AACb;;AAEA;IACI,SAAS;IACT,UAAU;IACV,qBAAqB;AACzB;;AAEA;IACI,cAAc;AAClB;;AAEA;IACI,eAAe;IACf,cAAc;IACd,cAAc;IACd,gBAAgB;;AAEpB;;AAEA;IACI,yDAAyD;AAC7D;;AAEA;IACI,2BAA2B;AAC/B;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,sBAAsB;IACtB,eAAe;IACf,WAAW;AACf;;AAEA;IACI,aAAa;IACb,iBAAiB;IACjB,WAAW;IACX,gBAAgB;AACpB;;AAEA;IACI,YAAY;IACZ,WAAW;IACX,kBAAkB;IAClB,wBAAwB;AAC5B;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,oBAAoB;IACpB,iBAAiB;IACjB,kBAAkB;IAClB,gBAAgB;IAChB,gBAAgB;IAChB,WAAW;IACX,gBAAgB;IAChB,wBAAwB;AAC5B;;AAEA,gDAAgD;AAChD;EACE,aAAa;AACf;;AAEA,mCAAmC;AACnC;AACA;;AAEA;IACI,mBAAmB;IACnB,iBAAiB;IACjB,kBAAkB;IAClB,YAAY;IACZ,aAAa;IACb,eAAe;IACf,iBAAiB;IACjB,gBAAgB;IAChB,gBAAgB;IAChB,iBAAiB;IACjB,gBAAgB;IAChB,kBAAkB;AACtB;;AAEA;IACI,mBAAmB;IACnB,gBAAgB;IAChB,mBAAmB;IACnB,YAAY;IACZ,kBAAkB;IAClB,YAAY;IACZ,eAAe;IACf,oBAAoB;IACpB,eAAe;IACf,YAAY;IACZ,uBAAuB;IACvB,cAAc;IACd,gBAAgB;IAChB,WAAW;IACX,cAAc;IACd,YAAY;AAChB;AACA;IACI,aAAa;AACjB;;;AAGA;IACI,yBAAyB;AAC7B;;AAEA;IACI,gBAAgB;IAChB,YAAY;IACZ,eAAe;IACf,eAAe;IACf,cAAc;IACd,UAAU;AACd","sourcesContent":[".metanno-table .react-autosuggest__container, .metanno-table  .input-tag-container {\n    position: relative;\n    height: 100%;\n    margin: 0 auto;\n    display: flex;\n    align-items: center;\n}\n\n.rdg-cell.rdg-editor-container > div > .react-autosuggest__container {\n    padding-left: 8px;\n    padding-right: 8px;\n    background: transparent;\n    margin-right: 0px;\n    box-sizing: border-box;\n}\n\n.rdg-cell .react-autosuggest__input {\n    font-family: inherit;\n    border: none;\n    font-size: var(--font-size);\n    width: 100%;\n    height: 100%;\n    color: var(--color);\n    background: transparent;\n}\n\n.rdg-cell .react-autosuggest__input::-ms-clear {\n    display: none;\n}\n\n.rdg-cell .react-autosuggest__input--open {\n    border-bottom-left-radius: 0;\n    border-bottom-right-radius: 0;\n}\n\n.rdg-cell .react-autosuggest__input--focused {\n    outline: none;\n}\n\n.rdg-cell .react-autosuggest__suggestions-container {\n    display: none;\n}\n\n.rdg-cell.rdg-editor-container > div {\n    /*background: white;*/\n}\n\n.rdg-editor-container > div, .metanno-table .rdg-cell-value, .rdg-cell-value > div {\n    height: 100%;\n    width: 100%;\n}\n\n.rdg-editor-container > div > .react-autosuggest__container--open > .react-autosuggest__suggestions-container {\n    left: -1px;\n    right: 0px;\n}\n\n.rdg-cell .react-autosuggest__suggestions-container--open {\n    display: block;\n    position: absolute;\n    top: 100%;\n    min-width: 100%;\n    box-sizing: border-box;\n    border: 1px solid var(--border-color, #aaa);\n    background-color: var(--background-color, white);\n    /* font-family: 'Open Sans', sans-serif;\n    font-weight: 300;\n    font-size: 14px;*/\n    border-bottom-left-radius: 4PX;\n    border-bottom-right-radius: 4PX;\n    z-index: 2;\n    max-height: 200px;\n    overflow-y: auto;\n\n    overflow-y: scroll;\n    scrollbar-width: none; /* Firefox */\n    -ms-overflow-style: none; /* Internet Explorer 10+ */\n}\n\n.rdg-cell .react-autosuggest__suggestions-container--open::-webkit-scrollbar {\n    width: 0;\n    height: 0;\n}\n\n.rdg-cell .react-autosuggest__suggestions-list {\n    margin: 0;\n    padding: 0;\n    list-style-type: none;\n}\n\n.rdg-cell ul.react-autosuggest__suggestions-list {\n    margin-left: 0;\n}\n\n.rdg-cell ul > li.react-autosuggest__suggestion {\n    cursor: pointer;\n    padding: 0 8px;\n    margin-left: 0;\n    margin-bottom: 0;\n\n}\n\n.rdg-cell .react-autosuggest__suggestion--highlighted {\n    background-color: var(--row-hover-background-color, #ddd);\n}\n\n.rdg-cell .react-autosuggest__section-container {\n    border-top: 1px dashed #ccc;\n}\n\n.rdg-cell .react-autosuggest__section-container-first {\n    border-top: 0;\n}\n\n.rdg-cell .react-autosuggest__section-title {\n    padding: 10px 0 0 10px;\n    font-size: 12px;\n    color: #777;\n}\n\ndiv.input-tag {\n    display: flex;\n    flex-wrap: nowrap;\n    width: 100%;\n    /*padding: 2px;*/\n}\n\ndiv.input-tag input {\n    border: none;\n    width: 100%;\n    border-radius: 4PX;\n    -webkit-appearance: none;\n}\n\ndiv.input-tag input:focus {\n    outline: none;\n}\n\ndiv.input-tag > ul.input-tag__tags {\n    display: inline-flex;\n    flex-wrap: nowrap;\n    /*padding: 0 2px;*/\n    padding: 2px 8px;\n    margin: 0px -8px;\n    width: 100%;\n    overflow: scroll;\n    -ms-overflow-style: none;\n}\n\n/* Hide scrollbar for Chrome, Safari and Opera */\ndiv.input-tag > ul.input-tag__tags::-webkit-scrollbar {\n  display: none;\n}\n\n/* Hide scrollbar for IE and Edge */\n.example {\n}\n\ndiv.input-tag > ul.input-tag__tags > li {\n    align-items: center;\n    background: white;\n    border-radius: 2px;\n    color: black;\n    display: flex;\n    font-size: 14px;\n    line-height: 15px;\n    font-weight: 300;\n    list-style: none;\n    margin: 0 2px 0 0;\n    padding: 1px 5px;\n    position: relative;\n}\n\ndiv.input-tag > ul.input-tag__tags > li button {\n    align-items: center;\n    appearance: none;\n    background: #333333;\n    border: none;\n    border-radius: 50%;\n    color: white;\n    cursor: pointer;\n    display: inline-flex;\n    font-size: 10px;\n    height: 15px;\n    justify-content: center;\n    line-height: 0;\n    margin-left: 8px;\n    width: 15px;\n    flex: 0 0 15px;\n    padding: 0px;\n}\ndiv.input-tag > ul.input-tag__tags > li button:focus {\n    outline: none;\n}\n\n\ndiv.input-tag > ul.input-tag__tags > li:not(.input-tag__tags__input) {\n    border: 1px solid #b3b3b3;\n}\n\ndiv.input-tag > ul.input-tag__tags > li.input-tag__tags__input {\n    background: none;\n    flex-grow: 1;\n    flex-basis: 50%;\n    min-width: 60px;\n    flex-shrink: 0;\n    padding: 0;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./client/components/Table/style.css":
/*!*********************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./client/components/Table/style.css ***!
  \*********************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".jp-Notebook .metanno-table {\n    min-height: 100px;\n}\n\n.metanno-table {\n    height: 100%;\n    width: 100%;\n    overflow: hidden;\n    min-height: 50px;\n}\n\n.metanno-table, .metanno-table input {\n    font-family: var(--metanno-font-family);\n    font-size: var(--metanno-font-size);\n}\n\n.metanno-table-filter {\n    inline-size: 100%;\n    padding: 4px;\n    font-size: var(--metanno-font-size);\n    background: var(--background-color);\n    color: var(--color);\n    border: 1px solid var(--border-color);\n}\n\n.metanno-table-header-filter {\n    line-height: 30px;\n    padding: 0;\n}\n\n.metanno-table-header-filter > div > div {\n    padding-block: 0;\n    padding-inline: 4px;\n}\n\n.metanno-table-header-filter > div > div:first-child {\n    border-block-end: 1px solid var(--border-color);\n    padding-inline: 8px;\n}\n\n.metanno-table > div.rdg {\n    --font-size: var(--metanno-font-size); /* more specific than react-data-grid's .rnvodz5700-beta7 selector to override */\n    height: 100%;\n    border: none;\n}\n\n.metanno-table a {\n    color: #106ba3;\n}\n\n.metanno-table a:hover {\n    text-decoration: underline;\n}\n\n.metanno-table .rdg-cell-mask:focus {\n    outline: none;\n}\n\n.metanno-table .react-tagsinput {\n    background: transparent;\n    border: none;\n    padding-top: 0;\n    padding-bottom: 0;\n}\n\n.metanno-table .react-tagsinput > span {\n    line-height: 14px;\n}\n\n.metanno-table .react-tagsinput-tag, .metanno-table .react-tagsinput-input {\n    padding-top: 0;\n    padding-bottom: 0;\n    margin-top: 0;\n    margin-bottom: 0;\n}\n\n.metanno-table .react-tagsinput-tag {\n    background-color: #ffffff;\n    border-radius: 2px;\n    border: 1px solid #4a9bd2;\n    color: #000000;\n}\n\n.metanno-table .react-tagsinput-input:focus {\n    outline: none;\n}\n\n.metanno-table .react-tagsinput.disabled .react-tagsinput-input {\n    display: none;\n}\n\n\n.metanno-tagscell-container {\n\n}\n\n.rdg-row.metanno-row--highlighted {\n    background-color: var(--row-hover-background-color);\n}\n\n.metanno-table .rdg-row, .metanno-table .rdg-cell {\n    contain: initial;\n    overflow: visible;\n}\n\n.metanno-table .rdg-cell {\n    position: relative;\n}\n\n/* TAGS INPUT */\n.react-tagsinput {\n    background-color: #fff;\n    border: 1px solid #ccc;\n    overflow: hidden;\n    padding-left: 5px;\n    padding-top: 5px;\n}\n\n.react-tagsinput--focused {\n    border-color: #a5d24a;\n}\n\n.react-tagsinput-tag {\n    background-color: #cde69c;\n    border-radius: 2px;\n    border: 1px solid #a5d24a;\n    color: #638421;\n    display: inline-block;\n    font-family: sans-serif;\n    font-size: 13px;\n    font-weight: 400;\n    margin-bottom: 5px;\n    margin-right: 5px;\n    padding: 5px;\n}\n\n.react-tagsinput-remove {\n    cursor: pointer;\n    font-weight: bold;\n}\n\n.react-tagsinput-tag a::before {\n    content: \" ×\";\n}\n\n.react-tagsinput-input {\n    background: transparent;\n    border: 0;\n    color: #777;\n    font-family: sans-serif;\n    font-size: 13px;\n    font-weight: 400;\n    margin-bottom: 6px;\n    margin-top: 1px;\n    outline: none;\n    padding: 5px;\n    width: 80px;\n}\n\n.rdg-cell > button {\n    width: 100%;\n    cursor: pointer;\n    outline: none;\n    -webkit-appearance: none;\n    -moz-appearance: none;\n    color: black;\n    padding: 0;\n    background: #f8f8f8;\n    border: none;\n    box-shadow: var(--metanno-box-shadow);\n    border-radius: 2px 2px 2px 2px;\n}\n\n.rdg-cell-editing {\n    padding: 0\n}\n\n.rdg-cell:focus, .rdg-cell[aria-selected=true] {\n    outline: 0\n}\n\n.metanno-table > div {\n    overflow-y: scroll;\n    scrollbar-width: none; /* Firefox */\n    -ms-overflow-style: none;  /* Internet Explorer 10+ */\n}\n.metanno-table > div::-webkit-scrollbar { /* WebKit */\n    width: 0;\n    height: 0;\n}\n\n.rdg-cell a, .rdg-cell span {\n    max-width: 100%;\n    display: inline-block;\n    text-overflow: ellipsis;\n    overflow: hidden;\n}\n\n.rdg-cell:last-child {\n    border-right: none;\n}\n", "",{"version":3,"sources":["webpack://./client/components/Table/style.css"],"names":[],"mappings":"AAAA;IACI,iBAAiB;AACrB;;AAEA;IACI,YAAY;IACZ,WAAW;IACX,gBAAgB;IAChB,gBAAgB;AACpB;;AAEA;IACI,uCAAuC;IACvC,mCAAmC;AACvC;;AAEA;IACI,iBAAiB;IACjB,YAAY;IACZ,mCAAmC;IACnC,mCAAmC;IACnC,mBAAmB;IACnB,qCAAqC;AACzC;;AAEA;IACI,iBAAiB;IACjB,UAAU;AACd;;AAEA;IACI,gBAAgB;IAChB,mBAAmB;AACvB;;AAEA;IACI,+CAA+C;IAC/C,mBAAmB;AACvB;;AAEA;IACI,qCAAqC,EAAE,gFAAgF;IACvH,YAAY;IACZ,YAAY;AAChB;;AAEA;IACI,cAAc;AAClB;;AAEA;IACI,0BAA0B;AAC9B;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,uBAAuB;IACvB,YAAY;IACZ,cAAc;IACd,iBAAiB;AACrB;;AAEA;IACI,iBAAiB;AACrB;;AAEA;IACI,cAAc;IACd,iBAAiB;IACjB,aAAa;IACb,gBAAgB;AACpB;;AAEA;IACI,yBAAyB;IACzB,kBAAkB;IAClB,yBAAyB;IACzB,cAAc;AAClB;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,aAAa;AACjB;;;AAGA;;AAEA;;AAEA;IACI,mDAAmD;AACvD;;AAEA;IACI,gBAAgB;IAChB,iBAAiB;AACrB;;AAEA;IACI,kBAAkB;AACtB;;AAEA,eAAe;AACf;IACI,sBAAsB;IACtB,sBAAsB;IACtB,gBAAgB;IAChB,iBAAiB;IACjB,gBAAgB;AACpB;;AAEA;IACI,qBAAqB;AACzB;;AAEA;IACI,yBAAyB;IACzB,kBAAkB;IAClB,yBAAyB;IACzB,cAAc;IACd,qBAAqB;IACrB,uBAAuB;IACvB,eAAe;IACf,gBAAgB;IAChB,kBAAkB;IAClB,iBAAiB;IACjB,YAAY;AAChB;;AAEA;IACI,eAAe;IACf,iBAAiB;AACrB;;AAEA;IACI,aAAa;AACjB;;AAEA;IACI,uBAAuB;IACvB,SAAS;IACT,WAAW;IACX,uBAAuB;IACvB,eAAe;IACf,gBAAgB;IAChB,kBAAkB;IAClB,eAAe;IACf,aAAa;IACb,YAAY;IACZ,WAAW;AACf;;AAEA;IACI,WAAW;IACX,eAAe;IACf,aAAa;IACb,wBAAwB;IACxB,qBAAqB;IACrB,YAAY;IACZ,UAAU;IACV,mBAAmB;IACnB,YAAY;IACZ,qCAAqC;IACrC,8BAA8B;AAClC;;AAEA;IACI;AACJ;;AAEA;IACI;AACJ;;AAEA;IACI,kBAAkB;IAClB,qBAAqB,EAAE,YAAY;IACnC,wBAAwB,GAAG,0BAA0B;AACzD;AACA,0CAA0C,WAAW;IACjD,QAAQ;IACR,SAAS;AACb;;AAEA;IACI,eAAe;IACf,qBAAqB;IACrB,uBAAuB;IACvB,gBAAgB;AACpB;;AAEA;IACI,kBAAkB;AACtB","sourcesContent":[".jp-Notebook .metanno-table {\n    min-height: 100px;\n}\n\n.metanno-table {\n    height: 100%;\n    width: 100%;\n    overflow: hidden;\n    min-height: 50px;\n}\n\n.metanno-table, .metanno-table input {\n    font-family: var(--metanno-font-family);\n    font-size: var(--metanno-font-size);\n}\n\n.metanno-table-filter {\n    inline-size: 100%;\n    padding: 4px;\n    font-size: var(--metanno-font-size);\n    background: var(--background-color);\n    color: var(--color);\n    border: 1px solid var(--border-color);\n}\n\n.metanno-table-header-filter {\n    line-height: 30px;\n    padding: 0;\n}\n\n.metanno-table-header-filter > div > div {\n    padding-block: 0;\n    padding-inline: 4px;\n}\n\n.metanno-table-header-filter > div > div:first-child {\n    border-block-end: 1px solid var(--border-color);\n    padding-inline: 8px;\n}\n\n.metanno-table > div.rdg {\n    --font-size: var(--metanno-font-size); /* more specific than react-data-grid's .rnvodz5700-beta7 selector to override */\n    height: 100%;\n    border: none;\n}\n\n.metanno-table a {\n    color: #106ba3;\n}\n\n.metanno-table a:hover {\n    text-decoration: underline;\n}\n\n.metanno-table .rdg-cell-mask:focus {\n    outline: none;\n}\n\n.metanno-table .react-tagsinput {\n    background: transparent;\n    border: none;\n    padding-top: 0;\n    padding-bottom: 0;\n}\n\n.metanno-table .react-tagsinput > span {\n    line-height: 14px;\n}\n\n.metanno-table .react-tagsinput-tag, .metanno-table .react-tagsinput-input {\n    padding-top: 0;\n    padding-bottom: 0;\n    margin-top: 0;\n    margin-bottom: 0;\n}\n\n.metanno-table .react-tagsinput-tag {\n    background-color: #ffffff;\n    border-radius: 2px;\n    border: 1px solid #4a9bd2;\n    color: #000000;\n}\n\n.metanno-table .react-tagsinput-input:focus {\n    outline: none;\n}\n\n.metanno-table .react-tagsinput.disabled .react-tagsinput-input {\n    display: none;\n}\n\n\n.metanno-tagscell-container {\n\n}\n\n.rdg-row.metanno-row--highlighted {\n    background-color: var(--row-hover-background-color);\n}\n\n.metanno-table .rdg-row, .metanno-table .rdg-cell {\n    contain: initial;\n    overflow: visible;\n}\n\n.metanno-table .rdg-cell {\n    position: relative;\n}\n\n/* TAGS INPUT */\n.react-tagsinput {\n    background-color: #fff;\n    border: 1px solid #ccc;\n    overflow: hidden;\n    padding-left: 5px;\n    padding-top: 5px;\n}\n\n.react-tagsinput--focused {\n    border-color: #a5d24a;\n}\n\n.react-tagsinput-tag {\n    background-color: #cde69c;\n    border-radius: 2px;\n    border: 1px solid #a5d24a;\n    color: #638421;\n    display: inline-block;\n    font-family: sans-serif;\n    font-size: 13px;\n    font-weight: 400;\n    margin-bottom: 5px;\n    margin-right: 5px;\n    padding: 5px;\n}\n\n.react-tagsinput-remove {\n    cursor: pointer;\n    font-weight: bold;\n}\n\n.react-tagsinput-tag a::before {\n    content: \" ×\";\n}\n\n.react-tagsinput-input {\n    background: transparent;\n    border: 0;\n    color: #777;\n    font-family: sans-serif;\n    font-size: 13px;\n    font-weight: 400;\n    margin-bottom: 6px;\n    margin-top: 1px;\n    outline: none;\n    padding: 5px;\n    width: 80px;\n}\n\n.rdg-cell > button {\n    width: 100%;\n    cursor: pointer;\n    outline: none;\n    -webkit-appearance: none;\n    -moz-appearance: none;\n    color: black;\n    padding: 0;\n    background: #f8f8f8;\n    border: none;\n    box-shadow: var(--metanno-box-shadow);\n    border-radius: 2px 2px 2px 2px;\n}\n\n.rdg-cell-editing {\n    padding: 0\n}\n\n.rdg-cell:focus, .rdg-cell[aria-selected=true] {\n    outline: 0\n}\n\n.metanno-table > div {\n    overflow-y: scroll;\n    scrollbar-width: none; /* Firefox */\n    -ms-overflow-style: none;  /* Internet Explorer 10+ */\n}\n.metanno-table > div::-webkit-scrollbar { /* WebKit */\n    width: 0;\n    height: 0;\n}\n\n.rdg-cell a, .rdg-cell span {\n    max-width: 100%;\n    display: inline-block;\n    text-overflow: ellipsis;\n    overflow: hidden;\n}\n\n.rdg-cell:last-child {\n    border-right: none;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./client/style.css":
/*!****************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./client/style.css ***!
  \****************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/* Light Theme, feel free to override */\n:root[data-theme=\"light\"] {\n    --metanno-color: #000;\n    --metanno-background-color: #fff;\n}\n\n/* Dark Theme, feel free to override */\n:root[data-theme=\"dark\"] {\n    --metanno-color: #fff;\n    --metanno-background-color: #1f1d1d;\n}\n\n:root, .metanno-table > .rdg {\n    /* --metanno-font-size: 1rem; */\n    --metanno-font-family: Verdana, --apple-system, BlinkMacSystemFont, \"Segoe UI\", Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n    --metanno-box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.24);\n}\n\n.jp-OutputArea {\n    --metanno-font-size: var(--jp-code-font-size);\n}\n", "",{"version":3,"sources":["webpack://./client/style.css"],"names":[],"mappings":"AAAA,uCAAuC;AACvC;IACI,qBAAqB;IACrB,gCAAgC;AACpC;;AAEA,sCAAsC;AACtC;IACI,qBAAqB;IACrB,mCAAmC;AACvC;;AAEA;IACI,+BAA+B;IAC/B,sKAAsK;IACtK,yDAAyD;AAC7D;;AAEA;IACI,6CAA6C;AACjD","sourcesContent":["/* Light Theme, feel free to override */\n:root[data-theme=\"light\"] {\n    --metanno-color: #000;\n    --metanno-background-color: #fff;\n}\n\n/* Dark Theme, feel free to override */\n:root[data-theme=\"dark\"] {\n    --metanno-color: #fff;\n    --metanno-background-color: #1f1d1d;\n}\n\n:root, .metanno-table > .rdg {\n    /* --metanno-font-size: 1rem; */\n    --metanno-font-family: Verdana, --apple-system, BlinkMacSystemFont, \"Segoe UI\", Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\";\n    --metanno-box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.24);\n}\n\n.jp-OutputArea {\n    --metanno-font-size: var(--jp-code-font-size);\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ })

}]);
//# sourceMappingURL=client_style_css-client_dist-globals_ts.9bee6c7e09a896927b36.js.map