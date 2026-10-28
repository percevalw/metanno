// Browser cache and download scheduler of volume slices, shared by every AnnotatedVolume panel of the page. Frames
// are too large for Stores, so panels keep volume ids and frame indices in their props and read voxels from here.
//
// Panels say which frames they show and where their cursor is, and which other volumes they may show next. The
// scheduler asks the server for small groups of slices, two requests at a time: the cursor slices of the shown
// frames, then a preview of every volume with one voxel every 2, 4 or more along each axis, then the full slices of
// the shown frames spread over the whole volume, then those of the other volumes, eg the series of a study in hidden
// tabs. Since queued slices are only requested when their turn comes, a panel that changes volume simply stops asking
// for the old ones.

import { VolumeMeta } from "../../types";
import { invertAffine, Vec3, voxelToWorld } from "./geometry";

export type SliceBytes = {
  shape: number[];
  dtype: string;
  bytes: Uint8Array;
  compression?: "deflate" | "shuffle-deflate";
};
export type LoadSlices = (
  volumeId: string,
  frame: number,
  start: number,
  stop: number,
  step?: number,
  stride?: number
) => Promise<SliceBytes>;

/**
 * One 3D frame of a volume in (k, j, i) order, filled as its slices arrive, `loaded` flagging the received slices.
 * Above PREVIEW_VOXELS, `preview` holds the frame with one voxel every `factor` along each axis, received before the
 * full slices and drawn where they are missing, its slices flagged in `previewLoaded` at the index of the full slice
 * they come from. `low` and `high` are value percentiles of the first received values, used as the default window
 */
export type VolumeFrame = {
  key: string;
  shape: number[];
  data: any;
  loaded: Uint8Array;
  loadedCount: number;
  factor: number;
  previewShape: number[];
  preview: any;
  previewLoaded: Uint8Array;
  low: number;
  high: number;
};

/**
 * A frame shown by a panel, with order 0 and the world cursor that sets which slices come first, or a volume that the
 * panel may show next, with its position among the panel volumes as order and no cursor, loaded from its middle slice
 */
export type Want = {
  meta: VolumeMeta;
  frame: number;
  order: number;
  cursor?: Vec3;
  loadSlices: LoadSlices;
  onLoad?: () => void;
};

// Slices start, start + stride... below stop, of the preview or at full size
export type SliceRequest = {
  volumeId: string;
  frame: number;
  preview: boolean;
  start: number;
  stop: number;
  stride: number;
};

const TYPED_ARRAYS: Record<string, any> = {
  uint8: Uint8Array,
  int8: Int8Array,
  uint16: Uint16Array,
  int16: Int16Array,
  uint32: Uint32Array,
  int32: Int32Array,
  float32: Float32Array,
};
// Two requests keep the link busy, one is downloading while the server prepares the other. More would only wait in
// the websocket and could not be dropped when the cursor or the volume changes
const MAX_IN_FLIGHT = 2;
// Requests are sized to last about half a second, a few slices on a slow link and much of a volume on a fast one
const TARGET_MS = 500;

// A frame above this many voxels first loads a preview with one voxel every 2, 4, 8... along each axis, the smallest
// factor that fits, eg 195 x 128 x 128 voxels for 778 CT slices of 512 x 512, ie a few seconds on a slow link
const PREVIEW_VOXELS = 2 ** 22;

// Bytes of the volumes that no panel shows but that stay loaded, eg about seven CT series of 512 x 512 x 500 int16
// voxels: the volumes that panels may show next, then the volumes shown most recently. The others are dropped, or
// not loaded at all.
const KEPT_BYTES = 2 * 2 ** 30;

const frames = new Map<string, VolumeFrame>();
// Slices on their way of each frame, full slices then preview slices
const inFlight = new Map<string, Uint8Array[]>();
const failed = new Set<string>();
const panels = new Map<object, Want[]>();
const lastServed = new Map<string, number>();
// Order in which the volumes were last shown, the volumes no panel shows being dropped oldest first
const lastShown = new Map<string, number>();
let shownCount = 0;
// Volumes that no panel shows and that fit in KEPT_BYTES, set by setWants
let kept = new Set<string>();
const releaseListeners: ((key: string) => void)[] = [];
let running = 0;
let served = 0;
let groupVoxels = 1 << 18;
let pumpQueued = false;

