import "regenerator-runtime/runtime";
// @ts-ignore
import {ArrayExt, filter, toArray} from '@lumino/algorithm';
// @ts-ignore
import {AttachedProperty} from '@lumino/properties';
// @ts-ignore
import {DisposableDelegate} from '@lumino/disposable';
// @ts-ignore
import {Kernel, KernelMessage} from '@jupyterlab/services';
// @ts-ignore
import {IDocumentManager} from '@jupyterlab/docmanager';
// @ts-ignore
import {IMainMenu} from '@jupyterlab/mainmenu';
// @ts-ignore
import {ILoggerRegistry, LogLevel} from '@jupyterlab/logconsole';
// @ts-ignore
import {IOutputModel, IRenderMimeRegistry} from '@jupyterlab/rendermime';
// @ts-ignore
import {IWidgetTracker, MainAreaWidget, WidgetTracker,} from '@jupyterlab/apputils';
// @ts-ignore
import {INotebookTracker, Notebook, NotebookPanel, NotebookTracker} from '@jupyterlab/notebook';
// @ts-ignore
import {ISettingRegistry} from '@jupyterlab/settingregistry';
// @ts-ignore
import {ILayoutRestorer, JupyterFrontEnd} from '@jupyterlab/application';
// @ts-ignore
import {OutputArea, SimplifiedOutputArea} from '@jupyterlab/outputarea';
// @ts-ignore
import {IObservableUndoableList} from '@jupyterlab/observables';
// @ts-ignore
import {ICellModel, ICodeCellModel} from '@jupyterlab/cells';
// @ts-ignore
import {LabIcon} from '@jupyterlab/ui-components';
// @ts-ignore
import {CodeCell} from '@jupyterlab/cells';
// @ts-ignore
import {Panel, Widget} from "@lumino/widgets";
// @ts-ignore
import {UUID} from "@lumino/coreutils";
// @ts-ignore
import {CommandRegistry} from "@lumino/commands";

import MetannoManager from "./manager";
import MetannoWidget, {WidgetCode, MetannoWidgetOptions} from "./widget";
// @ts-ignore
import metannoSvgstr from '../icon.svg';
import "./dontDisplayHiddenOutput";

const MIMETYPE = 'application/vnd.metanno+json';
export const notebookIcon = new LabIcon({name: 'ui-components:metanno', svgstr: metannoSvgstr});

export const contextToMetannoManagerRegistry = new AttachedProperty({
    name: 'widgetManager',
    create: () => undefined
});
const SETTINGS = {saveState: false};

/**
 * Iterate through all output areas that contain metanno renderers in a notebook.
 */
function* getMetannoContainers(notebook: Notebook) : Generator<CodeCell> {
    // @ts-ignore
    for (const cell of notebook.widgets) {
        if (cell.model.type === 'code') {
            // @ts-ignore
            for (const codecell of cell.outputArea.widgets as Generator<CodeCell>) {
                for (const output of toArray(codecell.children())) {
                    if (output instanceof MetannoWidget) {
                        yield codecell;
                        break;
                    }
                }
            }
        }
    }
}


/**
 * Iterate through all metanno renderers in a notebook.
 */
function* getWidgetsFromNotebook(notebook: Notebook) {
    // @ts-ignore
    for (const cell of notebook.widgets) {
        if (cell.model.type === 'code') {
            // @ts-ignore
            for (const codecell of cell.outputArea.widgets) {
                for (const output of toArray(codecell.children())) {
                    if (output instanceof MetannoWidget) {
                        yield output;
                    }
                }
            }
        }
    }
}


function* chain(...args) {
    for (const it of args) {
        yield* it;
    }
}

/**
 * Iterate through all matching linked output views
 */
function* getLinkedWidgetsFromApp(
    jupyterApp: JupyterFrontEnd,
    path: string,
) {
    const linkedViews = filter(
        jupyterApp.shell.widgets("main"),
        // @ts-ignore
        (w: Widget) => w.id.startsWith('LinkedOutputView-') && w.path === path);
    for (const view of toArray(linkedViews)) {
        for (const outputs of toArray(view.children())) {
            for (const output of toArray(outputs.children())) {
                if (output instanceof MetannoWidget) {
                    yield output;
                }
            }
        }
    }
}

/**
 * A widget hosting a metanno area.
 */
export class MetannoArea extends Panel {
    private _notebook: NotebookPanel;
    private _widget_state_id: string;
    private _widget_id: string;
    private _widget_type: string;
    private _widget_code: {
        'code': string,
        'py_code': string,
        'sourcemap': string,
    };
    private _cell: CodeCell | null = null;

