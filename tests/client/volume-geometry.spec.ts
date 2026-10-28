import assert from "node:assert/strict";
import {
  clampToVolume,
  defaultOrientation,
  directionLetter,
  dot,
  invertAffine,
  isProjection,
  panelFrame,
  planeAxes,
  screenToWorld,
  simplifyPath,
  slabSection,
  sliceAxis,
  stepCursor,
  voxelToWorld,
  worldToScreen,
} from "../../client/components/AnnotatedVolume/geometry";
const { test } = require(process.env.PRET_TESTING_HELPER);

// Axial series of 30 slices of 3 mm with 0.5 mm pixels, tilted by 8 degrees around the x axis
const angle = (8 * Math.PI) / 180;
const AFFINE = [
  [0.5, 0, 0, -100],
  [0, 0.5 * Math.cos(angle), -3 * Math.sin(angle), -80],
  [0, 0.5 * Math.sin(angle), 3 * Math.cos(angle), 20],
  [0, 0, 0, 1],
];
const SHAPE = [30, 384, 384];
const close = (a: number[], b: number[]) =>
  a.forEach((x, idx) => assert.ok(Math.abs(x - b[idx]) < 1e-6, `${a} != ${b}`));

test("axial panels follow the tilt of the series and keep the radiological convention", () => {
  const [right, down, normal] = planeAxes(defaultOrientation(AFFINE), "axial");
  // The normal is the slice direction of the series, so panels show its acquired slices
  close(normal, [0, -Math.sin(angle), Math.cos(angle)]);
  close([dot(right, down), dot(right, normal), dot(down, normal)], [0, 0, 0]);
  assert.deepEqual([directionLetter(right), directionLetter(down)], ["L", "P"]);
  const [sagittalRight, sagittalDown] = planeAxes(defaultOrientation(AFFINE), "sagittal");
  assert.deepEqual([directionLetter(sagittalRight), directionLetter(sagittalDown)], ["P", "I"]);
});

test("screen and world positions convert both ways", () => {
  const axes = planeAxes(defaultOrientation(AFFINE), "coronal");
  const cursor = voxelToWorld(AFFINE, [100, 200, 12]);
  const frame = panelFrame(axes, AFFINE, SHAPE, cursor, cursor, 2, 400, 300);
  // The cursor is shown in the middle of the panel when it is also the view center
  close(worldToScreen(frame, cursor, cursor), [200, 150, 0]);
  const [x, y, depth] = worldToScreen(frame, cursor, screenToWorld(frame, 37, 251));
  close([x, y, depth], [37, 251, 0]);
});

test("slice steps land on the centres of the acquired slices", () => {
  const inv = invertAffine(AFFINE);
  const [, , normal] = planeAxes(defaultOrientation(AFFINE), "axial");
  assert.ok(Math.abs(sliceAxis(AFFINE, normal).spacing - 3) < 1e-9);
  const start = voxelToWorld(AFFINE, [100.3, 50.7, 12.4]);
  const snapped = voxelToWorld(inv, stepCursor(AFFINE, inv, SHAPE, normal, start, 0));
  close(snapped, [100.3, 50.7, 12]);
  const next = voxelToWorld(inv, stepCursor(AFFINE, inv, SHAPE, normal, start, 1));
  close(next, [100.3, 50.7, 13]);
  // Steps stop at the first and last of the 30 slices
  const last = voxelToWorld(inv, stepCursor(AFFINE, inv, SHAPE, normal, voxelToWorld(AFFINE, [10, 10, 29]), 1));
  close(last, [10, 10, 29]);
  const first = voxelToWorld(inv, stepCursor(AFFINE, inv, SHAPE, normal, voxelToWorld(AFFINE, [10, 10, 0]), -1));
  close(first, [10, 10, 0]);
});

test("clicks and pans outside the scan come back to its edge", () => {
  const inv = invertAffine(AFFINE);
  const outside = voxelToWorld(AFFINE, [-40, 200, 35]);
  close(voxelToWorld(inv, clampToVolume(AFFINE, inv, SHAPE, outside)), [0, 200, 29]);
});

test("lasso paths keep only the points that bend them", () => {
  // A square traced every pixel, with half a pixel of hand jitter on its edges
  const path: [number, number][] = [];
  for (let x = 0; x < 20; x++) path.push([x, x % 2 ? 0.3 : 0]);
  for (let y = 0; y < 20; y++) path.push([20, y]);
  for (let x = 20; x > 0; x--) path.push([x, 20]);
  for (let y = 20; y >= 0; y--) path.push([0, y]);
  const kept = simplifyPath(path, 0.5).map((idx) => path[idx]);
  assert.deepEqual(kept, [
    [0, 0],
    [20, 0],
    [20, 20],
    [0, 20],
    [0, 0],
  ]);
});

