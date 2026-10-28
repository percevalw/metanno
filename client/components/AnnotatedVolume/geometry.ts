// World geometry of AnnotatedVolume panels. World positions are millimetres in DICOM patient space (LPS): x points to
// the patient left, y to the back and z to the head. Affines are row-major 4x4 matrices from voxel (i, j, k, 1) to
// world.

export type Vec3 = [number, number, number];
export type Mat3 = number[][];
export type Mat4 = number[][];
export type PlaneName = "axial" | "sagittal" | "coronal";

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: Vec3) => Math.sqrt(dot(a, a));
const unit = (a: Vec3) => scale(a, 1 / norm(a));

// Screen right, screen down and slice normal of each plane before rotation, in the radiological convention: the
// patient left is on the screen right, axial panels show the front at the top, sagittal panels the front on the left
const PLANE_AXES: Record<PlaneName, [Vec3, Vec3, Vec3]> = {
  axial: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  coronal: [
    [1, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ],
  sagittal: [
    [0, 1, 0],
    [0, 0, -1],
    [1, 0, 0],
  ],
};

export const voxelToWorld = (affine: Mat4, ijk: Vec3): Vec3 =>
  [0, 1, 2].map((r) => affine[r][0] * ijk[0] + affine[r][1] * ijk[1] + affine[r][2] * ijk[2] + affine[r][3]) as Vec3;

/**
 * Invert a voxel to world affine, used to sample textures and to snap the cursor to slice centres
 */
export function invertAffine(affine: Mat4): Mat4 {
  const [a, b, c] = affine;
  const det =
    a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  const m = [
    [(b[1] * c[2] - b[2] * c[1]) / det, (a[2] * c[1] - a[1] * c[2]) / det, (a[1] * b[2] - a[2] * b[1]) / det],
    [(b[2] * c[0] - b[0] * c[2]) / det, (a[0] * c[2] - a[2] * c[0]) / det, (a[2] * b[0] - a[0] * b[2]) / det],
    [(b[0] * c[1] - b[1] * c[0]) / det, (a[1] * c[0] - a[0] * c[1]) / det, (a[0] * b[1] - a[1] * b[0]) / det],
  ];
  const t: Vec3 = [a[3], b[3], c[3]];
  return [...m.map((row) => [...row, -dot(row as Vec3, t)]), [0, 0, 0, 1]];
}

const column = (affine: Mat4, idx: number): Vec3 => [affine[0][idx], affine[1][idx], affine[2][idx]];

/**
 * Rotation that aligns the planes with the voxel axes of a volume, so that panels show its acquired slices.
 *
 * For each world axis we take the voxel axis closest to it, with its sign, then make the three axes orthonormal and
 * right-handed. A slightly tilted axial series thus gives axial, coronal and sagittal planes tilted the same way.
 */
export function defaultOrientation(affine: Mat4): Mat3 {
  const axes = [0, 1, 2].map((idx) => unit(column(affine, idx)));
  const [x, y] = [0, 1].map((world) => {
    const best = axes.reduce((a, b) => (Math.abs(b[world]) > Math.abs(a[world]) ? b : a));
    return best[world] < 0 ? scale(best, -1) : best;
  });
  const ux = unit(x);
  const uy = unit(sub(y, scale(ux, dot(y, ux))));
  const uz = cross(ux, uy);
  // Columns are the rotated x, y and z axes
  return [0, 1, 2].map((r) => [ux[r], uy[r], uz[r]]);
}

/**
 * Screen right, screen down and normal of a panel in world coordinates, unit vectors
 */
export function planeAxes(orientation: Mat3, plane: PlaneName): [Vec3, Vec3, Vec3] {
  return PLANE_AXES[plane].map((axis) => [0, 1, 2].map((r) => dot(orientation[r] as Vec3, axis)) as Vec3) as [
    Vec3,
    Vec3,
    Vec3
  ];
}

// Opposite patient directions, to letter the far edge of a panel from the letters of a voxel axis, eg "FL" to "HR"
const OPPOSITE_LETTERS: Record<string, string> = { A: "P", P: "A", L: "R", R: "L", H: "F", F: "H" };

/**
 * Patient direction letter of a world direction, shown on panel edges. A volume placed in world space without its
 * patient geometry, eg a mammogram, gives the letters of its i and j axes like the DICOM PatientOrientation, eg
 * `["P", "L"]`, which letter the edges along these axes
 */
export function directionLetter(v: Vec3, affine?: Mat4, axisLetters?: string[] | null): string {
  for (let idx = 0; axisLetters && idx < 2; idx++) {
    const along = dot(unit(column(affine, idx)), unit(v));
    if (Math.abs(along) > 0.99)
      return along > 0 ? axisLetters[idx] : axisLetters[idx].replace(/./g, (c) => OPPOSITE_LETTERS[c] || c);
  }
  const axis = [0, 1, 2].reduce((a, b) => (Math.abs(v[b]) > Math.abs(v[a]) ? b : a));
  return (v[axis] > 0 ? "LPS" : "RAI")[axis];
}

/**
 * Pixel to world mapping of a panel, built from the view and the reference volume.
 *
 * `topLeft` is the world position of the top left corner, `right` and `down` the world steps of one CSS pixel.
 * The plane goes through the cursor, `center` only sets what is shown in the middle of the panel.
 */
export type PanelFrame = {
  topLeft: Vec3;
  right: Vec3;
  down: Vec3;
  normal: Vec3;
  mmPerPx: number;
  width: number;
  height: number;
};

export function panelFrame(
  axes: [Vec3, Vec3, Vec3],
  refAffine: Mat4,
  refShape: number[],
  cursor: Vec3,
  center: Vec3,
  zoom: number,
  width: number,
  height: number
): PanelFrame {
  const [u, v, n] = axes;
  // At zoom 1 the reference volume fits the panel, we measure its extent along the screen axes from its 8 corners
  const [nk, nj, ni] = refShape;
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((c) =>
    voxelToWorld(refAffine, [c & 1 ? ni - 0.5 : -0.5, c & 2 ? nj - 0.5 : -0.5, c & 4 ? nk - 0.5 : -0.5])
  );
  const extent = (axis: Vec3) => {
    const values = corners.map((corner) => dot(corner, axis));
    return Math.max(...values) - Math.min(...values);
  };
  const mmPerPx = Math.max(extent(u) / width, extent(v) / height) / zoom;
  const middle = add(center, scale(n, dot(sub(cursor, center), n)));
  const topLeft = sub(sub(middle, scale(u, (width / 2) * mmPerPx)), scale(v, (height / 2) * mmPerPx));
  return { topLeft, right: scale(u, mmPerPx), down: scale(v, mmPerPx), normal: n, mmPerPx, width, height };
}

export const screenToWorld = (frame: PanelFrame, x: number, y: number): Vec3 =>
  add(add(frame.topLeft, scale(frame.right, x)), scale(frame.down, y));

/**
 * Screen position of a world point and its distance to the panel plane in millimetres
 */
export function worldToScreen(frame: PanelFrame, cursor: Vec3, p: Vec3): [number, number, number] {
  const d = sub(p, frame.topLeft);
  const m2 = frame.mmPerPx * frame.mmPerPx;
  return [dot(d, frame.right) / m2, dot(d, frame.down) / m2, dot(sub(p, cursor), frame.normal)];
}

/**
 * Voxel axis of the reference volume most parallel to the normal, with the world distance between its slices along
 * the normal. Wheel steps and shape visibility use this distance.
 */
export function sliceAxis(refAffine: Mat4, normal: Vec3): { axis: number; spacing: number } {
  const steps = [0, 1, 2].map((idx) => column(refAffine, idx));
  const axis = [0, 1, 2].reduce((a, b) =>
    Math.abs(dot(unit(steps[b]), normal)) > Math.abs(dot(unit(steps[a]), normal)) ? b : a
  );
  return { axis, spacing: Math.abs(norm(steps[axis]) / dot(unit(steps[axis]), normal)) };
}

/**
 * Move the cursor along the normal to the centre of the reference slice `delta` slices away, without going past the
 * first or last slice. With `delta = 0` it only snaps the cursor to the nearest slice centre.
 */
export function stepCursor(
  refAffine: Mat4,
  invAffine: Mat4,
  refShape: number[],
  normal: Vec3,
  cursor: Vec3,
  delta: number
): Vec3 {
  const { axis, spacing } = sliceAxis(refAffine, normal);
  const voxel = voxelToWorld(invAffine, cursor)[axis];
  // A positive delta moves along the normal, which is the increasing or decreasing voxel index depending on its sign
  const direction = Math.sign(dot(column(refAffine, axis), normal));
  const last = refShape[2 - axis] - 1;
  const target = Math.min(last, Math.max(0, Math.round(voxel) + delta * direction));
  return add(cursor, scale(normal, (target - voxel) * direction * spacing));
}

/**
 * Unit normal of a polygon from the Newell sum of its edges, oriented by the order of its points
 */
export function polygonNormal(points: Vec3[]): Vec3 {
  return unit(points.reduce((sum, p, idx) => add(sum, cross(p, points[(idx + 1) % points.length])), [0, 0, 0]));
}

/**
 * Polygons where a panel plane cuts the slab of a polygon, the polygon extruded by half its thickness on each side of
 * its plane. Panels draw them for the polygons that do not lie within their slice.
 *
 * A panel plane meets the slab where the polygon lies closer to the panel plane than `|cos| * thickness / 2`, with
 * `cos` the cosine between both normals: the polygon is clipped to that strip, and each kept point slides along the
 * polygon normal onto the panel plane. A panel perpendicular to the polygon gives a zero width strip, so the line
 * where both planes meet is clipped by the polygon instead, and each segment inside it is widened across the slab.
 */
export function slabSection(points: Vec3[], thickness: number, origin: Vec3, normal: Vec3): Vec3[][] {
  const polygon = polygonNormal(points);
  const cos = dot(polygon, normal);
  // Degenerate polygons have a NaN normal
  if (Number.isNaN(cos)) return [];
  const depth = (p: Vec3) => dot(sub(p, origin), normal);
  if (Math.abs(cos) < 1e-6) {
    // Points where the edges cross the panel plane, ordered along the line where both planes meet, pair up into the
    // segments that lie inside the polygon
    const crossings: Vec3[] = [];
    points.forEach((p, idx) => {
      const next = points[(idx + 1) % points.length];
      if (depth(p) > 0 !== depth(next) > 0)
        crossings.push(add(p, scale(sub(next, p), depth(p) / (depth(p) - depth(next)))));
    });
    const direction = cross(polygon, normal);
    crossings.sort((a, b) => dot(a, direction) - dot(b, direction));
    const across = scale(polygon, thickness / 2);
    const quads: Vec3[][] = [];
    for (let idx = 0; idx + 1 < crossings.length; idx += 2) {
      const [a, b] = [crossings[idx], crossings[idx + 1]];
      quads.push([add(a, across), add(b, across), sub(b, across), sub(a, across)]);
    }
    return quads;
  }
  // Sutherland-Hodgman clipping by both sides of the strip, a concave polygon may keep zero width bridges along the
  // strip edges, which fill nothing
  const half = (Math.abs(cos) * thickness) / 2;
  let clipped = points;
  for (const side of [1, -1]) {
    const outside = (p: Vec3) => side * depth(p) - half;
    clipped = clipped.flatMap((p, idx) => {
      const next = clipped[(idx + 1) % clipped.length];
      const kept = outside(p) <= 0 ? [p] : [];
      if (outside(p) <= 0 !== outside(next) <= 0)
        kept.push(add(p, scale(sub(next, p), outside(p) / (outside(p) - outside(next)))));
      return kept;
    });
  }
  return clipped.length >= 3 ? [clipped.map((p) => sub(p, scale(polygon, depth(p) / cos)))] : [];
}

/**
 * Bring a point back inside the voxel centres of a volume, so that clicks, pans and zooms keep the scan in view
 */
export function clampToVolume(affine: Mat4, invAffine: Mat4, shape: number[], p: Vec3, keepDepth = false): Vec3 {
  const [i, j, k] = voxelToWorld(invAffine, p);
  const [nk, nj, ni] = shape;
  const clamp = (x: number, n: number) => Math.min(n - 1, Math.max(0, x));
  return voxelToWorld(affine, [clamp(i, ni), clamp(j, nj), keepDepth ? k : clamp(k, nk)]);
}

/**
 * Whether a volume of a single slice, eg a mammogram, lies parallel to a panel of normal `normal`. Such a projection
 * has no depth, so the panel shows it at every cursor depth, leaves the cursor depth to the other series of its view
 * and draws the shapes of every depth
 */
export function isProjection(affine: Mat4, shape: number[], normal: Vec3): boolean {
  return shape[0] === 1 && Math.abs(dot(unit(column(affine, 2)), unit(normal))) > 0.99;
}

/**
 * Indices of the screen points kept by Douglas-Peucker simplification, used to store a lasso path with only the
 * points that bend it by more than `tolerance` pixels
 */
export function simplifyPath(path: [number, number][], tolerance: number): number[] {
  const kept = new Set([0, path.length - 1]);
  const stack: [number, number][] = [[0, path.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const [ax, ay] = path[first];
    const [bx, by] = path[last];
    const length = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let farDistance = tolerance;
    for (let idx = first + 1; idx < last; idx++) {
      const [px, py] = path[idx];
      // Distance to the segment line, or to its first point when both ends are at the same place
      const distance =
        length > 0 ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length : Math.hypot(px - ax, py - ay);
      if (distance > farDistance) [far, farDistance] = [idx, distance];
    }
    if (far >= 0) {
      kept.add(far);
      stack.push([first, far], [far, last]);
    }
  }
  return [...kept].sort((a, b) => a - b);
}
