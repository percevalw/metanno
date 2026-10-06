"""
Read connections and table locations from metanno.yaml for the explorer and Copy code
"""

from __future__ import annotations

import importlib.util
import pkgutil
import sys
import threading
import uuid
from contextlib import ExitStack
from pathlib import Path
from typing import TYPE_CHECKING

from ibis.common.exceptions import TableNotFound

from .config import load_config

if TYPE_CHECKING:
    from ibis.expr.types import Table as IbisTable


class QueryError(RuntimeError):
    """
    A source could not be opened or queried
    """


def load_factory(directory, spec):
    """
    Import the connection factory `module:attribute` of a connection, for SourceCatalog.connection and Copy code

    A module beside metanno.yaml is loaded from that file, isolated by path when several projects share a kernel
    """
    module, attribute = spec.split(":", 1)
    project_module = directory / (module + ".py")
    if project_module.is_file():
        module = "metanno_connection_" + uuid.uuid5(uuid.NAMESPACE_URL, str(project_module)).hex
        if module not in sys.modules:
            module_spec = importlib.util.spec_from_file_location(module, project_module)
            loaded = importlib.util.module_from_spec(module_spec)
            sys.modules[module] = loaded
            try:
                module_spec.loader.exec_module(loaded)
            except Exception:
                del sys.modules[module]
                raise
    return pkgutil.resolve_name(f"{module}:{attribute}")


def file_table_uri(config, source, table_name):
    """
    Return the location of a table of a file source, relative paths start from the metanno.yaml directory
    """
    uri = source.uri.rstrip("/") + "/" + table_name
    return uri if ":" in uri or Path(uri).is_absolute() else str(config.directory / uri)


class SourceCatalog:
    """
    Share lazily opened Ibis connections across the sources listed in metanno.yaml
    """

    def __init__(self, config_path=None):
        self.config = load_config(config_path)
        self.connections = {}
        self.resources = {}
        self.connection_lock = threading.Lock()
        self.tables = {}

    def connection(self, name):
        """
        Open a connection from metanno.yaml once, with cleanup controlled by its factory or this catalogue

        A Spark session stopped by the cluster, e.g. when YARN client mode loses its connection after the
        2 hour TCP limit, is closed and opened again with its tables
        """
        with self.connection_lock:
            backend = self.connections.get(name)
            if backend is not None and backend.name == "pyspark":
                context = backend._session.sparkContext
                if context._jsc is None or context._jsc.sc().isStopped():
                    self.resources.pop(name).close()
                    del self.connections[name]
                    self.tables = {
                        key: table for key, table in self.tables.items() if self.source(key[0]).connection != name
                    }
            if name in self.connections:
                return self.connections[name]
            import ibis

            config = self.config.connections[name]
            resources = self.resources[name] = ExitStack()
            try:
                if config.factory:
                    backend = load_factory(self.config.directory, config.factory)(**config.kwargs)
                    if hasattr(backend, "__enter__"):
                        backend = resources.enter_context(backend)
                else:
                    backend = ibis.connect(config.url, **config.kwargs)
                    resources.callback(backend.disconnect)
            except ImportError as exc:
                raise QueryError(
                    f"Connection {name} could not import a module ({exc}), install its Ibis backend driver in the "
                    "Metanno data explorer kernel environment, a factory module must be beside metanno.yaml or "
                    "installed in that environment"
                ) from exc
            self.connections[name] = backend
            return backend

    def close(self):
        """
        Close the connections opened by this catalog, a factory backend is closed only when it is a context manager
        """
        for resources in self.resources.values():
            resources.close()
        self.resources.clear()
        self.connections.clear()
        self.tables.clear()

    def list_sources(self):
        return [{"name": source.name, "kind": source.kind} for source in self.config.sources.values()]

    def source(self, name):
        try:
            return self.config.sources[name]
        except KeyError as exc:
            raise QueryError(f"Unknown data source {name!r}") from exc

    def database_name(self, source):
        return (source.catalog, source.database) if source.catalog else source.database

    def list_tables(self, source_name):
        """
        List catalogue tables or child datasets at the URI recorded in the source definition
        """
        source = self.source(source_name)
        backend = self.connection(source.connection)
        if source.kind == "catalogue":
            names = backend.list_tables(database=self.database_name(source))
        else:
            names = self.list_storage_children(source, backend)
        return [{"name": name, "source": source_name} for name in sorted(names)]

    def list_storage_children(self, source, backend):
        """
        List local file datasets or use the source connection to access Hadoop filesystems
        """
        if source.uri.startswith(("hdfs:", "s3a:")):
            if backend.name != "pyspark":
                raise QueryError("HDFS and S3A directory discovery requires a Spark connection")
            spark = backend._session
            path = spark._jvm.org.apache.hadoop.fs.Path(source.uri)
            filesystem = path.getFileSystem(spark._jsc.hadoopConfiguration())
            return [status.getPath().getName() for status in filesystem.listStatus(path) if status.isDirectory()]
        from urllib.parse import urlparse

        uri = urlparse(source.uri)
        if uri.scheme not in ("", "file"):
            raise QueryError(f"Directory discovery does not support {uri.scheme}, use a catalogue source")
        root = Path(uri.path).expanduser()
        if not root.is_absolute():
            root = self.config.directory / root
        return [path.name for path in root.iterdir() if path.is_dir() or path.suffix == ".parquet"]

    def table(self, source_name: str, table_name: str) -> IbisTable:
        """
        Return an Ibis Table from the source definition, reusing file registrations between queries
        """
        key = source_name, table_name
        source = self.source(source_name)
        # Checks the connection before reusing a table, see connection
        backend = self.connection(source.connection)
        if key not in self.tables:
            if source.kind == "catalogue":
                try:
                    table = backend.table(table_name, database=self.database_name(source))
                except TableNotFound as exc:
                    raise QueryError(
                        f"Table {table_name!r} is not available in source {source_name!r} "
                        f"on connection {source.connection!r}, "
                        "check the table name and configured catalogue or database"
                    ) from exc
            else:
                if table_name not in self.list_storage_children(source, backend):
                    raise QueryError(f"Unknown file table {source_name}.{table_name}")
                reader = backend.read_delta if source.format == "delta" else backend.read_parquet
                table = reader(file_table_uri(self.config, source, table_name))
            self.tables[key] = table
        return self.tables[key]
