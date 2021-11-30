import "regenerator-runtime/runtime";
// @ts-ignore
import {filter, toArray} from '@lumino/algorithm';
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
import {MainAreaWidget, WidgetTracker,} from '@jupyterlab/apputils';
// @ts-ignore
import {INotebookTracker, NotebookPanel, NotebookTracker} from '@jupyterlab/notebook';
// @ts-ignore
import {ISettingRegistry} from '@jupyterlab/settingregistry';
// @ts-ignore
import {ILayoutRestorer, JupyterFrontEnd} from '@jupyterlab/application';
// @ts-ignore
import {OutputArea, SimplifiedOutputArea} from '@jupyterlab/outputarea';
// @ts-ignore
import {LabIcon} from '@jupyterlab/ui-components';
// @ts-ignore
import {CodeCell} from '@jupyterlab/cells';
// @ts-ignore
import {Panel, Widget} from "@lumino/widgets";
// @ts-ignore
import {UUID} from "@lumino/coreutils";

import MetannoManager from "./manager";
import MetannoRenderer from "./renderer";
// @ts-ignore
import metannoSvgstr from '../icon.svg';
import "./dontDisplayHiddenOutput";


const MIMETYPE = 'application/vnd.jupyter.annotator+json';
export const notebookIcon = new LabIcon({name: 'ui-components:metanno', svgstr: metannoSvgstr});

export const contextToMetannoManagerRegistry = new AttachedProperty({
    name: 'widgetManager',
    create: () => undefined
});
const SETTINGS = {saveState: false};

/**
 * Iterate through all widget renderers in a notebook.
 */
function* getEditorsFromNotebook(notebook: MainAreaWidget) {
    // @ts-ignore
    for (const cell of notebook.widgets) {
        if (cell.model.type === 'code') {
            for (const codecell of cell.outputArea.widgets) {
                for (const output of toArray(codecell.children())) {
                    if (output instanceof MetannoRenderer) {
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
function* getLinkedEditorsFromApp(
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
                if (output instanceof MetannoRenderer) {
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
    private _editor_id: string;
    private _editor_type: string;
    private _path: string;
    private _cell: CodeCell | null = null;

    constructor(options: { notebook?: NotebookPanel, editor_id?: string, editor_type?: string, cell?: CodeCell }) {
        super();
        this._notebook = options.notebook;
        this._editor_id = options.editor_id;
        this._editor_type = options.editor_type;
        this._cell = options.cell || null;

        if (!this._editor_id || !this._editor_type) {
            const widget = this._cell.outputArea.widgets[0].widgets[1] as MetannoRenderer;
            this._editor_id = widget.editor_id;
            this._editor_type = widget.editor_type;
        }

        this.id = `MetannoArea-${UUID.uuid4()}`;
        this.title.label = this._editor_id;
        this.title.icon = notebookIcon;
        this.title.caption = this._notebook.title.label ? `For Notebook: ${this._notebook.title.label || ''}` : '';
        this.addClass('jp-LinkedOutputView');


        // Wait for the notebook to be loaded before
        // cloning the output area.
        void this._notebook.context.ready.then(() => {
            if (!(this._editor_id && this._editor_type)) {
                this.dispose();
                return;
            }
            const widget = new MetannoRenderer({
                editor_id: this._editor_id,
                editor_type: this._editor_type,
            }, contextToMetannoManagerRegistry.get(this._notebook.context));
            widget.addClass("jp-OutputArea-output");
            this.addWidget(widget);
        });
    }

    get editor_id() {
        return this._editor_id;
    }

    get editor_type() {
        return this._editor_type;
    }

    get path(): string {
        return this?._notebook?.context?._path;
    }
}

/*
Here we add the singleton MetannoManager to the given editor (context)
 */
export function registerMetannoManager(
    context,
    rendermime,
    renderers
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
            createRenderer: options => new MetannoRenderer(options, wManager)
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
    const metannoAreas = new WidgetTracker<MainAreaWidget<MetannoArea>>({
        namespace: 'metanno-areas'
    });

    if (restorer) {
        restorer.restore(metannoAreas, {
            command: 'metanno:create-view',
            args: widget => ({
                editor_id: widget.content.editor_id,
                editor_type: widget.content.editor_type,
                path: widget.content.path,
            }),
            name: widget => `${widget.content.path}:${widget.content.editor_type}:${widget.content.editor_id}`,
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
                new MetannoRenderer(options, null);
            })
        },
        0
    );

    // Adds the singleton MetannoManager to all existing editors in the labapp/notebook
    if (notebookTracker !== null) {
        notebookTracker.forEach((panel) => {
            registerMetannoManager(
                panel.context,
                panel.content.rendermime,
                chain(
                    // @ts-ignore
                    getEditorsFromNotebook(panel.content),
                    getLinkedEditorsFromApp(app, panel.sessionContext.path)
                )
            );

            bindUnhandledIOPubMessageSignal(panel);
        });
        notebookTracker.widgetAdded.connect((sender, panel: NotebookPanel) => {
            registerMetannoManager(
                panel.context,
                panel.content.rendermime,
                chain(
                    // @ts-ignore
                    getEditorsFromNotebook(panel.content),
                    getLinkedEditorsFromApp(app, panel.sessionContext.path)
                )
            );

            bindUnhandledIOPubMessageSignal(panel);
        });
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
     * Whether there is an notebook active, with a single selected cell.
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
            const editor_id = args.editor_id as string | undefined | null;
            const editor_type = args.editor_type as string | undefined | null;
            const path = args.path as string | undefined | null;
            if (editor_id && editor_type && path) {
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
            }
            // Create a MainAreaWidget
            const content = new MetannoArea({
                notebook: current,
                cell,
                editor_id,
                editor_type,
            });
            const widget = new MainAreaWidget({content});
            current.context.addSibling(widget, {
                ref: current.id,
                mode: 'split-bottom'
            });

            // Add the cloned output to the output widget tracker.
            void metannoAreas.add(widget);
            void metannoAreas.save(widget);

            // Remove the output view if the parent notebook is closed.
            current.content.disposed.connect(() => {
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
        IDocumentManager], // docManager
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