import "regenerator-runtime/runtime";
// @ts-ignore
import {Widget} from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import React from "react";
import TextView from "../containers/TextView";
import TableView from "../containers/TableView";
import metannoManager from "./manager";

/**
 * A renderer for widgets.
 */
export default class MetannoRenderer extends Widget {
    private readonly _mimeType: string;
    private _manager: Promise<metannoManager>;
    private setManager: (value: metannoManager | PromiseLike<metannoManager>) => void;
    private _rerenderMimeModel: any;
    private model: any;
    private _editor_id: string;
    private _editor_type: string;

    constructor(options, manager) {
        super();
        this._mimeType = options.mimeType;
        this._editor_id = options.editor_id;
        this._editor_type = options.editor_type;
        if (manager) {
            this._manager = Promise.resolve(manager);
        } else {
            this._manager = new Promise((resolve, reject) => {
                this.setManager = resolve;
            })
        }
        this._rerenderMimeModel = null;
        this.model = null;

        // Widget will either show up "immediately", ie as soon as the manager is ready,
        // or this method will return prematurely (no editor_id/editor_type/model) and will
        // wait for the mimetype manager to assign a model to this widget and call renderModel
        // on its own (which will call showContent)
        this.showContent();
    }

    get editor_id() {
        if (!this._editor_id) {
            const source = this.model.data[this._mimeType];
            this._editor_id = source['editor-id'];
        }
        return this._editor_id
    }

    get editor_type() {
        if (!this._editor_type) {
            const source = this.model.data[this._mimeType];
            this._editor_type = source['editor-type'];
        }
        return this._editor_type
    }

    /**
     * The widget manager.
     */
    set manager(value) {
        value.restored.connect(this._rerender, this);
        this.setManager(value);
    }

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
        await this.showContent();
    }

    async hideContent() {
        if (!this.isVisible) {
            ReactDOM.unmountComponentAtNode(this.node);
            this._manager.then(manager => manager.views.delete(this));
        }
    }

    async showContent() {
        if (!this.isVisible)
            return;

        let editor_id = this._editor_id;
        let editor_type = this._editor_type;
        if (!editor_id || !editor_type) {
            if (this.model) {
                const source = this.model.data[this._mimeType];
                editor_id = source['editor-id'];
                editor_type = source['editor-type'];
            }
            else {
                return;
            }
        }

        // Let's be optimistic, and hope the widget state will come later.
        this.node.textContent = 'Loading widget...' + editor_id;

        const manager = await this._manager;
        manager.views.add(this);

        try {
            ReactDOM.unmountComponentAtNode(this.node);
        } catch (e) {}

        if (editor_type === "span-editor") {
            ReactDOM.render(
                <Provider store={manager.store}>
                    <TextView
                        id={editor_id}
                        selectEditorState={(...args) => manager.try_catch_exec(manager.app?.select_editor_state, ...args)}

                        onClickSpan={(...args) => manager.queue_try_catch_exec(manager.app?.handle_click_span, editor_id, ...args)}
                        onMouseEnterSpan={(...args) => manager.queue_try_catch_exec(manager.app?.handle_mouse_enter_span, editor_id, ...args)}
                        onMouseLeaveSpan={(...args) => manager.queue_try_catch_exec(manager.app?.handle_mouse_leave_span, editor_id, ...args)}
                        onKeyPress={(...args) => manager.queue_try_catch_exec(manager.app?.handle_key_press, editor_id, ...args)}
                        //onKeyDown={(...args) => manager.queue_try_catch_exec(manager.app?.handle_key_down)(editor_id, ...args)}
                        onMouseSelect={(...args) => manager.queue_try_catch_exec(manager.app?.handle_mouse_select, editor_id, ...args)}
                        onButtonPress={(...args) => manager.queue_try_catch_exec(manager.app?.handle_button_press, editor_id, ...args)}
                        registerActions={methods => {manager.actions[editor_id] = methods}}
                    />
                </Provider>,
                this.node,
            );
        } else if (editor_type === "table-editor") {
            ReactDOM.render(
                <Provider store={manager.store}>
                    <TableView
                        id={editor_id}
                        selectEditorState={(...args) => manager.try_catch_exec(manager.app?.select_editor_state, ...args)}

                        onKeyPress={(...args) => manager.queue_try_catch_exec(manager.app?.handle_key_press, editor_id, ...args)}
                        onClickCellContent={(...args) => manager.queue_try_catch_exec(manager.app?.handle_click_cell_content, editor_id, ...args)}
                        onMouseEnterRow={(...args) => manager.queue_try_catch_exec(manager.app?.handle_mouse_enter_row, editor_id, ...args)}
                        onMouseLeaveRow={(...args) => manager.queue_try_catch_exec(manager.app?.handle_mouse_leave_row, editor_id, ...args)}
                        onSelectedPositionChange={(...args) => manager.queue_try_catch_exec(manager.app?.handle_selected_position_change, editor_id, ...args)}
                        onSelectedRowsChange={(...args) => manager.queue_try_catch_exec(manager.app?.handle_select_rows, editor_id, ...args)}
                        onCellChange={(...args) => manager.queue_try_catch_exec(manager.app?.handle_cell_change, editor_id, ...args)}
                        onFiltersChange={(...args) => manager.queue_try_catch_exec(manager.app?.handle_filters_change, editor_id, ...args)}
                        registerActions={methods => { manager.actions[editor_id] = methods; }}
                        onButtonPress={(...args) => manager.queue_try_catch_exec(manager.app?.handle_button_press, editor_id, ...args)}
                        onInputChange={(...args) => manager.queue_try_catch_exec(manager.app?.handle_input_change, editor_id, ...args)}
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
     * Get whether the manager is disposed.
     *
     * #### Notes
     * This is a read-only property.
     */
    // @ts-ignore
    get isDisposed() {
        return this._manager === null;
    }

    /**
     * Dispose the resources held by the manager.
     */
    dispose() {
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
    }

    /**
     * The mimetype being rendered.
     */
};