// Browser cache and download scheduler of volume slices, shared by every AnnotatedVolume panel of the page. Frames
// are too large for Stores, so panels keep volume ids and frame indices in their props and read voxels from here.
//
// Panels say which frame they show and where their cursor is, then the scheduler asks the server for small groups of
// slices, nearest to the cursors first, two requests at a time. Since queued slices are only requested when their
// turn comes, a panel that changes study or series simply stops asking for the old ones.

import { VolumeMeta } from "../../types";
import { invertAffine, Vec3, voxelToWorld } from "./geometry";

export type SliceBytes = { shape: number[]; dtype: string; bytes: Uint8Array; compression?: "deflate" };
export type LoadSlices = (
  volumeId: string,
  frame: number,
  start: number,
  stop: number,
  step?: number
) => Promise<SliceBytes>;

/**
 * One 3D frame of a volume in (k, j, i) order, filled as its slices arrive. `loaded` flags the received slices,
 * `low` and `high` are value percentiles of the first received slices, used as the default window
 */
export type VolumeFrame = {
  key: string;
  shape: number[];
  data: any;
  loaded: Uint8Array;
  loadedCount: number;
  low: number;
  high: number;
};

/**
 * A frame shown by a panel, with the world cursor that sets which slices come first
 */
export type Want = { meta: VolumeMeta; frame: number; cursor: Vec3; loadSlices: LoadSlices; onLoad: () => void };

export type SliceRequest = { volumeId: string; frame: number; start: number; stop: number };

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
// the websocket and could not be dropped when the cursor or the study changes
const MAX_IN_FLIGHT = 2;
// Requests are sized to last about half a second, a few slices on a slow link and much of a volume on a fast one
const TARGET_MS = 500;

const frames = new Map<string, VolumeFrame>();
const inFlight = new Map<string, Uint8Array>();
const failed = new Set<string>();
const panels = new Map<object, Want[]>();
const lastServed = new Map<string, number>();
const releaseListeners: ((key: string) => void)[] = [];
let running = 0;
let served = 0;
let groupVoxels = 1 << 18;
let pumpQueued = false;

export const frameKey = (volumeId: string, frame: number) => `${volumeId}\u0000${frame}`;

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
 * Register a callback called with the key of each dropped frame, used by the renderer to free its textures
 */
export function onFrameRelease(listener: (key: string) => void) {
  releaseListeners.push(listener);
}

/**
 * Return a frame with at least one received slice, or null
 */
export function getFrame(volumeId: string, frame: number) {
  const entry = frames.get(frameKey(volumeId, frame));
  return entry && entry.loadedCount > 0 ? entry : null;
}

const compareRanks = (a: number[], b: number[]) => a.map((x, idx) => x - b[idx]).find((d) => d !== 0) || 0;

/**
 * Pick the next group of slices to request, or null when every wanted slice is loaded or requested.
 *
 * 1. Each volume proposes its most urgent slice: the shown frames before the other frames, then the slices nearest
 *    to the cursor slice.
 * 2. The most urgent proposal wins, ties go to the volume served least recently, so that every panel shows its
 *    cursor slice early.
 * 3. The group extends that slice away from the cursor, up to `groupVoxels` voxels.
 */
export function planRequest(
  wants: { meta: VolumeMeta; frame: number; slice: number }[],
  busy: (volumeId: string, frame: number, slice: number) => boolean,
  groupVoxels: number,
  lastServed: Map<string, number>
): SliceRequest | null {
  // 1. Most urgent free slice of each volume, ranked by [other frame, frame distance, slice distance]
  let best = null;
  for (const id of new Set(wants.map((want) => want.meta.id))) {
    const own = wants.filter((want) => want.meta.id === id);
    const meta = own[0].meta;
    const nk = meta.shape[0];
    let proposal = null;
    for (const want of own) {
      for (let frame = 0; frame < meta.frames.length; frame++) {
        const shown = own.some((other) => other.frame === frame);
        for (let distance = 0; distance < nk; distance++) {
          const rank = [shown ? 0 : 1, Math.abs(frame - want.frame), distance];
          if (proposal && compareRanks(rank, proposal.rank) >= 0) break;
          const slice = [want.slice + distance, want.slice - distance].find(
            (s) => s >= 0 && s < nk && !busy(id, frame, s)
          );
          if (slice !== undefined) {
            proposal = { id, frame, slice, from: want.slice, rank };
            break;
          }
        }
      }
    }
    // 2. Ties between volumes go to the one served least recently
    const order = proposal && best ? compareRanks(proposal.rank, best.rank) : -1;
    if (proposal && (order < 0 || (order === 0 && (lastServed.get(id) || 0) < (lastServed.get(best.id) || 0))))
      best = { ...proposal, meta };
  }
  if (!best) return null;

  // 3. Contiguous free slices away from the cursor, so that the next request continues where this one stops
  const [nk, nj, ni] = best.meta.shape;
  const size = Math.max(1, Math.floor(groupVoxels / (nj * ni)));
  const step = best.slice >= best.from ? 1 : -1;
  let end = best.slice;
  while (
    Math.abs(end - best.slice) + 1 < size &&
    end + step >= 0 &&
    end + step < nk &&
    !busy(best.id, best.frame, end + step)
  )
    end += step;
  return {
    volumeId: best.id,
    frame: best.frame,
    start: Math.min(best.slice, end),
    stop: Math.max(best.slice, end) + 1,
  };
}

const busy = (volumeId: string, frame: number, slice: number) => {
  const key = frameKey(volumeId, frame);
  return failed.has(key) || !!frames.get(key)?.loaded[slice] || !!inFlight.get(key)?.[slice];
};

