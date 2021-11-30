/* -----------------------------------------------------------------------------
| Modified by PW from the JupyterLab repository with an ugly monkey patch hack
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

//@ts-ignore
import {OutputArea} from "@jupyterlab/outputarea";
//@ts-ignore
import {CodeCell} from "@jupyterlab/cells";
//@ts-ignore
import {ISessionContext} from '@jupyterlab/apputils';
//@ts-ignore
import {Kernel, KernelMessage} from '@jupyterlab/services';
//@ts-ignore
import {JSONObject} from '@lumino/coreutils';


/**
 * The namespace for the `CodeCell` class statics.
 */

/**
 * Execute a cell given a client session.
 */
(function (CodeCell) {
    async function execute(
    cell: CodeCell,
    sessionContext: ISessionContext,
    metadata?: JSONObject
  ): Promise<KernelMessage.IExecuteReplyMsg | void> {
    const model = cell.model;
    const code = model.value.text;
    const canChangeHiddenState = !cell?.outputArea?.widgets?.[0]?.widgets?.[1].editor_type;  // <--- modified here
    if (!code.trim() || !sessionContext.session?.kernel) {
      model.clearExecution();
      return;
    }
    const cellId = { cellId: model.id };
    metadata = {
      ...model.metadata.toJSON(),
      ...metadata,
      ...cellId
    };
    const { recordTiming } = metadata;
    model.clearExecution();
    if (canChangeHiddenState) { // <--- modified here
      cell.outputHidden = false;
    } // <--- modified here
    cell.setPrompt('*');
    model.trusted = true;
    let future:
      | Kernel.IFuture<
          KernelMessage.IExecuteRequestMsg,
          KernelMessage.IExecuteReplyMsg
        >
      | undefined;
    try {
      const msgPromise = OutputArea.execute(
        code,
        cell.outputArea,
        sessionContext,
        metadata
      );
      // cell.outputArea.future assigned synchronously in `execute`
      if (recordTiming) {
        const recordTimingHook = (msg: KernelMessage.IIOPubMessage) => {
          let label: string;
          switch (msg.header.msg_type) {
            case 'status':
              label = `status.${
                (msg as KernelMessage.IStatusMsg).content.execution_state
              }`;
              break;
            case 'execute_input':
              label = 'execute_input';
              break;
            default:
              return true;
          }
          // If the data is missing, estimate it to now
          // Date was added in 5.1: https://jupyter-client.readthedocs.io/en/stable/messaging.html#message-header
          const value = msg.header.date || new Date().toISOString();
          const timingInfo: any = Object.assign(
            {},
            model.metadata.get('execution')
          );
          timingInfo[`iopub.${label}`] = value;
          model.metadata.set('execution', timingInfo);
          return true;
        };
        cell.outputArea.future.registerMessageHook(recordTimingHook);
      } else {
        model.metadata.delete('execution');
      }
      // Save this execution's future so we can compare in the catch below.
      future = cell.outputArea.future;
      const msg = (await msgPromise)!;
      model.executionCount = msg.content.execution_count;
      if (recordTiming) {
        const timingInfo = Object.assign(
          {},
          model.metadata.get('execution') as any
        );
        const started = msg.metadata.started as string;
        // Started is not in the API, but metadata IPyKernel sends
        if (started) {
          timingInfo['shell.execute_reply.started'] = started;
        }
        // Per above, the 5.0 spec does not assume date, so we estimate is required
        const finished = msg.header.date as string;
        timingInfo['shell.execute_reply'] =
          finished || new Date().toISOString();
        model.metadata.set('execution', timingInfo);
      }
      return msg;
    } catch (e) {
      // If we started executing, and the cell is still indicating this
      // execution, clear the prompt.
      if (future && !cell.isDisposed && cell.outputArea.future === future) {
        cell.setPrompt('');
      }
      throw e;
    }
  }

    CodeCell.old_execute = CodeCell.execute;
    CodeCell.execute = execute;
})(CodeCell);