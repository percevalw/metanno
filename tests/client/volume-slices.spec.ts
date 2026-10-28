import assert from "node:assert/strict";
import { fitVolume, planRequest } from "../../client/components/AnnotatedVolume/volumes";
const { test } = require(process.env.PRET_TESTING_HELPER);

const volume = (id: string, shape: number[], frames = 1) => ({
  id,
  shape,
  dtype: "int16",
  affine: [],
  frames: Array.from({ length: frames }, () => ({})),
});
const T2 = volume("t2", [30, 512, 512]);
const ADC = volume("adc", [20, 256, 256]);
const DWI = volume("dwi", [20, 256, 256], 2);

// Run the planner like the scheduler does, marking each request as loaded, and return the requests in order
function plan(wants, count: number, groupVoxels = 1 << 18) {
  const loaded = new Set<string>();
  const lastServed = new Map<string, number>();
  const requests = [];
  for (let idx = 0; idx < count; idx++) {
    const request = planRequest(
      wants,
      (id, frame, slice) => loaded.has(`${id}/${frame}/${slice}`),
      groupVoxels,
      lastServed
    );
    if (!request) break;
    for (let slice = request.start; slice < request.stop; slice++)
      loaded.add(`${request.volumeId}/${request.frame}/${slice}`);
    lastServed.set(request.volumeId, idx + 1);
    requests.push(`${request.volumeId} ${request.frame} ${request.start}:${request.stop}`);
  }
  return requests;
}

test("every series gets its cursor slice first, then the neighbouring slices", () => {
  const wants = [
    { meta: T2, frame: 0, slice: 15 },
    { meta: ADC, frame: 0, slice: 10 },
  ];
  // A 512 x 512 T2 slice fills a group, 4 ADC slices of 256 x 256 do, and groups extend away from the cursor
  assert.deepEqual(plan(wants, 5), ["t2 0 15:16", "adc 0 10:14", "t2 0 16:17", "adc 0 6:10", "t2 0 14:15"]);
});

test("other frames come once the shown frame is complete", () => {
  const requests = plan([{ meta: DWI, frame: 1, slice: 5 }], 20, 1 << 20);
  // 16 slices per group, the shown frame 1 first then frame 0, each from the cursor slice outward
  assert.deepEqual(requests, ["dwi 1 5:20", "dwi 1 0:5", "dwi 0 5:20", "dwi 0 0:5"]);
});

test("nothing is requested once every wanted slice is loaded", () => {
  assert.equal(plan([{ meta: ADC, frame: 0, slice: 0 }], 10, 1 << 23).length, 1);
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
