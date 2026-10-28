"""
Volume widget showing the series of the selected study in linked AnnotatedVolume panels, with the shapes drawn on it
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
        store_studies_key: Any,
        study_primary_key: str,
        store_shapes_key: Any = None,
        shapes_primary_key: Optional[str] = None,
        series: Callable[[Dict[str, Any]], List[Dict[str, Any]]],
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
        Show the series of the lead selected study in linked `AnnotatedVolume` panels, and draw points and outlines
        saved as rows of a shapes collection when one is given, e.g. beside a table of studies and a form of the
        selected lesion.

        Clicking a shape selects its row in the tables and forms of the shapes, and selecting a row in a table glides
        the cursor onto its shape. Outlines belong to the current object of the toolbar, e.g. `L1`, which a click on
        an outline also picks.

        Parameters
        ----------
        store_studies_key : Any
            Key of the collection or DataFrame of studies, the lead selected study is shown
        study_primary_key : str
            Field identifying the studies
        store_shapes_key : Any
            Key of the DataFrame or Store list of shape rows `{id, kind, points}`, with `thickness`, `object` and
            `label` for outlines, `interpolated` and `style` for the outlines written by "Fill slices", and the
            `space` of their series when it has one. A DataFrame needs these columns, `points` being a list of
            `[x, y, z]` lists. Without it the panels only show the series
        shapes_primary_key : str | None
            Field identifying the shapes, new shapes get a random hex id
        series : Callable[[Dict[str, Any]], List[Dict[str, Any]]]
            Called in Python with the study row, returns its series in panel order as
            `[{"id": "t2", "label": "T2", "space": "..."}, ...]`. Series with the same `space`, e.g. a DICOM frame
            of reference uid, share their cursor, zoom and pan, and the shapes drawn on them. Without `space`, all
            the series of a study share them. With `dock_anchor`, an `anchor` puts the panel of a series in the tab
            list of that anchor of the dock, e.g. `"@R CC"` for the 2D, synthetic and tomosynthesis views of a breast,
            or a dict of the anchor of the series in each arrangement
        loader : Callable[[Any], Dict[str, Any]]
            Called in Python with a series id, returns the volume dict described in `metanno.volume.serve_volumes`
        shapes_foreign_key : str | None
            Field of the shapes holding their study id, `study_primary_key` by default
        fill : Callable[[List[Dict[str, Any]]], List[Dict[str, Any]]] | None
            Called in Python with the rows of the current object behind the "Fill slices" button, e.g.
            `metanno.volume.interpolate_contours`, returns the rows replacing its earlier `interpolated` rows
        layout : str
            First layout of the panels, switchable from the toolbar. `"orthogonal"` shows the axial, coronal and
            sagittal planes of one series, an arrangement one axial panel per series
        arrangements : List[str] | None
            Names of the arrangements of one axial panel per series offered next to `"orthogonal"`, `["sequence"]` by
            default. In the dock, each places the series by their anchor of that name, e.g. right and left views of
            a breast side by side, or the synthetic 2D view next to the tomosynthesis of each view
        columns : int
            Panels per row of the arrangements in the panels grid, e.g. 2 to show right and left mammograms side by
            side
        dock_anchor : str | None
            Anchor tab of the `default_config` of the root `pret_simple_dock.Layout` of the view, e.g. `"@volume"`.
            With it the panels are tabs of that Layout instead of a grid: the second value returned is then a function
            to call when rendering the Layout in a component, returning one `Panel` per series
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
        store_studies_key = str(store_studies_key)
        arrangements = list(arrangements or ["sequence"])
        layouts = ["orthogonal", *arrangements]
        annotating = store_shapes_key is not None
        shapes_foreign_key = shapes_foreign_key or study_primary_key
        self.ensure_selected_rows(store_studies_key)
        self.register_pkey(store_studies_key, study_primary_key)
        on_mount = self.register_widget_dataframe(store_studies_key)
        studies, selected_studies = self.data[store_studies_key], self.selected_rows[store_studies_key]
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

        def describe_study(study):
            # Metadata of the series of a study for the volumes prop of the panels, with their label
            return [
                {
                    **describe(item["id"]),
                    "label": item.get("label", item["id"]),
                    "space": item.get("space", ""),
                    # Anchor of the series in each arrangement, the same in all when the item gives one
                    "anchors": (
                        None
                        if item.get("anchor") is None
                        else {
                            name: item["anchor"].get(name) if isinstance(item["anchor"], dict) else item["anchor"]
                            for name in arrangements
                        }
                    ),
                }
                for item in series(study)
            ]

        # Two widgets with different functions must not share server function ids, so we derive them from both
        describe_study = server_only(
            describe_study, f"metanno.volume_widget:{function_identifier(series)}:{function_identifier(loader)}"
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
        # panels, with the series metadata of the open study and the shape a table asked for until that study is open
        views = create_store({"spaces": {}})
        state = create_store(
            {
                "mode": "move",
                "tool": "point",
                "object": object_prefix + "1",
                "layout": layout,
                "series": None,
                "study": None,
                "opening": None,
                "volumes": None,
                "error": None,
                "pending": None,
            }
        )

        # Shapes of the open study last read by a panel, for the glide of show_shape
        loaded = {"rows": []}

        def study_shapes(study_id):
            # Shapes of a study from a DataFrame or a Store list, components render again when they change
            if not annotating:
                return []
            rows = use_selected_rows(
                shapes_store,
                shapes_primary_key,
                None,
                {"kind": "predicate", "column": shapes_foreign_key, "operator": "in", "value": [study_id]},
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
            # Glides the cursor onto the centroid of a shape, at once if its study is open, otherwise once it opens
            rows = [
                row
                for row in loaded["rows"]
                if row[shapes_foreign_key] == state["study"] and row[shapes_primary_key] == shape_id
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

        async def open_study(study):
            # Loads the series of a study, then starts the panels on the middle slice of the first series of each space,
            # otherwise each would start on the middle of its own series until the first click or wheel. The series of
            # the previous study stay in the state meanwhile, so the dock keeps the panels the new study also has
            study_id = study[study_primary_key]
            state["opening"] = study_id
            state["error"] = None
            try:
                volumes = await describe_study(study)
                if state["opening"] != study_id:
                    return
                if not len(volumes):
                    raise ValueError("This study has no series")
                spaces = {}
                for meta in volumes:
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
                state["series"] = volumes[0]["id"]
                state["volumes"] = volumes
                state["study"] = study_id
                if state["pending"] is not None:
                    show_shape(state["pending"])
            except BaseException as reason:
                state["error"] = str(reason)

        @component
        def ToolbarWidget():
            tracked = use_store_snapshot(state)
            study_ids = use_store_snapshot(selected_studies)["identities"]
            study_id = study_ids[0] if len(study_ids) else None
            shapes = study_shapes(study_id)
            current = tracked["object"]
            names = []
            for row in shapes:
                if row["object"] and row["object"] not in names:
                    names.append(row["object"])
            if current not in names:
                names.append(current)

            def set_state(key, value):
                state[key] = value

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
                    row[shapes_foreign_key] = study_id
                    row["style"] = "interpolated"
                    if len(drawn) and drawn[0]["space"]:
                        row["space"] = drawn[0]["space"]
                # The earlier filled outlines of the object are replaced by the new ones
                earlier = [row for row in drawn if row["interpolated"]]
                await edit_rows(shapes_store, shapes_primary_key, earlier, remove=True, read_only=read_only)
                await edit_rows(shapes_store, shapes_primary_key, insert=new_rows, read_only=read_only)

            lines = [line("Layout", choice(layouts, tracked["layout"], lambda v: set_state("layout", v)))]
            # In the dock each series of the orthogonal layout is a tab, in the grid the toolbar picks one
            if dock_anchor is None and tracked["layout"] == "orthogonal" and tracked["volumes"] is not None:
                lines.append(
                    line(
                        "Series",
                        Select(
                            *[Option(meta["label"], value=meta["id"]) for meta in tracked["volumes"]],
                            value=tracked["series"],
                            size="sm",
                            on_change=lambda event, value: set_state("series", value),
                        ),
                    )
                )
            if not read_only and study_id is not None:
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

        def use_open_study():
            # Opens the lead selected study and answers the shapes tables, for the panels grid or the dock panels,
            # returns the selected study id and the error of its query
            if on_mount is not None:
                use_effect(on_mount, [])
            study_ids = use_store_snapshot(selected_studies)["identities"]
            rows, study_view = use_selected_rows(studies, study_primary_key, study_ids[:1])
            study = rows[0] if len(rows) else None
            study_id = study[study_primary_key] if study else None

            def open_selected():
                if study is not None:
                    open_study(study)

            use_effect(open_selected, [study_id])
            if annotating:
                # Tables of the shapes also call set_highlighted_spans on hover, the panels have no hover highlight
                use_imperative_handle(
                    handle, lambda: {"scroll_to_span": show_shape, "set_highlighted_spans": lambda ids: None}, []
                )
                shapes = study_shapes(study_id)

                def show_pending():
                    # A shape asked by a table glides once its study and the shapes of a DataFrame are loaded
                    if state["pending"] is not None:
                        show_shape(state["pending"])

                use_effect(show_pending, [study_id, len(shapes)])
            return study_id, study_view.error

        @component
        def SeriesPanel(series_id, plane, study_id, label=None):
            # One plane of one series of the open study, a loading status while another study opens
            tracked = use_store_snapshot(state)
            tracked_views = use_store_snapshot(views)["spaces"]
            shapes = study_shapes(study_id)
            selected = use_store_snapshot(selected_shapes)["identities"] if annotating else []
            volumes = tracked["volumes"]
            picked = [meta for meta in volumes if meta["id"] == series_id]
            if tracked["study"] != study_id or not len(picked):
                return LoadingStatus(label="Opening the study")
            space = picked[0]["space"]

            def on_view_change(patch):
                for key, value in patch.items():
                    views["spaces"][space][key] = value

            async def on_mouse_select(modkeys, new_shapes):
                drawn = new_shapes[0]
                row = {
                    shapes_primary_key: "".join(crypto.randomUUID().split("-")),  # noqa: F821
                    shapes_foreign_key: study_id,
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
                    volumes=volumes,
                    load_slices=load_slices,
                    layers=[{"volume": series_id}],
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
                    # Long series names stop before the orientation letter at the top middle of the panel
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
            # The axial, coronal and sagittal planes of one series, as (series, plane, label) triples
            return [(meta, plane, meta["label"] + " " + plane) for plane in ["axial", "coronal", "sagittal"]]

        def shown(tracked):
            # Series and planes of the panels grid for the layout picked in the toolbar, as (series, plane, label)
            # triples, every arrangement showing one axial panel per series
            volumes = tracked["volumes"]
            if tracked["layout"] == "orthogonal":
                # The series picked in the toolbar, among the series of the open study
                picked = [meta for meta in volumes if meta["id"] == tracked["series"]]
                return planes(picked[0] if len(picked) else volumes[0])
            return [(meta, "axial", meta["label"]) for meta in volumes]

        def panels_grid(triples, study_id, per_row):
            # Panels of (series, plane, label) triples side by side, per_row per row
            panels = [
                SeriesPanel(series_id=meta["id"], plane=plane, study_id=study_id, label=label, key=meta["id"] + plane)
                for meta, plane, label in triples
            ]
            return div(*panels, style={**style, "gridTemplateColumns": f"repeat({min(len(panels), per_row)}, 1fr)"})

        @component
        def VolumeWidget():
            study_id, query_error = use_open_study()
            tracked = use_store_snapshot(state)
            if tracked["error"] or query_error:
                return div(ErrorBanner(error=tracked["error"] or query_error), style=style)
            if study_id is None:
                return div("No study selected", style={**style, "padding": "1em", "boxSizing": "border-box"})
            if tracked["volumes"] is None or tracked["study"] != study_id:
                return div(LoadingStatus(label="Opening the study"), style=style)
            return panels_grid(shown(tracked), study_id, 3 if tracked["layout"] == "orthogonal" else columns)

        def dock_panels():
            # Dock panels of the open study for the root Layout of a view, named by their layout and label so that a
            # panel the user moved keeps its place from one study to the next. In an arrangement a series goes in the
            # tab list of its anchor or of dock_anchor, where a status panel stands until a study opens. In the
            # orthogonal layout each series is a tab of dock_anchor showing its three planes, which share one panel
            # since the dock halves a cell at each split
            study_id, query_error = use_open_study()
            tracked = use_store_snapshot(state)
            if tracked["error"] or query_error or study_id is None or tracked["volumes"] is None:
                status = (
                    ErrorBanner(error=tracked["error"] or query_error)
                    if tracked["error"] or query_error
                    else "No study selected"
                    if study_id is None
                    else LoadingStatus(label="Opening the study")
                )
                return [
                    Panel(
                        div(status, style={"padding": "1em"}),
                        key="Volume",
                        place={"where": "last-tab", "of": dock_anchor},
                    )
                ]
            # The dock shows the tab it inserted last, so the first series of each anchor is inserted after the others,
            # at the front of its tab list
            layout = tracked["layout"]
            panels, firsts, names = [], [], []
            for meta in tracked["volumes"]:
                name = meta["label"]
                while name in names:
                    name = name + " +"
                names.append(name)
                if layout == "orthogonal":
                    content, anchor = panels_grid(planes(meta), study_id, 3), dock_anchor
                else:
                    content = SeriesPanel(series_id=meta["id"], plane="axial", study_id=study_id, key=meta["id"])
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