export const frameKey = (volumeId: string, frame: number) => `${volumeId}\u0000${frame}`;
const frameVolume = (key: string) => key.split("\u0000")[0];

/**
 * Voxels kept along each axis by the preview of a frame of this shape, 1 for a frame loaded at full size directly
 */
export function previewFactor(shape: number[]) {
  let factor = 1;
  while (shape.reduce((total, size) => total * Math.ceil(size / factor), 1) > PREVIEW_VOXELS) factor *= 2;
  return factor;
}

/**
 * Level of a slice in the order that halves the gaps between loaded slices: 0 for the middle slice, 1 for the slices
 * at the largest power of 2 from it within the volume, 2 for the slices halfway between, and so on. `spacing` is
 * the distance between two slices of the level on the same side, which planRequest requests together
 */
export function sliceLevel(slice: number, nk: number) {
  const middle = Math.floor((nk - 1) / 2);
  const distance = Math.abs(slice - middle);
  if (!distance) return { level: 0, spacing: 1 };
  let largest = 1;
  while (largest * 2 <= Math.max(middle, nk - 1 - middle)) largest *= 2;
  // Largest power of 2 dividing the distance
  const power = distance & -distance;
  return { level: Math.log2(largest / power) + 1, spacing: 2 * power };
}

/**
 * Metadata of a volume as the panels hold it. A volume wider than `maxSize`, the 3D texture limit of the GPU (2048
 * on many laptops, below a 4096 x 3328 mammogram), keeps one row and column every `step`, its affine scaled to
 * match, and its slices are requested with that step
 */
export function fitVolume(meta: VolumeMeta, maxSize: number): VolumeMeta {
  const [nk, nj, ni] = meta.shape;
  const step = Math.ceil(Math.max(nj, ni) / maxSize);
  if (step <= 1) return meta;
  return {
    ...meta,
    shape: [nk, Math.ceil(nj / step), Math.ceil(ni / step)],
    // Voxel (0, 0, k) keeps its centre, the i and j columns of the affine span `step` voxels
    affine: meta.affine.map((row) => row.map((value, col) => (col < 2 ? value * step : value))),
    step,
  };
}

/**
 * Register a callback called with the key of each frame that no panel shows any more, used by the renderer to free
 * its textures, which it uploads again from the frame if a panel shows it again
 */
export function onFrameRelease(listener: (key: string) => void) {
  releaseListeners.push(listener);
}

/**
 * Return a frame with at least one received slice, or null
 */
export function getFrame(volumeId: string, frame: number) {
  const entry = frames.get(frameKey(volumeId, frame));
  return entry && (entry.loadedCount > 0 || entry.preview) ? entry : null;
}

const compareRanks = (a: number[], b: number[]) => a.map((x, idx) => x - b[idx]).find((d) => d !== 0) || 0;

/**
 * Pick the next group of slices to request, or null when every wanted slice is loaded or requested.
 *
 * 1. Each volume proposes its most urgent slice, of its preview or at full size, ranked by
 *    - the cursor slice of the frames that panels show, unless it is larger than half their preview, eg for a
 *      mammogram, then it comes right after the previews,
 *    - then the preview of the frames that panels show or may show next, or their full slices when they have no
 *      preview,
 *    - then the full slices of these frames in the order of sliceLevel, so that the whole volume sharpens evenly,
 *    - then the other frames, eg the other b-values of a diffusion series,
 *    and within these by the order of the wants and the distance to the cursor slice.
 * 2. The most urgent proposal wins, ties go to the volume served least recently, so that every panel shows its
 *    cursor slice early.
 * 3. The group extends that slice away from the cursor with the next slices of the same rank, up to `groupVoxels`
 *    voxels.
 */
