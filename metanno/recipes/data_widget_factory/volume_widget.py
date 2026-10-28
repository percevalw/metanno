"""
Volume widget showing the volumes of the selected row in linked AnnotatedVolume panels, with the shapes drawn on it
"""

from typing import Any, Callable, Dict, List, Optional, Tuple

from pret import component, create_store, use_store_snapshot
from pret.dataframe_sqlite import INTERNAL_ROW_ID
from pret.hooks import use_effect, use_imperative_handle, use_ref
from pret.manager import function_identifier, server_only
from pret.marshal import js, marshal_as
from pret.react import div, span
from pret.render import Renderable
from pret_joy import Button, ButtonGroup, FormControl, FormLabel, Option, Select, Stack
from pret_simple_dock import Panel

from metanno import AnnotatedVolume
from metanno.volume import serve_volumes

from .widget_data import ErrorBanner, LoadingStatus, edit_rows, use_selected_rows


@marshal_as(js="return glideCursor", globals={"glideCursor": js.Metanno.glideCursor})
def glide_cursor(start, end, emit):
    """
    Move the cursor from start to end in a short animation, calling emit with each position, see
    client/components/AnnotatedVolume
    """


def choice(names, current, on_pick):
    """
    Buttons of mutually exclusive choices, the current one filled
    """
    return ButtonGroup(
        *[
            Button(
                name,
                variant="solid" if name == current else "soft",
                sx={"textTransform": "none"},
                on_click=lambda event, name=name: on_pick(name),
            )
            for name in names
        ],
        size="sm",
    )


def line(label, *controls):
    """
    One labelled line of the toolbar, like the fields of a form, its controls wrap in narrow panels
    """
    return FormControl(
        FormLabel(label),
        Stack(*controls, direction="row", spacing=1, use_flex_gap=True, sx={"flexWrap": "wrap"}),
    )


