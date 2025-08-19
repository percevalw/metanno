from typing import Any, Dict, List, Sequence

from pret import component, create_store, use_store_snapshot
from pret.hooks import use_effect, use_event_callback, use_memo
from pret.store import snapshot, subscribe, transact
from pret.ui.joy import Button, ButtonGroup, Divider
from pret.ui.metanno import AnnotatedText, Table
from pret.ui.react import div


def build_columns(
    rows: List[Dict[str, Any]],
    hidden_columns: Sequence[str] = (),
    id_columns: Sequence[str] = (),
    editable_columns: Sequence[str] = (),
    categorical_columns: Sequence[str] = (),
    first_columns=(),
) -> List[Dict[str, Any]]:
    # Collect every column name that appears in any row
    all_keys = list(
        {
            **dict.fromkeys(first_columns),
            **dict.fromkeys(k for row in rows for k in row),
        }
    )
    visible_keys = [k for k in all_keys if k not in hidden_columns]

    def non_null_values(key: str) -> List[Any]:
        """Return all non-None values for a column (order preserved)."""
        return list(
            dict.fromkeys(
                val for row in rows[:1000] if (val := row.get(key)) is not None
            )
        )

    def infer_scalar_type(values: List[Any]) -> str:
        """
        Classify a column as 'bool', 'int', 'float', 'string', or 'other'.
        Assumes the dataset has already been type-cast correctly.
        """
        if not values:  # empty or all-None column
            return "other"

        # bool must come *before* int because bool is a subclass of int
        if all(isinstance(v, bool) for v in values):
            return "bool"
        if all(isinstance(v, int) and not isinstance(v, bool) for v in values):
            return "int"
        if all(isinstance(v, float) for v in values):
            return "float"
        if all(isinstance(v, str) for v in values):
            return "string"
        return "other"

    columns: List[Dict[str, Any]] = []
    for key in visible_keys:
        values = non_null_values(key)
        s_type = infer_scalar_type(values)

        if s_type == "other":
            metanno_type = "text"
            may_be_editable = False
        elif s_type == "bool":
            metanno_type = "boolean"
            may_be_editable = True
        elif s_type == "string":
            metanno_type = "text"
            may_be_editable = True
        elif s_type in ("int", "float"):
            metanno_type = "text"
            may_be_editable = False
        else:  # safety net, should not occur
            metanno_type = "text"
            may_be_editable = False

        # Hyperlink override
        if key in id_columns:
            metanno_type = "hyperlink"

        assert may_be_editable or key not in editable_columns, (
            f"Column '{key}' cannot be marked editable (type: {s_type})."
        )

        # Candidate categories for discrete (categorical) columns
        categories = None
        if key in categorical_columns:
            categories = list(dict.fromkeys(values))

        columns.append(
            {
                "key": key,
                "name": key,
                "kind": metanno_type,
                "editable": key in editable_columns,
                "filterable": True,
                "candidates": categories,
            }
        )

    return columns


