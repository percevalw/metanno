"""
Load Python applications and their parameter schemas for source views and saved Annotations
"""

from __future__ import annotations

import enum
import importlib.util
import inspect
import pkgutil
import types
import typing
from pathlib import Path

from confit import Config, validate_arguments
from pydantic import TypeAdapter, ValidationError
from pydantic_core import to_jsonable_python
from typing_extensions import is_typeddict

from .config import ViewConfig


def table_view(store):
    """
    Show each DataFrame of a Store in its own tab, with a form for the rows selected in the last table used, the
    default view of tables and the raw view of any Store
    """
    from pret import DataFrame, component, use_store_snapshot
    from pret.dataframe_sqlite import INTERNAL_ROW_ID
    from pret.hooks import use_ref
    from pret_simple_dock import Layout, Panel

    from metanno import DataWidgetFactory

    keys = [key for key in store if isinstance(store[key], DataFrame)]
    if not keys:
        raise ValueError("The table view requires a DataFrame, choose a recipe for this Store")
    # Pret row IDs identify the selected rows shared by each table and its form
    factory = DataWidgetFactory(store)
    tables = [
        factory.create_table_widget(
            store_key=key,
            primary_key=INTERNAL_ROW_ID,
            fields=[],
            include_unconfigured_columns=True,
            source_requery=True,
            style={"height": "100%"},
        )
        for key in keys
    ]
    forms = [
        factory.create_form_widget(
            store_key=key,
            primary_key=INTERNAL_ROW_ID,
            fields=[],
            style={"height": "100%", "overflow": "auto", "padding": "8px", "boxSizing": "border-box"},
        )
        for key in keys
    ]
    selections = [factory.selected_rows[key] for key in keys]

    @component
    def SelectedRows():
        # Show the form of the table whose selection changed last, the first table before any selection
        snapshots = [use_store_snapshot(selection) for selection in selections]
        previous = use_ref(None)
        active = use_ref(0)
        if previous.current is not None:
            for idx in range(len(snapshots)):
                if snapshots[idx] is not previous.current[idx]:
                    active.current = idx
        previous.current = snapshots
        return forms[active.current]

    # Table tab names are the Store keys, renamed when one is the name of the form tab
    names = [key if key != "Selected rows" else f"{key} table" for key in keys]
    return Layout(
        *[Panel(table, key=name) for name, table in zip(names, tables)],
        Panel(SelectedRows(), key="Selected rows"),
        default_config={
            "kind": "row",
            "children": [{"tabs": names, "size": 70}, {"tabs": ["Selected rows"], "size": 30}],
        },
        style={"height": "100%", "minHeight": 0},
    )


table_view.annotation_setup_code = None
table_view.tables = None
table_view.main = table_view


class Column:
    """
    Marker of a recipe parameter that names a column of one of its tables, e.g.
    `entity_key: Annotated[str, Column("entities")] = "entity_id"`, which the table pickers offer as the list of the
    columns of the table picked for entities
    """

    def __init__(self, table):
        self.table = table


class RecipeTable:
    """
    Marker of a table read by a recipe, in the TypedDict that annotates the store parameter of its main, e.g.
    `notes: Annotated[DataFrame, RecipeTable("Clinical notes", keywords=["note", "doc"], max_rows=50)]`

    Parameters
    ----------
    description
        Shown above the table picker of the key
    keywords
        Regular expressions searched in table names, ignoring case, that bring matching tables first in the picker
    max_rows
        Rows loaded for the table instead of the `preview.rows` of metanno.yaml, e.g. few patients and every stay of
        these patients
    """

    def __init__(self, description="", keywords=(), max_rows=None):
        self.description = description
        self.keywords = list(keywords)
        self.max_rows = max_rows


