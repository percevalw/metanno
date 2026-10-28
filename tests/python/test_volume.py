import zlib

import numpy as np
import pytest

from metanno.volume import interpolate_contours, rasterize_shapes, serve_volumes

AFFINE = [[0.5, 0, 0, -10], [0, 0.5, 0, -20], [0, 0, 3, 5], [0, 0, 0, 1]]


@pytest.mark.parametrize(
    "voxels, frame, expected_dtype",
    [
        (np.arange(2 * 3 * 4, dtype=np.int16).reshape(2, 3, 4), 0, "int16"),
        (np.arange(5 * 2 * 3 * 4, dtype=np.float64).reshape(5, 2, 3, 4), 3, "float32"),
        (np.ones((2, 3, 4), dtype=bool), 0, "float32"),
    ],
)
def test_serve_volumes_sends_metadata_and_frames(voxels, frame, expected_dtype):
    describe, load_slices = serve_volumes(lambda volume_id: {"voxels": voxels, "affine": AFFINE})

    meta = describe("t2")
    frame_count = voxels.shape[0] if voxels.ndim == 4 else 1
    assert meta == {
        "id": "t2",
        "shape": [2, 3, 4],
        "dtype": expected_dtype,
        "affine": AFFINE,
        "frames": [{}] * frame_count,
        "window": None,
        "axis_letters": None,
    }

    payload = load_slices("t2", frame, 1, 2)
    assert payload.data == {"shape": [1, 3, 4], "dtype": expected_dtype, "compression": "deflate"}
    # The single zlib buffer holds the slices in C order, as the browser uploads them into the 3D texture
    expected = (voxels[frame] if voxels.ndim == 4 else voxels)[1:2]
    sent = np.frombuffer(zlib.decompress(payload.buffers[0]), dtype=expected_dtype).reshape(1, 3, 4)
    np.testing.assert_array_equal(sent, expected.astype(expected_dtype))


def test_serve_volumes_reads_slices_of_one_frame_of_a_memory_mapped_volume(tmp_path):
    voxels = np.lib.format.open_memmap(tmp_path / "dce.npy", mode="w+", dtype=np.uint16, shape=(3, 2, 3, 4))
    voxels[:] = np.arange(3, dtype=np.uint16)[:, None, None, None]
    frames = [{"label": "t0"}, {"label": "t1"}, {"label": "t2"}]
    describe, load_slices = serve_volumes(
        lambda volume_id: {"voxels": voxels, "affine": AFFINE, "frames": frames, "window": [1, 2]}
    )

    assert describe("dce")["frames"] == frames
    assert describe("dce")["window"] == [1, 2]
    assert set(np.frombuffer(zlib.decompress(load_slices("dce", 2, 0, 2).buffers[0]), dtype=np.uint16)) == {2}


def test_serve_volumes_keeps_one_row_and_column_every_step():
    voxels = np.arange(2 * 5 * 4, dtype=np.int16).reshape(2, 5, 4)
    describe, load_slices = serve_volumes(lambda volume_id: {"voxels": voxels, "affine": AFFINE})

    payload = load_slices("mg", 0, 0, 2, 2)
    assert payload.data["shape"] == [2, 3, 2]
    sent = np.frombuffer(zlib.decompress(payload.buffers[0]), dtype=np.int16).reshape(2, 3, 2)
    np.testing.assert_array_equal(sent, voxels[:, ::2, ::2])


def load_t2(volume_id):
    return {"voxels": np.zeros((1, 1, 1)), "affine": AFFINE}


def load_adc(volume_id):
    return {"voxels": np.ones((1, 1, 1)), "affine": AFFINE}


def test_serve_volumes_keeps_one_server_function_per_loader():
    from pret.manager import get_manager

    t2_describe, t2_load_slices = serve_volumes(load_t2)
    adc_describe, adc_load_slices = serve_volumes(load_adc)
    # The browser calls server functions by id, so each loader needs its own ids
    functions = list(get_manager().functions.values())
    assert all(fn in functions for fn in (t2_describe, t2_load_slices, adc_describe, adc_load_slices))


