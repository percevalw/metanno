import "regenerator-runtime/runtime";
import React from "react";

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
// @ts-ignore
import * as KernelMessage from "@jupyterlab/services/lib/kernel/messages";
import {applyMiddleware, compose, createStore, Store} from "redux";
import {applyPatches, enablePatches, Patch} from "immer";
import {INotification} from 'jupyterlab_toastify';
import {arrayEquals} from "./utils";
import {evalViewCode} from "./unpack";
import {createState, multiProduce, State} from "./state";

import {MetannoViewData} from "./types";

enablePatches();

export default class MetannoManager {
    public actions: { [view_id: string]: { [action_name: string]: Function } };
    public reduxStore: Store;
    public id: string;
    public lock: Promise<void>;

    private context: DocumentRegistry.IContext<DocumentRegistry.IModel>;
    private isDisposed: boolean;
    private readonly comm_target_name: string;
    private settings: { saveState: boolean };

    //modelsSync: Map<any>;
    private comm: IComm;
    private readonly callbacks: { [callbackId: string]: {resolve: (any) => void, reject: (any) => void}};
    private wrapperCache: (WeakMap<(...args) => void, (...args) => void>);

    private readonly variableStore: {[name: string]: any};

    // Lock promise to chain events, and avoid concurrent state access
    // Each event calls .then on this promise and replaces it to queue itself
    private readonly unsyncPaths: { [state_id: string]: string[][] };

    private readonly statesRefs: WeakRef<State>[];

    private readonly viewsData: {[key: string]: MetannoViewData}

    constructor(context: DocumentRegistry.IContext<DocumentRegistry.IModel>, settings: { saveState: boolean }) {
        this.actions = {};
        this.id = UUID.uuid4();
        this.callbacks = {};

        this.comm_target_name = 'metanno';
        this.context = context;
        this.comm = null;
        this.lock = Promise.resolve();
        this.reduxStore = this.createStore();
        this.variableStore = {};
        this.unsyncPaths = {}
        this.wrapperCache = new Map();
        this.statesRefs = [];
        this.viewsData = {};

        // @ts-ignore
        window.METANNO_MANAGER = this;
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
     * @param resolve - the resolve method of a Promise
     */
    registerRemoteCallback = (
        callbackId: string,
        resolve: (any) => void,
        reject: (any) => void,
    ) => {
        this.callbacks[callbackId] = {resolve: resolve, reject: reject};
    }

    /**
     * Remotely calls a method and returns a Promise that awaits for the call to end
     * on the kernel and the return value to be sent back, to be resolved
     *
     * @param functionName - the name of the method to call remotely
     * @param args - the arguments of the call
     */
    remoteCall = (functionName, args) => {
        const callbackId = UUID.uuid4()
        this.comm.send({
            'method': 'method_call',
            'data': {
                'method_name': functionName,
                'args': args,
                'callback_id': callbackId,
            }
        });
        return new Promise((resolve, reject) => {
            this.registerRemoteCallback(callbackId, resolve, reject);
        });
    }

    getState = (stateId) => {
        return this.reduxStore.getState()[stateId] || {}
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
                    if (data.callback_id) {
                        this.callbacks[data.callback_id].reject(new Error(data.args[0]));
                        delete this.callbacks[data.callback_id];
                    }
                    else {
                        this.toastError(data.args[0], data.autoClose);
                    }
                    break;
                case "info":
                    // @ts-ignore
                    this.toastInfo(...data.args, data.autoClose);
                    break;
                case "method_call":
                    //this.views[data.state_id]?.[data.view_id]?.[data.method_name]?.(...data.args);
                    break;
                case "method_return":
                    this.callbacks[data.callback_id].resolve(data.value);
                    delete this.callbacks[data.callback_id];
                    break;
                case "set_state":
                    this.reduxStore.dispatch({
                        'type': 'SET_STATE',
                        'state': data.state,
                        'stateId': data.state_id,
                    })
                    this.unsyncPaths[data.state_id] = data.unsync;
                    break;
                case "patch_state":
                    try {
                        this.reduxStore.dispatch({
                            'type': 'APPLY_PATCHES',
                            'patches': [{
                                stateId: data.state_id,
                                patches: data.patches,
                            }],
                            'sync': false,
                        });
                    } catch (error) {
                        console.error("ERROR DURING PATCHING");
                        console.error(error);
                    }
                    break;
                case "delete_state":
                    this.reduxStore.dispatch({
                        'type': 'DELETE_STATE',
                        'stateId': data.state_id,
                    });
                    if (data.state_id in this.unsyncPaths) {
                        delete this.unsyncPaths[data.state_id]
                    }
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.error("Error during comm message reception", e);
        }
    };

    toastError = (message, autoClose = 10000) => {
        //INotification.error(`Message: ${e.message} at ${parseInt(lineStr)-1}:${parseInt(columnStr)-1}`);
        INotification.error(<div><pre>{message}</pre></div>, {autoClose: autoClose});
    }

