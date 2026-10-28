"""
Server functions that send the volumes of a user loader to `AnnotatedVolume`, and helpers that fill the slices
between drawn outlines or turn outlines into voxel masks
"""

import zlib
from typing import Any, Callable, Dict, List, Sequence, Tuple

from pret.manager import BinaryPayload, function_identifier, server_only

# The browser converts frames to float textures, so we send these types as is and the others as float32
SENT_DTYPES = ("uint8", "int8", "uint16", "int16", "uint32", "int32", "float32")


def serve_volumes(loader: Callable[[Any], Dict[str, Any]]) -> Tuple[Callable, Callable]:
    """
    Wrap a volume loader into the two server functions used by `AnnotatedVolume`.

    The loader reads any format and returns one volume per id:

    ```python
    {
        "voxels": voxels,  # (k, j, i) or (frame, k, j, i), anything with shape, dtype and voxels[frame]
        "affine": affine,  # 4x4, maps (i, j, k, 1) to world millimetres in DICOM patient space (LPS)
        "frames": [{"label": "b50"}, {"label": "b800"}],  # optional, one per frame
        "window": [400, 800],  # optional default level and width
        "axis_letters": ["P", "L"],  # optional patient directions of the i and j axes, eg of a mammogram
    }
    ```

    Each call reloads the volume, so an expensive loader should be cached by the user, e.g. with
    `functools.lru_cache`. Memory-mapped, zarr, h5py or dask voxels only read the requested slices. Keep the stored
    type of the voxels, eg int16 for most MR series, since float32 doubles what the browser downloads.

    Parameters
    ----------
    loader
        Function from a volume id to the dict above, called on the server

    Returns
    -------
    describe
        `await describe(volume_id)` gives the volume metadata expected in the `volumes` prop of `AnnotatedVolume`
    load_slices
        `await load_slices(volume_id, frame, start, stop, step=1)` gives the slices `start:stop` of a frame as zlib
        compressed bytes, passed as the `load_slices` prop. Panels ask for a few slices at a time, nearest to their
        cursor first, with one row and column every `step` for volumes wider than the 3D textures of the GPU
    """
    import numpy as np

    def describe(volume_id):
        volume = loader(volume_id)
        voxels = volume["voxels"]
        dtype = np.dtype(voxels.dtype)
        frame_count = voxels.shape[0] if len(voxels.shape) == 4 else 1
        return {
            "id": volume_id,
            "shape": [int(size) for size in voxels.shape[-3:]],
            "dtype": dtype.name if dtype.name in SENT_DTYPES else "float32",
            "affine": np.asarray(volume["affine"], dtype=float).tolist(),
            "frames": volume.get("frames") or [{} for _ in range(frame_count)],
            "window": volume.get("window"),
            "axis_letters": volume.get("axis_letters"),
        }

    def load_slices(volume_id, frame, start, stop, step=1):
        voxels = loader(volume_id)["voxels"]
        data = np.asarray(voxels[frame, start:stop] if len(voxels.shape) == 4 else voxels[start:stop])
        data = data[:, ::step, ::step]
        if data.dtype.name not in SENT_DTYPES:
            data = data.astype(np.float32)
        data = np.ascontiguousarray(data)
        # Links to the notebook server can be slow (about 0.5 MB/s from home), and the fastest zlib level already
        # halves MR slices in a few milliseconds, so we compress every request and the browser inflates it
        meta = {"shape": list(data.shape), "dtype": data.dtype.name, "compression": "deflate"}
        return BinaryPayload(meta, [zlib.compress(memoryview(data).cast("B"), 1)])

    # Two calls with different loaders must not share server function ids, so we derive them from the loader
    prefix = f"metanno.volume:{function_identifier(loader)}"
    return server_only(describe, f"{prefix}:describe"), server_only(load_slices, f"{prefix}:load_slices")


def polygon_normal(points):
    """
    Unit normal of a polygon from the Newell sum of its edges, `points` being an (n, 3) array in millimetres
    """
    import numpy as np

    normal = np.cross(points, np.roll(points, -1, axis=0)).sum(axis=0)
    return normal / np.linalg.norm(normal)


def plane_basis(normal):
    """
    Two unit vectors that span the plane of `normal`, used to give polygons 2D coordinates within their plane
    """
    import numpy as np

    u = np.cross(normal, np.eye(3)[np.argmin(np.abs(normal))])
    u /= np.linalg.norm(u)
    return u, np.cross(normal, u)