export function planRequest(
  wants: { meta: VolumeMeta; frame: number; order: number; slice: number }[],
  busy: (volumeId: string, frame: number, preview: boolean, slice: number) => boolean,
  groupVoxels: number,
  lastServed: Map<string, number>
): SliceRequest | null {
  // 1. Most urgent free slice of each want, ranked by [stage, order, frame distance, preview first, level, distance]
  let best = null;
  for (const want of wants) {
    const { meta } = want;
    const [nk, nj, ni] = meta.shape;
    const factor = previewFactor(meta.shape);
    const previewVoxels = meta.shape.reduce((total, size) => total * Math.ceil(size / factor), 1);
    const cursorFirst = factor === 1 || 2 * nj * ni <= previewVoxels;
    const rankOf = (frame: number, preview: boolean, slice: number) => {
      const distance = Math.abs(slice - want.slice);
      const level = preview || factor === 1 ? 0 : sliceLevel(slice, nk).level;
      if (frame !== want.frame) return [3, want.order, Math.abs(frame - want.frame), preview ? 0 : 1, level, distance];
      if (want.order === 0 && !preview && !distance) return cursorFirst ? [0, 0, 0, 0, 0, 0] : [2, 0, 0, 0, -1, 0];
      return [preview || factor === 1 ? 1 : 2, want.order, 0, 0, level, distance];
    };
    for (let frame = 0; frame < meta.frames.length; frame++) {
      for (const preview of factor > 1 ? [true, false] : [false]) {
        for (let slice = 0; slice < nk; slice += preview ? factor : 1) {
          if (busy(meta.id, frame, preview, slice)) continue;
          const rank = rankOf(frame, preview, slice);
          const order = best ? compareRanks(rank, best.rank) : -1;
          // 2. Ties between volumes go to the one served least recently
          const older = order === 0 && (lastServed.get(meta.id) || 0) < (lastServed.get(best.meta.id) || 0);
          if (order < 0 || older) best = { meta, frame, preview, slice, from: want.slice, factor, rank, rankOf };
        }
      }
    }
  }
  if (!best) return null;

  // 3. Free slices of the same rank but for their distance, away from the cursor, so that the next request continues
  // where this one stops
  const { meta, frame, preview, slice, factor } = best;
  const [nk, nj, ni] = meta.shape;
  const size = Math.max(1, Math.floor((groupVoxels * (preview ? factor * factor : 1)) / (nj * ni)));
  const stride = preview ? factor : best.rank[0] === 1 || best.rank[4] <= 0 ? 1 : sliceLevel(slice, nk).spacing;
  const direction = slice >= best.from ? 1 : -1;
  let end = slice;
  while (Math.abs(end - slice) / stride + 1 < size) {
    const next = end + direction * stride;
    if (next < 0 || next >= nk || busy(meta.id, frame, preview, next)) break;
    if (compareRanks(best.rankOf(frame, preview, next).slice(0, 5), best.rank.slice(0, 5)) !== 0) break;
    end = next;
  }
  return {
    volumeId: meta.id,
    frame,
    preview,
    start: Math.min(slice, end),
    stop: Math.max(slice, end) + 1,
    stride,
  };
}

const busy = (volumeId: string, frame: number, preview: boolean, slice: number) => {
  const key = frameKey(volumeId, frame);
  const entry = frames.get(key);
  const received = preview ? entry?.previewLoaded : entry?.loaded;
  return failed.has(key) || !!received?.[slice] || !!inFlight.get(key)?.[preview ? 1 : 0][slice];
};

const allWants = () => [...panels.values()].flat();
// Wants that the scheduler loads: the shown frames, and the volumes to show next that fit in KEPT_BYTES
const servedWants = () => allWants().filter((want) => want.order === 0 || kept.has(want.meta.id));

/**
 * Store the slices of a response in their frame, creating the frame on its first slices, then redraw the panels
 * showing that volume
 */
