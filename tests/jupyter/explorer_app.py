"""
Local source catalogue and notebook applications for the Explorer workflows
"""

import shutil
import sqlite3
from pathlib import Path

import ibis
from IPython.display import display
from pret import DataFrame, component, create_store, save_store
from pret.react import div

from metanno import view_opener


def connect():
    """
    Open the local SQLite catalogue through the configured SourceCatalog factory
    """
    return ibis.sqlite.connect(Path(__file__).parent / "source.sqlite")


@component
def ConnectionView():
    """
    Hold a notebook PRET connection before an Explorer panel borrows the session
    """
    return div("Notebook PRET connection")


def open_preview(title="Notebook preview"):
    """
    Display a transient notebook Store and its Explorer opener
    """
    store = create_store({"todos": DataFrame([{"id": 1, "text": "Example todo"}])}, sync=True)
    display(ConnectionView())
    display(view_opener(store, view="review", config_path=Path.cwd(), title=title))
    return store


def open_annotation(store):
    """
    Save edited todos and display an annotation opener using a recipe function
    """
    from review import main

    store["todos"].update(identity={"id": 1}, values={"text": "Updated todo"})
    annotation = save_store(store, Path.cwd() / "review.pret")
    display(view_opener(annotation, view=main, config_path=Path.cwd(), title="Annotation"))
    return annotation


def open_related():
    """
    Display related source tables with one selected parent and a bounded child preview
    """
    source = ibis.sqlite.from_connection(sqlite3.connect(":memory:", check_same_thread=False))
    source.raw_sql("CREATE TABLE todos(todo_id INTEGER, title TEXT, text TEXT, due_date TEXT)")
    source.raw_sql(
        "INSERT INTO todos VALUES (1,'Source todo','Related text','2026-01-01'),"
        "(2,'Excluded todo','Other text','2026-01-02')"
    )
    source.raw_sql("CREATE TABLE tags(todo_id INTEGER, start INTEGER, end INTEGER, word TEXT)")
    source.raw_sql("INSERT INTO tags VALUES (1,0,7,'Related'),(2,0,5,'Other')")
    todos = source.table("todos").limit(1)
    tags = source.table("tags")
    tags = tags.join(todos.select("todo_id"), tags.todo_id == todos.todo_id, how="semi").limit(500)
    preview = create_store({"todos": DataFrame(todos), "tags": DataFrame(tags)}, sync=True)
    display(
        view_opener(
            preview,
            view="todo_tags",
            parameters={"tag_key": "__pret_row_id"},
            config_path=Path.cwd(),
            title="Related preview",
        )
    )
    return preview


if __name__ == "__main__":
    # Prepare the same local recipe and source files that the Explorer opens through its normal APIs
    root = Path(__file__).parent
    recipes = root / "views" / "recipes"
    recipes.mkdir(parents=True, exist_ok=True)
    for target in (root / "review.py", recipes / "review.py", recipes / "alternate.py"):
        shutil.copyfile(root / "explorer_recipe.py", target)
    shutil.copyfile(root / "related_recipe.py", recipes / "todo_tags.py")
    (root / "metanno.yaml").write_text(
        "connections:\n  local:\n    factory: explorer_app:connect\nsources:\n  fixture:\n    connection: local\n"
    )
    (root / "views" / "todos.yaml").write_text(
        "recipe: review\ntables:\n  todos:\n    source: fixture\n    table: todos\n"
    )
    # An annotation campaign folder, one Store per annotator, listed under its name in the sidebar
    campaign = root / "views" / "stores" / "campaign"
    campaign.mkdir(parents=True, exist_ok=True)
    save_store(
        create_store({"todos": [{"id": 1, "text": "Campaign todo"}]}),
        campaign / "alice.pret",
        metadata={"view": "review"},
    )
    with sqlite3.connect(root / "source.sqlite") as connection:
        for name in ("todos", "lists"):
            connection.execute(f"CREATE TABLE {name}(id INTEGER, text TEXT)")
            connection.execute(f"INSERT INTO {name} VALUES (1, '{name} source row')")
