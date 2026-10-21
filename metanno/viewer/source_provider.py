"""
PRET DataFrame provider for Ibis tables from SourceCatalog, queried on the shared backend worker
"""

from __future__ import annotations

import asyncio
import uuid
from typing import TYPE_CHECKING, Literal

from pret.dataframe_provider import DataFrameDescription, DataFrameProvider, DataFrameQueryResult

from .ibis_cancellation import CancellableQuery

if TYPE_CHECKING:
    from ibis.expr.types import Table as IbisTable
    from pyarrow import Table as ArrowTable

    from .query_worker import SourceQueryWorker
    from .sources import SourceCatalog


def unwrap_added_columns(frame):
    """
    Follow DataFrame.with_columns views to the DataFrame they extend, returning it with the added column defaults.

    get_related_source_table uses the source DataFrame, code_export also writes the defaults back as with_columns.
    """
    from pret.dataframe import DefaultColumnsView

    defaults = {}
    while isinstance(frame.provider, DefaultColumnsView):
        defaults = {**frame.provider.defaults, **defaults}
        frame = frame.provider.parent
    return frame, defaults


class SourceDataFrameProvider(DataFrameProvider):
    """
    Read tables from SourceCatalog for PRET widgets, executing database calls on SourceQueryWorker

    PRET implements description, filtering, paging and materialization, this adapter
    supplies connections, related source tables, progress, and the last query and source schema for Copy code
    """

    def __init__(
        self,
        sources: SourceCatalog,
        query_worker: SourceQueryWorker,
        source: str,
        table: str,
        view_id: str,
        *,
        connection: str | None = None,
        paging=False,
        max_rows=500,
    ):
        if type(paging) is not bool or type(max_rows) is not int or max_rows <= 0:
            raise ValueError("paging must be a boolean and max_rows a positive integer")
        self.sources = sources
        self.query_worker = query_worker
        self.source = source
        self.table = table
        self.connection = connection
        self.view_id = view_id
        self.paging = paging
        self.max_rows = max_rows
        self.dataframes_by_id = {}
        self.last_query = None
        self.last_schema = None

    def get_related_source_table(self, dataframe_id: str) -> IbisTable:
        """
        Look up a related DataFrame and return its lazy Ibis source table.

        Follow added-column views to the underlying source provider. PRET applies
        the related table filter to this object before joining it to the calling
        table, both tables must use the same Ibis connection.

        Parameters
        ----------
        dataframe_id
            The related DataFrame resource_id, for example store["patients"].resource_id
            This ID indexes the Store DataFrame registry

        Returns
        -------
        ibis.expr.types.Table
            Query object for the related source table, evaluated later by PRET
        """
        import ibis

        provider = unwrap_added_columns(self.dataframes_by_id[dataframe_id])[0].provider
        if not isinstance(provider, SourceDataFrameProvider):
            raise ValueError("Source relations require tables from the same Metanno view")
        parent = provider.sources.table(provider.source, provider.table, provider.connection)
        if ibis.get_backend(parent) is not ibis.get_backend(
            self.sources.table(self.source, self.table, self.connection)
        ):
            raise ValueError("Related source queries require a shared Ibis connection, materialize the tables first")
        return parent

    def execute_provider_call(self, method: Literal["describe", "query", "materialize"], options, operation_id):
        """
        Get the Ibis table from SourceCatalog and run its provider method with database cancellation
        """
        import ibis
        from pret.arrow import calculate_arrow_size
        from pret.dataframe_external import IbisDataFrameProvider

        source_table = self.sources.table(self.source, self.table, self.connection)
        provider = IbisDataFrameProvider(
            source_table,
            row_limit=self.max_rows,
            max_bytes=self.sources.config.preview.max_bytes,
            paging=self.paging,
        )
        with self.query_worker.cancellable_query(CancellableQuery(ibis.get_backend(source_table), operation_id)):
            if method == "describe":
                return provider.describe()
            if method == "query":
                options = dict(options or {})
                options["paging"] = self.paging
                if not self.paging:
                    options["limit"] = min(options.get("limit", self.max_rows), self.max_rows)
                result = provider.query(options, get_related_table=self.get_related_source_table)
                self.last_query = options
                self.last_schema = source_table.schema()
                return result
            table = provider.materialize(options)
            max_bytes = (options or {}).get("max_bytes", provider.max_bytes)
            if calculate_arrow_size(table) > max_bytes:
                raise ValueError(f"DataFrame exceeds the save bound of {max_bytes} bytes")
            return table

    def submit(self, method, options=None):
        """
        Queue a provider call on the query worker, which reports its progress to the view tab
        """
        operation_id = uuid.uuid4().hex
        return self.query_worker.submit(
            operation_id,
            self.execute_provider_call,
            method,
            options,
            operation_id,
            view_id=self.view_id,
            source=self.source,
            table=self.table,
            connection=self.connection or self.sources.source(self.source).connection,
        )

    async def describe(self) -> DataFrameDescription:
        """
        Read the source table schema on the backend query thread for widget columns
        """
        return await asyncio.wrap_future(self.submit("describe"))

    async def query(self, options=None) -> DataFrameQueryResult:
        """
        Run the DataFrame query on the backend thread and return Arrow rows with query metadata
        """
        return await asyncio.wrap_future(self.submit("query", options))

    def materialize(self, bounds=None) -> ArrowTable:
        """
        Collect all source rows as an Arrow table on the backend thread for save_store
        """
        if self.query_worker.on_thread(self.connection or self.sources.source(self.source).connection):
            return self.execute_provider_call("materialize", bounds, uuid.uuid4().hex)
        return self.submit("materialize", bounds).result()