async function receiveSlices(request: SliceRequest, meta: VolumeMeta, payload: SliceBytes) {
  let bytes = payload.bytes;
  const TypedArray = TYPED_ARRAYS[payload.dtype];
  if (payload.compression) {
    const inflated = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"));
    bytes = new Uint8Array(await new Response(inflated).arrayBuffer());
  }
  if (payload.compression === "shuffle-deflate") {
    // The 1st bytes of every value come first, then the 2nd ones and so on, so we put the bytes of each value back
    // together
    const size = TypedArray.BYTES_PER_ELEMENT;
    const count = bytes.length / size;
    const unshuffled = new Uint8Array(bytes.length);
    for (let byte = 0; byte < size; byte++) {
      for (let idx = 0; idx < count; idx++) unshuffled[idx * size + byte] = bytes[byte * count + idx];
    }
    bytes = unshuffled;
  } else if (!payload.compression) {
    // Uncompressed bytes of the standalone transport can start at any offset, typed views need a multiple of their
    // element size
    bytes = bytes.slice();
  }
  // A panel may have dropped the volume while its slices were on their way
  if (!servedWants().some((want) => want.meta.id === meta.id)) return;
  const values = new TypedArray(bytes.buffer, bytes.byteOffset, bytes.byteLength / TypedArray.BYTES_PER_ELEMENT);
  const key = frameKey(meta.id, request.frame);
  const [nk, nj, ni] = meta.shape;
  let entry = frames.get(key);
  if (!entry) {
    // 1st and 99th percentiles of the first values, so that a few very bright voxels do not wash out the image. MR
    // volumes often fill the area outside the scanned field with 0, so we leave zeros out when other values exist
    const stride = Math.max(1, Math.floor(values.length / 100000));
    const all = new Float64Array(Math.ceil(values.length / stride));
    for (let idx = 0; idx < all.length; idx++) all[idx] = values[idx * stride];
    const nonZero = all.filter((value) => value !== 0);
    const sample = nonZero.length ? nonZero : all;
    sample.sort();
    const low = sample[Math.floor(sample.length * 0.01)];
    const high = sample[Math.floor(sample.length * 0.99)];
    const factor = previewFactor(meta.shape);
    entry = {
      key,
      shape: meta.shape,
      data: null,
      loaded: new Uint8Array(nk),
      loadedCount: 0,
      factor,
      previewShape: meta.shape.map((size) => Math.ceil(size / factor)),
      preview: null,
      previewLoaded: new Uint8Array(nk),
      low,
      high: high > low ? high : low + 1,
    };
    frames.set(key, entry);
  }
  // The full data is only allocated with its first slice, as the previews of the hidden volumes come first
  const [pk, pj, pi] = entry.previewShape;
  const sliceVoxels = request.preview ? pj * pi : nj * ni;
  if (request.preview) entry.preview ||= new TypedArray(pk * sliceVoxels);
  else entry.data ||= new TypedArray(nk * sliceVoxels);
  for (let idx = 0, slice = request.start; slice < request.stop; idx++, slice += request.stride) {
    const received = values.subarray(idx * sliceVoxels, (idx + 1) * sliceVoxels);
    if (request.preview) {
      entry.preview.set(received, (slice / entry.factor) * sliceVoxels);
      entry.previewLoaded[slice] = 1;
    } else {
      entry.data.set(received, slice * sliceVoxels);
      entry.loadedCount += entry.loaded[slice] ? 0 : 1;
      entry.loaded[slice] = 1;
    }
  }
  allWants()
    .filter((want) => want.meta.id === meta.id)
    .forEach((want) => want.onLoad?.());
}

/**
 * Start requests until two are in flight or nothing is left to load
 */
function pump() {
  while (running < MAX_IN_FLIGHT) {
    const wants = servedWants();
    const request = planRequest(
      wants.map((want) => {
        // Slice of the volume that the cursor goes through along its acquisition axis, or its middle slice
        const nk = want.meta.shape[0];
        const k = want.cursor ? voxelToWorld(invertAffine(want.meta.affine), want.cursor)[2] : (nk - 1) / 2;
        return { ...want, slice: Math.min(nk - 1, Math.max(0, Math.round(k))) };
      }),
      busy,
      groupVoxels,
      lastServed
    );
    if (!request) return;
    const want = wants.find((want) => want.meta.id === request.volumeId);
    const key = frameKey(request.volumeId, request.frame);
    const nk = want.meta.shape[0];
    if (!inFlight.has(key)) inFlight.set(key, [new Uint8Array(nk), new Uint8Array(nk)]);
    const markInFlight = (value: number) => {
      for (let slice = request.start; slice < request.stop; slice += request.stride)
        inFlight.get(key)[request.preview ? 1 : 0][slice] = value;
    };
    markInFlight(1);
    lastServed.set(request.volumeId, ++served);
    running++;
    const started = performance.now();
    // A preview keeps one row and column every `factor` of the rows and columns that the panels keep. The step and
    // stride are only passed when needed, so that load_slices functions written for full size volumes keep working
    const factor = request.preview ? previewFactor(want.meta.shape) : 1;
    const step = (want.meta.step || 1) * factor;
    const extra = request.stride > 1 ? [step, request.stride] : step > 1 ? [step] : [];
    want
      .loadSlices(request.volumeId, request.frame, request.start, request.stop, ...extra)
      .then((payload) => {
        // The next requests aim at TARGET_MS from the speed of this one
        const [, nj, ni] = want.meta.shape;
        const count = Math.ceil((request.stop - request.start) / request.stride);
        const voxelsPerMs = (count * nj * ni) / (factor * factor) / Math.max(1, performance.now() - started);
        groupVoxels = Math.min(1 << 23, Math.max(1 << 15, voxelsPerMs * TARGET_MS));
        return receiveSlices(request, want.meta, payload);
      })
      .catch((error) => {
        failed.add(key);
        console.error(`Could not load slices ${request.start}:${request.stop} of volume ${request.volumeId}`, error);
      })
      .finally(() => {
        if (inFlight.has(key)) markInFlight(0);
        running--;
        pump();
      });
  }
}

