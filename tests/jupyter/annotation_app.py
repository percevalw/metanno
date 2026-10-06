"""
Notebook annotation application shared by the collection and DataFrame workflows
"""

from pret import DataFrame, component, create_store, use_state
from pret.marshal import marshal_as
from pret.react import div
from pret_simple_dock import Layout, Panel

from metanno import DataRelation, DataWidgetFactory


@marshal_as(
    js="""return (state, showAll) => {
    window.factory = state;
    window.historyState = window.storeLib.getStoreHistory(state.store);
    window.showAllDocuments = () => showAll(true);
    if (!window.calls) {
        window.calls = [];
        for (const key of ["todos", "tags"]) {
            const frame = state.store[key];
            if (!frame.query) continue;
            const query = frame.query;
            frame.query = options => { window.calls.push({key, offset: options.offset ?? 0}); return query(options); };
        }
    }
    window.readRows = async key => {
        const data = state.store[key];
        if (!data.__pret_dataframe__) return [...data];
        const view = await data.createView(null, 'null', 'id');
        try { return await view.getRows(0, view.rowCount, new AbortController().signal); }
        finally { data.releaseView(view); }
    };
}"""
)
def expose_state(state, show_all):
    """
    Expose annotation selection and history for precise browser assertions
    """


@component
def Application(state):
    """
    Render widgets through the notebook transport and expose their observable state
    """
    all_documents, show_all = use_state(False)
    expose_state(state, show_all)
    return div(state["view"], div(state["all_text"], id="all-documents") if all_documents else None)


def make_application(kind):
    """
    Build todos and related tags for notebook editing and read only scenarios
    """
    rows = {
        "todos": [
            {"id": 1, "text": "First todo", "review": "pending"},
            {"id": 2, "text": "Second todo\n" + "line\n" * 80 + "Target", "review": "pending"},
        ],
        "tags": [
            {"id": "a", "todo_id": 1, "begin": 0, "end": 5, "label": "First", "style": "urgent"},
            {"id": "b", "todo_id": 2, "begin": 412, "end": 418, "label": "Second", "style": None},
        ],
    }
    for idx, todo in enumerate(rows["todos"]):
        todo["active"] = idx % 2 == 0
    if kind == "paged":
        import sqlite3
        from pathlib import Path

        from metanno.viewer.query_worker import SourceQueryWorker
        from metanno.viewer.source_provider import SourceDataFrameProvider
        from metanno.viewer.sources import SourceCatalog

        # Query actual SQLite sources through the same worker used by Explorer tables
        with sqlite3.connect("annotations.sqlite") as connection:
            # A large real source checks the grid height limit while fetching short pages
            connection.executescript(
                "CREATE TABLE todos(id INTEGER, text TEXT, review TEXT, active BOOLEAN);"
                "WITH RECURSIVE rows(id) AS (VALUES(0) UNION ALL SELECT id + 1 FROM rows WHERE id < 2106295) "
                "INSERT INTO todos SELECT id, CAST(id AS TEXT), 'Todo ' || id, id % 2 = 0 FROM rows;"
                "CREATE TABLE tags(id TEXT, todo_id INTEGER, begin INTEGER, end INTEGER, label TEXT, style TEXT);"
            )
            connection.executemany(
                "INSERT INTO tags VALUES (?, ?, ?, ?, ?, ?)",
                [tuple(row.values()) for row in rows["tags"]],
            )
        Path("annotations.yaml").write_text(
            f"connections:\n  local:\n    url: sqlite://{Path('annotations.sqlite').resolve()}\n"
            "sources:\n  fixture:\n    connection: local\n"
        )
        sources = SourceCatalog(Path("annotations.yaml"))
        worker = SourceQueryWorker(lambda event: None)
        worker.requests_by_view["annotations"] = set()
        rows = {
            key: DataFrame(
                provider=SourceDataFrameProvider(sources, worker, "fixture", key, "annotations", paging=key == "todos")
            )
            for key in rows
        }
        for frame in rows.values():
            frame.provider.dataframes_by_id = {value.resource_id: value for value in rows.values()}
    else:
        rows = {key: DataFrame(value) if kind != "collection" else value for key, value in rows.items()}
    store = create_store(
        rows,
        sync=True,
        dataframe_sync="paged" if kind == "paged" else "full",
        dataframe_max_bytes=1024 * 1024,
    )
    factory = DataWidgetFactory(
        store,
        read_only=kind == "readonly",
        relations=[DataRelation("todos", "tags", on={"id": "todo_id"}, load="working_set")],
    )
    todos = factory.create_table_widget(
        store_key="todos",
        primary_key="id",
        include_unconfigured_columns=kind != "paged",
        source_requery=True,
        fields=[]
        if kind == "paged"
        else [
            {"key": "id", "name": "id", "kind": "text", "filterable": True},
            {"key": "review", "name": "review", "kind": "text", "editable": True},
        ],
        style={"height": "250px"},
    )
    tags = factory.create_table_widget(
        store_key="tags",
        primary_key="id",
        fields=[
            {"key": "id", "name": "id", "kind": "text"},
            {"key": "label", "name": "label", "kind": "text"},
        ],
        style={"height": "250px"},
    )
    review = factory.create_form_widget(
        store_key="todos",
        primary_key="id",
        fields=[{"key": "review", "kind": "text", "editable": True}],
        add_navigation_buttons=True,
    )
    tag_form = factory.create_form_widget(
        store_key="tags",
        primary_key="id",
        allow_delete=True,
        fields=[
            {"key": "label", "kind": "text", "editable": True},
            {"key": "begin", "kind": "text", "editable": True},
        ],
    )
    text, toolbar = factory.create_text_widget(
        store_text_key="todos",
        store_spans_key="tags",
        text_key="text",
        text_primary_key="id",
        spans_primary_key="id",
        spans_foreign_key="todo_id",
        fields=[{"key": "label", "kind": "text", "editable": True}],
        labels={"urgent": {"color": "#cfe8ff"}},
        style={"height": "200px", "overflow": "auto"},
    )
    all_text, _ = factory.create_text_widget(
        store_text_key="todos",
        store_spans_key="tags",
        text_key="text",
        text_primary_key="id",
        spans_primary_key="id",
        spans_foreign_key="todo_id",
        fields=[],
        labels={"urgent": {"color": "#cfe8ff"}},
        docs_mode="all",
    )
    return store, Application(
        state={
            # A dock layout, like real apps use, registers drag listeners on the whole page
            "view": div(
                todos,
                tags,
                review,
                tag_form,
                toolbar,
                text,
                Layout(Panel("Dock content", key="Dock"), style={"height": "80px"}),
                # Store errors appear once in this bar instead of above every widget
                factory.create_status_bar(),
            ),
            "store": store,
            "all_text": all_text,
            "selected": factory.selected_rows,
            "handles": factory.handles,
        }
    )