class DatasetApp:
    def __init__(self, data, sync=None):
        self.data = create_store(data, sync=sync)
        self.state = create_store({})
        self.shared_state = create_store({})
        self.views = {}

    def render_table(
        self,
        name,
        path,
        pkey,
        child_data=(),
        hidden_columns=(),
        id_columns=(),
        editable_columns=(),
        categorical_columns=(),
        first_columns=(),
        style=None,
    ):
        app_state = self.state
        app_data = self.data
        # path, indices_names = QueryBuilder.parse(path)
        columns = build_columns(
            rows=app_data[path],  # query_path(app_data, path)[0],
            hidden_columns=hidden_columns,
            id_columns=id_columns,
            editable_columns=editable_columns,
            categorical_columns=categorical_columns,
            first_columns=first_columns,
        )
        state = {
            "suggestions": [],
            "filters": {},
            "idx": None,
            "last_idx": None,
            "hierarchies": list(child_data),
            "subset": None,
            "highlighted": [],
            "columns": columns,
        }
        app_state[name] = state
        views = self.views
        view = views[name] = {
            "kind": "table",
            "pkey": pkey,
            "actions": {},
        }

        @component
        def TableView():
            data = use_store_snapshot(app_data[path])
            state = use_store_snapshot(app_state[name])

            @use_event_callback
            def handle_filters_change(filters, col):
                app_state[name]["filters"][col] = filters[col]

            @use_event_callback
            def handle_cell_change(row_idx, col, new_value):
                app_data[path][row_idx][col] = new_value

            @use_event_callback
            def handle_position_change(row_idx, col, mode, cause):
                if state["idx"] == row_idx:
                    return

                app_state[name]["idx"] = row_idx
                if row_idx is None:
                    return
                app_state[name]["last_idx"] = row_idx
                info = data[row_idx]

                for dep in app_state.keys():
                    if dep == name:
                        continue
                    linked_view = views[dep]
                    if linked_view["kind"] == "table":
                        cols = [col["name"] for col in app_state[dep]["columns"]]
                        if pkey in cols:
                            for col in app_state[dep]["columns"]:
                                if col["kind"] == "hyperlink":
                                    app_state[dep]["filters"].pop(col["key"], None)
                            app_state[dep]["filters"][pkey] = str(info[pkey])

            @use_event_callback
            def handle_input_change(row_idx, col, value, cause):
                value = value or ""
                candidates = next(c for c in columns if c["key"] == col).get(
                    "candidates"
                )
                if cause == "unmount":
                    app_state[name]["suggestions"] = None
                if candidates is not None:
                    if cause == "mount":
                        app_state[name]["suggestions"] = candidates
                    if cause == "type":
                        app_state[name]["suggestions"] = [
                            cand for cand in candidates if value.lower() in cand.lower()
                        ]

            @use_event_callback
            def handle_click_cell_content(row_idx, col, value):
                for linked_name, linked_view in views.items():
                    # Don't scroll in a view if this is the view we clicked in
                    if linked_name == name:
                        continue
                    pkey = linked_view["pkey"]
                    if col == pkey:
                        idx = next(
                            (
                                i
                                for i, row in enumerate(app_data[linked_name])
                                if row[pkey] == value
                            ),
                            None,
                        )
                        linked_view["scroll_to_row"](idx)
                return True

            @use_event_callback
            def handle_mouse_enter_row(row_idx, modkeys):
                if row_idx is None:
                    app_state[name]["highlighted"] = []
                    return
                row_id = data[row_idx][pkey]
                app_state[name]["highlighted"] = [row_id]

            @use_event_callback
            def handle_mouse_leave_row(row_idx, modkeys):
                if row_idx is None:
                    app_state[name]["highlighted"] = []
                    return
                row_id = data[row_idx][pkey]
                app_state[name]["highlighted"] = [
                    s for s in app_state[name]["highlighted"] if s != row_id
                ]

            @use_event_callback
            def handle_subset_change(subset):
                app_state[name]["subset"] = subset

            res = Table(
                rows=data,
                row_key=pkey,
                columns=columns,
                # subset=subset,
                filters=state["filters"],
                suggestions=state["suggestions"],
                on_subset_change=handle_subset_change,
                highlighted_rows=state["highlighted"],
                on_filters_change=handle_filters_change,
                on_input_change=handle_input_change,
                on_cell_change=handle_cell_change,
                on_position_change=handle_position_change,
                on_click_cell_content=handle_click_cell_content,
                on_mouse_enter_row=handle_mouse_enter_row,
                on_mouse_leave_row=handle_mouse_leave_row,
                auto_filter=True,
                style=style,
                actions=view["actions"],
            )
            return res

        return TableView()

    def render_text(
        self,
        *,
        text_name,
        spans_name,
        labels=None,
        text_column,
        text_pkey,
        spans_pkey,
        style,
        name=None,
    ):
        app_state = self.state
        app_data = self.data
        name = name or text_name
        views = self.views
        view = views[name] = {
            "kind": "text",
            "text_name": text_name,
            "spans_name": spans_name,
            "actions": {},
        }

        app_state[text_name].update({"selected_ranges": []})
        app_state[spans_name].update({"highlighted": []})

        def on_mouse_enter_span(span_id, modkeys):
            app_state[spans_name]["highlighted"].append(span_id)

        def on_mouse_leave_span(span_id, modkeys):
            app_state[spans_name]["highlighted"] = [
                s for s in app_state[text_name]["highlighted"] if s != span_id
            ]

        def on_mouse_select(ranges, modkeys):
            if ranges != app_state[text_name]["selected_ranges"]:
                app_state[text_name]["selected_ranges"] = ranges

        def make_on_add_span(label):
            def on_add_span(*args):
                doc_idx = app_state[text_name]["last_idx"] or 0
                doc = app_data[text_name][doc_idx]
                doc_id = doc[text_pkey]
                for r in app_state[text_name]["selected_ranges"]:
                    text = doc[text_column][r["begin"] : r["end"]]
                    app_data[spans_name].append(
                        {
                            "id": f"{doc_id}-{r['begin']}-{r['end']}-{label}",
                            "begin": r["begin"],
                            "end": r["end"],
                            "label": label,
                            "text": text,
                            text_pkey: doc_id,
                        }
                    )
                    app_state[text_name]["selected_ranges"] = []

            return on_add_span

        def on_delete(*args):
            found = False
            doc_id = app_data[text_name][app_state[text_name]["last_idx"]][text_pkey]
            with transact(app_data):
                for span in reversed(app_data[spans_name]):
                    for r in app_state[text_name]["selected_ranges"]:
                        # Check overlap between selection and span
                        if (
                            span[text_pkey] != doc_id
                            or span["end"] <= r["begin"]
                            or r["end"] <= span["begin"]
                        ):
                            continue

                        app_data[spans_name].remove(span)
                        found = True
                        break
            if found:
                app_state[text_name]["selected_ranges"] = []

        @component
        def ShortcutButton(label, shortcut="", on_click=None):
            sx = {
                "backgroundColor": labels[label]["color"],
                "color": "black",
                "p": "0 8px 0",
                "lineHeight": 0.5,
            }
            return ButtonGroup(
                Button(label, on_click=on_click, size="sm", variant="soft", sx=sx),
                Button(shortcut, on_click=on_click, size="sm", variant="soft", sx=sx)
                if shortcut
                else None,
                sx={"display": "inline-block", "margin": "2px"},
            )

        on_label_handlers = {label: make_on_add_span(label) for label in labels}

        @component
        def ButtonBar():
            return div(
                *(
                    ShortcutButton(
                        key=label,
                        label=label,
                        shortcut=labels[label].get("shortcut"),
                        on_click=on_label_handlers[label],
                    )
                    for label in labels.keys()
                ),
                Button(
                    "⌫",
                    key="delete",
                    color="neutral",
                    size="sm",
                    on_click=on_delete,
                    sx={"p": "0 8px 0", "lineHeight": 0.5},
                ),
            )

        @component
        def TextView():
            text_data = use_store_snapshot(app_data[text_name])
            text_state = use_store_snapshot(app_state[text_name])
            span_data = use_store_snapshot(app_data[spans_name])
            span_state = use_store_snapshot(app_state[spans_name])

            shown_idx = text_state["last_idx"] or 0
            doc = text_data[shown_idx]
            doc_id = doc[text_pkey]

            @use_effect(dependencies=[])
            def make_subscribe():
                @subscribe(app_state)
                def on_span_idx_change(events):
                    for event in events:
                        if (
                            len(event.path) == 1
                            and event.path[0] == spans_name
                            and event.keysChanged.has("idx")
                        ):
                            idx = app_state[spans_name]["idx"]
                            if idx is None:
                                continue
                            span = app_data[spans_name][idx]
                            span_id = span[spans_pkey]
                            span_text_id = span.get(text_pkey)
                            scroll_behavior = "smooth"
                            if span_text_id is not None:
                                doc_idx = next(
                                    (
                                        i
                                        for i, d in enumerate(text_data)
                                        if d[text_pkey] == span_text_id
                                    ),
                                    None,
                                )
                                if doc_idx is not None:
                                    if app_state[text_name]["last_idx"] != doc_idx:
                                        app_state[text_name]["idx"] = doc_idx
                                        app_state[text_name]["last_idx"] = doc_idx
                                        scroll_behavior = "instant"
                            view["actions"]["scroll_to_span"](span_id, scroll_behavior)
                        if (
                            len(event.path) == 1
                            and event.path[0] == text_name
                            and event.keysChanged.has("last_idx")
                        ):
                            app_state[text_name]["selected_ranges"] = []

            def on_key_press(k, modkeys, selection):
                if k == "ArrowRight" or k == "ArrowLeft":
                    subset = app_state[text_name]["subset"]
                    abs_idx = app_state[text_name]["last_idx"]
                    delta = 1 if k == "ArrowRight" else -1 if k == "ArrowLeft" else 0
                    if delta != 0:
                        if subset is None:
                            abs_idx = (abs_idx + delta) % len(app_data[text_name])
                        else:
                            try:
                                rel_idx = subset.index(abs_idx)
                                abs_idx = subset[(rel_idx + delta) % len(subset)]
                            except IndexError:
                                abs_idx = subset[0] if len(subset) > 0 else 0
                        info = app_data[text_name][abs_idx]
                        app_state[text_name]["last_idx"] = abs_idx
                        app_state[text_name]["highlighted"] = [info[text_pkey]]

                        # Only show entities for the current document
                        for dep in app_state.keys():
                            if dep == name:
                                continue
                            if dep == text_name:
                                continue
                            linked_view = views[dep]
                            if linked_view["kind"] == "table":
                                cols = [
                                    col["name"] for col in app_state[dep]["columns"]
                                ]
                                if text_pkey in cols:
                                    for col in app_state[dep]["columns"]:
                                        if col["kind"] == "hyperlink":
                                            app_state[dep]["filters"].pop(
                                                col["key"], None
                                            )
                                    app_state[dep]["filters"][text_pkey] = str(
                                        info[text_pkey]
                                    )

                        # Scroll in the table view of documents
                        views[text_name]["actions"].scroll_to_row(abs_idx, "smooth")
                    return
                elif k == "Backspace":
                    # Handle backspace to delete selected spans
                    on_delete()
                    return
                for label in labels.keys():
                    if k == labels[label]["shortcut"]:
                        on_label_handlers[label]()

            def filter_doc_spans():
                spans = []
                idx = span_state["idx"]
                doc_id = doc[text_pkey]
                for i, span in enumerate(snapshot(app_data[spans_name])):
                    if span[text_pkey] == doc_id:
                        spans.append(
                            {
                                **span,
                                "highlighted": span[spans_pkey]
                                in span_state["highlighted"]
                                or idx == i,
                            }
                        )
                return spans

            doc_spans = use_memo(
                filter_doc_spans,
                [
                    doc_id,
                    span_data,
                    span_state["highlighted"],
                    span_state["idx"],
                ],
            )

            return div(
                ButtonBar(),
                Divider(),
                AnnotatedText(
                    text=doc[text_column],
                    on_key_press=on_key_press,
                    spans=doc_spans,
                    annotation_styles=labels,
                    on_mouse_enter_span=on_mouse_enter_span,
                    on_mouse_leave_span=on_mouse_leave_span,
                    on_mouse_select=on_mouse_select,
                    mouse_selection=text_state["selected_ranges"],
                    actions=view["actions"],
                    style={"flex": 1, "overflow": "scroll", **style},
                ),
                style={
                    "display": "flex",
                    "flexDirection": "column",
                    "overflow": "hidden",
                    "flex": 1,
                    "height": "100%",
                },
            )

        return TextView()
