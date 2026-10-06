"""
Project connections and source locations used by the Metanno data explorer
"""

from pathlib import Path
from typing import Any, Dict, Literal, Optional

import yaml
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator
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
    A catalogue database or a directory of Parquet or Delta tables reached through a named connection
    """

    name: NonEmpty
    connection: NonEmpty
    kind: Literal["catalogue", "files"] = "catalogue"
    catalog: Optional[str] = None
    database: Optional[str] = None
    uri: Optional[str] = None
    format: Optional[Literal["parquet", "delta"]] = None

    @model_validator(mode="after")
    def check_files(self):
        if self.kind == "files" and (not self.uri or self.format is None):
            raise ValueError(f"file source {self.name} requires uri and parquet or delta format")
        return self


class ProjectConfig(Section):
    directory: Path
    preview: PreviewConfig = PreviewConfig()
    connections: Dict[NonEmpty, ConnectionConfig] = {}
    sources: Dict[NonEmpty, SourceConfig] = {}
    views: Path


def config_file(path: Path | None = None) -> Path:
    """
    Resolve an explicit file or directory, otherwise the nearest metanno.yaml above the current directory.

    The Metanno sidebar keeps this file at the root of the Jupyter file browser, and notebook kernels start in a
    folder under that root, so they find the same file. Without one, it would be in the current directory
    """
    if path is None:
        directory = Path.cwd()
        for folder in (directory, *directory.parents):
            if (folder / "metanno.yaml").is_file():
                return folder / "metanno.yaml"
        return directory / "metanno.yaml"
    path = Path(path).expanduser().resolve()
    return path / "metanno.yaml" if path.is_dir() else path


def parse_config(raw: Any, config_path: Path) -> ProjectConfig:
    """
    Validate connection definitions without importing drivers or starting connections
    """
    if not isinstance(raw, dict):
        raise ConfigError("metanno.yaml must contain a mapping")
    views = Path(raw.get("views", "views")).expanduser()
    try:
        config = ProjectConfig(
            directory=config_path.parent,
            preview=raw.get("preview", {}),
            connections=raw.get("connections", {}),
            sources={name: {**value, "name": name} for name, value in raw.get("sources", {}).items()},
            views=views if views.is_absolute() else config_path.parent / views,
        )
    except (ValidationError, TypeError, AttributeError) as exc:
        raise ConfigError(f"Invalid Metanno configuration, {exc}") from exc
    for source in config.sources.values():
        if source.connection not in config.connections:
            raise ConfigError(f"Source {source.name} refers to unknown connection {source.connection}")
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