const allWants = () => [...panels.values()].flat();

/**
 * Store the slices of a response in their frame, creating the frame on its first slices, then redraw the panels
 * showing that volume
 */
async function receiveSlices(request: SliceRequest, meta: VolumeMeta, payload: SliceBytes) {
  let bytes = payload.bytes;
  if (payload.compression === "deflate") {
    const inflated = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"));
    bytes = new Uint8Array(await new Response(inflated).arrayBuffer());
  } else {
    // Uncompressed bytes of the standalone transport can start at any offset, typed views need a multiple of their
    // element size
    bytes = bytes.slice();
  }
  // A panel may have dropped the volume while its slices were on their way
  if (!allWants().some((want) => want.meta.id === meta.id)) return;
  const TypedArray = TYPED_ARRAYS[payload.dtype];
  const values = new TypedArray(bytes.buffer, bytes.byteOffset, bytes.byteLength / TypedArray.BYTES_PER_ELEMENT);
  const key = frameKey(meta.id, request.frame);
  const [nk, nj, ni] = meta.shape;
  let entry = frames.get(key);
  if (!entry) {
    // 1st and 99th percentiles of the first slices, so that a few very bright voxels do not wash out the image. MR
    // series often fill the area outside the scanned field with 0, so we leave zeros out when other values exist
    const stride = Math.max(1, Math.floor(values.length / 100000));
    const all = new Float64Array(Math.ceil(values.length / stride));
    for (let idx = 0; idx < all.length; idx++) all[idx] = values[idx * stride];
    const nonZero = all.filter((value) => value !== 0);
    const sample = nonZero.length ? nonZero : all;
    sample.sort();
    const low = sample[Math.floor(sample.length * 0.01)];
    const high = sample[Math.floor(sample.length * 0.99)];
    entry = {
      key,
      shape: meta.shape,
      data: new TypedArray(nk * nj * ni),
      loaded: new Uint8Array(nk),
      loadedCount: 0,
      low,
      high: high > low ? high : low + 1,
    };
    frames.set(key, entry);
  }
  entry.data.set(values, request.start * nj * ni);
  for (let slice = request.start; slice < request.stop; slice++) {
    entry.loadedCount += entry.loaded[slice] ? 0 : 1;
    entry.loaded[slice] = 1;
  }
  allWants()
    .filter((want) => want.meta.id === meta.id)
    .forEach((want) => want.onLoad());
}

/**
 * Start requests until two are in flight or nothing is left to load
 */
function pump() {
  while (running < MAX_IN_FLIGHT) {
    const wants = allWants();
    const request = planRequest(
      wants.map((want) => {
        // Slice of the volume that the cursor goes through, along its acquisition axis
        const k = Math.round(voxelToWorld(invertAffine(want.meta.affine), want.cursor)[2]);
        return { meta: want.meta, frame: want.frame, slice: Math.min(want.meta.shape[0] - 1, Math.max(0, k)) };
      }),
      busy,
      groupVoxels,
      lastServed
    );
    if (!request) return;
    const want = wants.find((want) => want.meta.id === request.volumeId);
    const key = frameKey(request.volumeId, request.frame);
    if (!inFlight.has(key)) inFlight.set(key, new Uint8Array(want.meta.shape[0]));
    inFlight.get(key).fill(1, request.start, request.stop);
    lastServed.set(request.volumeId, ++served);
    running++;
    const started = performance.now();
    // The step is only passed when needed, so that load_slices functions written for full size volumes keep working
    const step = want.meta.step > 1 ? [want.meta.step] : [];
    want
      .loadSlices(request.volumeId, request.frame, request.start, request.stop, ...step)
      .then((payload) => {
        // The next requests aim at TARGET_MS from the speed of this one
        const [, nj, ni] = want.meta.shape;
        const voxelsPerMs = ((request.stop - request.start) * nj * ni) / Math.max(1, performance.now() - started);
        groupVoxels = Math.min(1 << 23, Math.max(1 << 15, voxelsPerMs * TARGET_MS));
        return receiveSlices(request, want.meta, payload);
      })
      .catch((error) => {
        failed.add(key);
        console.error(`Could not load slices ${request.start}:${request.stop} of volume ${request.volumeId}`, error);
      })
      .finally(() => {
        inFlight.get(key)?.fill(0, request.start, request.stop);
        running--;
        pump();
      });
  }
}

/**
 * Replace the frames shown by a panel and request the slices they miss. A panel passes no wants when it unmounts,
 * and the frames that no panel shows any more are dropped 30 s later, so that switching back to a series is instant.
 */
export function setWants(panel: object, wants: Want[]) {
  const dropped = (panels.get(panel) || [])
    .map((want) => want.meta.id)
    .filter((id) => !wants.some((want) => want.meta.id === id));
  if (wants.length) panels.set(panel, wants);
  else panels.delete(panel);
  // Sibling panels register one after the other in the same render, so we plan once all of them did, otherwise the
  // first panel would take both requests
  if (!pumpQueued) {
    pumpQueued = true;
    queueMicrotask(() => {
      pumpQueued = false;
      pump();
    });
  }
  for (const id of new Set(dropped)) {
    setTimeout(() => {
      if (allWants().some((want) => want.meta.id === id)) return;
      for (const key of [...frames.keys()].filter((key) => key.startsWith(`${id}\u0000`))) {
        frames.delete(key);
        releaseListeners.forEach((listener) => listener(key));
      }
    }, 30000);
  }
}
