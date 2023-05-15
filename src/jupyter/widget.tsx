import "regenerator-runtime/runtime";
import {Widget as LuminoWidget} from '@lumino/widgets';
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import React from "react";

import MetannoManager from "../manager";
import MetannoViewContainer from "../containers/MetannoContainer";
import {MetannoViewData} from "../types";

/**
 * A renderer for metanno Views with Jupyter (Lumino) framework
 */
export default class MetannoViewWidget extends LuminoWidget {
    public view: any;

    private readonly _mimeType: string;
    public manager: MetannoManager;
    model: any;
    private _viewData: MetannoViewData;

    constructor(
        options: {view_data?: MetannoViewData, mimeType: string},
        manager: MetannoManager,
    ) {
        super();

        this.view = null;

        this._mimeType = options.mimeType;
        this._viewData = options.view_data;
        this.manager = manager;

        this.model = null;

        // Widget will either show up "immediately", ie as soon as the manager is ready,
        // or this method will return prematurely (no view_id/view_type/model) and will
        // wait for the mimetype manager to assign a model to this view and call renderModel
        // on its own (which will call showContent)
        this.addClass('metanno-view');

        this.unpackView();
        this.showContent();
    }

    get viewData() {
        if (!this._viewData && this.model) {
            const source = this.model.data[this._mimeType];
            this._viewData = source['view_data'];
        }
        return this._viewData
    }

    /**
     * The view manager.
     */
    // set manager(value) {
    //     value.restored.connect(this._rerender, this);
    //     this.setManager(value);
    // }

    setFlag(flag: LuminoWidget.Flag) {
        const wasVisible = this.isVisible;
        super.setFlag(flag);
        if (this.isVisible && !wasVisible) {
            this.showContent();
        }
        else if (!this.isVisible && wasVisible) {
            this.hideContent();
        }
    }

    clearFlag(flag: LuminoWidget.Flag) {
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
        this.unpackView()
        this.showContent();
    }

    unpackView() {
        if (!this.viewData)
            return

        this.view = this.manager.unpackView(this.viewData)
    }

    hideContent() {
        if (!this.isVisible) {
            ReactDOM.unmountComponentAtNode(this.node);
            // this.manager.unregister_view(this.view_id, this.view);
        }
    }

    showContent() {
        if (!this.isVisible || !this.view)
            return;

        /*this.manager.register_view(view_id, this.view);*/

        // Let's be optimistic, and hope the view state will come later.
        this.node.textContent = 'Loading view...';

        try {
            ReactDOM.unmountComponentAtNode(this.node);
        } catch (e) {
        }


        ReactDOM.render(
            <Provider store={this.manager.reduxStore}>
                <MetannoViewContainer
                    manager={this.manager}
                    view={this.view}
                />
            </Provider>,
            this.node,
        );
    }
};