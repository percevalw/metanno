"""
Load Python applications and their parameter schemas for source views and saved Annotations
"""

from __future__ import annotations

import importlib.util
import inspect
from pathlib import Path

from confit import Config, validate_arguments

from .config import load_config


def views_directory(project_root):
    """
    Return the project directory containing saved views and recipes
    """
    root = Path(project_root)
    return load_config(root).views if (root / "metanno.yaml").is_file() else root / "views"


def recipes_directory(project_root):
    """
    Return the Python recipe directory inside the project views directory
    """
    return views_directory(project_root) / "recipes"


def table_view(store):
    """
    Show the only DataFrame of a Store in a table, with a form for the selected rows, the default view of a table
    """
    from pret import DataFrame
    from pret.dataframe_sqlite import INTERNAL_ROW_ID
    from pret_simple_dock import Layout, Panel

    from metanno import DataWidgetFactory

    frames = [key for key in store if isinstance(store[key], DataFrame)]
    if len(frames) != 1:
        raise ValueError("The table view requires exactly one DataFrame, choose a recipe for this Store")
    # Pret row IDs identify the selected rows shared by the table and the form
    factory = DataWidgetFactory(store)
    table = factory.create_table_widget(
        store_key=frames[0],
        primary_key=INTERNAL_ROW_ID,
        fields=[],
        include_unconfigured_columns=True,
        source_requery=True,
        style={"height": "100%"},
    )
    form = factory.create_form_widget(
        store_key=frames[0],
        primary_key=INTERNAL_ROW_ID,
        fields=[],
        style={"height": "100%", "overflow": "auto", "padding": "8px", "boxSizing": "border-box"},
    )
    return Layout(
        Panel(table, key="Table"),
        Panel(form, key="Selected rows"),
        default_config={
            "kind": "row",
            "children": [{"tabs": ["Table"], "size": 70}, {"tabs": ["Selected rows"], "size": 30}],
        },
        style={"height": "100%", "minHeight": 0},
    )


table_view.annotation_setup_code = None


def load_recipes(path):
    """
    Load the recipe entry points of a directory, after the built in table view
    """
    root = Path(path)
    recipes = {"table": table_view}
    if not root.is_dir():
        return recipes
    for file in sorted(root.glob("*.py")):
        spec = importlib.util.spec_from_file_location(f"metanno.viewer_recipe_{file.stem}", file)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        main = getattr(module, "main", None)
        if not callable(main):
            raise ValueError(f"Recipe {file} must define a callable main")
        if "store" not in inspect.signature(main).parameters:
            raise ValueError(f"Recipe {file} must define main(store, ...)")
        recipe = validate_arguments(main)
        recipe.annotation_setup_code = getattr(module, "annotation_setup_code", None)
        recipes[file.stem] = recipe
    return recipes


def recipe_choices(store, recipes):
    """
    Return the recipes offered by the recipe selectors for a Store, the table view needs exactly one DataFrame
    """
    from pret import DataFrame

    single = sum(isinstance(store[key], DataFrame) for key in store) == 1
    return [name for name in recipes if name != "table" or single]


def load_views(path):
    """
    Load named table and recipe selections from Confit configuration files
    """
    root = Path(path)
    views = []
    if not root.is_dir():
        return views
    for file in sorted([*root.glob("*.cfg"), *root.glob("*.yml"), *root.glob("*.yaml")]):
        config = Config.from_disk(file)
        tables = dict(config.get("tables", {}))
        if not tables:
            raise ValueError(f"Saved view {file} requires named tables")
        for name, table in tables.items():
            if (
                not isinstance(table, dict)
                or not isinstance(table.get("source"), str)
                or not isinstance(table.get("table"), str)
            ):
                raise ValueError(f"Saved view {file} table {name!r} is invalid")
        views.append(
            {
                "name": file.stem,
                "tables": tables,
                "recipe": config.get("recipe", ""),
                "parameters": dict(config.get("parameters", {})),
                "root": config.get("root", next(iter(tables))),
            }
        )
    return views


def render_recipe(store, name, parameters, recipes, read_only=False):
    """
    Render a Store with the selected recipe for a source tab or notebook view, with a bar below it showing
    the rejected edits and undo of the Store
    """
    import importlib

    from pret.react import div

    from metanno.recipes.data_widget_factory import VIEW_READ_ONLY
    from metanno.recipes.data_widget_factory.widget_data import StatusBar

    token = VIEW_READ_ONLY.set(read_only)
    try:
        if ":" in name:
            module, attribute = name.split(":", 1)
            application = importlib.import_module(module)
            for part in attribute.split("."):
                application = getattr(application, part)
        else:
            application = recipes[name]
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
