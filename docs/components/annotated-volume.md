# AnnotatedVolume {: #metanno.ui.AnnotatedVolume }

::: metanno.ui.AnnotatedVolume
    options:
        heading_level: 2
        show_bases: false
        show_source: false
        only_class_level: true

## Load volumes from Python

`serve_volumes` turns a loader into the `describe` and `load_slices` server functions of the panel. The loader reads
any format and returns the voxels with their affine in DICOM patient coordinates, eg for a DICOM series read with
`pydicom`:

```python
import functools
from pathlib import Path

import numpy as np
import pydicom

from metanno.volume import serve_volumes


@functools.lru_cache(maxsize=4)
def load_series(folder):
    slices = [pydicom.dcmread(path) for path in sorted(Path(folder).glob("*.dcm"))]
    row, col = np.array(slices[0].ImageOrientationPatient, dtype=float).reshape(2, 3)
    # Slices are sorted along the normal of the image plane, which gives the k axis
    normal = np.cross(row, col)
    slices.sort(key=lambda ds: np.dot(normal, np.array(ds.ImagePositionPatient, dtype=float)))
    origin = np.array(slices[0].ImagePositionPatient, dtype=float)
    step = np.array(slices[-1].ImagePositionPatient, dtype=float) - origin
    spacing_row, spacing_col = (float(x) for x in slices[0].PixelSpacing)
    affine = np.eye(4)
    # Columns of the affine are the world steps of i (along a row), j (along a column) and k (between slices)
    affine[:3, 0] = row * spacing_col
    affine[:3, 1] = col * spacing_row
    affine[:3, 2] = step / max(len(slices) - 1, 1)
    affine[:3, 3] = origin
    voxels = np.stack([ds.pixel_array for ds in slices])
    slope, intercept = float(slices[0].get("RescaleSlope", 1)), float(slices[0].get("RescaleIntercept", 0))
    # Stored values become physical values, eg Hounsfield units for CT. MR series usually need no change and keep
    # their int16 values, which download twice faster than float32
    if (slope, intercept) != (1, 0):
        voxels = (voxels * slope + intercept).astype(np.float32)
    return {"voxels": voxels, "affine": affine}


describe, load_slices = serve_volumes(load_series)
```

`describe(volume_id)` gives the metadata for the `volumes` prop, and `load_slices` is passed as is. A NIfTI file read
with `nibabel` has a RAS affine, the first two rows of `img.affine` are negated to get DICOM patient coordinates, and
its voxels are transposed from `(i, j, k)` to `(k, j, i)`.

## Annotate studies with DataWidgetFactory

`create_volume_widget` builds a view of a study from a Store: it shows the series of the study selected in a table,
and saves each drawn point or outline as a row of the shapes list, with the id of its study. Tables and forms of the
shapes share its selection, so selecting a row glides the panels onto its shape, and clicking a shape shows its fields
in a form:

```python { .no-exec }
from pret import create_store
from pret_joy import Divider, Stack
from pret_simple_dock import Layout, Panel

from metanno import DataWidgetFactory
from metanno.volume import interpolate_contours

store = create_store({"studies": [{"study_uid": "1.3.6.1.4", "patient": "A"}], "shapes": []}, sync="prostate.pret")
factory = DataWidgetFactory(store)


def list_series(study):
    # Series folders of a study, as read by load_series above
    folder = f"dicom/{study['study_uid']}"
    return [{"id": f"{folder}/t2", "label": "T2"}, {"id": f"{folder}/adc", "label": "ADC"}]


studies = factory.create_table_widget(store_key="studies", primary_key="study_uid", fields=[])
toolbar, volume = factory.create_volume_widget(
    store_studies_key="studies",
    study_primary_key="study_uid",
    store_shapes_key="shapes",
    shapes_primary_key="id",
    series=list_series,
    loader=load_series,
    fill=interpolate_contours,
)
shapes = factory.create_table_widget(store_key="shapes", primary_key="id", fields=[{"key": "object", "kind": "text"}])
form = factory.create_form_widget(
    store_key="shapes", primary_key="id", fields=[{"key": "score", "kind": "select", "options": ["1", "2", "3", "4", "5"]}]
)
Layout(
    Panel(studies, key="Studies"),
    Panel(volume, key="Volume"),
    Panel(shapes, key="Shapes"),
    # The toolbar is a column of labelled controls, made for a side panel above the form of the selected shape
    Panel(Stack(toolbar, Divider(), form, spacing=2, sx={"m": "10px"}), key="Info"),
)
```

The toolbar switches between the axial, coronal and sagittal planes of one series and one axial panel per series,
between moving and drawing, and between the point, polygon and lasso tools. Outlines belong to the current object
of the toolbar, eg `L1`, which "New object" changes and a click on an outline picks. A drawn outline is saved as:

```python
{"id": "3f2a...", "study_uid": "1.3.6.1.4", "kind": "polygon", "object": "L1", "label": "L1", "thickness": 3.0, "points": [[1.2, -9.4, 0.5], ...]}
```

