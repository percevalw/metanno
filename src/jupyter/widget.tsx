import "regenerator-runtime/runtime";
// @ts-ignore
import {Widget} from '@lumino/widgets';
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import React from "react";
import TextView from "../containers/TextContainer";
import TableContainer from "../containers/TableContainer";
import MetannoManager from "./manager";
import {eval_code} from "./loadTranscypt";
import {decode, SourceMapMappings} from 'sourcemap-codec';

export type WidgetCode = {
    code: string,
    py_code: string,
    sourcemap: string,
};

export type MetannoWidgetOptions = {
    widget_id?: string,
    widget_type?: string,
    widget_code?: WidgetCode,
    widget_state_id?: string,
}

/**
 * A renderer for widgets.
 */
export default class MetannoWidget extends Widget {
    public app: any;
    private source_code_py: string;
    private sourcemap: SourceMapMappings;

    private readonly _mimeType: string;
    // private _manager: Promise<metannoManager>;
    public manager: MetannoManager;
    // private setManager: (value: MetannoManager | PromiseLike<MetannoManager>) => void;
    model: any;
    private _widget_id: string;
    private _widget_type: string;
    private _widget_state_id: string;
    private _widget_code: WidgetCode;

    constructor(
        options: MetannoWidgetOptions & {mimeType: string},
        manager: MetannoManager,
    ) {
        super();

        this.app = null;
        this.sourcemap = null;
        this.source_code_py = '';

        this._mimeType = options.mimeType;
        this._widget_id = options.widget_id;
        this._widget_type = options.widget_type;
        this._widget_state_id = options.widget_state_id;
        this._widget_code = options.widget_code;
        this.manager = manager

        this.model = null;

        // Widget will either show up "immediately", ie as soon as the manager is ready,
        // or this method will return prematurely (no widget_id/widget_type/model) and will
        // wait for the mimetype manager to assign a model to this widget and call renderModel
        // on its own (which will call showContent)
        this.addClass('metanno-widget');

        this.loadApp();
        this.showContent();
    }

    get widget_id() {
        if (!this._widget_id && this.model) {
            const source = this.model.data[this._mimeType];
            this._widget_id = source['widget_id'];
        }
        return this._widget_id
    }

    get widget_type() {
        if (!this._widget_type && this.model) {
            const source = this.model.data[this._mimeType];
            this._widget_type = source['widget_type'];
        }
        return this._widget_type
    }

    get widget_code() {
        if (!this._widget_code && this.model) {
            const source = this.model.data[this._mimeType];
            this._widget_code = source['widget_code'];
        }
        return this._widget_code
    }

    get widget_state_id() {
        if (!this._widget_state_id && this.model) {
            const source = this.model.data[this._mimeType];
            this._widget_state_id = source['widget_state_id'];
        }
        return this._widget_state_id
    }

    /**
     * The widget manager.
     */
    // set manager(value) {
    //     value.restored.connect(this._rerender, this);
    //     this.setManager(value);
    // }

    setFlag(flag: Widget.Flag) {
        const wasVisible = this.isVisible;
        super.setFlag(flag);
        if (this.isVisible && !wasVisible) {
            this.showContent();
        }
        else if (!this.isVisible && wasVisible) {
            this.hideContent();
        }
    }

    clearFlag(flag: Widget.Flag) {
        const wasVisible = this.isVisible;
        super.clearFlag(flag);
        if (this.isVisible && !wasVisible) {
            this.showContent();
        }
        else if (!this.isVisible && wasVisible) {
            this.hideContent();
        }
    }

    async renderModel(model) {
        this.model = model;
        this.loadApp()
        this.showContent();
    }

    loadApp() {
        if (!this.widget_code)
            return

        this.app = eval_code(this.widget_code.code)(
            /*state=*/null,
            /*name*/this.widget_id,
        );
        this.app.manager = this.manager;
        this.app._state_id = this.widget_state_id;
        this.app.widget_id = this.widget_id;

        this.sourcemap = decode(this.widget_code.sourcemap);
        this.source_code_py = this.widget_code.py_code;
    }

    async hideContent() {
        if (!this.isVisible) {
            ReactDOM.unmountComponentAtNode(this.node);
            this.manager.unregister_widget(this.widget_state_id, this.widget_id, this.app);
        }
    }

