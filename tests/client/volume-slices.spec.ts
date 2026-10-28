import assert from "node:assert/strict";
import {
  fitVolume,
  keptVolumes,
  planRequest,
  previewFactor,
  sliceLevel,
} from "../../client/components/AnnotatedVolume/volumes";
const { test } = require(process.env.PRET_TESTING_HELPER);

const volume = (id: string, shape: number[], frames = 1) => ({
  id,
  shape,
  dtype: "int16",
  affine: [],
  frames: Array.from({ length: frames }, () => ({})),
});
const CT = volume("ct", [778, 512, 512]);
const T2 = volume("t2", [30, 512, 512]);
const ADC = volume("adc", [20, 256, 256]);
const DWI = volume("dwi", [20, 256, 256], 2);

// Run the planner like the scheduler does, marking each request as loaded, and return the requests in order as
// "volume frame [preview] start:stop:stride"
function plan(wants, count: number, groupVoxels = 1 << 18) {
  const loaded = new Set<string>();
  const lastServed = new Map<string, number>();
  const requests = [];
  for (let idx = 0; idx < count; idx++) {
    const request = planRequest(
      wants,
      (id, frame, preview, slice) => loaded.has(`${id}/${frame}/${preview}/${slice}`),
      groupVoxels,
      lastServed
    );
    if (!request) break;
    for (let slice = request.start; slice < request.stop; slice += request.stride)
      loaded.add(`${request.volumeId}/${request.frame}/${request.preview}/${slice}`);
    lastServed.set(request.volumeId, idx + 1);
    const { volumeId, frame, preview, start, stop, stride } = request;
    requests.push(`${volumeId} ${frame} ${preview ? "preview " : ""}${start}:${stop}:${stride}`);
  }
  return requests;
}

test("volumes above 4 million voxels get a preview with one voxel every 2, 4 or more along each axis", () => {
  assert.equal(previewFactor(CT.shape), 4);
  assert.equal(previewFactor(T2.shape), 2);
  assert.equal(previewFactor(ADC.shape), 1);
  assert.equal(previewFactor([1, 4096, 3328]), 2);
});

test("slice levels halve the gaps between the slices of the previous levels, from the middle slice", () => {
  const levels = Array.from({ length: 30 }, (_, slice) => sliceLevel(slice, 30).level);
  assert.deepEqual(levels, [3, 4, 2, 4, 3, 4, 1, 4, 3, 4, 2, 4, 3, 4, 0, 4, 3, 4, 2, 4, 3, 4, 1, 4, 3, 4, 2, 4, 3, 4]);
  // Slices of a level on the same side are 2 x their distance to the slices of the previous levels apart
  assert.deepEqual(
    [6, 10, 12, 13].map((slice) => sliceLevel(slice, 30).spacing),
    [16, 8, 4, 2]
  );
});

test("every series gets its cursor slice first, then its preview or its slices nearest to the cursor", () => {
  const wants = [
    { meta: T2, frame: 0, order: 0, slice: 15 },
    { meta: ADC, frame: 0, order: 0, slice: 10 },
  ];
  // A 512 x 512 T2 slice fills a group, as do 4 preview slices of 256 x 256 or 4 ADC slices
  assert.deepEqual(plan(wants, 6), [
    "t2 0 15:16:1",
    "adc 0 10:11:1",
    "t2 0 preview 8:15:2",
    "adc 0 6:10:1",
    "t2 0 preview 16:23:2",
    "adc 0 11:15:1",
  ]);
});

test("previews of the volumes to show next come before the full slices of the shown one, which sharpen evenly", () => {
  const wants = [
    { meta: ADC, frame: 0, order: 2, slice: 10 },
    { meta: T2, frame: 0, order: 1, slice: 15 },
    { meta: CT, frame: 0, order: 0, slice: 300 },
  ];
  // Groups of 16 CT slices: the CT cursor slice, the previews of the CT and the T2, the small ADC at full size, then
  // the middle CT slice and the slices halving the gaps, ie 256 slices apart, then 128 and so on
  assert.deepEqual(plan(wants, 13, 1 << 22), [
    "ct 0 300:301:1",
    "ct 0 preview 300:777:4",
    "ct 0 preview 0:297:4",
    "t2 0 preview 0:15:2",
    "t2 0 preview 16:29:2",
    "adc 0 10:20:1",
    "adc 0 0:10:1",
    "ct 0 388:389:1",
    "ct 0 132:133:512",
    "ct 0 644:645:512",
    "ct 0 4:261:256",
    "ct 0 516:773:256",
    "ct 0 324:709:128",
  ]);
});

test("images wider than twice their preview show the preview before their cursor slice", () => {
  assert.deepEqual(plan([{ meta: volume("mg", [1, 4096, 3328]), frame: 0, order: 0, slice: 0 }], 5, 1 << 24), [
    "mg 0 preview 0:1:2",
    "mg 0 0:1:1",
  ]);
});

test("other frames come once the shown frame is complete", () => {
  const requests = plan([{ meta: DWI, frame: 1, order: 0, slice: 5 }], 20, 1 << 20);
  // 16 slices per group, the shown frame 1 first then frame 0, each from the cursor slice outward
  assert.deepEqual(requests, ["dwi 1 5:6:1", "dwi 1 0:5:1", "dwi 1 6:20:1", "dwi 0 5:20:1", "dwi 0 0:5:1"]);
});

test("nothing is requested once every wanted slice is loaded", () => {
  assert.deepEqual(plan([{ meta: ADC, frame: 0, order: 0, slice: 0 }], 10, 1 << 23), ["adc 0 0:1:1", "adc 0 1:20:1"]);
});

test("volumes wider than the GPU textures keep one row and column every step", () => {
  const affine = [
    [0.065, 0, 0, 10],
    [0, 0.065, 0, 20],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  const mammogram = { ...volume("mg", [1, 4096, 3328]), affine };
  assert.deepEqual(fitVolume(mammogram, 2048), {
    ...mammogram,
    shape: [1, 2048, 1664],
    affine: [
      [0.13, 0, 0, 10],
      [0, 0.13, 0, 20],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    step: 2,
  });
  assert.equal(fitVolume(T2, 2048), T2);
});

test("volumes no panel shows are kept within the budget, those to show next first", () => {
  // dwi and adc are to show next, t2 and mg were shown before, mg most recently
  const idle = [
    { id: "t2", order: Infinity, bytes: 100, lastShown: 1 },
    { id: "mg", order: Infinity, bytes: 100, lastShown: 2 },
    { id: "adc", order: 2, bytes: 100, lastShown: 0 },
    { id: "dwi", order: 1, bytes: 200, lastShown: 0 },
  ];
  assert.deepEqual([...keptVolumes(idle, 500)], ["dwi", "adc", "mg", "t2"]);
  assert.deepEqual([...keptVolumes(idle, 400)], ["dwi", "adc", "mg"]);
  // A volume that does not fit leaves room for the next ones
  assert.deepEqual([...keptVolumes(idle, 150)], ["adc"]);
  assert.deepEqual([...keptVolumes(idle, 0)], []);
});