def interpolate_contours(rows: List[Dict[str, Any]], pixel_size: float = 0.25) -> List[Dict[str, Any]]:
    """
    Outlines of the slices between the drawn outlines of an object, the default "Fill slices" function.

    Drawn outlines are grouped by plane orientation and by slice, a slice being `thickness` millimetres along the
    normal. For each pair of neighbouring drawn slices, eg 12 and 15, the outlines of each slice are filled into one
    image of `pixel_size` pixels, turned into signed distance maps, and slices 13 and 14 trace the zero level of the
    maps blended with weights 2/3 and 1/3 then 1/3 and 2/3. Outlines are never matched, so a lesion drawn as one
    region on a slice and two on the next narrows and splits on its own.

    Parameters
    ----------
    rows
        Shape rows of one object as passed to `AnnotatedVolume`, polygons with `points` and `thickness`. Points and
        rows marked `interpolated` are ignored
    pixel_size
        Size in millimetres of the pixels of the distance maps

    Returns
    -------
    List[Dict[str, Any]]
        New polygon rows without `id`, marked `interpolated`, with the other fields of the lower drawn outline
    """
    import numpy as np
    from scipy.ndimage import distance_transform_edt
    from skimage.draw import polygon as fill_polygon
    from skimage.measure import approximate_polygon, find_contours

    drawn = [row for row in rows if row["kind"] == "polygon" and not row.get("interpolated")]
    # Outlines with parallel planes, eg the axial outlines of a lesion apart from its sagittal ones
    groups = []
    for row in drawn:
        points = np.asarray(row["points"], dtype=float)
        normal = polygon_normal(points)
        group = next((group for group in groups if abs(normal @ group["normal"]) > 0.999), None)
        if group is None:
            group = {"normal": normal, "outlines": []}
            groups.append(group)
        group["outlines"].append((row, points))

    new_rows = []
    for group in groups:
        normal, outlines = group["normal"], group["outlines"]
        origin = np.concatenate([points for _, points in outlines]).mean(axis=0)
        u, v = plane_basis(normal)
        step = float(np.median([row["thickness"] for row, _ in outlines]))
        # Slices by index along the normal, with their outlines in pixel coordinates (column along u, row along v)
        flat = [(row, (points - origin) @ np.stack([u, v, normal]).T) for row, points in outlines]
        low = np.concatenate([coords[:, :2] for _, coords in flat]).min(axis=0) - 4 * pixel_size
        high = np.concatenate([coords[:, :2] for _, coords in flat]).max(axis=0) + 4 * pixel_size
        size = np.ceil((high - low) / pixel_size).astype(int) + 1
        # Slice indices count from the first drawn outline, which lies on a slice centre like the others
        start = flat[0][1][:, 2].mean()
        slices = {}
        for row, coords in flat:
            index = int(round((coords[:, 2].mean() - start) / step))
            slices.setdefault(index, []).append((row, coords))

        def distance_map(outlines):
            # Signed distance in millimetres to the filled outlines of one slice, negative inside
            mask = np.zeros((size[1], size[0]), dtype=bool)
            for _, coords in outlines:
                pixels = (coords[:, :2] - low) / pixel_size
                mask[fill_polygon(pixels[:, 1], pixels[:, 0], mask.shape)] = True
            return (distance_transform_edt(~mask) - distance_transform_edt(mask)) * pixel_size

        indices = sorted(slices)
        for first, last in zip(indices, indices[1:]):
            if last - first < 2:
                continue
            first_map, last_map = distance_map(slices[first]), distance_map(slices[last])
            first_depth = np.mean([coords[:, 2].mean() for _, coords in slices[first]])
            last_depth = np.mean([coords[:, 2].mean() for _, coords in slices[last]])
            source = {key: value for key, value in slices[first][0][0].items() if key != "id"}
            for index in range(first + 1, last):
                weight = (index - first) / (last - first)
                depth = first_depth + weight * (last_depth - first_depth)
                for contour in find_contours((1 - weight) * first_map + weight * last_map, 0):
                    # Closed contours repeat their first point, half a pixel keeps the traced shape
                    contour = approximate_polygon(contour, tolerance=0.5)[:-1]
                    if len(contour) < 3:
                        continue
                    flat_points = low + contour[:, ::-1] * pixel_size
                    points = origin + flat_points[:, :1] * u + flat_points[:, 1:] * v + depth * normal
                    new_rows.append({**source, "points": points.tolist(), "interpolated": True})
    return new_rows


def rasterize_shapes(
    rows: List[Dict[str, Any]], affine: Any, shape: Sequence[int], label_key: str = "object"
) -> Tuple[Any, List[Any]]:
    """
    Mask of the polygon slabs on a voxel grid, eg to save a segmentation as NIfTI or DICOM SEG.

    A voxel gets the label of a polygon when its centre lies inside the polygon slab, the polygon extruded by half
    its `thickness` on each side of its plane. Later rows overwrite earlier ones where slabs overlap.

    Parameters
    ----------
    rows
        Shape rows as passed to `AnnotatedVolume`, points are ignored
    affine
        4x4 matrix from voxel (i, j, k, 1) to world millimetres, as returned by the volume loader
    shape
        Grid shape (k, j, i)
    label_key
        Row field whose values become labels, numbered from 1 in order of first appearance

    Returns
    -------
    mask
        uint8 or uint16 array of `shape`, 0 outside every slab
    values
        `values[label - 1]` is the `label_key` value of each label
    """
    import numpy as np
    from skimage.measure import points_in_poly

    polygons = [row for row in rows if row["kind"] == "polygon"]
    values = list(dict.fromkeys(row.get(label_key) for row in polygons))
    mask = np.zeros(shape, dtype=np.uint8 if len(values) < 256 else np.uint16)
    affine = np.asarray(affine, dtype=float)
    inverse = np.linalg.inv(affine)
    for row in polygons:
        points = np.asarray(row["points"], dtype=float)
        normal = polygon_normal(points)
        half = row["thickness"] / 2
        # Voxel box around the slab, from the voxel positions of its corners
        corners = np.concatenate([points + half * normal, points - half * normal])
        ijk = corners @ inverse[:3, :3].T + inverse[:3, 3]
        low = np.maximum(np.floor(ijk.min(axis=0)).astype(int), 0)
        high = np.minimum(np.ceil(ijk.max(axis=0)).astype(int), np.array(shape[::-1]) - 1)
        if np.any(low > high):
            continue
        k, j, i = np.meshgrid(*[np.arange(low[axis], high[axis] + 1) for axis in (2, 1, 0)], indexing="ij")
        centres = np.stack([i, j, k], axis=-1) @ affine[:3, :3].T + affine[:3, 3]
        u, v = plane_basis(normal)
        offsets = centres - points[0]
        inside = np.abs(offsets @ normal) <= half
        flat = (points - points[0]) @ np.stack([u, v]).T
        inside[inside] = points_in_poly(offsets[inside] @ np.stack([u, v]).T, flat)
        mask[k[inside], j[inside], i[inside]] = values.index(row.get(label_key)) + 1
    return mask, values