The shapes can also be a DataFrame with these columns, `points` being a list of `[x, y, z]` lists, so that the
`.pret` file of an annotation keeps them as a table next to the studies. Without `store_shapes_key`, the toolbar only
switches the layout and the series, eg to browse the studies of a DataFrame read from a database before choosing the
ones to annotate.

All the series of a study share one cursor, zoom and pan, which suits the MRI or CT series of one exam. Images taken
in different positions, eg the four views of a mammography, should not move together: a `space` key in the items
returned by `series` groups the series that do, eg by their DICOM frame of reference. Shapes drawn on a series with a
`space` keep it as a `space` field, so they only show on the series of that space.

Many series do not fit one grid of panels. With `dock_anchor`, each series is instead a tab of the dock of the view,
in the cell of its `anchor`: the cells are anchor tabs of `default_config`, starting with `@`, which only show once a
series is in them. The second value returned is then a function giving the panels of the open study, called where the
dock is rendered, and a panel moved by the user keeps its place for the next studies since panels are named by their
label:

```python { .no-exec }
from pret import component


def list_series(study):
    # The 2D view of each breast, then its tomosynthesis in the same space and cell, the right breast on the left
    return [
        {"id": "rcc-2d", "label": "R CC", "space": "1.2.840.1", "anchor": "@right"},
        {"id": "lcc-2d", "label": "L CC", "space": "1.2.840.2", "anchor": "@left"},
        {"id": "rcc-tomo", "label": "R CC tomosynthesis", "space": "1.2.840.1", "anchor": "@right"},
        {"id": "lcc-tomo", "label": "L CC tomosynthesis", "space": "1.2.840.2", "anchor": "@left"},
    ]


toolbar, volume_panels = factory.create_volume_widget(
    store_studies_key="studies",
    study_primary_key="study_uid",
    series=list_series,
    loader=load_series,
    layout="sequence",
    dock_anchor="@right",
)


@component
def View():
    return Layout(
        *volume_panels(),
        Panel(studies, key="Studies"),
        Panel(toolbar, key="Toolbar"),
        default_config={
            "kind": "column",
            "children": [
                {"kind": "row", "size": 70, "children": [{"tabs": ["@right"]}, {"tabs": ["@left"]}]},
                {"kind": "row", "size": 30, "children": [{"tabs": ["Studies"]}, {"tabs": ["Toolbar"]}]},
            ],
        },
    )
```

The first series of a cell is the tab shown, the others are one click away or dragged next to it to compare them. In
the orthogonal layout each series is a tab of `dock_anchor` showing its three planes. `arrangements` names several ways
to place the series, offered next to the orthogonal layout in the toolbar, and an `anchor` can then give the cell of
the series in each of them, eg `{"pairs": "@right", "tomosynthesis": "@right-tomo"}`.

A series of a single slice, like a mammogram or the synthetic 2D view of a tomosynthesis, has no depth: the panels
parallel to it show it whatever the cursor depth, and their wheel and clicks keep the depth set by the other series of
its space. Volumes placed in world space without their patient geometry, like these mammograms, can give the patient
directions of their voxel axes as `axis_letters` in the loader dict, eg `["P", "L"]`, which letter the panel edges.

## Fill the slices between outlines

A lesion is usually outlined on a few slices only, eg 12, 15 and 18. `interpolate_contours` takes the rows of one
object and returns outlines for the slices in between, blended from the signed distance maps of the drawn outlines.
Outlines are never matched, so a lesion drawn as one region on a slice and two on the next narrows and splits on its
own. The new rows are guesses to check and edit like the others, so they carry `interpolated: True`, eg to give them
a fainter style. `create_volume_widget(fill=interpolate_contours)` shows a "Fill slices" button for the current
object, and a view built by hand can run it on the server and replace the earlier filled slices of the lesion:

```python
from pret.manager import server_only
from pret.store import transact

from metanno.volume import interpolate_contours

fill_slices = server_only(interpolate_contours)


async def on_fill(event):
    new_rows = await fill_slices([row for row in store["shapes"] if row["object"] == "L1"])
    # Edits made after an await are grouped into one Store op by a transaction
    with transact(store):
        for idx in range(len(store["shapes"]) - 1, -1, -1):
            if store["shapes"][idx]["object"] == "L1" and store["shapes"][idx]["interpolated"]:
                store["shapes"].pop(idx)
        for idx, row in enumerate(new_rows):
            row["id"] = "L1-fill-" + str(idx)
            store["shapes"].append(row)
```

A filled row keeps the fields of the drawn outline below it:

```python
{"kind": "polygon", "object": "L1", "label": "L1", "thickness": 3.0, "points": [[1.2, -9.4, 0.5], ...], "interpolated": True}
```

## Export masks

`rasterize_shapes` turns outlines into a mask on the grid of a volume, eg to save a segmentation as NIfTI. A voxel
gets the label of an outline when its centre lies inside the outline slab:

```python
from metanno.volume import rasterize_shapes

volume = load_series("t2")
mask, values = rasterize_shapes(store["shapes"], volume["affine"], volume["voxels"].shape[-3:], label_key="object")
# mask has the (k, j, i) shape of the voxels, label n is values[n - 1], eg "L1"
```

Both functions need `scipy` and `scikit-image`, installed with `pip install "metanno[volume]"`.