def circle(center, radius, u, v, count=64):
    angles = np.linspace(0, 2 * np.pi, count, endpoint=False)
    return (np.asarray(center) + radius * (np.cos(angles)[:, None] * u + np.sin(angles)[:, None] * v)).tolist()


def test_interpolate_contours_blends_drawn_slices():
    # Axial outlines of 3 mm slices tilted by 8 degrees, a 10 mm circle on slice 0 and a 4 mm one on slice 3
    angle = np.deg2rad(8)
    u = np.array([1, 0, 0])
    v = np.array([0, np.cos(angle), np.sin(angle)])
    normal = np.array([0, -np.sin(angle), np.cos(angle)])
    top = np.add([5, 5, 5], 9 * normal)
    rows = [
        {"id": "a", "kind": "polygon", "object": "L1", "thickness": 3, "points": circle([5, 5, 5], 10, u, v)},
        {"id": "b", "kind": "polygon", "object": "L1", "thickness": 3, "points": circle(top, 4, u, v)},
        {"id": "p", "kind": "point", "object": "L1", "points": [[5, 5, 5]]},
    ]

    new_rows = interpolate_contours(rows)

    fields = [(row["object"], row["thickness"], row["interpolated"], "id" in row) for row in new_rows]
    assert fields == [("L1", 3, True, False)] * 2
    for row, depth, radius in zip(new_rows, [3, 6], [8, 6]):
        offsets = np.asarray(row["points"]) - [5, 5, 5]
        assert np.allclose(offsets @ normal, depth)
        assert abs(np.linalg.norm(offsets - depth * normal, axis=1).mean() - radius) < 0.2


def test_interpolate_contours_splits_regions_and_keeps_other_planes_apart():
    u, v, normal = np.eye(3)
    rows = [
        {"id": "a", "kind": "polygon", "thickness": 2, "points": circle([0, 0, 0], 8, u, v)},
        {"id": "b", "kind": "polygon", "thickness": 2, "points": circle([-6, 0, 4], 3, u, v)},
        {"id": "c", "kind": "polygon", "thickness": 2, "points": circle([6, 0, 4], 3, u, v)},
        # A sagittal outline of the same object has no parallel outline to blend with
        {"id": "d", "kind": "polygon", "thickness": 2, "points": circle([0, 0, 2], 5, v, normal)},
        # Earlier interpolated rows are not used as drawn outlines
        {"id": "e", "kind": "polygon", "thickness": 2, "points": circle([0, 0, 2], 1, u, v), "interpolated": True},
    ]

    new_rows = interpolate_contours(rows)

    assert 1 <= len(new_rows) <= 2
    assert all(np.allclose(np.asarray(row["points"])[:, 2], 2) for row in new_rows)


def test_rasterize_shapes_labels_voxels_inside_slabs():
    # A square on slice k = 2 covering voxels i = 2 to 6 and j = 4 to 8, a triangle of another object on slice 4
    square = [[-9.1, -18.1, 11], [-6.9, -18.1, 11], [-6.9, -15.9, 11], [-9.1, -15.9, 11]]
    triangle = [[-10, -20, 17], [-5, -20, 17], [-10, -15, 17]]
    rows = [
        {"id": "a", "kind": "polygon", "object": "L1", "thickness": 3, "points": square},
        {"id": "b", "kind": "point", "object": "P", "points": [[-8, -17, 11]]},
        {"id": "c", "kind": "polygon", "object": "L2", "thickness": 3, "points": triangle},
    ]

    mask, values = rasterize_shapes(rows, AFFINE, (6, 12, 12))

    assert values == ["L1", "L2"]
    assert mask.dtype == np.uint8
    expected = np.zeros((6, 12, 12), dtype=np.uint8)
    expected[2, 4:9, 2:7] = 1
    assert np.array_equal(mask == 1, expected == 1)
    assert set(np.unique(np.nonzero(mask == 2)[0])) == {4}
