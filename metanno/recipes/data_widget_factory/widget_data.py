"""
Row access, edits and history shared by factory widgets
"""

from contextvars import ContextVar
from typing import Any, List, Optional, Sequence

from pret import component
from pret.hooks import (
    use_connection_status,
    use_dataframe_view,
    use_effect,
    use_event_callback,
    use_ref,
    use_state,
    use_store_history,
    use_store_snapshot,
)
from pret.marshal import marshal_as
from pret.react import Portal, div, span
from pret.store import transact
from pret_joy import (
    Box,
    CircularProgress,
    Dropdown,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    Tooltip,
    Typography,
)

from metanno.ui import js


@marshal_as(js="return useRowFilter", globals={"useRowFilter": js.Metanno.useRowFilter})
def use_row_filter(description, filters, filter):
    """
    Combine header filter text with a filter tree, returns the tree and the parse error, see client/rows.ts
    """


@marshal_as(js="return useListRows", globals={"useListRows": js.Metanno.useListRows})
def use_list_rows(store_list, rows, primary_key, filters, filter, sort):
    """
    Filter and sort a Store list snapshot behind a row source, see client/rows.ts
    """


@marshal_as(js="return withFilterError", globals={"withFilterError": js.Metanno.withFilterError})
def with_filter_error(view, filter_error):
    """
    Add the filter parse error to a DataFrame view, see client/rows.ts
    """


@marshal_as(js="return useSelectedRows", globals={"useSelectedRows": js.Metanno.useSelectedRows})
def use_view_selected_rows(data, view, primary_key, identities, filter, selection):
    """
    Read the rows of a row view by primary key or filter, or all rows, see client/rows.ts
    """


def use_rows(data, primary_key, filters=None, filter=None, sort=None):
    """
    Show a DataFrame or a Store list through one row source, for factory tables and use_selected_rows

    The DataFrame or the Store list is read here with PRET hooks, the Metanno browser helpers only receive the
    view or the list rows. A widget keeps the same kind of data for its lifetime, which keeps the hook order
    stable. Related tables load their scopes together, see make_dataframe_queries in data_relations.py, so
    DataFrame views do not load the whole table themselves.

    Returns
    -------
    Any
        Row view with rowSource, previousRowSource, contentVersion, description, loading, error and filterError
    """
    if getattr(data, "__pret_dataframe__", False):
        tree, filter_error = use_row_filter(data.description, filters, filter)
        return with_filter_error(use_dataframe_view(data, tree, primary_key, sort or [], False), filter_error)
    return use_list_rows(data, use_store_snapshot(data), primary_key, filters, filter, sort or [])


def use_selected_rows(data, primary_key, identities=None, filter=None, selection=None):
    """
    Read rows of a DataFrame or a Store list by primary key or filter, or all rows, for forms and annotations

    Parameters
    ----------
    selection
        Snapshot of the shared selection the identities come from: its lead `row`, eg the document clicked in a table,
        shows at once while the rows of a DataFrame load, and while a table is `awaiting_first_row` the previous rows
        stay, marked stale

    Returns
    -------
    Tuple[List[Any], Any]
        The rows, loaded after mounting for a DataFrame, and the row view reporting loading, errors and `stale` rows
    """
    view = use_rows(data, primary_key, None, filter)
    return use_view_selected_rows(data, view, primary_key, identities, filter, selection)


async def edit_rows(data, primary_key, rows=(), values=None, remove=False, insert=None, read_only=False):
    """
    Update or remove the given rows, or insert new ones, in a DataFrame or a Store list as one Store action
    """
    if read_only:
        raise ValueError("This view is read only")
    if not len(rows) and insert is None:
        # Deleting or updating no row, e.g. Backspace with only text selected, changes nothing
        return None
    if getattr(data, "__pret_dataframe__", False):
        identity = data.description.internal_id_col
        edits = [
            {"kind": "delete", "row_identity": row[identity]}
            if remove
            else {"kind": "update", "row_identity": row[identity], "values": values}
            for row in rows
        ]
        result = (
            await data.insert(insert)
            if insert is not None
            else await data.applyMutation({"kind": "batch", "edits": edits})
        )
        if result is not None and result.status != "applied":
            raise ValueError(result.error or result.message or "Edit was rejected")
        return result
    keys = [row[primary_key] for row in rows]
    indices = [idx for idx in range(len(data)) if data[idx][primary_key] in keys]
    with transact(data):
        if insert is not None:
            for row in insert:
                data.append(row)
        elif remove:
            for idx in sorted(indices, reverse=True):
                del data[idx]
        else:
            for idx in indices:
                for key, value in values.items():
                    data[idx][key] = value