    constructor(options: MetannoWidgetOptions & {
        notebook?: NotebookPanel,
        cell?: CodeCell,
    }) {
        super();
        this._notebook = options.notebook;
        this._widget_id = options.widget_id;
        this._widget_type = options.widget_type;
        this._widget_code = options.widget_code;
        this._widget_state_id = options.widget_state_id;
        this._cell = options.cell || null;

        this.addClass('jp-LinkedOutputView');

        // Wait for the notebook to be loaded before
        // cloning the output area.
        void this._notebook.context.ready.then(() => {

            if (!this._widget_id) {
                // @ts-ignore
                const widget = this._cell.outputArea.widgets[0].widgets[1] as MetannoWidget;
                this._widget_id = widget.widget_id;
                this._widget_type = widget.widget_type;
                this._widget_code = widget.widget_code;
                this._widget_state_id = widget.widget_state_id;
            }

            this.id = `MetannoArea-${UUID.uuid4()}`;
            this.title.label = this._widget_id;
            this.title.icon = notebookIcon;
            this.title.caption = this._notebook.title.label ? `For Notebook: ${this._notebook.title.label || ''}` : '';

            if (!(this._widget_id && this._widget_type && this._widget_code && this.widget_state_id)) {
                this.dispose();
                return;
            }
            const widget = new MetannoWidget({
                mimeType: null,
                widget_id: this._widget_id,
                widget_type: this._widget_type,
                widget_code: this._widget_code,
                widget_state_id: this._widget_state_id,
            }, contextToMetannoManagerRegistry.get(this._notebook.context));
            widget.addClass("jp-OutputArea-output");
            this.addWidget(widget);
        });
    }

    get widget_id() {
        return this._widget_id;
    }

    get widget_type() {
        return this._widget_type;
    }

    get widget_code() {
        return this._widget_code;
    }

    get widget_state_id() {
        return this._widget_state_id;
    }

    get path(): string {
        return this?._notebook?.context?.path;
    }
}

type MetannoClonedAreaOptions = {
    /**
     * The notebook associated with the cloned output area.
     */
    notebook: NotebookPanel;

    /**
     * The cell for which to clone the output area.
     */
    cell?: CodeCell;

    /**
     * If the cell is not available, provide the index
     * of the cell for when the notebook is loaded.
     */
    index?: number;

    /**
     * If the cell is not available, provide the index
     * of the cell for when the notebook is loaded.
     */
}

/**
 * A widget hosting a cloned output area.
 */
export class MetannoClonedArea extends Panel {
    constructor(options: MetannoClonedAreaOptions) {
        super();

        this._notebook = options.notebook;
        this._index = options.index !== undefined ? options.index : -1;
        this._cell = options.cell || null;

        this.id = `MetannoArea-${UUID.uuid4()}`;
        this.title.icon = notebookIcon;
        this.title.caption = this._notebook.title.label ? `For Notebook: ${this._notebook.title.label || ''}` : '';
        this.addClass('jp-LinkedOutputView');

        // Wait for the notebook to be loaded before
        // cloning the output area.
        void this._notebook.context.ready.then(() => {
            if (!this._cell) {
                this._cell = this._notebook.content.widgets[this._index] as CodeCell;
            }
            if (!this._cell || this._cell.model.type !== 'code') {
                this.dispose();
                return;
            }
            // @ts-ignore
            const widget = this._cell.outputArea.widgets?.[0]?.widgets?.[1] as MetannoWidget;
            this.title.label = widget.widget_id;
            const clone = this._cell.cloneOutputArea();
            this.addWidget(clone);
        });
    }

    /**
     * The index of the cell in the notebook.
     */
    get index(): number {
        return this._cell
            ? ArrayExt.findFirstIndex(
                this._notebook.content.widgets,
                c => c === this._cell
            )
            : this._index;
    }

    /**
     * The path of the notebook for the cloned output area.
     */
    get path(): string {
        return this._notebook.context.path;
    }

    private _notebook: NotebookPanel;
    private _index: number;
    private _cell: CodeCell | null = null;
}

/*
Here we add the singleton MetannoManager to the given editor (context)
 */
export function registerMetannoManager(
    context,
    rendermime: IRenderMimeRegistry,
    renderers: Generator<MetannoWidget>,
) {
    let wManager = contextToMetannoManagerRegistry.get(context);
    if (!wManager) {
        wManager = new MetannoManager(context, SETTINGS);
        contextToMetannoManagerRegistry.set(context, wManager);
    }

    for (const r of renderers) {
        r.manager = wManager;
    }

    // Replace the placeholder widget renderer with one bound to this widget
    // manager.
    rendermime.removeMimeType(MIMETYPE);
    rendermime.addFactory(
        {
            safe: true,
            mimeTypes: [MIMETYPE],
            createRenderer: options => new MetannoWidget(options, wManager)
        },
        0
    );

    return new DisposableDelegate(() => {
        if (rendermime) {
            rendermime.removeMimeType(MIMETYPE);
        }
        wManager.dispose();
    });
}