    showContent() {
        if (!this.isVisible || !this.app)
            return;

        let widget_id = this.widget_id;
        let widget_type = this.widget_type;
        this.manager.register_widget(this.widget_state_id, widget_id, this.app);

        // Let's be optimistic, and hope the widget state will come later.
        this.node.textContent = 'Loading widget...' + widget_id;

        try {
            ReactDOM.unmountComponentAtNode(this.node);
        } catch (e) {}

        const wrap = fn => {
            const producer = this.manager.produce(fn, this.app, this.widget_state_id);
            return (...args) => {
                this.queueTryCatchExec(producer, ...args)
            }
        }

        if (widget_type === "text-widget") {
            ReactDOM.render(
                <Provider store={this.manager.store}>
                    <TextView
                        id={widget_id}
                        stateId={this.widget_state_id}
                        selectState={(...args) => {
                            this.app.state = this.manager.getState(this.widget_state_id);
                            return this.tryCatchExec(this.app?.render, ...args)
                        }}

                        onClickSpan={wrap(this.app?.handle_click_span)}
                        onMouseEnterSpan={wrap(this.app?.handle_mouse_enter_span)}
                        onMouseLeaveSpan={wrap(this.app?.handle_mouse_leave_span)}
                        onKeyPress={wrap(this.app?.handle_key_press)}
                        onMouseSelect={wrap(this.app?.handle_mouse_select)}
                        onButtonPress={wrap(this.app?.handle_button_press)}

                        registerActions={methods => {this.app._actions = methods}}
                    />
                </Provider>,
                this.node,
            );
        } else if (widget_type === "table-widget") {
            ReactDOM.render(
                <Provider store={this.manager.store}>
                    <TableContainer
                        id={widget_id}
                        stateId={this.widget_state_id}
                        selectState={(...args) => {
                            this.app.state = this.manager.getState(this.widget_state_id);
                            return this.tryCatchExec(this.app?.render, ...args)
                        }}

                        /*onKeyPress={wrap(this.app?.handle_key_press)}*/
                        onClickCellContent={wrap(this.app?.handle_click_cell_content)}
                        onMouseEnterRow={wrap(this.app?.handle_mouse_enter_row)}
                        onMouseLeaveRow={wrap(this.app?.handle_mouse_leave_row)}
                        onPositionChange={wrap(this.app?.handle_position_change)}
                        onCellChange={wrap(this.app?.handle_cell_change)}
                        onFiltersChange={wrap(this.app?.handle_filters_change)}
                        onButtonPress={wrap(this.app?.handle_button_press)}
                        onInputChange={wrap(this.app?.handle_input_change)}

                        registerActions={methods => { this.app._actions = methods; }}
                    />
                </Provider>,
                this.node,
            );
        }

        /*let wModel;
        try {
            // Presume we have a DOMWidgetModel. Should we check for sure?
            wModel = (await manager.get_model(source.model_id));
        } catch (err) {
            if (manager.restoredStatus) {
                // The manager has been restored, so this error won't be going away.
                this.node.textContent = 'Error displaying widget: model not found';
                this.addClass('jupyter-widgets');
                console.error(err);
                return;
            }

            // Store the model for a possible rerender
            this._rerenderMimeModel = model;
            return;
        }

        // Successful getting the model, so we don't need to try to rerender.
        this._rerenderMimeModel = null;

        let widget;
        try {
            widget = (await manager.create_view(wModel)).pWidget;
        } catch (err) {
            this.node.textContent = 'Error displaying widget';
            this.addClass('jupyter-widgets');
            console.error(err);
            return;
        }

        // When the widget is disposed, hide this container and make sure we
        // change the output model to reflect the view was closed.
        widget.disposed.connect(() => {
            this.hide();
            source.model_id = '';
        });*/
    }


        /**
         * Executes a function and display any error using custom components
         *
         * @param fn: Function to execute
         * @param args: Call arguments
         */
        tryCatchExec = (fn: Function, ...args: any[]): any => {
            try {
                if (fn) {
                    return fn(...args);
                }
            } catch (e) {
                this.handleException(e)
            }
        };


        /**
         * Queue the execution of a function, to avoid concurrent access to the state
         *
         * @param fn: Function to execute
         * @param args: Call arguments
         */
        queueTryCatchExec = (fn: Function, ...args: any[]): void => {
            this.manager.lock = this.manager.lock.then(() => {
                return this.tryCatchExec(fn, ...args);
            }).catch(this.handleException);
        };

        handleException = (e: Error) => {
            console.log("Got an error !");
            console.log(e);
            const py_lines = [...e.stack.matchAll(/<anonymous>:(\d+):(\d+)/gm)];
            if (py_lines.length > 0 && this.sourcemap !== null) {
                const [_, lineStr, columnStr] = py_lines[0];
                const source_line_str = this.source_code_py.split("\n")[this.sourcemap[parseInt(lineStr) - 1][0][2]].trim();
                this.manager.toastError(`Error: ${e.message} at \n${source_line_str}`);
            } else { // @ts-ignore
                if (e.__args__) {
                    // @ts-ignore
                    this.manager.toastError(`Error: ${e.__args__[0]}`);
                } else {
                    this.manager.toastError(`Error: ${e.message}`);
                }
            }
        };

    /**
     * Get whether the manager is disposed.
     *
     * #### Notes
     * This is a read-only property.
     */
    // @ts-ignore
    /*get isDisposed() {
        return this._manager === null;
    }

    /**
     * Dispose the resources held by the manager.
     */
    /*dispose() {
        if (this.isDisposed) {
            return;
        }
        super.dispose();
        this._manager = null;
    }

    _rerender() {
        if (this._rerenderMimeModel) {
            // Clear the error message
            this.node.textContent = '';
            this.removeClass('jupyter-widgets');

            // Attempt to rerender.
            this.renderModel(this._rerenderMimeModel).then();
        }
    }*/

    /**
     * The mimetype being rendered.
     */
};