"""
DataWidgetFactory volume views over two synthetic studies, with a studies table, a shapes table and the panels, and
the same studies shown without shapes
"""

import numpy as np
import pyarrow as pa
from pret import DataFrame, component, create_store, use_store_snapshot
from pret.marshal import js
from pret.react import div
from pret_simple_dock import Layout, Panel
from volume_app import load_phantom

from metanno import DataWidgetFactory
from metanno.recipes.data_widget_factory.widget_data import use_selected_rows
from metanno.volume import interpolate_contours

STUDIES = [{"study_uid": "s1", "patient": "A"}, {"study_uid": "s2", "patient": "B"}]
# Columns written by the volume widget, the points of a shape being a list of [x, y, z] lists
SHAPES = pa.schema(
    [
        ("id", pa.string()),
        ("study_uid", pa.string()),
        ("kind", pa.string()),
        ("points", pa.list_(pa.list_(pa.float64()))),
        ("thickness", pa.float64()),
        ("object", pa.string()),
        ("label", pa.string()),
        ("interpolated", pa.bool_()),
        ("style", pa.string()),
        ("space", pa.string()),
    ]
)


def list_series(study):
    # Study s1 has two series, s2 one
    return (
        [{"id": "s1-t2", "label": "T2"}, {"id": "s1-adc", "label": "ADC"}]
        if study["study_uid"] == "s1"
        else [{"id": "s2-t2", "label": "T2"}]
    )


def load_series(series_id):
    # The phantom, 100 mm to the left for study s2 so that its world positions differ from s1
    volume = load_phantom(series_id)
    if series_id == "s2-t2":
        volume["affine"] = np.add(volume["affine"], [[0, 0, 0, 100], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]])
    return volume


def make_viewer(view_store):
    """
    Studies table, volume panels and toolbar, and shapes table of a Store whose shapes are a list or a DataFrame,
    the shapes rows being shared with the browser checks as window.volumeShapes
    """
    view_factory = DataWidgetFactory(view_store)
    studies = view_factory.create_table_widget(
        store_key="studies", primary_key="study_uid", fields=[{"key": "study_uid", "kind": "text", "editable": False}]
    )
    shapes = view_factory.create_table_widget(
        store_key="shapes",
        primary_key="id",
        fields=[
            {"key": "kind", "kind": "text", "editable": False},
            {"key": "object", "kind": "text", "editable": False},
            {"key": "study_uid", "kind": "text", "editable": False},
        ],
    )
    toolbar, volume = view_factory.create_volume_widget(
        store_studies_key="studies",
        study_primary_key="study_uid",
        store_shapes_key="shapes",
        shapes_primary_key="id",
        series=list_series,
        loader=load_series,
        fill=interpolate_contours,
    )

    @component
    def Viewer():
        js.volumeShapes = use_selected_rows(view_store["shapes"], "id")[0]
        return div(
            div(studies, style={"height": "120px"}),
            div(
                div(volume, style={"height": "300px", "width": "900px"}),
                div(toolbar, style={"width": "260px"}),
                style={"display": "flex", "gap": "8px"},
            ),
            div(shapes, style={"height": "200px"}),
        )

    return view_factory, studies, Viewer


store = create_store({"studies": STUDIES, "shapes": []}, sync=True)
factory, studies, Viewer = make_viewer(store)
# The same view with the shapes in a DataFrame, as annotation copies of a recipe save them
dataframe_store = create_store({"studies": STUDIES, "shapes": DataFrame(SHAPES.empty_table())}, sync=True)
_, _, DataFrameViewer = make_viewer(dataframe_store)

# Without a shapes list the panels only show the series
browse_toolbar, browse_volume = factory.create_volume_widget(
    store_studies_key="studies", study_primary_key="study_uid", series=list_series, loader=load_series
)


@component
def Browser():
    return div(
        div(studies, style={"height": "120px"}),
        div(
            div(browse_volume, style={"height": "300px", "width": "900px"}),
            div(browse_toolbar, style={"width": "260px"}),
            style={"display": "flex", "gap": "8px"},
        ),
    )


# One study whose right series is in another space than its two left ones, like the views of a mammography, shown
# as tabs of the root dock of the view: the first left series lettered like a mammogram, the second a projection of
# its middle slice like a synthetic 2D view. A second arrangement stacks all of them as tabs of one cell
space_store = create_store({"studies": [{"study_uid": "s3"}], "shapes": []}, sync=True)
space_factory = DataWidgetFactory(space_store)
space_studies = space_factory.create_table_widget(
    store_key="studies", primary_key="study_uid", fields=[{"key": "study_uid", "kind": "text", "editable": False}]
)


def load_spaces(volume_id):
    volume = load_phantom(volume_id)
    if volume_id == "s3-l2":
        affine = np.array(volume["affine"], dtype=float)
        affine[:3, 3] += 10 * affine[:3, 2]
        return {**volume, "voxels": volume["voxels"][:, 10:11], "affine": affine.tolist()}
    return {**volume, "axis_letters": ["A", "FR"] if volume_id == "s3-l" else None}


space_toolbar, space_panels = space_factory.create_volume_widget(
    store_studies_key="studies",
    study_primary_key="study_uid",
    store_shapes_key="shapes",
    shapes_primary_key="id",
    series=lambda study: [
        {"id": "s3-r", "label": "R", "space": "r", "anchor": {"sides": "@R", "tabs": "@R"}},
        {"id": "s3-l", "label": "L", "space": "l", "anchor": {"sides": "@L", "tabs": "@R"}},
        {"id": "s3-l2", "label": "L2", "space": "l", "anchor": {"sides": "@L", "tabs": "@R"}},
    ],
    loader=load_spaces,
    layout="sides",
    arrangements=["sides", "tabs"],
    dock_anchor="@R",
)


@component
def Spaces():
    js.spaceShapes = use_store_snapshot(space_store["shapes"])
    return div(
        div(space_studies, style={"height": "120px"}),
        div(
            Layout(
                *space_panels(),
                Panel(space_toolbar, key="Toolbar"),
                default_config={
                    "kind": "row",
                    "children": [
                        {"tabs": ["@R"], "size": 35},
                        {"tabs": ["@L"], "size": 35},
                        {"tabs": ["Toolbar"], "size": 30},
                    ],
                },
            ),
            style={"height": "340px", "width": "900px"},
        ),
    )
