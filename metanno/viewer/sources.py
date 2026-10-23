"""
Read connections and table locations from metanno.yaml for the explorer and Copy code
"""

from __future__ import annotations

import pkgutil
import sys
import threading
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


def is_remote(uri):
    """
    Say whether a location is listed through the connection, eg hdfs://, s3a:// or gs://, rather than a local path
    """
    from urllib.parse import urlparse

    return urlparse(uri).scheme not in ("", "file")


def resolve_uri(config, uri):
    """
    Return the location of a file source folder, a local path starts from the metanno.yaml directory when relative,
    a file:// uri becomes a path
    """
    from urllib.parse import urlparse

    uri = uri.rstrip("/")
    if is_remote(uri):
        return uri
    path = Path(urlparse(uri).path if uri.startswith("file:") else uri).expanduser()
    return str(path if path.is_absolute() else config.directory / path)


def storage_entries(backend, uri):
    """
    List a folder of a file source as (name, is_folder) pairs, for SourceCatalog.file_entries and file_table

    Remote folders, eg on HDFS or S3, are listed by the connection, with its list_storage method or the Hadoop
    filesystem of a Spark connection, local ones with pathlib. A connection with only list_folders gives the subfolders
    """
    if not is_remote(uri):
        return [(path.name, path.is_dir()) for path in Path(uri).iterdir()]
    if hasattr(backend, "list_storage"):
        return backend.list_storage(uri)
    if hasattr(backend, "list_folders"):
        return [(name, True) for name in backend.list_folders(uri)]
    if backend.name != "pyspark":
        raise QueryError(f"Listing {uri} needs a Spark connection or a connection with a list_storage method")
    spark = backend._session
    path = spark._jvm.org.apache.hadoop.fs.Path(uri)
    filesystem = path.getFileSystem(spark._jsc.hadoopConfiguration())
    return [(status.getPath().getName(), status.isDirectory()) for status in filesystem.listStatus(path)]


def is_dataset(entries):
    """
    Say whether a folder, from its storage_entries, is itself one dataset rather than a folder of datasets and folders

    A Delta log, a Spark _SUCCESS marker or hive partition folders, eg year=2024, make a dataset, and so do data files,
    eg part-00000.parquet or 000000_0, without subfolders. Next to subfolders, .parquet files are tables of their own,
    see SourceCatalog.file_entries
    """
    if any(name in ("_delta_log", "_SUCCESS") or (folder and "=" in name) for name, folder in entries):
        return True
    if any(folder and visible(name) for name, folder in entries):
        return False
    return any(not folder and visible(name) for name, folder in entries)


def opens_as_table(backend, uri):
    """
    Say whether a location is a dataset or a .parquet file of its own, for SourceCatalog.resolve_path
    """
    parent, name = uri.rsplit("/", 1)
    if name.endswith(".parquet") and (name, False) in storage_entries(backend, parent):
        return True
    return is_dataset(storage_entries(backend, uri))


def visible(name):
    return not name.startswith(("_", "."))


def place(uri):
    """
    Key to compare locations, an HDFS uri without its host, eg hdfs://namenode/user/me is hdfs:///user/me
    """
    from urllib.parse import urlparse

    parsed = urlparse(uri)
    return f"hdfs://{parsed.path.rstrip('/')}" if parsed.scheme == "hdfs" else uri.rstrip("/")


