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
    display(view_opener(store, view="review", title=title))
    return store


def open_annotation(store):
    """
    Save edited todos and display an annotation opener using a recipe function
    """
    from review import main

    store["todos"].update(identity={"id": 1}, values={"text": "Updated todo"})
    annotation = save_store(store, Path.cwd() / "review.pret")
    display(view_opener(annotation, view=main, title="Annotation"))
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
            title="Related preview",
        )
    )
    return preview


if __name__ == "__main__":
    # Prepare the same local recipe and source files that the Explorer opens through its normal APIs
    root = Path(__file__).parent
    recipes = root / "metanno-home" / "recipes"
    views = root / "metanno-home" / "views"
    for folder in (recipes, views):
        folder.mkdir(parents=True, exist_ok=True)
    for target in (root / "review.py", recipes / "review.py", recipes / "alternate.py"):
        shutil.copyfile(root / "explorer_recipe.py", target)
    shutil.copyfile(root / "related_recipe.py", recipes / "todo_tags.py")
    (root / "metanno-home" / "explorer_connections.py").write_text(
        f"import ibis\n\n\ndef connect():\n    return ibis.sqlite.connect({str(root / 'source.sqlite')!r})\n"
    )
    (root / "metanno-home" / "metanno.yaml").write_text(
        "connections:\n  local:\n    factory: explorer_connections:connect\n"
        "sources:\n  fixture:\n    connection: local\n"
    )
    (views / "todos.yaml").write_text("recipe: review\ntables:\n  todos:\n    source: fixture\n    table: todos\n")
    # An annotation campaign folder, one Store per annotator, listed under its name in the sidebar
    campaign = root / "metanno-home" / "annotations" / "campaign"
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
