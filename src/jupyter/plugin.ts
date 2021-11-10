import "regenerator-runtime/runtime";
import metannoManager from "./manager";
import metannoRenderer from "./renderer";
// @ts-ignore
import {KernelMessage} from '@jupyterlab/services';
// @ts-ignore
import {DisposableDelegate} from '@lumino/disposable';

// @ts-ignore
import {IMainMenu} from '@jupyterlab/mainmenu';
// @ts-ignore
import {ILoggerRegistry, LogLevel} from '@jupyterlab/logconsole';
// @ts-ignore
import {IRenderMimeRegistry} from '@jupyterlab/rendermime';
// @ts-ignore
import {INotebookTracker, NotebookPanel} from '@jupyterlab/notebook';
// @ts-ignore
import {ISettingRegistry} from '@jupyterlab/settingregistry';
// @ts-ignore
import {JupyterFrontEnd} from '@jupyterlab/application';


// @ts-ignore
import {filter, toArray} from '@lumino/algorithm';
// @ts-ignore
import {AttachedProperty} from '@lumino/properties';
import "./dontDisplayHiddenOutput";

//import {ICommandPalette} from '@jupyterlab/apputils';
// @ts-ignore
import {Widget} from "@lumino/widgets";
// @ts-ignore
import {MainAreaWidget} from "@jupyterlab/apputils/lib/mainareawidget";

const MIMETYPE = 'application/vnd.jupyter.annotator+json';

export const contextTometannoManagerRegistry = new AttachedProperty({
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
                    if (output instanceof metannoRenderer) {
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
                if (output instanceof metannoRenderer) {
                    yield output;
                }
            }
        }
    }
}

/*
Here we add the singleton metannoManager to the given editor (context)
 */
export function registermetannoManager(
    context,
    rendermime,
    renderers
) {
    let wManager = contextTometannoManagerRegistry.get(context);
    if (!wManager) {
        wManager = new metannoManager(context, SETTINGS);
        contextTometannoManagerRegistry.set(context, wManager);
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
            createRenderer: options => new metannoRenderer(options, wManager)
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
function activatemetannoExtension(
    app: JupyterFrontEnd,
    rendermime: IRenderMimeRegistry,
    tracker: INotebookTracker,
    settingRegistry: ISettingRegistry,
    menu: IMainMenu,
    loggerRegistry: ILoggerRegistry | null,
    //palette: ICommandPalette,
) {
    const {commands, shell, contextMenu} = app;

    const bindUnhandledIOPubMessageSignal = (nb) => {
        if (!loggerRegistry) {
            return;
        }

        const wManager = contextTometannoManagerRegistry[nb.context];
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
                new metannoRenderer(options, null);
            })
        },
        0
    );

    // Adds the singleton metannoManager to all existing editors in the labapp/notebook
    if (tracker !== null) {
        tracker.forEach((panel) => {
            registermetannoManager(
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
        tracker.widgetAdded.connect((sender, panel: NotebookPanel) => {
            registermetannoManager(
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
            tracker.currentWidget !== null &&
            tracker.currentWidget === shell.currentWidget
        );
    }

    /**
     * Whether there is an notebook active, with a single selected cell.
     */
    function isEnabledAndSingleSelected() {  // :boolean
        if (!isEnabled()) {
            return false;
        }
        const {content} = tracker.currentWidget;
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

    commands.addCommand('metanno:detachOutput', {
        label: 'Detach Output',
        execute: async args => {
            // check https://github.com/jupyterlab/jupyterlab/blob/master/packages/notebook-extension/src/index.ts
            // for the command name
            await Promise.all([
                commands.execute("notebook:create-output-view", args),
                commands.execute("notebook:hide-cell-outputs", args),
            ]);
        },
        isEnabled: isEnabledAndSingleSelected
    });

    // CodeCell context menu groups
    contextMenu.addItem({
        command: 'metanno:detachOutput',
        selector: '.jp-Notebook .jp-CodeCell',
        rank: 10.5,
    });
}

function updateSettings(settings) {
    SETTINGS.saveState = !!settings.get('saveState').composite;
}

const plugin = {
    id: 'metanno:plugin',
    requires: [IRenderMimeRegistry],
    optional: [
        INotebookTracker,
        ISettingRegistry,
        IMainMenu,
        ILoggerRegistry,
        //ICommandPalette
    ],
    activate: activatemetannoExtension,
    autoStart: true
};

export default plugin;