def make_grouped_text():
    """
    Show the todos of the selected group in a DataFrame text widget and record its text selection
    """
    store = create_store(
        {
            "groups": DataFrame([{"id": 1}, {"id": 2}]),
            "todos": DataFrame(
                [
                    {"id": 1, "group_id": 1, "text": "First group todo"},
                    {"id": 2, "group_id": 2, "text": "Second group todo"},
                    {"id": 3, "group_id": 2, "text": "Other todo"},
                ]
            ),
            "tags": DataFrame([{"id": "a", "todo_id": 1, "begin": 0, "end": 5, "label": "First"}]),
        },
        sync=True,
        dataframe_sync="full",
        dataframe_max_bytes=1024 * 1024,
    )
    factory = DataWidgetFactory(store, relations=[DataRelation("groups", "todos", on={"id": "group_id"})])
    selection = create_store({"current": None})

    def record_selection(doc_id, ranges, text):
        selection["current"] = {"doc_id": doc_id, "ranges": ranges, "text": text}

    text, _ = factory.create_text_widget(
        store_text_key="todos",
        store_spans_key="tags",
        text_key="text",
        text_primary_key="id",
        spans_primary_key="id",
        spans_foreign_key="todo_id",
        fields=[],
        docs_mode="all",
        on_select_text=record_selection,
    )
    groups = factory.create_table_widget(
        store_key="groups",
        primary_key="id",
        fields=[{"key": "id", "name": "id", "kind": "text"}],
        style={"height": "120px"},
    )
    factory.selected_rows["groups"]["identities"] = [1]
    return Application(
        state={"view": div(groups, text), "store": store, "selected": factory.selected_rows, "selection": selection}
    )
