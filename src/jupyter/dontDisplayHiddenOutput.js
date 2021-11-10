import {OutputArea} from "@jupyterlab/outputarea";
import {CodeCell} from "@jupyterlab/cells";

/**
 * The namespace for the `CodeCell` class statics.
 */

/**
 * Execute a cell given a client session.
 */
/*(function (CodeCell) {
    async function execute(cell, session, metadata) {
        let model = cell.model;
        let code = model.value.text;
        if (!code.trim() || !session.kernel) {
            model.executionCount = null;
            model.outputs.clear();
            return;
        }
        let cellId = {cellId: model.id};
        metadata = Object.assign({}, model.metadata.toJSON(), metadata, cellId);
        const {recordTiming} = metadata;
        model.executionCount = null;
        // cell.outputHidden = true; // only this line was removed
        cell.setPrompt('*');
        model.trusted = true;
        let future;
        try {
            const msgPromise = OutputArea.execute(code, cell.outputArea, session, metadata);
            // cell.outputArea.future assigned synchronously in `execute`
            if (recordTiming) {
                const recordTimingHook = (msg) => {
                    let label;
                    switch (msg.header.msg_type) {
                        case 'status':
                            label = `status.${msg.content.execution_state}`;
                            break;
                        case 'execute_input':
                            label = 'execute_input';
                            break;
                        default:
                            return;
                    }
                    const value = msg.header.date;
                    if (!value) {
                        return;
                    }
                    const timingInfo = model.metadata.get('execution') || {};
                    timingInfo[`iopub.${label}`] = value;
                    model.metadata.set('execution', timingInfo);
                    return true;
                };
                cell.outputArea.future.registerMessageHook(recordTimingHook);
            }
            // Save this execution's future so we can compare in the catch below.
            future = cell.outputArea.future;
            const msg = await msgPromise;
            model.executionCount = msg.content.execution_count;
            const started = msg.metadata.started;
            if (recordTiming && started) {
                const timingInfo = model.metadata.get('execution') || {};
                if (started) {
                    timingInfo['shell.execute_reply.started'] = started;
                }
                const date = msg.header.date;
                if (date) {
                    timingInfo['shell.execute_reply'] = date;
                }
                model.metadata.set('execution', timingInfo);
            }
            return msg;
        }
        catch (e) {
            // If this is still the current execution, clear the prompt.
            if (e.message === 'Canceled' && cell.outputArea.future === future) {
                cell.setPrompt('');
            }
            throw e;
        }
    }

    CodeCell.old_execute = CodeCell.execute;
    CodeCell.execute = execute;
})(CodeCell);
*/