export function registerOutputListener(
    notebook: Notebook,
    listener
) {
    let callbacks = [];
    notebook.model.cells.changed.connect((cells, changes) => {
        changes.newValues.forEach((cell: ICodeCellModel) => {
            const signal = cell.outputs.changed;
            const callback = (outputArea, outputChanges) => {
                for (let index = 0; index<notebook.model.cells.length; index++) {
                    if (cell === notebook.model.cells.get(index)) {
                        const detachMetanno = outputChanges.newValues.some(outputModel =>
                            !!outputModel._rawData?.['application/vnd.metanno+json']?.['autodetach']
                        );
                        if (detachMetanno) {
                            listener((notebook.parent as NotebookPanel).context.path, index);
                        }
                    }
                }
            };
            callbacks.push({callback, signal})
            signal.connect(callback)
        })
        changes.oldValues.forEach((cell: ICodeCellModel) => {
            const oldSignal = cell.outputs.changed;
            callbacks = callbacks.filter(({callback, signal}) => {
                if (signal === oldSignal) {
                    signal.disconnect(callback);
                    return false;
                }
                return true;
            });
        })
        //if (change.type == "remove") {
        //
        //}
        // for (const cell of sender.widgets) {
        //     if (cell.model.type === 'code' && (cell as CodeCell).outputArea) {
        //         const signal = (cell as CodeCell).outputArea.outputTracker.widgetAdded;
        //         signal.connect((...args) => {
        //             return listener(cell, (cell as CodeCell).outputArea)
        //         });
        //     }
        // }
    })
}

/*
Activate the extension:
-
 */
