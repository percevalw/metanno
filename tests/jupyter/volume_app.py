"""
AnnotatedVolume panels linked by one view Store, on a synthetic tilted volume served by `serve_volumes`
"""

import numpy as np
from pret import component, create_store, use_state, use_store_snapshot
from pret.marshal import js
from pret.react import button, div

from metanno import AnnotatedVolume
from metanno.volume import serve_volumes


def load_phantom(volume_id):
    # An ellipsoid organ of value 400 over a background of 50, in 20 slices of 3 mm tilted by 8 degrees, the second
    # frame is twice as bright
    k, j, i = np.mgrid[0:20, 0:48, 0:48]
    organ = ((i - 24) / 18) ** 2 + ((j - 24) / 14) ** 2 + ((k - 10) / 8) ** 2 < 1
    voxels = np.where(organ, 400, 50).astype(np.int16)
    angle = np.deg2rad(8)
    affine = [
        [1, 0, 0, -24],
        [0, np.cos(angle), -3 * np.sin(angle), -24],
        [0, np.sin(angle), 3 * np.cos(angle), -30],
        [0, 0, 0, 1],
    ]
    return {"voxels": np.stack([voxels, voxels * 2]), "affine": affine, "frames": [{"label": "t0"}, {"label": "t1"}]}


describe, load_slices = serve_volumes(load_phantom)
PHANTOM = describe("phantom")
view = create_store({})
points = create_store([])


@component
def Viewer():
    tracked_view = use_store_snapshot(view)
    tracked_points = use_store_snapshot(points)
    mode, set_mode = use_state("move")
    tool, set_tool = use_state("point")
    selected, set_selected = use_state([])
    js.volumeView = tracked_view
    js.volumePoints = tracked_points
    js.volumeSelected = selected

    def on_view_change(patch):
        for key, value in patch.items():
            view[key] = value

    def on_mouse_select(modkeys, shapes):
        row = {"id": str(len(points))}
        for key, value in shapes[0].items():
            row[key] = value
        points.append(row)

    def on_shape_change(shape_id, new_points):
        for shape in points:
            if shape["id"] == shape_id:
                shape["points"] = new_points

    def on_click(shape_id, modkeys):
        set_selected([] if shape_id is None else [shape_id])

    def panel(plane):
        return AnnotatedVolume(
            volumes=[PHANTOM],
            load_slices=load_slices,
            layers=[{"volume": "phantom"}],
            plane=plane,
            view=tracked_view,
            shapes=tracked_points,
            mode=mode,
            tool=tool,
            selected=selected,
            on_view_change=on_view_change,
            on_mouse_select=on_mouse_select,
            on_shape_change=on_shape_change,
            on_click=on_click,
            style={"width": "300px", "height": "300px"},
        )

    return div(
        button("Edit" if mode == "move" else "Move", on_click=lambda event: set_mode("edit" if mode == "move" else "move")),
        button("Polygon", on_click=lambda event: set_tool("polygon")),
        button("Lasso", on_click=lambda event: set_tool("lasso")),
        div(panel("axial"), panel("sagittal"), style={"display": "flex", "gap": "8px"}),
    )