# Browser Store of the statuses of the view rendered by render_recipe, `{"errors": {}, "busy": {}, "dismissed": {}}`,
# where the widgets of the view write their query errors and StatusTray shows each message once. None elsewhere,
# so each widget shows its query error itself
VIEW_STATUS = ContextVar("metanno_view_status", default=None)


def use_status_report(status, error=None, busy=None):
    """
    Write the error and the work in progress of a widget to the status of its view, under a key of its own, and clear
    them when the widget goes away, for StatusTray. Does nothing outside render_recipe, where status is None
    """
    key = use_ref("".join(crypto.randomUUID().split("-"))).current  # noqa: F821
    # The browser Store refuses writes while it loads, and reading it suspends the widget until then. Its small
    # dismissed part is read, so that a new message does not render every widget again
    if status is not None:
        use_store_snapshot(status["dismissed"])

    def report():
        if status is not None:
            status["errors"][key] = error or ""
            status["busy"][key] = busy or ""

            def clear():
                status["errors"][key] = ""
                status["busy"][key] = ""

            return clear

    use_effect(report, [error, busy])


def use_widget_statuses(status, error=None, busy=None, local_error=None):
    """
    Report the query `error` of a widget to the status of its view, and return the statuses that the widget shows
    itself with StatusStack: its work in progress `busy`, its `local_error` (eg a header filter that does not
    parse) and, outside render_recipe, its query error. A dismissed error shows again once its message changes
    """
    use_status_report(status, error)
    dismissed, set_dismissed = use_state(None)
    statuses = [{"kind": "busy", "label": busy, "on_dismiss": None}] if busy else []
    for message in [local_error, error if status is None else None]:
        if message and message != dismissed:
            statuses.append(
                {"kind": "error", "label": message, "on_dismiss": lambda event, message=message: set_dismissed(message)}
            )
    return statuses


# Look of the pills of StatusBadge and of the "+N" button of StatusStack, 30px high like the buttons of the tab toolbar
# so that a pill in its tray does not change its height
PILL_SX = {
    "display": "flex",
    "alignItems": "center",
    "gap": 1,
    "minWidth": 0,
    "maxWidth": 320,
    "px": 1.5,
    "py": "5px",
    "borderRadius": "lg",
    "boxShadow": "md",
    "fontSize": "sm",
    "lineHeight": "20px",
    "whiteSpace": "nowrap",
    "pointerEvents": "auto",
}


@component
def StatusBadge(label, kind="busy", on_dismiss=None):
    """
    Show a status as a pill, in blue with a spinner for a work in progress (`kind` "busy") or in red for an "error". A
    long label is cut, and shown whole on hover, and over several lines after a click on an error
    """
    error = kind == "error"
    expanded, set_expanded = use_state(False)
    return Tooltip(
        Box(
            CircularProgress(size="sm", color="primary", sx={"--CircularProgress-size": "16px"}) if not error else None,
            span(label, style={"overflow": "hidden", "textOverflow": "ellipsis"}),
            IconButton(
                "×",
                size="sm",
                variant="plain",
                color="danger",
                on_click=on_dismiss,
                aria_label="Dismiss error",
                sx={"minWidth": 20, "minHeight": 20, "my": -0.5, "mr": -0.75, "fontSize": "lg"},
            )
            if on_dismiss
            else None,
            role="alert" if error else "status",
            on_click=(lambda event: set_expanded(not expanded)) if error else None,
            sx={
                **PILL_SX,
                **({"whiteSpace": "normal", "maxWidth": 640, "overflowWrap": "anywhere"} if expanded else {}),
                "cursor": "pointer" if error else None,
                # A work in progress looks like the soft buttons of the forms, so it shows that a click was taken
                "bgcolor": "danger.softBg" if error else "primary.softBg",
                "color": "danger.softColor" if error else "primary.softColor",
            },
        ),
        title="" if expanded else label,
        size="sm",
        placement="bottom-end",
        sx={"maxWidth": 480, "overflowWrap": "anywhere"},
    )


# Position of a StatusStack in the corner of its widget, its first status being the closest to the corner
STACK_CORNERS = {
    "top-right": {"top": 16, "right": 16, "flexDirection": "column"},
    "bottom-right": {"bottom": 16, "right": 16, "flexDirection": "column-reverse"},
}


