"""
Source configuration discovery, connection ownership and Spark reconnection
"""

from contextlib import contextmanager
from decimal import Decimal
from types import SimpleNamespace

import ibis
import pytest
import yaml

from metanno.viewer.config import ConfigError, config_file, load_config
from metanno.viewer.sources import QueryError, SourceCatalog


def test_nearest_configuration_and_explicit_overrides(tmp_path, tmp_path_factory, config_path, monkeypatch):
    """
    Notebooks below the Jupyter root find its metanno-home/metanno.yaml, explicit files and directories override it
    """
    # Without a metanno-home above the notebook, the configuration would be in a metanno-home beside it
    empty = tmp_path_factory.mktemp("empty")
    monkeypatch.chdir(empty)
    assert config_file() == empty / "metanno-home" / "metanno.yaml"
    assert load_config().sources == {}
    # The metanno-home of a root above the notebooks is found, the nearest one wins
    home = tmp_path / "metanno-home"
    home.mkdir()
    config_path = config_path.rename(home / "metanno.yaml")
    nested = tmp_path / "project" / "notebooks"
    nested.mkdir(parents=True)
    monkeypatch.chdir(nested)
    assert config_file() == config_path
    assert load_config().sources["planner"].connection == "local"
    assert config_file(home) == config_path
    project = tmp_path / "project" / "metanno-home" / "metanno.yaml"
    project.parent.mkdir()
    project.write_text(config_path.read_text())
    assert config_file() == project
    with pytest.raises(ConfigError):
        load_config(tmp_path / "missing.yaml")


@pytest.mark.parametrize(
    "data",
    [
        {"connections": {"local": {"url": "duckdb://", "factory": "app:connect"}}},
        {"sources": {"source": {"connection": "missing"}}},
        {"preview": {"rows": 0}},
        {
            "connections": {"local": {"url": "duckdb://"}},
            "sources": {"source": {"connection": "local", "kind": "files", "format": "csv", "uri": "/data"}},
        },
        {
            "connections": {"local": {"url": "duckdb://"}, "other": {"url": "duckdb://"}},
            "sources": {"source": {"connection": "local", "connections": ["other"]}},
        },
    ],
)
def test_invalid_config(tmp_path, data):
    path = tmp_path / "metanno.yaml"
    path.write_text(yaml.safe_dump(data))
    with pytest.raises(ConfigError):
        load_config(path)


def test_catalogue_queries_and_file_sources(tmp_path, config_path, monkeypatch):
    import sys

    path = config_path
    service = SourceCatalog(path)
    assert service.list_sources() == [
        {"name": "planner", "kind": "catalogue", "connection": "local", "connections": ["local"]}
    ]
    assert service.connections == {}
    backend = service.connection("local")
    with pytest.raises(QueryError, match="Table 'missing' of source 'planner' cannot be read"):
        service.table("planner", "missing")
    backend.create_table(
        "lists",
        ibis.memtable({"id": [1, 2], "name": ["Home", "Work"], "amount": [Decimal("1.20"), Decimal("2.40")]}),
    )
    assert {"name": "lists", "source": "planner"} in service.list_tables("planner")
    assert service.table("planner", "lists").schema().names[0] == "id"
    root = tmp_path / "exports"
    root.mkdir()
    backend.table("lists").to_parquet(root / "lists.parquet")
    remote = ibis.duckdb.connect()
    remote.list_folders = lambda uri: ["care_site", "person"] if uri == "s3a://bucket/central" else []
    monkeypatch.setitem(sys.modules, "s3_connections", SimpleNamespace(connect=lambda: remote))
    config = yaml.safe_load(path.read_text())
    config["connections"]["s3"] = {"factory": "s3_connections:connect"}
    config["sources"]["files"] = {"connection": "local", "kind": "files", "format": "parquet", "uri": "exports"}
    config["sources"]["central"] = {
        "connection": "s3",
        "kind": "files",
        "format": "delta",
        "uri": "s3a://bucket/central",
    }
    path.write_text(yaml.safe_dump(config))
    service.config = load_config(path)
    assert service.list_tables("files") == [{"name": "lists.parquet", "source": "files"}]
    assert service.table("files", "lists.parquet").limit(1).to_pyarrow().num_rows == 1
    assert service.list_tables("central") == [
        {"name": "care_site", "source": "central"},
        {"name": "person", "source": "central"},
    ]
    service.close()
    assert not service.connections


