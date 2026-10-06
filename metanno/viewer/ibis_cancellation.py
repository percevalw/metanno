"""
Interrupt Ibis queries using driver handles recorded for the current worker operation
"""

from __future__ import annotations

import threading
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from trino.dbapi import Cursor as TrinoCursor


class CancellableQuery:
    """
    Cancel one Ibis query through its database driver.

    Spark uses a job group and DuckDB interrupts its connection. For Trino this
    object temporarily replaces the Ibis connection so cursor creation can be
    tracked, Ibis then calls cursor through its usual DB API interface.
    """

    def __init__(self, backend, request_id):
        self.backend = backend
        self.request_id = request_id
        self.cancelled = False
        self.cursors = []
        self.lock = threading.Lock()
        self.connection = None
        self.spark_properties = {}

    def __enter__(self):
        """
        Capture query handles and preserve the caller's Spark job properties
        """
        if self.backend.name == "pyspark":
            context = self.backend._session.sparkContext
            self.spark_properties = {
                name: context.getLocalProperty(name)
                for name in ("spark.jobGroup.id", "spark.job.description", "spark.job.interruptOnCancel")
            }
            context.setJobGroup(str(self.request_id), "Metanno source query", interruptOnCancel=True)
        elif self.backend.name == "trino":
            self.connection = self.backend.con
            # Ibis creates Trino cursors internally, intercept creation to keep their cancellation handles
            self.backend.con = self
        return self

    def __getattr__(self, name):
        """
        Forward other Trino connection attributes used by Ibis to the original connection
        """
        return getattr(self.connection, name)

    def cursor(self, *args, **kwargs) -> TrinoCursor:
        """
        Create a Trino DB API cursor and keep its handle for cancel.

        Ibis calls this method through backend.con while the query is running.
        Each returned cursor can cancel its corresponding query on the Trino server.
        """
        with self.lock:
            if self.cancelled:
                raise RuntimeError("Query cancelled")
            cursor = self.connection.cursor(*args, **kwargs)
            self.cursors.append(cursor)
            return cursor

    def cancel(self):
        """
        Interrupt the backend and prevent its eventual result from being displayed
        """
        with self.lock:
            if self.backend.name == "pyspark":
                self.backend._session.sparkContext.cancelJobGroup(str(self.request_id))
            elif self.backend.name == "trino":
                for cursor in self.cursors:
                    cursor.cancel()
            elif self.backend.name == "duckdb":
                self.backend.con.interrupt()
            else:
                return False
            self.cancelled = True
            return True

    def __exit__(self, *exc):
        """
        Restore the connection and Spark properties after execution
        """
        if self.connection is not None:
            self.backend.con = self.connection
        elif self.backend.name == "pyspark":
            for name, value in self.spark_properties.items():
                self.backend._session.sparkContext.setLocalProperty(name, value)