@component
def StatusStack(statuses, corner=None):
    """
    Show statuses as StatusBadge, at most two, and then a "+N" badge that lists the others in a menu. The badges
    stack over a `corner` of the positioned parent, "top-right" or "bottom-right", or line up in a row without one,
    as in the toolbar of a Metanno tab. `statuses` holds `{"kind", "label", "on_dismiss"}` dicts
    """
    if not len(statuses):
        return None
    shown = statuses if len(statuses) <= 2 else statuses[:1]
    badges = [
        StatusBadge(label=status["label"], kind=status["kind"], on_dismiss=status["on_dismiss"], key=status["label"])
        for status in shown
    ]
    if len(statuses) > 2:
        badges.append(
            Dropdown(
                MenuButton(
                    f"+{len(statuses) - 1}",
                    variant="plain",
                    color="neutral",
                    aria_label=f"{len(statuses) - 1} more statuses",
                    sx={**PILL_SX, "minHeight": 0, "bgcolor": "background.surface"},
                ),
                Menu(
                    *[
                        MenuItem(
                            StatusBadge(label=status["label"], kind=status["kind"], on_dismiss=status["on_dismiss"]),
                            key=status["label"],
                        )
                        for status in statuses[1:]
                    ],
                    size="sm",
                    placement="bottom-end",
                ),
                key="more",
            )
        )
    return Box(
        *badges,
        class_name="metanno-status-stack",
        sx={
            "display": "flex",
            "gap": 1,
            "minWidth": 0,
            **(
                {
                    "position": "absolute",
                    "zIndex": 4,
                    "alignItems": "flex-end",
                    "maxWidth": "calc(100% - 32px)",
                    # Only the badges take clicks, the widget under the stack keeps the others
                    "pointerEvents": "none",
                    **STACK_CORNERS[corner],
                }
                if corner
                else {"alignItems": "center"}
            ),
        },
    )


@component
def StatusTray(status):
    """
    Show each work in progress and each error reported to the status of a view once, eg the failed query of a
    related group read by a table, a form and a text widget. In a Metanno tab, the badges go into the
    `.metanno-viewer__tray` node of its toolbar, elsewhere they stack over the top right corner of the view
    """
    tracked = use_store_snapshot(status)
    anchor = use_ref(None)
    slot, set_slot = use_state(None)

    def find_slot():
        view = anchor.current.closest(".metanno-viewer__view")
        set_slot(view.querySelector(".metanno-viewer__tray") if view else None)

    use_effect(find_slot, [])

    def dismiss(message):
        status["dismissed"][message] = True

    reported, statuses = {}, []
    for _, label in tracked["busy"].items():
        if label and label not in reported:
            reported[label] = True
            statuses.append({"kind": "busy", "label": label, "on_dismiss": None})
    for _, message in tracked["errors"].items():
        if message and message not in reported:
            reported[message] = True
            if not tracked["dismissed"][message]:
                statuses.append(
                    {"kind": "error", "label": message, "on_dismiss": lambda event, message=message: dismiss(message)}
                )

    # A dismissed error shows again if it comes back after no widget reported it, eg a new query that fails again
    def forget_dismissals():
        for message, dismissed in tracked["dismissed"].items():
            if dismissed and message not in reported:
                status["dismissed"][message] = False

    use_effect(forget_dismissals)

    stack = StatusStack(statuses=statuses, corner=None if slot else "top-right")
    return span(Portal(stack, container=slot) if slot else stack, ref=anchor, style={"display": "contents"})


@component
def StoreWidget(store, content, style=None, read_only=False):
    """
    Handle data history shortcuts inside factory widgets while editors keep native undo, a failed undo is
    recorded as the Store history error shown by StatusBar.

    A shortcut belongs to the widget containing the focused element, or to the widget clicked last when nothing
    is focused: Safari and Firefox on macOS do not focus a clicked button, and a button that renders again, like
    the Delete button of a span toolbar, loses the focus, so the key then goes to the page body.
    """
    history = use_store_history(store)
    container = use_ref(None)
    # Whether the last pointer press of the page was inside this widget
    clicked_last = use_ref(False)

    @use_event_callback
    def handle_pointer(event):
        clicked_last.current = container.current is not None and container.current.contains(event.target)

    @use_event_callback
    async def handle_key(event):
        key = event.key.lower()
        if read_only or not (event.ctrlKey or event.metaKey) or (key != "z" and key != "y"):
            return
        if container.current is None:
            return
        unfocused = event.target == document.body or event.target == document.documentElement  # noqa: F821
        if not (container.current.contains(event.target) or (unfocused and clicked_last.current)):
            return
        if event.target.closest("input, textarea, [contenteditable=true]"):
            return
        event.preventDefault()
        event.stopPropagation()
        redo = key == "y" or event.shiftKey
        if history.pending or not (history.canRedo if redo else history.canUndo):
            return
        try:
            await (history.redo() if redo else history.undo())
        except BaseException:
            pass

    def listen():
        # JupyterLab 3 runs its shortcuts, such as the notebook undo, while the key goes down the page,
        # listening on the window first lets the widget undo Store edits before them
        window.addEventListener("keydown", handle_key, True)  # noqa: F821
        window.addEventListener("pointerdown", handle_pointer, True)  # noqa: F821

        def stop():
            window.removeEventListener("keydown", handle_key, True)  # noqa: F821
            window.removeEventListener("pointerdown", handle_pointer, True)  # noqa: F821

        return stop

    use_effect(listen, [])

    return div(
        content,
        ref=container,
        tab_index=0,
        style=style,
    )


