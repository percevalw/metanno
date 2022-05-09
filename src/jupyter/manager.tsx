import "regenerator-runtime/runtime";
import React from "react";

import {applyMiddleware, compose, createStore, Store} from "redux";
import {eval_code} from "./loadTranscypt";
import {applyPatches, enablePatches} from "immer";
// @ts-ignore
import {JSONObject, JSONValue} from "@lumino/coreutils";
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
import {UUID} from "@lumino/coreutils";
import {decode, SourceMapMappings} from 'sourcemap-codec';
import "./metanno.css";

enablePatches();

export default class metannoManager {
    public actions: { [editor_id: string]: { [action_name: string]: Function } };
    public app: any;
    public store: Store;
    public views: Set<any>;
    public id: string;

    private context: DocumentRegistry.IContext<DocumentRegistry.IModel>;
    private isDisposed: boolean;
    private readonly comm_target_name: string;
    private settings: { saveState: boolean };

    //modelsSync: Map<any>;
    private comm: IComm;
    private source_code_py: string;
    private sourcemap: SourceMapMappings;
    private readonly callbacks: { [callbackId: string]: (any) => void };

    // Lock promise to chain events, and avoid concurrent state access
    // Each event calls .then on this promise and replaces it to queue itself
    private lock: Promise<void>;

    constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>, settings: { saveState: boolean }) {
        this.store = this.createStore();
        this.actions = {};
        this.app = null;
        this.id = UUID.uuid4();
        this.callbacks = {};

        this.comm_target_name = 'metanno';
        this.context = context;
        this.comm = null;
        this.views = new Set();
        this.lock = Promise.resolve();

        this.source_code_py = '';
        this.sourcemap = null;

        // this.modelsSync = new Map();
        // this.onUnhandledIOPubMessage = new Signal(this);


        // https://github.com/jupyter-widgets/ipywidgets/commit/5b922f23e54f3906ed9578747474176396203238
        context.sessionContext.kernelChanged.connect((
            sender: ISessionContext,
            args: IChangedArgs<Kernel.IKernelConnection | null, Kernel.IKernelConnection | null, 'kernel'>
        ) => {
            this._handleKernelChanged(args);
        });

        context.sessionContext.statusChanged.connect((
            sender: ISessionContext,
            status: Kernel.Status,
        ) => {
            this._handleKernelStatusChange(status);
        });

        if (context.sessionContext.session?.kernel) {
            this._handleKernelChanged({
                name: 'kernel',
                oldValue: null,
                newValue: context.sessionContext.session?.kernel
            });
        }

        this.connectToAnyKernel().then();//() => {});

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
        this.comm = comm;

        this.comm.onMsg = this.onMsg;

        this.comm.send({
            "method": "sync_request",
            "data": {}
        })
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
        let kernel = this.context.sessionContext.session?.kernel;
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
        let kernel = this.context.sessionContext.session?.kernel;
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
        if (!this.context.sessionContext) {
            return;
        }
        await this.context.sessionContext.ready;

        if (this.context.sessionContext.session.kernel.handleComms === false) {
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
     * @param func_name - the name of the method to call remotely
     * @param args - the arguments of the call
     */
    remoteCall = (func_name, args) => {
        const callbackId = UUID.uuid4()
        this.comm.send({
            'method': 'method_call',
            'data': {
                'method_name': func_name,
                'args': args,
                'callback_id': callbackId,
            }
        });
        return new Promise((resolve, reject) => {
            this.registerRemoteCallback(callbackId, resolve);
        });
    }

    onMsg = (msg: KernelMessage.ICommMsgMsg) => {
        try {
            const {method, data} = msg.content.data as { method: string, data: any };
            const exceptId = msg?.metadata?.exceptId;
            if (this.id === exceptId) {
                return;
            }
            if (method === "action") {
                this.store.dispatch(data);
            } else if (method === "method_call") {
                this.app[data.method_name](...data.args);
            } else if (method === "method_return") {
                this.callbacks[data.callback_id](data.value);
                delete this.callbacks[data.callback_id];
            } else if (method === "patch") {
                try {
                    const newState = applyPatches(this.store.getState(), data.patches);
                    this.store.dispatch({
                        'type': 'SET_STATE',
                        'payload': newState,
                    })
                } catch (error) {
                    console.error("ERROR DURING PATCHING")
                    console.error(error);
                }
            } else if (method === "set_app_code") {
                this.app = eval_code(data.code)();
                this.sourcemap = decode(data.sourcemap);
                this.source_code_py = data.py_code;
                this.app.manager = this;
                this.views.forEach(view => view.showContent())
            } else if (method === "sync") {
                this.store.dispatch({
                    'type': 'SET_STATE',
                    'payload': data.state,
                })
            }
        } catch (e) {
            console.error("Error during comm message reception", e);
        }
    };

    handle_exception = (e: Error) => {
        console.log("Got an error !");
        console.log(e);
        const py_lines = [...e.stack.matchAll(/<anonymous>:(\d+):(\d+)/gm)];
        if (py_lines.length > 0 && this.sourcemap !== null) {
            const [_, lineStr, columnStr] = py_lines[0];
            const source_line_str = this.source_code_py.split("\n")[this.sourcemap[parseInt(lineStr) - 1][0][2]].trim();
            this.toastError(`Error: ${e.message} at \n${source_line_str}`);
        } else { // @ts-ignore
            if (e.__args__) {
                // @ts-ignore
                this.toastError(`Error: ${e.__args__[0]}`);
            } else {
                this.toastError(`Error: ${e.message}`);
            }
        }
    };

    /**
     * Queue the execution of a function, to avoid concurrent access to the state
     *
     * @param fn: Function to execute
     * @param args: Call arguments
     */
    queue_try_catch_exec = (fn: Function, ...args: any[]): void => {
        this.lock = this.lock.then(() => {
            return this.try_catch_exec(fn, ...args);
        }).catch(this.handle_exception);
    };

    /**
     * Executes a function and display any error using custom components
     *
     * @param fn: Function to execute
     * @param args: Call arguments
     */
    try_catch_exec = (fn: Function, ...args: any[]): any => {
        try {
            if (fn) {
                return fn(...args);
            }
        } catch (e) {
            this.handle_exception(e)
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

    /**
     * Disconnect the widget manager from the kernel, setting each model's comm
     * as dead.
     */
    /*disconnect() {
        // super.disconnect();
    }*/

    /**
     * Dispose the resources held by the manager.
     */
    dispose = () => {
        if (this.isDisposed) {
            return;
        }
        this.isDisposed = true;

        // TODO do something with the comm ?
    };

    /**
     * A signal emitted when state is restored to the widget manager.
     *
     * #### Notes
     * This indicates that previously-unavailable widget models might be available now.
     */

    /**
     * Whether the state has been restored yet or not.
     */

    /**
     * A signal emitted for unhandled iopub kernel messages.
     *
     */

    /**
     * Synchronously get the state of the live widgets in the widget manager.
     *
     * This includes all of the live widget models, and follows the format given in
     * the @jupyter-widgets/schema package.
     *
     * @param options - The options for what state to return.
     * @returns A state dictionary
     */
    /*get_state_sync(options = {}) {
        const models = [];
        for (const model of this.modelsSync.values()) {
            if (model.comm_live) {
                models.push(model);
            }
        }
        return serialize_state(models, options);
    }*/

    /* **************************
     *       REDUX STUFF        *
     * ************************** /

    /*reduxMiddleware = store => next => action => {
        (action.meta?.executors || []).map(executor => {
            if (executor === "kernel") {
                this.comm.send({
                    "method": "action",
                    "data": {
                        ...action,
                        "meta": {"executors": [executor]}
                    }
                });
            } else if (executor === "frontend") {
                next(action);
            }
        });
    };*/

    reduce = (state = null, action) => {
        if (action.type === 'SET_STATE') {
            return action.payload;
        }
        if (this.app?.reduce) {
            return this.app.reduce(state, action);
        }
        return state;
    };

    getState = () => this.store.getState();

    dispatch = (action: any) => this.store.dispatch(action);

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
}
