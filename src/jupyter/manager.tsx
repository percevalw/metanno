import "regenerator-runtime/runtime";
import React from "react";

import {applyMiddleware, compose, createStore, Store} from "redux";
import {applyPatches, createDraft, enablePatches, finishDraft, Patch} from "immer";
// @ts-ignore
import {JSONObject, JSONValue, UUID} from "@lumino/coreutils";
// @ts-ignore
import {DocumentRegistry} from "@jupyterlab/docregistry";
// @ts-ignore
import {IComm, IKernelConnection} from "@jupyterlab/services/lib/kernel/kernel";
// @ts-ignore
import {IChangedArgs} from "@jupyterlab/coreutils";
// @ts-ignore
import {Kernel} from "@jupyterlab/services";
// @ts-ignore
import {ISessionContext} from "@jupyterlab/apputils/lib/sessioncontext";
import {INotification} from 'jupyterlab_toastify';
// @ts-ignore
import * as KernelMessage from "@jupyterlab/services/lib/kernel/messages";
import "./metanno.css";
import {arrayEquals} from "../utils";

enablePatches();

export default class MetannoManager {
    public actions: { [widget_id: string]: { [action_name: string]: Function } };
    public store: Store;
    public widgets: { [widget_id: string]: any }; // Transpiled python widgets code
    public id: string;
    public lock: Promise<void>;

    private context: DocumentRegistry.IContext<DocumentRegistry.IModel>;
    private isDisposed: boolean;
    private readonly comm_target_name: string;
    private settings: { saveState: boolean };

    //modelsSync: Map<any>;
    private comm: IComm;
    private readonly callbacks: { [callbackId: string]: (any) => void };

    // Lock promise to chain events, and avoid concurrent state access
    // Each event calls .then on this promise and replaces it to queue itself
    private unsyncPaths: { [state_id: string]: string[][] };

    constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>, settings: { saveState: boolean }) {
        this.actions = {};
        this.id = UUID.uuid4();
        this.callbacks = {};

        this.comm_target_name = 'metanno';
        this.context = context;
        this.comm = null;
        this.widgets = {};
        this.lock = Promise.resolve();
        this.store = this.createStore();
        this.unsyncPaths = {}

        // this.modelsSync = new Map();
        // this.onUnhandledIOPubMessage = new Signal(this);


        // https://github.com/jupyter-widgets/ipywidgets/commit/5b922f23e54f3906ed9578747474176396203238
        context?.sessionContext.kernelChanged.connect((
            sender: ISessionContext,
            args: IChangedArgs<Kernel.IKernelConnection | null, Kernel.IKernelConnection | null, 'kernel'>
        ) => {
            this._handleKernelChanged(args);
        });

        context?.sessionContext.statusChanged.connect((
            sender: ISessionContext,
            status: Kernel.Status,
        ) => {
            this._handleKernelStatusChange(status);
        });

        if (context?.sessionContext.session?.kernel) {
            this._handleKernelChanged({
                name: 'kernel',
                oldValue: null,
                newValue: context.sessionContext.session?.kernel
            });
        }

        this.connectToAnyKernel().then();

        this.settings = settings;
        /*context.saveState.connect((sender, saveState) => {
            if (saveState === 'started' && settings.saveState) {
                this.saveState();
            }
        });*/
    }

    _handleCommOpen = (comm: IComm, msg?: KernelMessage.ICommOpenMsg) => {
        // const data = (msg.content.data);
        // hydrate state ?
        console.log("New comm !")
        this.comm = comm;
        this.comm.onMsg = this.handleMessage;
        console.log("SEND SYNC MESSAGE");
        this.comm.send({
            "method": "sync_request",
            "data": {}
        });
    };

    /**
     * Create a comm.
     */

    _create_comm = async (
        target_name: string,
        model_id: string,
        data?: JSONValue,
        metadata?: JSONObject,
        buffers?: (ArrayBuffer | ArrayBufferView)[]
    ): Promise<IComm> => {
        let kernel = this.context?.sessionContext.session?.kernel;
        if (!kernel) {
            throw new Error('No current kernel');
        }
        let comm = kernel.createComm(target_name, model_id);
        if (data || metadata) {
            comm.open(data, metadata, buffers);
        }
        return comm;
    }

    /**
     * Get the currently-registered comms.
     */
    _get_comm_info = async (): Promise<any> => {
        let kernel = this.context?.sessionContext.session?.kernel;
        if (!kernel) {
            throw new Error('No current kernel');
        }
        const reply = await kernel.requestCommInfo({target_name: this.comm_target_name});
        if (reply.content.status === 'ok') {
            return (reply.content).comms;
        } else {
            return {};
        }
    }

    connectToAnyKernel = async () => {
        if (!this.context?.sessionContext) {
            console.log("No session context")
            return;
        }
        console.log("Awaiting session ready")
        await this.context.sessionContext.ready;

        if (this.context?.sessionContext.session.kernel.handleComms === false) {
            console.log("handleComms === false")
            return;
        }
        const all_comm_ids = await this._get_comm_info();
        const relevant_comm_ids = Object.keys(all_comm_ids).filter(key => all_comm_ids[key]['target_name'] === this.comm_target_name);
        console.log("Jupyter annotator comm ids", relevant_comm_ids, "(there should be at most one)");
        if (relevant_comm_ids.length > 0) {
            const comm = await this._create_comm(
                this.comm_target_name,
                relevant_comm_ids[0]);
            this._handleCommOpen(comm);
        }
    };

    /**
     * Register a callback that will be called when the kernel has sent back the
     * return of a remote method call
     *
     * @param callbackId - the callback ID, to know which call does the callback resolves
     * @param callback - the resolve method of a Promise
     */
    registerRemoteCallback = (callbackId: string, callback: (any) => void) => {
        this.callbacks[callbackId] = callback;
    }

    /**
     * Remotely calls a method and returns a Promise that awaits for the call to end
     * on the kernel and the return value to be sent back, to be resolved
     *
     * @param state_id - id of the state the widget is linked to
     * @param widget_id - id of the widget on which to call the method
     * @param func_name - the name of the method to call remotely
     * @param args - the arguments of the call
     */
    remoteCall = (state_id, widget_id, func_name, args) => {
        const callbackId = UUID.uuid4()
        this.comm.send({
            'method': 'method_call',
            'data': {
                'method_name': func_name,
                'args': args,
                'callback_id': callbackId,
                'widget_id': widget_id,
                'state_id': state_id,
            }
        });
        return new Promise((resolve, reject) => {
            this.registerRemoteCallback(callbackId, resolve);
        });
    }

    getState = (stateId) => {
        return this.store.getState()[stateId] || {}
    }

    handleMessage = (msg: KernelMessage.ICommMsgMsg) => {
        try {
            const {method, data} = msg.content.data as { method: string, data: any };
            const exceptId = msg?.metadata?.exceptId;
            if (this.id === exceptId) {
                return;
            }
            console.log("RECEIVED", msg.content.data);
            switch (method) {
                case "error":
                    // @ts-ignore
                    this.toastError(...data.args, data.autoClose)
                    break
                case "info":
                    // @ts-ignore
                    this.toastInfo(...data.args, data.autoClose)
                    break
                case "method_call":
                    this.widgets[data.state_id]?.[data.widget_id]?.[data.method_name]?.(...data.args);
                    break
                case "method_return":
                    this.callbacks[data.callback_id](data.value);
                    delete this.callbacks[data.callback_id];
                    break
                case "set_state":
                    this.store.dispatch({
                        'type': 'SET_STATE',
                        'state': data.state,
                        'state_id': data.state_id,
                    })
                    this.unsyncPaths[data.state_id] = data.unsync
                    break;
                case "patch_state":
                    const newState = applyPatches(
                        this.store.getState()[data.state_id],
                        data.patches
                    );
                    try {
                        this.store.dispatch({
                            'type': 'SET_STATE',
                            'state': newState,
                            'state_id': data.state_id,
                        })
                    } catch (error) {
                        console.error("ERROR DURING PATCHING")
                        console.error(error);
                    }
                    break;
                case "delete_state":
                    this.store.dispatch({
                        'type': 'DELETE_STATE',
                        'state_id': data.state_id,
                    })
                    if (data.state_id in this.unsyncPaths) {
                        delete this.unsyncPaths[data.state_id]
                    }
                    break
                default:
                    break;
            }
        } catch (e) {
            console.error("Error during comm message reception", e);
        }
    };

    toastError = (message, autoClose = 10000) => {
        //INotification.error(`Message: ${e.message} at ${parseInt(lineStr)-1}:${parseInt(columnStr)-1}`);
        INotification.error(<div>{message.split("\n").map(line => <p>{line}</p>)}</div>, {autoClose: autoClose});
    }

    toastInfo = (message, autoClose = 10000) => {
        //INotification.error(`Message: ${e.message} at ${parseInt(lineStr)-1}:${parseInt(columnStr)-1}`);
        INotification.info(<div>{message.split("\n").map(line => <p>{line}</p>)}</div>, {autoClose: autoClose});
    }

    /*_saveState() {
        const state = this.get_state_sync({drop_defaults: true});
        this._context.model.metadata.set('widgets', {
            'application/vnd.jupyter.annotator-state+json': state
        });
    }*/

    /**
     * Restore widgets from kernel and saved state.
     */
    /*async restoreWidgets(notebook, {loadKernel, loadNotebook} = {loadKernel: true, loadNotebook: true}) {
        if (loadKernel) {
            await this._loadFromKernel();
        }
        if (loadNotebook) {
            await this._loadFromNotebook(notebook);
        }
    }*/

    /*async _loadFromNotebook(notebook) {
        const widget_md = notebook.metadata.get('widgets');
        // Restore any widgets from saved state that are not live
        if (widget_md && widget_md[MIMETYPE]) {
            // TODO redux hydrating here
        }
    }*/

    /**
     * Register a new kernel
     */
    _handleKernelChanged = (
        {
            name,
            oldValue,
            newValue
        }: { name: string, oldValue: IKernelConnection | null, newValue: IKernelConnection | null }) => {
        console.debug("handleKernelChanged", oldValue, newValue);
        console.log("handleKernelChanged", oldValue, newValue);
        if (oldValue) {
            this.comm = null;
            oldValue.removeCommTarget(this.comm_target_name, this._handleCommOpen);
        }

        if (newValue) {
            newValue.registerCommTarget(this.comm_target_name, this._handleCommOpen);
        }
    };

    _handleKernelStatusChange = (status: Kernel.Status) => {
        switch (status) {
            case 'autorestarting':
            case 'restarting':
            case 'dead':
                //this.disconnect();
                break;
            default:
        }
    };

    reduce = (state = null, action) => {
        switch (action.type) {
            case 'SET_STATE':
                return {
                    ...state,
                    [action.state_id]: action.state
                };
            case 'DELETE_STATE':
                const newState = {
                    ...state,
                }
                delete newState[action.state_id]
                return newState
            default:
                return state;
        }
    }

    createStore = (): Store => {
        const composeEnhancers =
            typeof window === 'object' &&
            // @ts-ignore
            window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
                // @ts-ignore
                window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
                    // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
                }) : compose;

        return createStore(
            this.reduce,
            composeEnhancers(
                applyMiddleware(
                    // thunkMiddleware, // lets us dispatch() functions
                    // loggerMiddleware, // neat middleware that logs actions
                    // this.reduxMiddleware,
                )
            )
        );
    };

    produce = (fn, app, stateId) => {
        const new_fn = async (...args) => {
            let recordedPatches: Patch[] = [];
            // Create a new immer draft for the state and make it available to the app instance
            app.state = createDraft(this.getState(stateId));

            // Await the function result (in case it is async, when it queries the backend)
            await fn(...args);

            // Finish the draft and if the state has changed, update the redux state and send the patches to the backend
            finishDraft(app.state, (patches, inversePatches) => recordedPatches = patches);

            if (recordedPatches.length > 0) {
                const newState = applyPatches(this.getState(stateId), recordedPatches);

                this.store.dispatch({
                    type: 'SET_STATE',
                    state_id: stateId,
                    state: newState
                });

                // Trim down the list of patches to send over to the kernel
                recordedPatches = recordedPatches.filter((patch: Patch) => {
                    // Keep any patch for which not any skip path matched its path
                    return !this.unsyncPaths[stateId].some(skipPath =>
                        arrayEquals(patch.path.slice(0, skipPath.length), skipPath)
                    )
                })

                if (recordedPatches.length > 0) {
                    // @ts-ignore
                    if (new_fn.frontend_only || fn.frontend_only)
                        return;
                    this.comm.send({
                        'method': 'patch_state',
                        'data': {
                            'state_id': stateId,
                            'patches': ((recordedPatches as unknown) as JSONValue[]),
                        }
                    }, {
                        id: this.id,
                    })
                }
            }
            delete app.state;
        }
        return new_fn;
    }

    get_widget = (stateId, widgetId) => {
        return this.widgets?.[stateId]?.[widgetId]
    }

    register_widget(widget_state_id: string, widget_id: string, app: any) {
        if (!this.widgets[widget_state_id])
            this.widgets[widget_state_id] = {}
        this.widgets[widget_state_id][widget_id] = app
    }

    unregister_widget(widget_state_id: string, widget_id: string, app: any=null) {
        if (!this.widgets[widget_state_id])
            return
        // Only unregister the widget if the widget instance was not specified or
        // if it is the same as the one registered (in case a new instance of the same
        // widget was registered after the first one, like when hitting the 'Detach' btn
        if (!app || this.widgets[widget_state_id][widget_id] == app) {
            delete this.widgets[widget_state_id][widget_id]
        }
    }
}