class VolumeWidgets:
    def create_volume_widget(
        self,
        *,
        store_key: Any,
        primary_key: str,
        store_shapes_key: Any = None,
        shapes_primary_key: Optional[str] = None,
        volumes: Callable[[Dict[str, Any]], List[Dict[str, Any]]],
        loader: Callable[[Any], Dict[str, Any]],
        shapes_foreign_key: Optional[str] = None,
        fill: Optional[Callable[[List[Dict[str, Any]]], List[Dict[str, Any]]]] = None,
        layout: str = "orthogonal",
        arrangements: Optional[List[str]] = None,
        columns: int = 3,
        dock_anchor: Optional[str] = None,
        object_prefix: str = "L",
        shape_styles: Optional[Dict[str, Dict[str, Any]]] = None,
        style: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Renderable, Renderable]:
        """
        Show the volumes of the lead selected row in linked `AnnotatedVolume` panels, and draw points and outlines
        saved as rows of a shapes collection when one is given, e.g. beside a table and a form of the selected
        lesion.

        Clicking a shape selects its row in the tables and forms of the shapes, and selecting a row in a table glides
        the cursor onto its shape. Outlines belong to the current object of the toolbar, e.g. `L1`, which a click on
        an outline also picks.

        Parameters
        ----------
        store_key : Any
            Key of the collection or DataFrame whose lead selected row is shown
        primary_key : str
            Field identifying the rows
        store_shapes_key : Any
            Key of the DataFrame or Store list of shape rows `{id, kind, points}`, with `thickness`, `object` and
            `label` for outlines, `interpolated` and `style` for the outlines written by "Fill slices", and the
            `space` of their volumes when it has one. A DataFrame needs these columns, `points` being a list of
            `[x, y, z]` lists. Without it the panels only show the volumes
        shapes_primary_key : str | None
            Field identifying the shapes, new shapes get a random hex id
        volumes : Callable[[Dict[str, Any]], List[Dict[str, Any]]]
            Called in Python with the row, returns its volumes in panel order as
            `[{"id": "t2", "label": "T2", "space": "..."}, ...]`. Volumes with the same `space`, e.g. a DICOM frame
            of reference uid, share their cursor, zoom and pan, and the shapes drawn on them. Without `space`, all
            the volumes of a row share them. With `dock_anchor`, an `anchor` puts the panel of a volume in the tab
            list of that anchor of the dock, e.g. `"@R CC"` for the 2D, synthetic and tomosynthesis views of a breast,
            or a dict of the anchor of the volumes in each arrangement. `overlays` lists the masks drawn over a volume
            as `[{"id": "t2-model", "label": "Model", "color": "red", "opacity": 0.5}, ...]`, volumes of integer labels
            read by `loader`, on any grid, 0 being transparent. Without `color` each label gets its own color. The
            toolbar shows or hides the overlays of each label, at most 3 are drawn over a volume
        loader : Callable[[Any], Dict[str, Any]]
            Called in Python with a volume id, returns the volume dict described in `metanno.volume.serve_volumes`
        shapes_foreign_key : str | None
            Field of the shapes holding the id of their row, `primary_key` by default
        fill : Callable[[List[Dict[str, Any]]], List[Dict[str, Any]]] | None
            Called in Python with the rows of the current object behind the "Fill slices" button, e.g.
            `metanno.volume.interpolate_contours`, returns the rows replacing its earlier `interpolated` rows
        layout : str
            First layout of the panels, switchable from the toolbar. `"orthogonal"` shows the axial, coronal and
            sagittal planes of one volume, an arrangement one axial panel per volume
        arrangements : List[str] | None
            Names of the arrangements of one axial panel per volume offered next to `"orthogonal"`, `["sequence"]` by
            default. In the dock, each places the volumes by their anchor of that name, e.g. right and left views of
            a breast side by side, or the synthetic 2D view next to the tomosynthesis of each view
        columns : int
            Panels per row of the arrangements in the panels grid, e.g. 2 to show right and left mammograms side by
            side
        dock_anchor : str | None
            Anchor tab of the `default_config` of the root `pret_simple_dock.Layout` of the view, e.g. `"@volume"`.
            With it the panels are tabs of that Layout instead of a grid: the second value returned is then a function
            to call when rendering the Layout in a component, returning one `Panel` per volume
        object_prefix : str
            Objects are named with this prefix and a number, e.g. `L1`
        shape_styles : Dict[str, Dict[str, Any]] | None
            Named styles of `AnnotatedVolume`, added to the `interpolated` style of the filled outlines
        style : Dict[str, Any] | None
            Inline style of the panels container, which fills its parent unless these keys override it

        Returns
        -------
        Tuple[Renderable, Renderable | Callable[[], List[Renderable]]]
            The toolbar, one labelled line per control to place in a side panel, and the panels, or with
            `dock_anchor` the function returning their dock panels
        """
        store_key = str(store_key)
        arrangements = list(arrangements or ["sequence"])
        layouts = ["orthogonal", *arrangements]
        annotating = store_shapes_key is not None
        shapes_foreign_key = shapes_foreign_key or primary_key
        self.ensure_selected_rows(store_key)
        self.register_pkey(store_key, primary_key)
        on_mount = self.register_widget_dataframe(store_key)
        row_store, selected_rows = self.data[store_key], self.selected_rows[store_key]
        handles, read_only = self.handles, self.read_only or not annotating
        shapes_store, selected_shapes, handle = None, None, None
        if annotating:
            store_shapes_key = str(store_shapes_key)
            on_mount = on_mount or self.register_widget_dataframe(store_shapes_key)
            self.ensure_selected_rows(store_shapes_key)
            self.register_pkey(store_shapes_key, shapes_primary_key)
            shapes_store, selected_shapes = self.data[store_shapes_key], self.selected_rows[store_shapes_key]
            # Tables of the shapes call scroll_to_span with the shape of their selected row
            handle = use_ref()
            handles.setdefault(store_shapes_key, []).append([handle, "spans"])
        describe, load_slices = serve_volumes(loader)

        def describe_row(row):
            # Metadata of the volumes of a row for the volumes prop of the panels, with their label
            return [
                {
                    **describe(item["id"]),
                    "label": item.get("label", item["id"]),
                    "space": item.get("space", ""),
                    "overlays": [
                        {
                            **describe(overlay["id"]),
                            "label": overlay.get("label", overlay["id"]),
                            "color": overlay.get("color"),
                            "opacity": overlay.get("opacity", 0.5),
                        }
                        for overlay in item.get("overlays", [])
                    ],
                    # Anchor of the volumes in each arrangement, the same in all when the item gives one
                    "anchors": (
                        None
                        if item.get("anchor") is None
                        else {
                            name: item["anchor"].get(name) if isinstance(item["anchor"], dict) else item["anchor"]
                            for name in arrangements
                        }
                    ),
                }
                for item in volumes(row)
            ]

        # Two widgets with different functions must not share server function ids, so we derive them from both
        describe_row = server_only(
            describe_row, f"metanno.volume_widget:{function_identifier(volumes)}:{function_identifier(loader)}"
        )

        def fill_shapes(rows):
            # The filled outlines copy the fields of the drawn ones, but not the row identity of a DataFrame
            return [{key: value for key, value in row.items() if key != INTERNAL_ROW_ID} for row in fill(rows)]

        fill_rows = (
            server_only(fill_shapes, f"metanno.volume_widget.fill:{function_identifier(fill)}")
            if fill is not None
            else None
        )
        shape_styles = {"interpolated": {"opacity": 0.5}, **(shape_styles or {})}
        style = {"display": "grid", "gap": "4px", "width": "100%", "height": "100%", "minHeight": 0, **(style or {})}
        # Browser only Stores: the view of each space shared by its panels, and the state shared by the toolbar and the
        # panels, with the volumes metadata of the open row and the shape a table asked for until that row is open
        views = create_store({"spaces": {}})
        state = create_store(
            {
                "mode": "move",
                "tool": "point",
                "object": object_prefix + "1",
                "layout": layout,
                "volume": None,
                "row": None,
                "opening": None,
                "volumes": None,
                "error": None,
                "pending": None,
                "hidden": {},
            }
        )

        # Shapes of the open row last read by a panel, for the glide of show_shape
        loaded = {"rows": []}

        def row_shapes(row_id):
            # Shapes of a row from a DataFrame or a Store list, components render again when they change
            if not annotating:
                return []
            rows = use_selected_rows(
                shapes_store,
                shapes_primary_key,
                None,
                {"kind": "predicate", "column": shapes_foreign_key, "operator": "in", "value": [row_id]},
            )[0]
            loaded["rows"] = rows
            return rows

        def select_shape(row):
            # Shares the shape selection with the forms, and highlights the row in the tables of the shapes
            selected_shapes["identities"] = [] if row is None else [row[shapes_primary_key]]
            selected_shapes["row"] = row
            for other in handles.get(store_shapes_key, []):
                if other[1] == "table" and other[0].current is not None and row is not None:
                    other[0].current.select_row_id(row[shapes_primary_key], "relation")

        def show_shape(shape_id):
            # Glides the cursor onto the centroid of a shape, at once if its row is open, otherwise once it opens
            rows = [
                row
                for row in loaded["rows"]
                if row[shapes_foreign_key] == state["row"] and row[shapes_primary_key] == shape_id
            ]
            if state["volumes"] is None or not len(rows):
                state["pending"] = shape_id
                return
            state["pending"] = None
            points, view = rows[0]["points"], views["spaces"][rows[0]["space"] or ""]

            def set_cursor(cursor):
                view["cursor"] = cursor

            glide_cursor(
                view["cursor"], [sum([p[axis] for p in points]) / len(points) for axis in range(3)], set_cursor
            )

        async def open_row(row):
            # Loads the volumes of a row, then starts the panels on the middle slice of the first volume of each space,
            # otherwise each would start on the middle of its own volume until the first click or wheel. The volumes of
            # the previous row stay in the state meanwhile, so the dock keeps the panels the new row also has
            row_id = row[primary_key]
            state["opening"] = row_id
            state["error"] = None
            try:
                described = await describe_row(row)
                if state["opening"] != row_id:
                    return
                if not len(described):
                    raise ValueError("No volumes for this row")
                spaces = {}
                for meta in described:
                    if meta["space"] in spaces:
                        continue
                    nk, nj, ni = meta["shape"]
                    affine = meta["affine"]
                    cursor = [
                        affine[r][0] * (ni - 1) / 2
                        + affine[r][1] * (nj - 1) / 2
                        + affine[r][2] * (nk // 2)
                        + affine[r][3]
                        for r in range(3)
                    ]
                    spaces[meta["space"]] = {"cursor": cursor, "center": None, "zoom": None, "orientation": None}
                views["spaces"] = spaces
                state["volume"] = described[0]["id"]
                state["volumes"] = described
                state["row"] = row_id
                if state["pending"] is not None:
                    show_shape(state["pending"])
            except BaseException as reason:
                state["error"] = str(reason)

        @component
        def ToolbarWidget():
            tracked = use_store_snapshot(state)
            row_ids = use_store_snapshot(selected_rows)["identities"]
            row_id = row_ids[0] if len(row_ids) else None
            shapes = row_shapes(row_id)
            current = tracked["object"]
            names = []
            for row in shapes:
                if row["object"] and row["object"] not in names:
                    names.append(row["object"])
            if current not in names:
                names.append(current)

            def set_state(key, value):
                state[key] = value

            def toggle_overlay(label):
                state["hidden"][label] = not state["hidden"][label]

            def new_object(event=None):
                number = 1
                while object_prefix + str(number) in names:
                    number += 1
                state["object"] = object_prefix + str(number)

            async def on_fill(event=None):
                drawn = [row for row in shapes if row["object"] == current]
                new_rows = await fill_rows(drawn)
                for row in new_rows:
                    row[shapes_primary_key] = "".join(crypto.randomUUID().split("-"))  # noqa: F821
                    row[shapes_foreign_key] = row_id
                    row["style"] = "interpolated"
                    if len(drawn) and drawn[0]["space"]:
                        row["space"] = drawn[0]["space"]
                # The earlier filled outlines of the object are replaced by the new ones
                earlier = [row for row in drawn if row["interpolated"]]
                await edit_rows(shapes_store, shapes_primary_key, earlier, remove=True, read_only=read_only)
                await edit_rows(shapes_store, shapes_primary_key, insert=new_rows, read_only=read_only)

            lines = [line("Layout", choice(layouts, tracked["layout"], lambda v: set_state("layout", v)))]
            # In the dock each volume of the orthogonal layout is a tab, in the grid the toolbar picks one
            if dock_anchor is None and tracked["layout"] == "orthogonal" and tracked["volumes"] is not None:
                lines.append(
                    line(
                        "Volume",
                        Select(
                            *[Option(meta["label"], value=meta["id"]) for meta in tracked["volumes"]],
                            value=tracked["volume"],
                            size="sm",
                            on_change=lambda event, value: set_state("volume", value),
                        ),
                    )
                )
            overlays = []
            for meta in tracked["volumes"] if tracked["volumes"] is not None else []:
                for overlay in meta["overlays"]:
                    if overlay["label"] not in overlays:
                        overlays.append(overlay["label"])
            if len(overlays):
                lines.append(
                    line(
                        "Overlays",
                        ButtonGroup(
                            *[
                                Button(
                                    label,
                                    variant="soft" if tracked["hidden"][label] else "solid",
                                    sx={"textTransform": "none"},
                                    on_click=lambda event, label=label: toggle_overlay(label),
                                )
                                for label in overlays
                            ],
                            size="sm",
                        ),
                    )
                )
            if not read_only and row_id is not None:
                lines.append(line("Mode", choice(["move", "edit"], tracked["mode"], lambda v: set_state("mode", v))))
                lines.append(
                    line("Tool", choice(["point", "polygon", "lasso"], tracked["tool"], lambda v: set_state("tool", v)))
                )
                lines.append(
                    line(
                        "Object",
                        Select(
                            *[Option(name, value=name) for name in names],
                            value=current,
                            size="sm",
                            on_change=lambda event, value: set_state("object", value),
                        ),
                        Button("New object", size="sm", variant="soft", on_click=new_object),
                        Button("Fill slices", size="sm", variant="soft", on_click=on_fill) if fill_rows else None,
                    )
                )
            return Stack(*lines, spacing=1.5)

        def use_open_row():
            # Opens the lead selected row and answers the shapes tables, for the panels grid or the dock panels,
            # returns the selected row id and the error of its query
            if on_mount is not None:
                use_effect(on_mount, [])
            row_ids = use_store_snapshot(selected_rows)["identities"]
            rows, row_view = use_selected_rows(row_store, primary_key, row_ids[:1])
            row = rows[0] if len(rows) else None
            row_id = row[primary_key] if row else None

            def open_selected():
                if row is not None:
                    open_row(row)

            use_effect(open_selected, [row_id])
            if annotating:
                # Tables of the shapes also call set_highlighted_spans on hover, the panels have no hover highlight
                use_imperative_handle(
                    handle, lambda: {"scroll_to_span": show_shape, "set_highlighted_spans": lambda ids: None}, []
                )
                shapes = row_shapes(row_id)

                def show_pending():
                    # A shape asked by a table glides once its row and the shapes of a DataFrame are loaded
                    if state["pending"] is not None:
                        show_shape(state["pending"])

                use_effect(show_pending, [row_id, len(shapes)])
            return row_id, row_view.error

        @component
        def VolumePanel(volume_id, plane, row_id, label=None):
            # One plane of one volume of the open row, a loading status while another row opens
            tracked = use_store_snapshot(state)
            tracked_views = use_store_snapshot(views)["spaces"]
            shapes = row_shapes(row_id)
            selected = use_store_snapshot(selected_shapes)["identities"] if annotating else []
            picked = [meta for meta in tracked["volumes"] if meta["id"] == volume_id]
            if tracked["row"] != row_id or not len(picked):
                return LoadingStatus(label="Opening the volumes")
            space = picked[0]["space"]
            # The volume, then its overlays the toolbar did not hide
            metas, layers = [picked[0]], [{"volume": volume_id}]
            for overlay in picked[0]["overlays"]:
                if not tracked["hidden"][overlay["label"]]:
                    metas.append(overlay)
                    layers.append(
                        {
                            "volume": overlay["id"],
                            "colormap": "labels",
                            "color": overlay["color"],
                            "opacity": overlay["opacity"],
                        }
                    )

            def on_view_change(patch):
                for key, value in patch.items():
                    views["spaces"][space][key] = value

            async def on_mouse_select(modkeys, new_shapes):
                drawn = new_shapes[0]
                row = {
                    shapes_primary_key: "".join(crypto.randomUUID().split("-")),  # noqa: F821
                    shapes_foreign_key: row_id,
                    "kind": drawn["kind"],
                    "points": drawn["points"],
                }
                if space:
                    row["space"] = space
                if drawn["kind"] == "polygon":
                    row["thickness"] = drawn["thickness"]
                    row["object"] = tracked["object"]
                    row["label"] = tracked["object"]
                await edit_rows(shapes_store, shapes_primary_key, insert=[row], read_only=read_only)
                select_shape(row)

            async def on_shape_change(shape_id, points):
                moved = [row for row in shapes if row[shapes_primary_key] == shape_id]
                await edit_rows(shapes_store, shapes_primary_key, moved, {"points": points}, read_only=read_only)

            def on_click(shape_id, modkeys):
                clicked = [row for row in shapes if row[shapes_primary_key] == shape_id]
                select_shape(clicked[0] if len(clicked) else None)
                if len(clicked) and clicked[0]["object"]:
                    state["object"] = clicked[0]["object"]

            async def on_key_press(key, modkeys):
                if annotating and (key == "Delete" or key == "Backspace"):
                    removed = [row for row in shapes if row[shapes_primary_key] in selected]
                    select_shape(None)
                    await edit_rows(shapes_store, shapes_primary_key, removed, remove=True, read_only=read_only)

            return div(
                AnnotatedVolume(
                    volumes=metas,
                    load_slices=load_slices,
                    layers=layers,
                    plane=plane,
                    view=tracked_views[space],
                    shapes=[row for row in shapes if (row["space"] or "") == space],
                    shape_styles=shape_styles,
                    selected=selected,
                    mode="move" if read_only else tracked["mode"],
                    tool=tracked["tool"],
                    on_view_change=on_view_change,
                    on_mouse_select=on_mouse_select,
                    on_shape_change=on_shape_change,
                    on_click=on_click,
                    on_key_press=on_key_press,
                ),
                span(
                    label,
                    # Long volume names stop before the orientation letter at the top middle of the panel
                    style={
                        "position": "absolute",
                        "top": 4,
                        "left": 6,
                        "maxWidth": "calc(50% - 16px)",
                        "overflow": "hidden",
                        "textOverflow": "ellipsis",
                        "whiteSpace": "nowrap",
                        "color": "white",
                        "pointerEvents": "none",
                    },
                )
                if label
                else None,
                style={"position": "relative", "width": "100%", "height": "100%", "minWidth": 0, "minHeight": 0},
            )

        def planes(meta):
            # The axial, coronal and sagittal planes of one volume, as (volume, plane, label) triples
            return [(meta, plane, meta["label"] + " " + plane) for plane in ["axial", "coronal", "sagittal"]]

        def shown(tracked):
            # Volumes and planes of the panels grid for the layout picked in the toolbar, as (volume, plane, label)
            # triples, every arrangement showing one axial panel per volume
            volumes = tracked["volumes"]
            if tracked["layout"] == "orthogonal":
                # The volume picked in the toolbar, among the volumes of the open row
                picked = [meta for meta in volumes if meta["id"] == tracked["volume"]]
                return planes(picked[0] if len(picked) else volumes[0])
            return [(meta, "axial", meta["label"]) for meta in volumes]

        def panels_grid(triples, row_id, per_row):
            # Panels of (volume, plane, label) triples side by side, per_row per row
            panels = [
                VolumePanel(volume_id=meta["id"], plane=plane, row_id=row_id, label=label, key=meta["id"] + plane)
                for meta, plane, label in triples
            ]
            return div(*panels, style={**style, "gridTemplateColumns": f"repeat({min(len(panels), per_row)}, 1fr)"})

        @component
        def VolumeWidget():
            row_id, query_error = use_open_row()
            tracked = use_store_snapshot(state)
            if tracked["error"] or query_error:
                return div(ErrorBanner(error=tracked["error"] or query_error), style=style)
            if row_id is None:
                return div("No row selected", style={**style, "padding": "1em", "boxSizing": "border-box"})
            if tracked["volumes"] is None or tracked["row"] != row_id:
                return div(LoadingStatus(label="Opening the volumes"), style=style)
            return panels_grid(shown(tracked), row_id, 3 if tracked["layout"] == "orthogonal" else columns)

        def dock_panels():
            # Dock panels of the open row for the root Layout of a view, named by their layout and label so that a
            # panel the user moved keeps its place from one row to the next. In an arrangement a volume goes in the
            # tab list of its anchor or of dock_anchor, where a status panel stands until a row opens. In the
            # orthogonal layout each volume is a tab of dock_anchor showing its three planes, which share one panel
            # since the dock halves a cell at each split
            row_id, query_error = use_open_row()
            tracked = use_store_snapshot(state)
            if tracked["error"] or query_error or row_id is None or tracked["volumes"] is None:
                status = (
                    ErrorBanner(error=tracked["error"] or query_error)
                    if tracked["error"] or query_error
                    else "No row selected"
                    if row_id is None
                    else LoadingStatus(label="Opening the volumes")
                )
                return [
                    Panel(
                        div(status, style={"padding": "1em"}),
                        key="Volume",
                        place={"where": "last-tab", "of": dock_anchor},
                    )
                ]
            # The dock shows the tab it inserted last, so the first volume of each anchor is inserted after the others,
            # at the front of its tab list
            layout = tracked["layout"]
            panels, firsts, names = [], [], []
            for meta in tracked["volumes"]:
                name = meta["label"]
                while name in names:
                    name = name + " +"
                names.append(name)
                if layout == "orthogonal":
                    content, anchor = panels_grid(planes(meta), row_id, 3), dock_anchor
                else:
                    content = VolumePanel(volume_id=meta["id"], plane="axial", row_id=row_id, key=meta["id"])
                    anchor = (meta["anchors"][layout] if meta["anchors"] else None) or dock_anchor
                key = layout + " " + name
                if len([other for other in firsts if other[1] == anchor]):
                    panels.append(Panel(content, key=key, header=name, place={"where": "last-tab", "of": anchor}))
                else:
                    place = {"where": "first-tab", "of": anchor}
                    firsts.append([Panel(content, key=key, header=name, place=place), anchor])
            for first in firsts:
                panels.append(first[0])
            return panels

        return ToolbarWidget(), (dock_panels if dock_anchor is not None else VolumeWidget())
