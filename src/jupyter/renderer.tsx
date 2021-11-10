import "regenerator-runtime/runtime";
// @ts-ignore
import {Widget} from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import React from "react";
import SpanEditor from "../containers/SpanEditor";
import TableEditor from "../containers/TableEditor";
import metannoManager from "./manager";

/**
 * A renderer for widgets.
 */
export default class metannoRenderer extends Widget {
    private readonly mimeType: string;
    private _manager: Promise<metannoManager>;
    private setManager: (value: metannoManager | PromiseLike<metannoManager>) => void;
    private _rerenderMimeModel: any;
    private model: any;

    constructor(options, manager) {
        super();
        this.mimeType = options.mimeType;
        if (manager) {
            this._manager = Promise.resolve(manager);
        } else {
            this._manager = new Promise((resolve, reject) => {
                this.setManager = resolve;
            })
        }
        this._rerenderMimeModel = null;
        this.model = null;
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
        }
    }

    async showContent() {
        if (!this.model || !this.isVisible)
            return;

        const source = this.model.data[this.mimeType];
        const editor_id = source['editor-id'];
        const editor_type = source['editor-type'];

        // Let's be optimistic, and hope the widget state will come later.
        this.node.textContent = 'Loading widget...' + editor_id;

        const manager = await this._manager;
        if (editor_type === "span-editor") {
            ReactDOM.render(
                <Provider store={manager.store}>
                    <SpanEditor
                        id={editor_id}
                        onClickSpan={(...args) => manager.app?.handle_click_span(editor_id, ...args)}
                        onEnterSpan={(...args) => manager.app?.handle_enter_span(editor_id, ...args)}
                        onLeaveSpan={(...args) => manager.app?.handle_leave_span(editor_id, ...args)}
                        onKeyPress={(...args) => manager.app?.handle_key_press(editor_id, ...args)}
                        //onKeyDown={(...args) => manager.app?.handle_key_down(editor_id, ...args)}
                        onMouseSelect={(...args) => manager.app?.handle_mouse_select(editor_id, ...args)}
                        onButtonPress={(...args) => manager.app?.handle_button_press(editor_id, ...args)}
                        registerActions={methods => {
                            manager.actions[editor_id] = methods
                        }}
                        selectEditorState={(...args) => manager.app?.select_editor_state(...args)}
                    />
                </Provider>,
                this.node,
            );
        } else if (editor_type === "table-editor") {
            ReactDOM.render(
                <Provider store={manager.store}>
                    <TableEditor
                        id={editor_id}
                        onKeyPress={(...args) => manager.app?.handle_key_press(editor_id, ...args)}
                        onClickCellContent={(...args) => manager.app?.handle_click_cell_content(editor_id, ...args)}
                        onSelectedCellChange={(...args) => manager.app?.handle_select_cell(editor_id, ...args)}
                        onSelectedRowsChange={(...args) => manager.app?.handle_select_rows(editor_id, ...args)}
                        onCellChange={(...args) => manager.app?.handle_cell_change(editor_id, ...args)}
                        registerActions={methods => {
                            manager.actions[editor_id] = methods;
                        }}
                        selectEditorState={(...args) => manager.app?.select_editor_state(...args)}
                        onButtonPress={(...args) => manager.app?.handle_button_press(editor_id, ...args)}
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