def checked_path(path):
    """
    Return a table or folder path of a file source, refusing paths that leave the source folder, eg `../other`
    """
    if any(part in ("", ".", "..") for part in path.split("/")):
        raise QueryError(f"Invalid path {path!r} in a file source")
    return path


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
        # Connection factories and recipes import the modules of the config folder, e.g. metanno-home/my_connections.py
        if str(self.config.directory) not in sys.path:
            sys.path.insert(0, str(self.config.directory))
        self.connections = {}
        self.resources = {}
        self.connection_locks = {}
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
        # Each connection opens on its own query thread, a slow one, e.g. Spark, does not block the others
        with self.connection_locks.setdefault(name, threading.Lock()):
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
                    backend = pkgutil.resolve_name(config.factory)(**config.kwargs)
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
        # A folder made a source by resolve_path, eg in a fullscreen link, is made again after a kernel restart
        if source is None and "://" in name and self.config.default_connection:
            source = SourceConfig(name=name, connection=self.config.default_connection, kind="files", uri=name)
            self.listed[name] = source
        if source is None:
            raise QueryError(f"Unknown data source {name!r}")
        return source

    def resolve_path(self, uri, connection=None):
        """
        Find the source and table of a dataset given by its location, eg opened from an HDFS file browser extension

        The dataset is a table of the deepest file source of metanno.yaml that contains it and can use the connection.
        Otherwise the folder of the dataset becomes a source, read with the connection or default_connection

        Returns
        -------
        tuple[str, str, str]
            Source name, table name and connection, eg ("hdfs:///user/me", "runs/notes", "duckdb")
        """
        uri = resolve_uri(self.config, uri)
        key = place(uri)
        found = None
        for source in self.config.sources.values():
            root = resolve_uri(self.config, source.uri) if source.kind == "files" else None
            if root is None or (connection and connection not in source.allowed_connections):
                continue
            if (key == place(root) or key.startswith(place(root) + "/")) and (
                found is None or len(place(root)) > len(place(found[1]))
            ):
                found = source, root
        if found:
            source, root = found
            backend = self.connection(connection or source.connection)
            if key == place(root):
                if not is_dataset(storage_entries(backend, root)):
                    raise QueryError(f"{uri} is a folder, open one of its datasets")
                return source.name, root.rsplit("/", 1)[-1], connection or source.connection
            table = key[len(place(root)) + 1 :]
            if not opens_as_table(backend, f"{root}/{table}"):
                raise QueryError(f"{uri} is a folder, open one of its datasets")
            return source.name, table, connection or source.connection
        connection = connection or self.config.default_connection
        if connection is None:
            raise QueryError(f"No source contains {uri}, pass a connection or set default_connection in metanno.yaml")
        if connection not in self.config.connections:
            raise QueryError(f"Unknown connection {connection!r}")
        if not opens_as_table(self.connection(connection), uri):
            raise QueryError(f"{uri} is a folder, open one of its datasets")
        parent, table = uri.rsplit("/", 1)
        self.listed[parent] = SourceConfig(name=parent, connection=connection, kind="files", uri=parent)
        return parent, table, connection

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

    def list_tables(self, source_name, folder=""):
        """
        List the tables of a catalogue source, or the datasets and subfolders of a folder of a file source

        Each entry is a table or a folder named by its path under the source uri, eg `runs/notes`, which the sidebar
        passes back as folder to list that folder. A file source whose uri is one dataset has a single table named
        after its folder
        """
        source = self.source(source_name)
        if source.kind == "databases":
            raise QueryError(f"Source {source_name!r} lists databases, not tables, see list_databases")
        backend = self.connection(source.connection)
        if source.kind == "catalogue":
            entries = {name: "table" for name in backend.list_tables(database=self.database_name(source))}
        else:
            entries = self.file_entries(source, backend, folder)
        return [{"name": name, "source": source_name, "kind": kind} for name, kind in sorted(entries.items())]

    def file_entries(self, source, backend, folder):
        """
        Map the datasets and subfolders of a folder of a file source to "table" or "folder", eg {"runs/notes": "table"}

        Each subfolder is listed to tell a dataset from a folder of datasets, in parallel since listings do not query
        the connection. A connection with only list_folders gives no files, so its subfolders are tables
        """
        root = resolve_uri(self.config, source.uri)
        uri = f"{root}/{checked_path(folder)}" if folder else root
        entries = storage_entries(backend, uri)
        if not folder and is_dataset(entries):
            return {root.rsplit("/", 1)[-1]: "table"}
        prefix = f"{folder}/" if folder else ""
        subfolders = [name for name, is_folder in entries if is_folder and visible(name) and "=" not in name]
        if is_remote(uri) and not hasattr(backend, "list_storage") and hasattr(backend, "list_folders"):
            return {prefix + name: "table" for name in subfolders}
        with ThreadPoolExecutor(16) as pool:
            datasets = list(pool.map(lambda name: is_dataset(storage_entries(backend, f"{uri}/{name}")), subfolders))
        found = {prefix + name: "table" if dataset else "folder" for name, dataset in zip(subfolders, datasets)}
        # Next to subfolders, .parquet files are tables of their own
        found.update(
            {
                prefix + name: "table"
                for name, is_folder in entries
                if not is_folder and visible(name) and name.endswith(".parquet")
            }
        )
        return found

    def file_table(self, source_name, table_name, connection=None):
        """
        Return the location and format of a table of a file source, for table and Copy code

        table_name is the path of the dataset under the source uri, or the name of the source folder when it is one
        dataset. A dataset is read as Delta when its folder has a _delta_log, as Parquet otherwise, unless
        metanno.yaml gives the format
        """
        source = self.source(source_name)
        backend = self.connection(connection or source.connection)
        root = resolve_uri(self.config, source.uri)
        uri = f"{root}/{checked_path(table_name)}"
        try:
            if table_name == root.rsplit("/", 1)[-1] and is_dataset(storage_entries(backend, root)):
                uri = root
            # A .parquet file next to subfolders is a table of its own
            elif table_name.endswith(".parquet"):
                parent, name = uri.rsplit("/", 1)
                if (name, False) in storage_entries(backend, parent):
                    return uri, "parquet"
            entries = storage_entries(backend, uri)
        except (OSError, QueryError) as exc:
            separator = "/" if "/" in source_name else "."
            raise QueryError(f"Unknown file table {source_name}{separator}{table_name}") from exc
        return uri, source.format or ("delta" if ("_delta_log", True) in entries else "parquet")

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
                uri, format = self.file_table(source_name, table_name, connection)
                table = (backend.read_delta if format == "delta" else backend.read_parquet)(uri)
            self.tables[key] = table
        return self.tables[key]
