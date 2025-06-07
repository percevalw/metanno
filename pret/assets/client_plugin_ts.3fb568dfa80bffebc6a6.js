"use strict";
(self["webpackChunkpret_joy"] = self["webpackChunkpret_joy"] || []).push([["client_plugin_ts"],{

/***/ "./client/plugin.ts":
/*!**************************!*\
  !*** ./client/plugin.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _globals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./globals */ "./client/globals.ts");
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./index.css */ "./client/index.css");
// noinspection ES6UnusedImports


function updateMaterialUITheme() {
    const body = document.body;
    const html = document.documentElement;
    // Check the current theme setting in JupyterLab
    const isLightTheme = body.getAttribute('data-jp-theme-light');
    // Update Material UI's theme attribute accordingly
    if (isLightTheme === "true" || isLightTheme === "false") {
        html.setAttribute('data-theme', isLightTheme ? 'light' : 'dark');
    }
}
// Create a new MutationObserver instance to listen for changes in the body tag's attributes
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-jp-theme-light') {
            updateMaterialUITheme();
        }
    });
});
const plugin = {
    id: "pret-joy:plugin", // app
    activate: () => null,
    autoStart: true,
};
// Start observing the body tag for attribute changes
observer.observe(document.body, { attributes: true });
// Initialize the theme when the script loads
updateMaterialUITheme();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);


/***/ })

}]);
//# sourceMappingURL=client_plugin_ts.3fb568dfa80bffebc6a6.js.map