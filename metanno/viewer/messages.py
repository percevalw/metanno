"""
Comm messages exchanged with the Metanno JupyterLab extension, see client/viewer/kernel_client.ts
"""

PROTOCOL_VERSION = 1


def send_message(comm, kind, method, data, request_id=None):
    """
    Send a response or event, requests come from the browser with the same fields
    """
    comm.send(
        {
            "protocol_version": PROTOCOL_VERSION,
            "kind": kind,
            "method": method,
            "request_id": request_id,
            "data": data,
        }
    )


def send_error(comm, method, request_id, error):
    """
    Answer a failed request with the error type and message, the browser rejects the pending request with it
    """
    data = {"error": {"type": type(error).__name__, "message": str(error)}}
    send_message(comm, "response", method or "unknown", data, request_id)