/**
 * Volumes that no panel shows and that stay in memory within `keptBytes`: first the volumes that panels may show
 * next, in their order and at their full size since they keep loading, then the volumes loaded earlier, the ones
 * shown most recently first. A volume that does not fit is skipped. Used by setWants with KEPT_BYTES.
 */
export function keptVolumes(
  idle: { id: string; order: number; bytes: number; lastShown: number }[],
  keptBytes: number
): Set<string> {
  const kept = new Set<string>();
  let total = 0;
  for (const volume of [...idle].sort((a, b) => a.order - b.order || b.lastShown - a.lastShown)) {
    if (total + volume.bytes > keptBytes) continue;
    total += volume.bytes;
    kept.add(volume.id);
  }
  return kept;
}

/**
 * Replace the wants of a panel, ie the frames it shows and the volumes it may show next, and request the slices they
 * miss. A panel passes no wants when it unmounts. The volumes that no panel shows any more free their textures at
 * once but, like the volumes to show next, stay here within KEPT_BYTES, so that showing them only uploads them to the
 * GPU.
 */
export function setWants(panel: object, wants: Want[]) {
  const shownVolumes = () =>
    new Set(
      allWants()
        .filter((want) => want.order === 0)
        .map((want) => want.meta.id)
    );
  const before = shownVolumes();
  if (wants.length) panels.set(panel, wants);
  else panels.delete(panel);
  const shown = shownVolumes();
  // The volumes shown until now or from now on become the most recently shown
  for (const id of new Set([...before, ...shown])) lastShown.set(id, ++shownCount);
  for (const key of frames.keys()) {
    const id = frameVolume(key);
    if (before.has(id) && !shown.has(id)) releaseListeners.forEach((listener) => listener(key));
  }

  // The volumes that panels may show next, at their full size, and the volumes loaded earlier that no panel lists,
  // at the size of their frames, compete for KEPT_BYTES, and the frames of the volumes left out are dropped
  const idle = new Map<string, { id: string; order: number; bytes: number; lastShown: number }>();
  for (const want of allWants()) {
    const id = want.meta.id;
    if (shown.has(id) || (idle.get(id)?.order ?? Infinity) <= want.order) continue;
    const [nk, nj, ni] = want.meta.shape;
    const voxels = nk * nj * ni * want.meta.frames.length;
    idle.set(id, {
      id,
      order: want.order,
      bytes: voxels * TYPED_ARRAYS[want.meta.dtype].BYTES_PER_ELEMENT,
      lastShown: 0,
    });
  }
  const listed = new Set(idle.keys());
  for (const [key, entry] of frames) {
    const id = frameVolume(key);
    if (shown.has(id) || listed.has(id)) continue;
    const loaded = idle.get(id) || { id, order: Infinity, bytes: 0, lastShown: lastShown.get(id) || 0 };
    const bytes = (entry.data?.byteLength || 0) + (entry.preview?.byteLength || 0);
    idle.set(id, { ...loaded, bytes: loaded.bytes + bytes });
  }
  kept = keptVolumes([...idle.values()], KEPT_BYTES);
  for (const key of [...frames.keys()]) {
    const id = frameVolume(key);
    if (shown.has(id) || kept.has(id)) continue;
    frames.delete(key);
    lastShown.delete(id);
  }

  // Sibling panels register one after the other in the same render, so we plan once all of them did, otherwise the
  // first panel would take both requests
  if (!pumpQueued) {
    pumpQueued = true;
    queueMicrotask(() => {
      pumpQueued = false;
      pump();
    });
  }
}