def test_factory_ownership_and_missing_drivers(tmp_path, monkeypatch):
    import sys

    created, closed = [], []
    borrowed = ibis.duckdb.connect()

    @contextmanager
    def owned():
        created.append("owned")
        backend = ibis.duckdb.connect()
        try:
            yield backend
        finally:
            closed.append("owned")
            backend.disconnect()

    def missing():
        raise ImportError("optional driver")

    monkeypatch.setitem(
        sys.modules,
        "viewer_connections",
        SimpleNamespace(owned=owned, borrowed=lambda: borrowed, missing=missing),
    )
    path = tmp_path / "metanno.yaml"
    path.write_text(
        yaml.safe_dump(
            {
                "connections": {
                    "owned": {"factory": "viewer_connections:owned"},
                    "borrowed": {"factory": "viewer_connections:borrowed"},
                    "missing": {"factory": "viewer_connections:missing"},
                },
                "sources": {name: {"connection": name} for name in ("owned", "borrowed", "missing")},
            }
        )
    )
    service = SourceCatalog(path)
    assert len(service.list_sources()) == 3 and not created
    assert service.connection("owned") is service.connection("owned")
    assert service.connection("borrowed") is borrowed
    with pytest.raises(QueryError, match=r"could not import a module \(optional driver\)"):
        service.connection("missing")
    assert created == ["owned"]
    service.close()
    assert closed == ["owned"]
    assert borrowed.sql("select 1 as value").execute().value.tolist() == [1]
    borrowed.disconnect()


def test_stopped_spark_session_reconnects(tmp_path, monkeypatch):
    """
    Reopen a factory Spark session after the cluster stops its context, as YARN does after the 2 hour TCP limit
    """
    import sys

    pytest.importorskip("pyspark")
    import pyarrow as pa
    import pyarrow.parquet as pq
    from pyspark.sql import SparkSession

    # The local session reads local files even where the Hadoop configuration defaults to HDFS
    @contextmanager
    def spark():
        session = SparkSession.builder.master("local[1]").config("spark.hadoop.fs.defaultFS", "file:///").getOrCreate()
        try:
            yield ibis.pyspark.connect(session=session)
        finally:
            session.stop()

    monkeypatch.setitem(sys.modules, "viewer_connections", SimpleNamespace(spark=spark))
    (tmp_path / "data").mkdir()
    pq.write_table(pa.table({"todo_id": [1, 2]}), tmp_path / "data/todos.parquet")
    path = tmp_path / "metanno.yaml"
    path.write_text(
        yaml.safe_dump(
            {
                "connections": {"spark": {"factory": "viewer_connections:spark"}},
                "sources": {
                    "files": {
                        "connection": "spark",
                        "kind": "files",
                        "format": "parquet",
                        "uri": str(tmp_path / "data"),
                    }
                },
            }
        )
    )
    service = SourceCatalog(path)
    first = service.connection("spark")
    assert service.table("files", "todos.parquet").count().execute() == 2
    # Stop only the JVM context, the Python session still references it like after a lost YARN connection
    first._session.sparkContext._jsc.sc().stop()
    assert service.table("files", "todos.parquet").count().execute() == 2
    assert service.connection("spark") is not first
    service.close()


def test_trino_cancellation_tracks_all_cursors():
    from metanno.viewer.ibis_cancellation import CancellableQuery

    cancelled = []
    connection = SimpleNamespace(cursor=lambda: SimpleNamespace(cancel=lambda: cancelled.append(True)))
    backend = SimpleNamespace(name="trino", con=connection)
    with CancellableQuery(backend, "query") as execution:
        backend.con.cursor()
        backend.con.cursor()
        assert execution.cancel()
        with pytest.raises(RuntimeError, match="cancelled"):
            backend.con.cursor()
    assert backend.con is connection
    assert cancelled == [True, True]