function activateMetannoExtension(
    app: JupyterFrontEnd,
    rendermime: IRenderMimeRegistry,
    docManager: IDocumentManager,
    notebookTracker: INotebookTracker,
    settingRegistry: ISettingRegistry,
    menu: IMainMenu,
    loggerRegistry: ILoggerRegistry | null,
    restorer: ILayoutRestorer | null,
    //palette: ICommandPalette,
) {
    const {commands, shell, contextMenu} = app;
    const metannoAreas = new WidgetTracker<MainAreaWidget<MetannoClonedArea>>({
        namespace: 'metanno-areas'
    });

    if (restorer) {
        restorer.restore(metannoAreas, {
            command: 'metanno:create-view',
            args: widget => ({
                path: widget.content.path,
                index: widget.content.index,
            }),
            name: widget => `${widget.content.path}:${widget.content.index}`,
            when: notebookTracker.restored // After the notebook widgets (but not contents).
        });
    }

    const bindUnhandledIOPubMessageSignal = (nb) => {
        if (!loggerRegistry) {
            return;
        }

        const wManager = contextToMetannoManagerRegistry[nb.context];
        // Don't know what it is
        if (wManager) {
            wManager.onUnhandledIOPubMessage.connect(
                (sender, msg) => {
                    const logger = loggerRegistry.getLogger(nb.context.path);
                    let level: LogLevel = 'warning';
                    if (
                        KernelMessage.isErrorMsg(msg) ||
                        (KernelMessage.isStreamMsg(msg) && msg.content.name === 'stderr')
                    ) {
                        level = 'error';
                    }
                    const data = {
                        ...msg.content,
                        output_type: msg.header.msg_type
                    };
                    logger.rendermime = nb.content.rendermime;
                    logger.log({type: 'output', data, level});
                }
            );
        }
    };

    // Some settings stuff, haven't used it yet
    if (settingRegistry !== null) {
        settingRegistry
            .load(plugin.id)
            .then((settings) => {
                settings.changed.connect(updateSettings);
                updateSettings(settings);
            })
            .catch((reason) => {
                console.error(reason.message);
            });
    }

    // Sets the renderer everytime we see our special SpanComponent/TableEditor mimetype
    rendermime.addFactory(
        {
            safe: false,
            mimeTypes: [MIMETYPE],
            // @ts-ignore
            createRenderer: (options => {
                new MetannoWidget(options, null);
            })
        },
        0
    );

    // Adds the singleton MetannoManager to all existing widgets in the labapp/notebook
    if (notebookTracker !== null) {
        notebookTracker.forEach((panel) => {
            registerMetannoManager(
                panel.context,
                panel.content.rendermime,
                chain(
                    // @ts-ignore
                    getWidgetsFromNotebook(panel.content),
                    getLinkedWidgetsFromApp(app, panel.sessionContext.path)
                )
            );

            bindUnhandledIOPubMessageSignal(panel);
        });
        notebookTracker.widgetAdded.connect((sender, panel: NotebookPanel) => {
            registerMetannoManager(
                panel.context,
                panel.content.rendermime,
                chain(
                    getWidgetsFromNotebook(panel.content),
                    getLinkedWidgetsFromApp(app, panel.sessionContext.path)
                )
            );
            bindUnhandledIOPubMessageSignal(panel);
        });
        notebookTracker.currentChanged.connect((sender, panel: NotebookPanel) => {
            registerOutputListener(
                panel.content,
                (path, index) => {
                    (commands as CommandRegistry).execute('metanno:create-view', {path, index});
                    (panel.content.widgets[index] as CodeCell).outputHidden = true;
                },
            )
        });
    }

    const widgetTracker = new WidgetTracker<OutputArea>({namespace: ''});

    if (widgetTracker !== null) {
        widgetTracker.widgetAdded.connect((sender, widget) => {
            console.log(sender, widget);
        })
    }

    // -----------------
    // Add some commands
    // -----------------

    if (settingRegistry !== null) {
        // Add a command for automatically saving metanno state.
        commands.addCommand('metanno:saveAnnotatorState', {
            label: 'Save Annotator State Automatically',
            execute: () => {
                return settingRegistry
                    .set(plugin.id, 'saveState', !SETTINGS.saveState)
                    .catch((reason) => {
                        console.error(`Failed to set ${plugin.id}: ${reason.message}`);
                    });
            },
            isToggled: () => SETTINGS.saveState
        });
    }

    if (menu) {
        menu.settingsMenu.addGroup([
            {command: 'metanno:saveAnnotatorState'}
        ]);
    }

    /**
     * Whether there is an active notebook.
     */
    function isEnabled() {  // : boolean
        return (
            notebookTracker.currentWidget !== null &&
            notebookTracker.currentWidget === shell.currentWidget
        );
    }

    /**
     * Whether there is a notebook active, with a single selected cell.
     */
    function isEnabledAndSingleSelected() {  // :boolean
        if (!isEnabled()) {
            return false;
        }
        const {content} = notebookTracker.currentWidget;
        const index = content.activeCellIndex;
        // If there are selections that are not the active cell,
        // this command is confusing, so disable it.
        for (let i = 0; i < content.widgets.length; ++i) {
            if (content.isSelected(content.widgets[i]) && i !== index) {
                return false;
            }
        }
        return true;
    }

    // CodeCell context menu groups
    contextMenu.addItem({
        command: 'metanno:create-view',
        selector: '.jp-Notebook .jp-CodeCell',
        rank: 10.5,
    });
    commands.addCommand('metanno:create-view', {
        label: 'Detach',
        execute: async args => {
            let cell: CodeCell | undefined;
            let current: NotebookPanel | undefined | null;
            // If we are given a notebook path and cell index, then
            // use that, otherwise use the current active cell.
            const path = args.path as string | undefined | null;
            let index = args.index as number | undefined | null;
            if (path && index !== undefined && index !== null) {
                current = docManager.findWidget(path, 'Notebook') as NotebookPanel;
                if (!current) {
                    return;
                }
            } else {
                current = notebookTracker.currentWidget;
                if (!current) {
                    return;
                }
                cell = current.content.activeCell as CodeCell;
                index = current.content.activeCellIndex;
            }
            // Create a MainAreaWidget
            const content = new MetannoClonedArea({
                notebook: current,
                cell,
                index,
            });

            // Check if it already exists
            const hasBeenDetached = !!metannoAreas.find(widget =>
                (widget.content.path === path)
                && (widget.content.index === index)
            )

            if (hasBeenDetached) {
                return;
            }

            const widget = new MainAreaWidget({content});
            current.context.addSibling(widget, {
                ref: current.id,
                mode: 'split-bottom'
            });

            const updateCloned = () => {
                void metannoAreas.save(widget);
            };

            current.context.pathChanged.connect(updateCloned);
            current.context.model?.cells.changed.connect(updateCloned);

            // Add the cloned output to the output widget tracker.
            void metannoAreas.add(widget);
            void metannoAreas.save(widget);

            // Remove the output view if the parent notebook is closed.
            current.content.disposed.connect(() => {
                current!.context.pathChanged.disconnect(updateCloned);
                current!.context.model?.cells.changed.disconnect(updateCloned);
                widget.dispose();
            });
            await Promise.all([
                commands.execute("notebook:hide-cell-outputs", args),
            ]);
        },
        isEnabled: isEnabledAndSingleSelected
    });
}

function updateSettings(settings) {
    SETTINGS.saveState = !!settings.get('saveState').composite;
}

const plugin = {
    id: 'metanno:plugin', // app
    requires: [
        IRenderMimeRegistry,  // rendermime
        IDocumentManager
    ], // docManager
    optional: [
        INotebookTracker, // notebookTracker
        ISettingRegistry, // settingRegistry
        IMainMenu, // menu
        ILoggerRegistry, // loggerRegistry
        ILayoutRestorer, // restorer
    ],
    activate: activateMetannoExtension,
    autoStart: true
};

export default plugin;