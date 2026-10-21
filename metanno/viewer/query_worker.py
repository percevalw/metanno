"""
Run database operations on one backend thread per connection and cancel active source queries
"""

from __future__ import annotations

import threading
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager


class SourceQueryWorker:
    """
    Execute source queries in the data explorer kernel, one at a time per connection.

    Each connection is opened and queried on its own thread, so a slow database, e.g. a Spark session
    starting, does not delay the others. Work without a connection runs on the `None` thread. View IDs
    group requests for tab cleanup, request IDs identify individual operations for cancellation even
    after the source configuration changes.
    """

    def __init__(self, report):
        self.report = report
        self.executors = {}
        self.pending_requests = {}
        self.requests_by_view = {}
        self.lock = threading.RLock()
        self.active_queries = {}

    def executor(self, connection):
        """
        Return the single thread executor of a connection, created on first use
        """
        with self.lock:
            if connection not in self.executors:
                self.executors[connection] = ThreadPoolExecutor(1, thread_name_prefix=f"metanno-source-{connection}")
            return self.executors[connection]

    def on_thread(self, connection):
        """
        Tell whether the caller already runs on the thread of this connection
        """
        return threading.current_thread().name == f"metanno-source-{connection}_0"

    def submit(self, operation_id, function, *args, view_id=None, source=None, table=None, connection=None):
        """
        Queue catalogue or provider work and publish progress for its requesting view
        """
        started = time.monotonic()

        def report(phase, error=None):
            if view_id is not None:
                self.report(
                    {
                        "view_ref": view_id,
                        "operation_id": operation_id,
                        "source": source,
                        "table": table,
                        "phase": phase,
                        "error": error,
                        "elapsed_ms": round((time.monotonic() - started) * 1000),
                    }
                )

        def execute():
            report("running")
            return function(*args)

        def completed(future):
            with self.lock:
                self.pending_requests.pop(operation_id, None)
                if view_id in self.requests_by_view:
                    self.requests_by_view[view_id].discard(operation_id)
            error = "Query cancelled" if future.cancelled() else future.exception()
            report("failed" if error else "completed", str(error) if error else None)

        with self.lock:
            if view_id is not None and view_id not in self.requests_by_view:
                raise ValueError("The view has been closed")
            report("queued")
            future = self.executor(connection).submit(execute)
            self.pending_requests[operation_id] = future
            if view_id is not None:
                self.requests_by_view[view_id].add(operation_id)
            future.add_done_callback(completed)
        return future

    @contextmanager
    def cancellable_query(self, query):
        """
        Register a query cancellation handle while its provider call runs on this worker
        """
        with query as execution:
            with self.lock:
                self.active_queries[execution.request_id] = execution
            try:
                yield
                if execution.cancelled:
                    raise ValueError("Query cancelled")
            finally:
                with self.lock:
                    self.active_queries.pop(execution.request_id, None)

    def cancel(self, operation_id):
        """
        Cancel queued work or interrupt the backend currently running that operation
        """
        with self.lock:
            future = self.pending_requests.get(operation_id)
            if future is not None and future.cancel():
                return True
            active = self.active_queries.get(operation_id)
            return bool(active and active.cancel())

    def close_view(self, view_id):
        """
        Release a tab's queued and running work without affecting other views
        """
        with self.lock:
            for operation_id in list(self.requests_by_view.pop(view_id, ())):
                self.cancel(operation_id)

    def close(self, sources):
        """
        Cancel requests and release connections on the worker that created them
        """
        with self.lock:
            for operation_id in list(self.pending_requests):
                self.cancel(operation_id)
            self.requests_by_view.clear()
        for source in sources:
            self.executor(None).submit(source.close)
        for executor in self.executors.values():
            executor.shutdown(wait=False)