def test_application_import_and_empty_sources_without_backend_drivers(tmp_path):
    import subprocess
    import sys

    result = subprocess.run(
        [
            sys.executable,
            "-c",
            """
import importlib.abc
import sys

class NoDrivers(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.split(".")[0] in ("pyspark", "duckdb", "trino"):
            raise ImportError("Backend driver is not installed")

sys.meta_path.insert(0, NoDrivers())
from metanno import view_opener
import metanno.viewer.explorer_kernel
assert "pret.manager" not in sys.modules
from metanno.viewer.sources import SourceCatalog
from metanno.viewer.view_opener import ViewOpener
from pret import DataFrame, create_store
service = SourceCatalog(sys.argv[1])
assert service.list_sources() == []
store = create_store({"todos": DataFrame([{"id": 1}])}, sync=True)
output = ViewOpener(store, None, None, sys.argv[1], None, True)
assert output.read_only and output._repr_mimebundle_()
""",
            str(tmp_path),
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr


def test_explorer_registration_records_the_selected_python(tmp_path):
    import json
    import os
    import subprocess
    import sys

    subprocess.run(
        [sys.executable, "-m", "metanno.viewer.explorer_kernel", "--install"],
        env={**os.environ, "JUPYTER_DATA_DIR": str(tmp_path)},
        check=True,
        capture_output=True,
        text=True,
    )
    spec = json.loads((tmp_path / "kernels/metanno-explorer/kernel.json").read_text())
    assert spec["argv"] == [
        sys.executable,
        "-m",
        "metanno.viewer.explorer_kernel",
        "-f",
        "{connection_file}",
    ]
    assert spec["display_name"] == "Metanno Data Explorer"


def test_sources_switch_connection_and_list_databases(tmp_path):
    """
    Read one database with either of its connections, make one the default in metanno.yaml, and list the
    databases of a connection as sources
    """
    import duckdb

    with duckdb.connect(str(tmp_path / "notes.duckdb")) as connection:
        connection.execute("CREATE SCHEMA cohort")
        connection.execute("CREATE TABLE cohort.patients AS SELECT 1 AS patient_id")
    path = tmp_path / "metanno.yaml"
    path.write_text(
        "# Shared notes, read with DuckDB or a second DuckDB connection\n"
        "connections:\n"
        f"  fast: {{url: 'duckdb://{tmp_path / 'notes.duckdb'}'}}\n"
        f"  slow: {{url: 'duckdb://{tmp_path / 'notes.duckdb'}'}}\n"
        "sources:\n"
        "  notes:\n"
        "    database: cohort\n"
        "    connection: fast  # the quick one\n"
        "    connections: [fast, slow]\n"
        "  everything: {connection: slow, kind: databases}\n"
    )
    service = SourceCatalog(path)
    assert service.list_sources()[0] == {
        "name": "notes",
        "kind": "catalogue",
        "connection": "fast",
        "connections": ["fast", "slow"],
    }
    fast = service.table("notes", "patients")
    slow = service.table("notes", "patients", "slow")
    assert set(service.tables) == {("notes", "patients", "fast"), ("notes", "patients", "slow")}
    assert ibis.get_backend(fast) is not ibis.get_backend(slow)
    with pytest.raises(QueryError):
        service.table("notes", "patients", "missing")

    before = path.read_text()
    service.set_connection("notes", "slow")
    assert path.read_text() == before.replace("connection: fast  # the quick one", "connection: slow  # the quick one")
    assert service.source("notes").connection == "slow"
    assert SourceCatalog(path).source("notes").connection == "slow"

    listed = {source["name"] for source in service.list_databases("everything")}
    assert "notes.cohort" in listed and "notes.main" not in listed
    assert service.list_tables("notes.cohort") == [{"name": "patients", "source": "notes.cohort"}]
    assert service.table("notes.cohort", "patients").count().execute() == 1
    with pytest.raises(QueryError):
        service.set_connection("notes.cohort", "fast")
    service.close()