class Ref:
    def __init__(self, current):
        self.current = current


def extract_row_indices(selected_rows: Optional[Sequence[Any]]) -> List[int]:
    """
    Read unique nonnegative row indices from table selection events, preserving event order

    Selection entries are integers or mappings with row_idx or rowIdx
    """
    extracted: List[int] = []
    seen = set()
    for item in list(selected_rows or []):
        if isinstance(item, bool):
            idx = None
        elif isinstance(item, int):
            idx = item
        else:
            idx = item.get("row_idx", item.get("rowIdx"))
        if not isinstance(idx, int) or idx < 0 or idx in seen:
            continue
        extracted.append(idx)
        seen.add(idx)
    return extracted


def get_first_selected_row_idx(selected_rows: Optional[Sequence[Any]]) -> Optional[int]:
    """
    Return the leading row index used to focus the annotation widget
    """
    extracted = extract_row_indices(selected_rows)
    if len(extracted) > 0:
        return extracted[0]
    return None


def normalize_row_indices(
    selected_rows: Optional[Sequence[Any]],
    row_idx: Optional[int],
    row_count: int,
) -> List[int]:
    """
    Include the active row, discard indices outside the loaded rows and sort the selection

    The annotation widget uses these indices to read and edit its loaded documents and spans
    """
    source = list(selected_rows or [])
    if row_idx is not None:
        source = [row_idx, *source]
    return sorted([idx for idx in extract_row_indices(source) if idx < row_count])


def get_parent_selection(path_parts, selected_rows_by_store, read=lambda store: store):
    """
    Map each parent path of a nested Store key, e.g. notes for notes.spans, to the ID of its lead selected row.

    DataWidgetFactory.deep_get_store uses this mapping to find the nested rows shown by a widget.
    Components pass read=use_store_snapshot so they render again when a parent selection changes.
    """
    selection = {}
    for idx in range(1, len(path_parts)):
        parent_path = ".".join(path_parts[:idx])
        parent_store = selected_rows_by_store.get(parent_path)
        identities = read(parent_store)["identities"] if parent_store is not None else []
        selection[parent_path] = identities[0] if len(identities) else None
    return selection


@component
def StatusBar(store, synced, show_connection=True, view_status=None):
    """
    Show the last rejected edit or undo of a Store and, with show_connection, its connection to Python, below
    the widgets of an app. With the `view_status` of render_recipe, the error goes to the StatusTray of the view
    """
    statuses = use_widget_statuses(view_status, use_store_history(store).error)
    status = use_connection_status()
    if not show_connection:
        return StatusStack(statuses=statuses)
    if status["connected"]:
        connected, color = "Connected", "success"
    elif synced:
        connected, color = "Disconnected", "danger"
    else:
        connected, color = "Offline (changes won't be saved)", "neutral"
    sx = {
        "width": "100%",
        "px": 1.5,
        "py": 0.25,
        "borderTop": "1px solid var(--joy-palette-divider, #d6d6d6)",
        "background": "var(--joy-palette-background-surface, #fff)",
    }
    rejections = status["state_write_rejection_count"] or 0
    if synced and status["connected"] is False and rejections:
        # Pulse the bar each time an edit is refused while disconnected
        animation_name = f"pret-disconnected-status-pulse-{rejections}"
        sx.update(
            {
                "animation": f"{animation_name} 500ms ease-out",
                f"@keyframes {animation_name}": {
                    "0%": {
                        "borderTopColor": "var(--joy-palette-danger-500, #c41c1c)",
                        "background": "var(--joy-palette-danger-100, #ffe9e8)",
                    },
                    "55%": {
                        "borderTopColor": "var(--joy-palette-danger-400, #e4746b)",
                        "background": "var(--joy-palette-danger-50, #fff4f3)",
                    },
                    "100%": {
                        "borderTopColor": "var(--joy-palette-divider, #d6d6d6)",
                        "background": "var(--joy-palette-background-surface, #fff)",
                    },
                },
            }
        )
    return Box(
        StatusStack(statuses=statuses),
        Typography(f"Connection status: {connected}", level="body-sm", color=color),
        class_name="metanno-status-bar",
        sx=sx,
    )