def docstring_descriptions(function):
    """
    Read the description of each parameter in the NumPy Parameters section of a docstring, shown under its field
    """
    lines = (inspect.getdoc(function) or "").splitlines()
    descriptions, names, inside = {}, [], False
    for idx, line in enumerate(lines):
        underlined = idx + 1 < len(lines) and lines[idx + 1].strip() and set(lines[idx + 1].strip()) == {"-"}
        if underlined:
            # On a section title, Parameters starts the descriptions and any other section ends them
            inside = line.strip() == "Parameters"
        elif inside and line.strip() and set(line.strip()) != {"-"}:
            if not line.startswith(" "):
                names = [name.strip() for name in line.split(":")[0].split(",")]
            else:
                for name in names:
                    descriptions[name] = f"{descriptions.get(name, '')} {line.strip()}".strip()
    return descriptions


def parameter_signature(main):
    """
    Return the parameters of a recipe main function that the user sets, without store and read_only, with their
    type hints, for recipe_parameters and check_parameters
    """
    hints = typing.get_type_hints(main, include_extras=True)
    return [
        (name, parameter, hints.get(name, typing.Any))
        for name, parameter in inspect.signature(main).parameters.items()
        if name not in ("store", "read_only")
        and parameter.kind not in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD)
    ]


def recipe_parameters(main):
    """
    Describe the parameters of a recipe main function for the parameter fields of the table pickers

    Returns
    -------
    list[dict]
        Name, kind of field (text, integer, number, boolean, choice, column or json), whether it is required, default
        value, choices of a Literal or Enum, table of a Column and docstring description of each parameter
    """
    descriptions = docstring_descriptions(main)
    parameters = []
    for name, parameter, annotation in parameter_signature(main):
        table = None
        if typing.get_origin(annotation) is typing.Annotated:
            annotation, *extras = typing.get_args(annotation)
            table = next((extra.table for extra in extras if isinstance(extra, Column)), None)
        # An Optional parameter takes the field of its type
        others = [arg for arg in typing.get_args(annotation) if arg is not type(None)]
        if typing.get_origin(annotation) in (typing.Union, types.UnionType) and len(others) == 1:
            annotation = others[0]
        choices = None
        if table is not None:
            kind = "column"
        elif annotation in (bool, int, float, str):
            kind = {bool: "boolean", int: "integer", float: "number", str: "text"}[annotation]
        elif typing.get_origin(annotation) is typing.Literal:
            kind, choices = "choice", list(typing.get_args(annotation))
        elif isinstance(annotation, type) and issubclass(annotation, enum.Enum):
            kind, choices = "choice", [member.value for member in annotation]
        else:
            kind = "json"
        required = parameter.default is inspect.Parameter.empty
        parameters.append(
            {
                "name": name,
                "kind": kind,
                "required": required,
                "default": None if required else to_jsonable_python(parameter.default, fallback=str),
                "choices": choices,
                "table": table,
                "description": descriptions.get(name, ""),
            }
        )
    return parameters


def check_parameters(main, values):
    """
    Validate the parameter values given to a recipe main function with pydantic, as the recipe call does, before a
    tab opens it

    Returns
    -------
    dict[str, str]
        Message of each invalid value and of each required parameter without one, shown under their field
    """
    errors = {}
    for name, parameter, annotation in parameter_signature(main):
        if name not in values:
            if parameter.default is inspect.Parameter.empty:
                errors[name] = "Required"
            continue
        try:
            TypeAdapter(annotation).validate_python(values[name])
        except ValidationError as error:
            errors[name] = error.errors()[0]["msg"]
    return errors


def recipe_tables(main, namespace):
    """
    Read the tables of a recipe from the TypedDict annotating the store parameter of its main, for the table pickers
    of the Metanno tabs and the check made before the recipe runs, e.g.

        class Tables(TypedDict):
            notes: Annotated[DataFrame, RecipeTable("Clinical notes", keywords=["note", "doc"])]
            entities: DataFrame

        def main(store: Tables): ...

    namespace is the module of the recipe, which resolves the annotations of its TypedDict

    Returns
    -------
    dict[str, dict] | None
        Description, keywords and max_rows of each Store key, None when store is not annotated with a TypedDict
    """
    annotation = typing.get_type_hints(main, include_extras=True).get("store")
    if not is_typeddict(annotation):
        return None
    tables = {}
    for key, hint in typing.get_type_hints(annotation, globalns=namespace, include_extras=True).items():
        table = next((extra for extra in getattr(hint, "__metadata__", ()) if isinstance(extra, RecipeTable)), None)
        table = table or RecipeTable()
        tables[key] = {"description": table.description, "keywords": table.keywords, "max_rows": table.max_rows}
    return tables