test("panels cut polygon slabs drawn in another orientation into bands", () => {
  // A U shaped axial outline 4 mm thick at z = 10, cut by the coronal plane y = 5 through both of its arms
  const outline: [number, number, number][] = [
    [0, 0, 10],
    [30, 0, 10],
    [30, 20, 10],
    [20, 20, 10],
    [20, 10, 10],
    [10, 10, 10],
    [10, 20, 10],
    [0, 20, 10],
  ];
  // Range of each quad along x, y and z
  const extents = (quads: number[][][]) =>
    quads
      .map((quad) => [0, 1, 2].map((axis) => quad.map((p) => p[axis])).map((v) => [Math.min(...v), Math.max(...v)]))
      .sort((a, b) => a[0][0] - b[0][0]);
  assert.deepEqual(extents(slabSection(outline, 4, [0, 5, 0], [0, 1, 0])), [
    [
      [0, 30],
      [5, 5],
      [8, 12],
    ],
  ]);
  const arms = extents(slabSection(outline, 4, [0, 15, 0], [0, 1, 0])).map(([x]) => x);
  assert.deepEqual(arms, [
    [0, 10],
    [20, 30],
  ]);
  // A plane tilted by 60 degrees from the outline crosses its slab over 4 / sin(60) mm, within the panel plane
  const tilted = [0, Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6)];
  const [band] = slabSection(outline, 4, [0, 5, 10], tilted as [number, number, number]);
  band.forEach((p) => assert.ok(Math.abs(dot([p[0], p[1] - 5, p[2] - 10], tilted as any)) < 1e-6));
  const [x, y, z] = extents([band])[0];
  assert.deepEqual(x, [0, 30]);
  assert.ok(Math.abs(Math.hypot(y[1] - y[0], z[1] - z[0]) - 4 / Math.sin(Math.PI / 3)) < 1e-6);
  // A plane 10 degrees from the outline keeps the part of a 2 mm slab within its slice, over cot(10) mm on both sides
  // of the line where both planes meet
  const angle = Math.PI / 18;
  const [part] = slabSection(outline, 2, [0, 10, 10], [0, -Math.sin(angle), Math.cos(angle)]);
  const reach = 1 / Math.tan(angle);
  close(extents([part])[0][1], [10 - reach, 10 + reach]);
  // A parallel plane cuts the whole outline inside the slab, and nothing past it
  assert.deepEqual(slabSection(outline, 4, [0, 0, 11], [0, 0, 1])[0].length, outline.length);
  assert.deepEqual(slabSection(outline, 4, [0, 0, 13], [0, 0, 1]), []);
});

test("edges along the axes of a volume without patient geometry take its axis letters", () => {
  // A left mammogram stored with its rows towards the back, flipped left to right to put its chest wall on the left
  const affine = [
    [-0.1, 0, 0, 200],
    [0, 0.1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  assert.equal(directionLetter([1, 0, 0], affine, ["P", "FL"]), "A");
  assert.equal(directionLetter([0, 1, 0], affine, ["P", "FL"]), "FL");
  assert.equal(directionLetter([0, -1, 0], affine, ["P", "FL"]), "HR");
  assert.equal(directionLetter([0, 0, 1], affine, ["P", "FL"]), "S");
  assert.equal(directionLetter([1, 0, 0]), "L");
});

test("single slice volumes are projections in the panels parallel to them", () => {
  const affine = [
    [0.1, 0, 0, 0],
    [0, 0.1, 0, 0],
    [0, 0, 1, 5],
    [0, 0, 0, 1],
  ];
  assert.equal(isProjection(affine, [1, 100, 80], [0, 0, 1]), true);
  assert.equal(isProjection(affine, [1, 100, 80], [0, 1, 0]), false);
  assert.equal(isProjection(affine, [2, 100, 80], [0, 0, 1]), false);
  // Clicks on a projection keep the cursor depth, the depth of the other series of its space
  const inside = clampToVolume(affine, invertAffine(affine), [1, 100, 80], [20, 3, 42], true);
  assert.deepEqual(
    inside.map((x) => Math.round(x * 1e6) / 1e6),
    [7.9, 3, 42]
  );
});