    toastInfo = (message, autoClose = 10000) => {
        //INotification.error(`Message: ${e.message} at ${parseInt(lineStr)-1}:${parseInt(columnStr)-1}`);
        INotification.info(<div>{message.split("\n").map(line => <p>{line}</p>)}</div>, {autoClose: autoClose});
    }

    /*_saveState() {
        const state = this.get_state_sync({drop_defaults: true});
        this._context.model.metadata.set('views', {
            'application/vnd.jupyter.annotator-state+json': state
        });
    }*/

    /**
     * Restore views from kernel and saved state.
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
        const view_md = notebook.metadata.get('views');
        // Restore any views from saved state that are not live
        if (view_md && view_md[MIMETYPE]) {
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
                    [action.stateId]: action.state
                };
            case 'APPLY_PATCHES':
                return {
                    ...state,
                    ...Object.fromEntries(
                        action.patches.map(
                            ({stateId, patches}) => (
                                [/*key*/stateId, /*new value*/applyPatches(
                                    state[stateId],
                                    patches,
                                )])
                        )
                    )
                };
            case 'DELETE_STATE':
                const newState = {
                    ...state,
                }
                delete newState[action.stateId]
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

        const syncMiddleware = () => next => action => {
            const returnValue = next(action);

            if (action.type !== 'APPLY_PATCHES' || action.sync === false) {
                return returnValue;
            }

            // Trim down the list of patches to send over to the kernel
            const newPatches = [];
            action.patches.forEach(({stateId, patches}) => {
                const newStatePatches = patches.filter((patch: Patch) => {
                    // Keep any patch for which not any skip path matched its path
                    return !this.unsyncPaths[stateId].some(skipPath =>
                        arrayEquals(patch.path.slice(0, skipPath.length), skipPath)
                    );
                });
                if (newStatePatches.length > 0) {
                    newPatches.push({
                        state_id: stateId,
                        patches: newStatePatches
                    });
                }
            })

            if (newPatches.length > 0) {
                this.comm.send({
                    'method': 'patch_states',
                    'data': newPatches,
                }, {
                    id: this.id,
                })
            }

            return returnValue
        }

        return createStore(
            this.reduce,
            composeEnhancers(
                applyMiddleware(
                    // thunkMiddleware, // lets us dispatch() functions
                    // loggerMiddleware, // neat middleware that logs actions
                    // this.reduxMiddleware,
                    syncMiddleware,
                )
            )
        );
    };

    unpackView({view_id, js_code, py_code, sourcemap}: MetannoViewData) {
        this.viewsData[view_id] = {js_code, py_code, sourcemap};
        return evalViewCode(
            js_code + `\n//# sourceURL=${view_id}`,
            this.createState,
            (name) => (...args) => this.remoteCall(name, args),
            this.variableStore,
        )
    }

    createState = (stateId) => {
        const state = createState(this.reduxStore, stateId);
        this.statesRefs.splice(
            0,
            this.statesRefs.length,
            ...this.statesRefs.filter(state => !!state.deref()))
        this.statesRefs.push(new WeakRef(state));
        return state;
    }

    wrapAction = <Inputs extends any[]>(
        fn: (...args: Inputs) => void,
    ): (...args: Inputs) => void => {
        if (!fn)
            return;
        if (this.wrapperCache.has(fn)) {
            return this.wrapperCache.get(fn);
        }
        const producer = multiProduce(
            this.statesRefs,
            this.reduxStore,
        )(fn);
        const wrapped = (...args) => {
            this.queueTryCatchExec(producer, ...args)
        }
        this.wrapperCache.set(fn, wrapped);
        return wrapped;
    };


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
        this.lock = this.lock.then(() => {
            return this.tryCatchExec(fn, ...args);
        }).catch(this.handleException);
    };

    handleException = (e: Error, toast: boolean = true): string => {
        console.log("Got an error !");
        console.log(e);
        const py_lines = [...e.stack.matchAll(/<(\[a-z0-9-]+)>:(\d+):(\d+)/gm)];
        let message;
        if (py_lines.length > 0) {
            const [_, scriptStr, lineStr, columnStr] = py_lines[0];
            const {py_code, sourcemap} = this.viewsData[scriptStr];
            const source_line_str = py_code.split("\n")[sourcemap[parseInt(lineStr) - 1][0][2]].trim();
            message =`Error: ${e.message} at \n${source_line_str}`;
        } else { // @ts-ignore
            if (e.__args__) {
                // @ts-ignore
                message =`Error: ${e.__args__[0]}`;
            } else {
                message =`Error: ${e.message}`;
            }
        }
        if (toast) {
            this.toastError(message);
        }
        return message;
    };

    /*get_view = (view_id) => {
        return this.views?.[view_id]
    }*/

    /*register_view(view_id: string, app: any) {
        if (!this.views)
            this.views = {}
        this.views[view_id] = app
    }

    unregister_view(view_id: string, app: any=null) {
        // Only unregister the view if the view instance was not specified or
        // if it is the same as the one registered (in case a new instance of the same
        // view was registered after the first one, like when hitting the 'Detach' btn
        if (!app || this.views[view_id] == app) {
            delete this.views[view_id]
        }
    }*/
}