def load_recipes(directory):
    """
    Load the recipe entry points of the recipes folder of a config folder, after the built in table view

    Since a metanno-home made before the recipes folder existed keeps its recipes in views, we load those too, but a
    recipe of the recipes folder replaces one of the same name there
    """
    recipes = {"table": table_view}
    for file in [*sorted(Path(directory, "views").glob("*.py")), *sorted(Path(directory, "recipes").glob("*.py"))]:
        spec = importlib.util.spec_from_file_location(f"metanno.viewer_recipe_{file.stem}", file)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        main = getattr(module, "main", None)
        if not callable(main):
            raise ValueError(f"Recipe {file} must define a callable main")
        if "store" not in inspect.signature(main).parameters:
            raise ValueError(f"Recipe {file} must define main(store, ...)")
        tables = recipe_tables(main, vars(module))
        # pydantic would check the Store against the TypedDict of its tables, so the validated call leaves it unchecked
        main.__annotations__.pop("store", None)
        recipe = validate_arguments(main)
        recipe.annotation_setup_code = getattr(module, "annotation_setup_code", None)
        recipe.tables = tables
        recipe.main = main
        recipes[file.stem] = recipe
    return recipes


def recipe_choices(store, recipes):
    """
    Return the recipes offered by the recipe selectors for a Store, the table view needs a DataFrame
    """
    from pret import DataFrame

    tables = any(isinstance(store[key], DataFrame) for key in store)
    return [name for name in recipes if name != "table" or tables]


def load_views(path):
    """
    Load the saved views of a directory, listed by the sidebar and opened by the explorer kernel and view_opener
    """
    root = Path(path)
    if not root.is_dir():
        return []
    views = []
    for file in sorted([*root.glob("*.cfg"), *root.glob("*.yml"), *root.glob("*.yaml")]):
        try:
            views.append(ViewConfig(**{**Config.from_disk(file), "name": file.stem}))
        except ValidationError as exc:
            raise ValueError(f"Saved view {file} is invalid, {exc}") from exc
    return views


def render_recipe(store, name, parameters, recipes, read_only=False):
    """
    Render a Store with the selected recipe for a source tab or notebook view, with a bar below it showing
    the rejected edits and undo of the Store
    """
    from pret.react import div

    from metanno.recipes.data_widget_factory import VIEW_READ_ONLY
    from metanno.recipes.data_widget_factory.widget_data import StatusBar

    token = VIEW_READ_ONLY.set(read_only)
    try:
        if ":" not in name and name not in recipes:
            raise ValueError(f"No recipe {name!r} in the recipes folder, found {', '.join(sorted(recipes))}")
        application = pkgutil.resolve_name(name) if ":" in name else recipes[name]
        missing = [key for key in getattr(application, "tables", None) or {} if key not in store]
        if missing:
            raise ValueError(
                f"The {name} recipe reads the tables {', '.join(missing)}, missing from this Store which has "
                f"{', '.join(map(str, store)) or 'no table'}"
            )
        parameters = dict(parameters)
        if "read_only" in inspect.signature(application).parameters:
            parameters["read_only"] = read_only
        view = application(store=store, **parameters)
        return div(
            div(view, style={"flex": "1 1 auto", "minHeight": 0}),
            # The tab toolbar shows the kernel state, the bar shows only Store errors
            StatusBar(store=store, synced=store.doc.sync_id is not None, show_connection=False),
            style={"display": "flex", "flexDirection": "column", "height": "100%"},
        )
    finally:
        VIEW_READ_ONLY.reset(token)
