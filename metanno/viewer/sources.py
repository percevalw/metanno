"""
Read connections and table locations from metanno.yaml for the explorer and Copy code
"""

from __future__ import annotations

import importlib.util
import pkgutil
import sys
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack
from pathlib import Path
from typing import TYPE_CHECKING

from ibis.common.exceptions import TableNotFound

from .config import SourceConfig, config_file, load_config

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


def catalog_databases(backend, catalog):
    """
    List the databases of a catalog that hold at least one table the user can see, for SourceCatalog.list_databases

    One information_schema query per catalog is much faster than a list_tables per database, e.g. 47 s instead of 6
    min on the EDS Trino. A backend without information_schema, e.g. Spark, lists all the databases of the catalog
    """
    for location in ((catalog, "information_schema"), "information_schema"):
        try:
            tables = backend.table("tables", database=location)
            names = tables.filter(tables.table_catalog == catalog).select("table_schema").distinct().to_pyarrow()
            return [(catalog, name) for name in names["table_schema"].to_pylist() if name != "information_schema"]
        except Exception:
            continue
    try:
        return [(catalog, database) for database in backend.list_databases(catalog=catalog)]
    except Exception:
        return []


class SourceCatalog:
    """
    Share lazily opened Ibis connections across the sources listed in metanno.yaml
    """

    def __init__(self, config_path=None):
        self.config_path = config_file(config_path)
        self.config = load_config(config_path)
        self.connections = {}
        self.resources = {}
        self.connection_lock = threading.Lock()
        # Tables by (source, table, connection), the same table can be open on DuckDB and on Spark
        self.tables = {}
        # Databases found by list_databases, by the name shown in the sidebar, e.g. my_catalog.my_database
        self.listed = {}

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
                    self.tables = {key: table for key, table in self.tables.items() if key[2] != name}
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
        """
        Describe each source for the sidebar: its default connection, the ones it can switch to, and whether it is a
        `databases` source that the sidebar expands with list_databases
        """
        return [
            {
                "name": source.name,
                "kind": source.kind,
                "connection": source.connection,
                "connections": source.allowed_connections,
            }
            for source in self.config.sources.values()
        ]

    def source(self, name):
        """
        Return the SourceConfig of a source of metanno.yaml or of a database found by list_databases
        """
        source = self.config.sources.get(name) or self.listed.get(name)
        if source is None:
            raise QueryError(f"Unknown data source {name!r}")
        return source

    def list_databases(self, source_name):
        """
        List the databases of a `databases` source, each becoming a source the sidebar shows under it

        When the backend has catalogs, e.g. Trino, the databases of every catalog are named `catalog.database`, and
        only those with a table the user can see are kept
        """
        source = self.source(source_name)
        if source.kind != "databases":
            raise QueryError(f"Source {source_name!r} is not a databases source")
        backend = self.connection(source.connection)
        if hasattr(backend, "list_catalogs"):
            catalogs = backend.list_catalogs()
            # The EDS Trino refuses more than about 16 queries at once, in-process engines such as DuckDB cannot share
            # their connection between threads
            workers = 1 if backend.name in {"duckdb", "sqlite"} else 8
            with ThreadPoolExecutor(workers) as pool:
                found = [
                    pair
                    for pairs in pool.map(lambda name: catalog_databases(backend, name), catalogs)
                    for pair in pairs
                ]
        else:
            found = [(None, database) for database in backend.list_databases()]
        databases = []
        for catalog, database in sorted(found, key=lambda pair: (pair[0] or "", pair[1])):
            name = f"{catalog}.{database}" if catalog else database
            if name in self.config.sources:
                continue
            self.listed[name] = SourceConfig(
                name=name, connection=source.connection, catalog=catalog, database=database
            )
            databases.append(
                {"name": name, "kind": "catalogue", "connection": source.connection, "connections": [source.connection]}
            )
        return databases

    def set_connection(self, source_name, connection):
        """
        Make connection the default of a source, in memory and in metanno.yaml, keeping the comments of the file
        """
        from ruamel.yaml import YAML

        source = self.source(source_name)
        if source_name not in self.config.sources:
            raise QueryError(f"Source {source_name!r} comes from a databases source and has a single connection")
        if connection not in source.allowed_connections:
            raise QueryError(f"Source {source_name!r} cannot use connection {connection!r}")
        yaml = YAML()
        yaml.preserve_quotes = True
        yaml.width = 4096
        document = yaml.load(self.config_path.read_text())
        document["sources"][source_name]["connection"] = connection
        with self.config_path.open("w") as file:
            yaml.dump(document, file)
        self.config.sources[source_name] = source.model_copy(update={"connection": connection})

    def database_name(self, source):
        return (source.catalog, source.database) if source.catalog else source.database

    def list_tables(self, source_name):
        """
        List catalogue tables or child datasets at the URI recorded in the source definition
        """
        source = self.source(source_name)
        if source.kind == "databases":
            raise QueryError(f"Source {source_name!r} lists databases, not tables, see list_databases")
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
            if hasattr(backend, "list_folders"):
                return backend.list_folders(source.uri)
            if backend.name != "pyspark":
                raise QueryError(
                    "HDFS and S3A directory discovery requires a Spark connection or a list_folders method"
                )
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

    def table(self, source_name: str, table_name: str, connection: str | None = None) -> IbisTable:
        """
        Return an Ibis Table from the source definition, reusing file registrations between queries

        connection is one of the source connections, its default one when None
        """
        source = self.source(source_name)
        connection = connection or source.connection
        if connection not in source.allowed_connections:
            raise QueryError(f"Source {source_name!r} cannot use connection {connection!r}")
        key = source_name, table_name, connection
        # Checks the connection before reusing a table, see connection
        backend = self.connection(connection)
        if key not in self.tables:
            if source.kind == "catalogue":
                try:
                    table = backend.table(table_name, database=self.database_name(source))
                except TableNotFound as exc:
                    raise QueryError(
                        f"Table {table_name!r} of source {source_name!r} cannot be read on connection "
                        f"{connection!r}, it may not exist anymore or you may not be allowed to read its columns"
                    ) from exc
            else:
                if table_name not in self.list_storage_children(source, backend):
                    raise QueryError(f"Unknown file table {source_name}.{table_name}")
                reader = backend.read_delta if source.format == "delta" else backend.read_parquet
                table = reader(file_table_uri(self.config, source, table_name))
            self.tables[key] = table
        return self.tables[key]
