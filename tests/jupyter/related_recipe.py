from pret import Store
from pret_joy import Divider, Stack, Typography
from pret_simple_dock import Layout, Panel

from metanno import DataRelation, DataWidgetFactory


def main(store: Store, tag_key: str = "tag_id"):
    """
    Render todo navigation, annotated text, and linked tag rows
    """
    missing = {"todos", "tags"} - set(store)
    if missing:
        raise ValueError(f"The todo_tags view requires Store tables {', '.join(sorted(missing))}")
    factory = DataWidgetFactory(
        store,
        relations=[
            DataRelation(
                parent="todos",
                child="tags",
                on="todo_id",
                load="working_set",
            )
        ],
    )
    todos = factory.create_table_widget(
        store_key="todos",
        primary_key="todo_id",
        fields=[
            {"key": "todo_id", "kind": "text", "editable": False},
            {"key": "due_date", "kind": "text", "editable": False},
            {"key": "title", "kind": "text", "editable": False},
        ],
        source_requery=True,
        style={"height": "100%"},
    )
    tags_table = factory.create_table_widget(
        store_key="tags",
        primary_key=tag_key,
        fields=[
            {"key": tag_key, "kind": "text", "editable": False},
            {"key": "todo_id", "kind": "text", "editable": False},
            {"key": "start", "kind": "text", "editable": True},
            {"key": "end", "kind": "text", "editable": True},
            {"key": "word", "kind": "text", "editable": True},
        ],
        include_unconfigured_columns=True,
        source_requery=True,
        style={"height": "100%"},
    )
    text, _ = factory.create_text_widget(
        store_text_key="todos",
        store_spans_key="tags",
        text_key="text",
        text_primary_key="todo_id",
        spans_primary_key=tag_key,
        spans_foreign_key="todo_id",
        fields=[],
        begin_key="start",
        end_key="end",
        label_key="word",
        style_key="tag_style",
        labels={"urgent": {"color": "#cfe8ff"}},
        style={"height": "100%", "overflow": "auto"},
    )
    review_form = factory.create_form_widget(
        store_key="todos",
        primary_key="todo_id",
        fields=[
            {"key": "done", "name": "Reviewed", "kind": "boolean", "editable": True},
            {
                "key": "review_comment",
                "name": "Review comment",
                "kind": "text",
                "editable": True,
            },
        ],
    )
    tag_form = factory.create_form_widget(
        store_key="tags",
        primary_key=tag_key,
        fields=[
            {"key": "start", "kind": "text", "editable": True},
            {"key": "end", "kind": "text", "editable": True},
            {"key": "word", "kind": "text", "editable": True},
        ],
        allow_delete=True,
    )
    return Layout(
        Panel(todos, key="Todos"),
        Panel(text, key="Document"),
        Panel(tags_table, key="Tags"),
        Panel(
            Stack(
                Typography("Document review", level="title-md"),
                review_form,
                Divider(),
                Typography("Selected tag", level="title-md"),
                tag_form,
                spacing=1,
                use_flex_gap=True,
                sx={"p": 1, "height": "100%", "boxSizing": "border-box", "overflow": "auto"},
            ),
            key="Info",
        ),
        default_config={
            "kind": "column",
            "children": [
                {"tabs": ["Todos"], "size": 35},
                {
                    "kind": "row",
                    "size": 65,
                    "children": [
                        {"tabs": ["Document"], "size": 55},
                        {
                            "kind": "column",
                            "size": 45,
                            "children": [
                                {"tabs": ["Tags"], "size": 70},
                                {"tabs": ["Info"], "size": 30},
                            ],
                        },
                    ],
                },
            ],
        },
        style={"height": "100%", "minHeight": 0},
    )


def annotation_setup_code(parameters):
    """
    Return field additions and select the persistent tag key for the copied recipe parameters

    Parameters
    ----------
    parameters
        View arguments updated before Data Viewer emits their final notebook assignment
    """
    parameters["tag_key"] = "tag_id"
    return """import uuid

tables["todos"] = tables["todos"].with_columns(done=False, review_comment="")
tables["tags"] = tables["tags"].with_columns(tag_id=lambda: uuid.uuid4().hex)
"""
