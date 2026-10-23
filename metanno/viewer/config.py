"""
Project connections and source locations used by the Metanno data explorer
"""

from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import yaml
from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictStr, ValidationError, model_validator
from typing_extensions import Annotated

NonEmpty = Annotated[str, Field(min_length=1, strict=True)]
Positive = Annotated[int, Field(gt=0, strict=True)]


class ConfigError(ValueError):
    """
    Invalid Metanno project configuration
    """


class Section(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class PreviewConfig(Section):
    rows: Positive = 500
    max_bytes: Positive = 10 * 1024 * 1024


class ConnectionConfig(Section):
    """
    Open with ibis.connect(url, **kwargs), or call factory, a module and callable separated by a colon
    """

    url: Optional[NonEmpty] = None
    factory: Optional[Annotated[NonEmpty, Field(pattern=r"^[^:]+:.+$")]] = None
    kwargs: Dict[str, Any] = {}

    @model_validator(mode="after")
    def check_target(self):
        if bool(self.url) == bool(self.factory):
            raise ValueError("a connection requires either url or factory")
        return self


class SourceConfig(Section):
    """
    A catalogue database, a folder tree of Parquet or Delta datasets, or every database of a connection

    connection is the one used by default, connections lists the others that can read the same database, e.g. DuckDB
    and Spark for a Hive database. A `databases` source lists the catalogs and databases of its connection, each
    shown as its own source in the sidebar. A `files` source shows the folder tree under its uri, format is detected
    per table when left out, Delta when the table folder has a _delta_log
    """

    name: NonEmpty
    connection: NonEmpty
    connections: List[NonEmpty] = []
    kind: Literal["catalogue", "files", "databases"] = "catalogue"
    catalog: Optional[str] = None
    database: Optional[str] = None
    uri: Optional[str] = None
    format: Optional[Literal["parquet", "delta"]] = None

    @model_validator(mode="after")
    def check_files(self):
        if self.kind == "files" and not self.uri:
            raise ValueError(f"file source {self.name} requires a uri")
        if self.connections and self.connection not in self.connections:
            raise ValueError(f"source {self.name} uses {self.connection}, which is not in its connections")
        return self

    @property
    def allowed_connections(self):
        return self.connections or [self.connection]


class ViewTable(BaseModel):
    """
    A table of a saved view, read by SourceDataFrameProvider with connection, or the source default when None
    """

    source: StrictStr
    table: StrictStr
    connection: Optional[StrictStr] = None
    paging: StrictBool = False
    max_rows: Optional[Positive] = None


class ViewConfig(BaseModel):
    """
    Tables and recipe of a source view, read by load_views from a saved view file or built by the explorer kernel
    for a table tab. root names the main table, the first one by default
    """

    name: str = ""
    tables: Annotated[Dict[str, ViewTable], Field(min_length=1)]
    recipe: str = ""
    parameters: Dict[str, Any] = {}
    root: Optional[str] = None

    @model_validator(mode="after")
    def default_root(self):
        if self.root is None:
            self.root = next(iter(self.tables))
        return self


class ProjectConfig(Section):
    """
    directory is the config folder, e.g. metanno-home, holding the connection modules, views/ and annotations/
    """

    directory: Path
    preview: PreviewConfig = PreviewConfig()
    connections: Dict[NonEmpty, ConnectionConfig] = {}
    sources: Dict[NonEmpty, SourceConfig] = {}


def config_file(path: Path | None = None) -> Path:
    """
    Resolve an explicit file or directory, otherwise the nearest metanno-home/metanno.yaml above the current
    directory.

    The Metanno sidebar keeps this file in the metanno-home folder at the root of the Jupyter file browser, and
    notebook kernels start in a folder under that root, so they find the same file. Without one, it would be in the
    metanno-home folder of the current directory
    """
    if path is None:
        directory = Path.cwd()
        for folder in (directory, *directory.parents):
            if (folder / "metanno-home" / "metanno.yaml").is_file():
                return folder / "metanno-home" / "metanno.yaml"
        return directory / "metanno-home" / "metanno.yaml"
    path = Path(path).expanduser().resolve()
    if not path.is_dir():
        return path
    # A folder may hold its metanno-home, e.g. the file browser root saved by Stores
    return path / "metanno.yaml" if (path / "metanno.yaml").is_file() else path / "metanno-home" / "metanno.yaml"


def parse_config(raw: Any, config_path: Path) -> ProjectConfig:
    """
    Validate connection definitions without importing drivers or starting connections
    """
    if not isinstance(raw, dict):
        raise ConfigError("metanno.yaml must contain a mapping")
    try:
        config = ProjectConfig(
            directory=config_path.parent,
            preview=raw.get("preview", {}),
            connections=raw.get("connections", {}),
            sources={name: {**value, "name": name} for name, value in raw.get("sources", {}).items()},
        )
    except (ValidationError, TypeError, AttributeError) as exc:
        raise ConfigError(f"Invalid Metanno configuration, {exc}") from exc
    for source in config.sources.values():
        for connection in source.allowed_connections:
            if connection not in config.connections:
                raise ConfigError(f"Source {source.name} refers to unknown connection {connection}")
    return config


def load_config(path: Path | None = None) -> ProjectConfig:
    """
    Load an explicit file or the metanno.yaml of a directory, otherwise the nearest one, see config_file
    """
    explicit = path is not None and not Path(path).is_dir()
    config_path = config_file(path)
    if not explicit and not config_path.exists():
        return parse_config({}, config_path)
    try:
        raw = yaml.safe_load(config_path.read_text()) or {}
    except (OSError, yaml.YAMLError) as exc:
        raise ConfigError(f"Could not read {config_path}, {exc}") from exc
    return parse_config(raw, config_path)
