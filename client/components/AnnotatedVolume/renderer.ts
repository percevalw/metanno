// WebGL2 reslicing of volume layers, shared by every AnnotatedVolume panel of the page. Browsers keep about 16 live
// WebGL contexts per page and drop the oldest, so we render every panel with one hidden canvas then copy the pixels
// into the panel's own 2D canvas.

import Konva from "konva";

import { invertAffine, Mat4, PanelFrame, Vec3 } from "./geometry";
import { onFrameRelease, VolumeFrame } from "./volumes";

const MAX_LAYERS = 4;
const COLORMAPS = { gray: 0, hot: 1, labels: 2 };

/**
 * One layer to draw: a loaded frame, its affine, the window as level and width, a colormap, the color of all its
 * labels if they share one and an opacity
 */
export type RenderLayer = {
  frame: VolumeFrame;
  affine: Mat4;
  window: [number, number];
  colormap: keyof typeof COLORMAPS;
  color?: string;
  opacity: number;
  // A projection lying parallel to the panel, sampled at its single slice whatever the depth
  flat?: boolean;
};

const VERTEX = `#version 300 es
void main() {
  // A single triangle covering the viewport
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// For each pixel we compute its world position, map it to texture coordinates of each layer and blend the layers
// over a black background. Positions outside a volume, or whose slices and preview have not arrived yet, leave that
// layer transparent.
const FRAGMENT = `#version 300 es
precision highp float;
precision highp sampler3D;
uniform vec2 uSize;
uniform vec3 uTopLeft;
uniform vec3 uRight;
uniform vec3 uDown;
${[0, 1, 2, 3]
  .map((idx) => `uniform sampler3D uTex${idx};\nuniform sampler3D uPreview${idx};\nuniform sampler2D uFlags${idx};`)
  .join("\n")}
uniform mat4 uWorldToTex[${MAX_LAYERS}];
// (i, j, k) size of each layer, its preview factor and preview size, 0 without preview, and whether all its slices
// arrived
uniform vec3 uShape[${MAX_LAYERS}];
uniform vec4 uPreviewShape[${MAX_LAYERS}];
uniform int uComplete[${MAX_LAYERS}];
uniform vec2 uWindow[${MAX_LAYERS}];
uniform int uColormap[${MAX_LAYERS}];
uniform vec4 uLabelColor[${MAX_LAYERS}];
uniform float uOpacity[${MAX_LAYERS}];
uniform int uCount;
out vec4 color;

// Value of full slice k at the in-plane texture position xy, or of the preview there while the slice is on its way,
// with 0 as second component when neither arrived. Row 0 of the flags marks the received full slices, row 1 the
// received preview slices at the index of the full slice they come from
vec2 sliceValue(sampler3D tex, sampler3D preview, sampler2D flags, int idx, vec2 xy, float k) {
  vec3 shape = uShape[idx];
  if (texelFetch(flags, ivec2(int(k), 0), 0).r > 0.0) return vec2(texture(tex, vec3(xy, (k + 0.5) / shape.z)).r, 1.0);
  float factor = uPreviewShape[idx].x;
  if (factor == 0.0) return vec2(0.0);
  float nearest = clamp(floor(k / factor + 0.5), 0.0, uPreviewShape[idx].w - 1.0) * factor;
  if (texelFetch(flags, ivec2(int(nearest), 1), 0).r == 0.0) return vec2(0.0);
  // Preview voxel p holds full voxel p * factor
  vec3 coord = (vec3(xy * shape.xy - 0.5, k) / factor + 0.5) / uPreviewShape[idx].yzw;
  return vec2(texture(preview, coord).r, 1.0);
}

// Value of a layer at a texture position, blending the two slices around it like the linear sampler of a complete
// layer does, or taking the nearest slice for labels
vec2 sampleLayer(sampler3D tex, sampler3D preview, sampler2D flags, int idx, vec3 coord) {
  if (uComplete[idx] == 1) return vec2(texture(tex, coord).r, 1.0);
  float nk = uShape[idx].z;
  float z = clamp(coord.z * nk - 0.5, 0.0, nk - 1.0);
  if (uColormap[idx] == 2) return sliceValue(tex, preview, flags, idx, coord.xy, floor(z + 0.5));
  float k0 = floor(z);
  vec2 below = sliceValue(tex, preview, flags, idx, coord.xy, k0);
  vec2 above = sliceValue(tex, preview, flags, idx, coord.xy, min(k0 + 1.0, nk - 1.0));
  if (below.y == 0.0) return above;
  if (above.y == 0.0) return below;
  return vec2(mix(below.x, above.x, z - k0), 1.0);
}

vec4 shade(sampler3D tex, sampler3D preview, sampler2D flags, int idx, vec3 world) {
  vec3 coord = (uWorldToTex[idx] * vec4(world, 1.0)).xyz;
  if (any(lessThan(coord, vec3(0.0))) || any(greaterThan(coord, vec3(1.0)))) return vec4(0.0);
  vec2 sampled = sampleLayer(tex, preview, flags, idx, coord);
  if (sampled.y == 0.0) return vec4(0.0);
  float value = sampled.x;
  if (uColormap[idx] == 2) {
    float label = floor(value + 0.5);
    if (label <= 0.0) return vec4(0.0);
    if (uLabelColor[idx].a > 0.0) return vec4(uLabelColor[idx].rgb, uOpacity[idx]);
    // Golden ratio hues give distinct colors to consecutive labels
    float h = fract(label * 0.618034) * 6.0;
    vec3 rgb = clamp(vec3(abs(h - 3.0) - 1.0, 2.0 - abs(h - 2.0), 2.0 - abs(h - 4.0)), 0.0, 1.0);
    return vec4(rgb, uOpacity[idx]);
  }
  float v = clamp((value - uWindow[idx].x) / uWindow[idx].y + 0.5, 0.0, 1.0);
  if (uColormap[idx] == 1) return vec4(clamp(vec3(3.0 * v, 3.0 * v - 1.0, 3.0 * v - 2.0), 0.0, 1.0), uOpacity[idx]);
  return vec4(vec3(v), uOpacity[idx]);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec3 world = uTopLeft + px.x * uRight + px.y * uDown;
  vec3 rgb = vec3(0.0);
  vec4 c;
  if (uCount > 0) { c = shade(uTex0, uPreview0, uFlags0, 0, world); rgb = mix(rgb, c.rgb, c.a); }
  if (uCount > 1) { c = shade(uTex1, uPreview1, uFlags1, 1, world); rgb = mix(rgb, c.rgb, c.a); }
  if (uCount > 2) { c = shade(uTex2, uPreview2, uFlags2, 2, world); rgb = mix(rgb, c.rgb, c.a); }
  if (uCount > 3) { c = shade(uTex3, uPreview3, uFlags3, 3, world); rgb = mix(rgb, c.rgb, c.a); }
  color = vec4(rgb, 1.0);
}`;

type GlState = {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
  linear: WebGLSampler;
  nearest: WebGLSampler;
  floatFormat: number;
  maxSize: number;
  textures: Map<string, FrameTextures>;
};

// Textures of a frame: its full slices, its preview, and the flags of the slices received of each, with the full and
// preview slices already uploaded
type FrameTextures = {
  full: WebGLTexture;
  preview: WebGLTexture | null;
  flags: WebGLTexture;
  uploaded: Uint8Array;
  previewUploaded: Uint8Array;
};

let state: GlState | null = null;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

/**
 * Create the shared context on first use, or again after the browser lost it. Textures are uploaded again from the
 * frame cache when panels next render.
 */
function getState(): GlState {
  if (state && !state.gl.isContextLost()) return state;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error("AnnotatedVolume needs WebGL2");

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const uniforms: Record<string, WebGLUniformLocation> = {};
  for (const name of [
    "uSize",
    "uTopLeft",
    "uRight",
    "uDown",
    "uCount",
    "uWorldToTex",
    "uWindow",
    "uColormap",
    "uLabelColor",
    "uOpacity",
    "uShape",
    "uPreviewShape",
    "uComplete",
  ])
    uniforms[name] = gl.getUniformLocation(program, name);
  // Layer idx reads its full slices from texture unit idx, its preview from unit 4 + idx and its flags from 8 + idx
  for (let idx = 0; idx < MAX_LAYERS; idx++) {
    gl.uniform1i(gl.getUniformLocation(program, `uTex${idx}`), idx);
    gl.uniform1i(gl.getUniformLocation(program, `uPreview${idx}`), MAX_LAYERS + idx);
    gl.uniform1i(gl.getUniformLocation(program, `uFlags${idx}`), 2 * MAX_LAYERS + idx);
  }

  // Labels need nearest sampling while images are interpolated, sampler objects let one texture serve both
  const makeSampler = (filter: number) => {
    const sampler = gl.createSampler();
    for (const param of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.samplerParameteri(sampler, param, filter);
    for (const param of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R])
      gl.samplerParameteri(sampler, param, gl.CLAMP_TO_EDGE);
    return sampler;
  };

  // R32F textures are only interpolated with this extension, R16F always are but keep about 3 significant digits
  const floatFormat = gl.getExtension("OES_texture_float_linear") ? gl.R32F : gl.R16F;
  const textures = new Map<string, FrameTextures>();
  state = {
    gl,
    program,
    uniforms,
    linear: makeSampler(gl.LINEAR),
    nearest: makeSampler(gl.NEAREST),
    floatFormat,
    maxSize: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE),
    textures,
  };
  return state;
}

/**
 * Largest width, height or depth of a 3D texture on this GPU, used by the panels to fit wider volumes
 */
export const maxTextureSize = () => getState().maxSize;

onFrameRelease((key) => {
  if (!state || !state.textures.has(key)) return;
  const { full, preview, flags } = state.textures.get(key);
  [full, preview, flags].forEach((texture) => state.gl.deleteTexture(texture));
  state.textures.delete(key);
});

/**
 * Upload to the bound 3D texture each run of slices received but not uploaded yet in one call, `received(k)` telling
 * whether texture slice k arrived
 */
function uploadSlices(
  gl: WebGL2RenderingContext,
  [nk, nj, ni]: number[],
  data: any,
  received: (k: number) => boolean,
  uploaded: Uint8Array
) {
  for (let start = 0; start < nk; start++) {
    if (!received(start) || uploaded[start]) continue;
    let stop = start;
    while (stop < nk && received(stop) && !uploaded[stop]) stop++;
    const values = new Float32Array(data.subarray(start * nj * ni, stop * nj * ni));
    gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, start, ni, nj, stop - start, gl.RED, gl.FLOAT, values);
    uploaded.fill(1, start, stop);
    start = stop;
  }
}

/**
 * Return the textures of a frame, allocated on first use, after uploading the slices and preview slices received
 * since the last render and the flags of both
 */
function getTextures({ gl, floatFormat, textures }: GlState, frame: VolumeFrame): FrameTextures {
  const [nk, nj, ni] = frame.shape;
  const [pk, pj, pi] = frame.previewShape;
  let entry = textures.get(frame.key);
  if (!entry) {
    const create3D = (width: number, height: number, depth: number) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_3D, texture);
      gl.texStorage3D(gl.TEXTURE_3D, 1, floatFormat, width, height, depth);
      return texture;
    };
    const flags = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, flags);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, nk, 2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    entry = {
      full: create3D(ni, nj, nk),
      preview: frame.factor > 1 ? create3D(pi, pj, pk) : null,
      flags,
      uploaded: new Uint8Array(nk),
      previewUploaded: new Uint8Array(pk),
    };
    textures.set(frame.key, entry);
  }
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.bindTexture(gl.TEXTURE_3D, entry.full);
  uploadSlices(gl, frame.shape, frame.data, (k) => frame.loaded[k] === 1, entry.uploaded);
  if (entry.preview) {
    gl.bindTexture(gl.TEXTURE_3D, entry.preview);
    const received = (k: number) => frame.previewLoaded[k * frame.factor] === 1;
    uploadSlices(gl, frame.previewShape, frame.preview, received, entry.previewUploaded);
  }
  gl.bindTexture(gl.TEXTURE_2D, entry.flags);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, nk, 1, gl.RED, gl.UNSIGNED_BYTE, frame.loaded);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 1, nk, 1, gl.RED, gl.UNSIGNED_BYTE, frame.previewLoaded);
  return entry;
}

/**
 * Draw the layers of a panel into its 2D canvas, at the canvas pixel size
 */
export function renderPanel(target: HTMLCanvasElement, frame: PanelFrame, layers: RenderLayer[]) {
  const glState = getState();
  const { gl, uniforms } = glState;
  const ratio = target.width / frame.width;
  if (gl.canvas.width < target.width || gl.canvas.height < target.height) {
    gl.canvas.width = Math.max(gl.canvas.width, target.width);
    gl.canvas.height = Math.max(gl.canvas.height, target.height);
  }
  gl.viewport(0, 0, target.width, target.height);

  // Uniforms are in device pixels of the target canvas
  gl.uniform2f(uniforms.uSize, target.width, target.height);
  gl.uniform3fv(uniforms.uTopLeft, frame.topLeft);
  gl.uniform3fv(
    uniforms.uRight,
    frame.right.map((x) => x / ratio)
  );
  gl.uniform3fv(
    uniforms.uDown,
    frame.down.map((x) => x / ratio)
  );
  const drawn = layers.slice(0, MAX_LAYERS);
  gl.uniform1i(uniforms.uCount, drawn.length);

  const worldToTex = new Float32Array(16 * MAX_LAYERS);
  const windows = new Float32Array(2 * MAX_LAYERS);
  const colormaps = new Int32Array(MAX_LAYERS);
  const labelColors = new Float32Array(4 * MAX_LAYERS);
  const opacities = new Float32Array(MAX_LAYERS);
  const shapes = new Float32Array(3 * MAX_LAYERS);
  const previewShapes = new Float32Array(4 * MAX_LAYERS);
  const complete = new Int32Array(MAX_LAYERS);
  drawn.forEach((layer, idx) => {
    const { full, preview, flags } = getTextures(glState, layer.frame);
    const sampler = layer.colormap === "labels" ? glState.nearest : glState.linear;
    gl.activeTexture(gl.TEXTURE0 + idx);
    gl.bindTexture(gl.TEXTURE_3D, full);
    gl.bindSampler(idx, sampler);
    gl.activeTexture(gl.TEXTURE0 + MAX_LAYERS + idx);
    gl.bindTexture(gl.TEXTURE_3D, preview);
    gl.bindSampler(MAX_LAYERS + idx, sampler);
    gl.activeTexture(gl.TEXTURE0 + 2 * MAX_LAYERS + idx);
    gl.bindTexture(gl.TEXTURE_2D, flags);
    // Texture coordinates of a voxel centre (i, j, k) are ((i + 0.5) / ni, (j + 0.5) / nj, (k + 0.5) / nk)
    const [nk, nj, ni] = layer.frame.shape;
    const [pk, pj, pi] = layer.frame.previewShape;
    shapes.set([ni, nj, nk], idx * 3);
    previewShapes.set(layer.frame.factor > 1 ? [layer.frame.factor, pi, pj, pk] : [0, 0, 0, 0], idx * 4);
    complete[idx] = layer.frame.loadedCount === nk ? 1 : 0;
    const inv = invertAffine(layer.affine);
    const sizes: Vec3 = [ni, nj, nk];
    for (let col = 0; col < 4; col++)
      for (let row = 0; row < 3; row++)
        worldToTex[idx * 16 + col * 4 + row] =
          row === 2 && layer.flat ? (col === 3 ? 0.5 : 0) : (inv[row][col] + (col === 3 ? 0.5 : 0)) / sizes[row];
    worldToTex[idx * 16 + 15] = 1;
    windows.set([layer.window[0], Math.max(layer.window[1], 1e-6)], idx * 2);
    colormaps[idx] = COLORMAPS[layer.colormap];
    if (layer.color) {
      const { r, g, b } = Konva.Util.colorToRGBA(layer.color);
      labelColors.set([r / 255, g / 255, b / 255, 1], idx * 4);
    }
    opacities[idx] = layer.opacity;
  });
  gl.uniformMatrix4fv(uniforms.uWorldToTex, false, worldToTex);
  gl.uniform2fv(uniforms.uWindow, windows);
  gl.uniform1iv(uniforms.uColormap, colormaps);
  gl.uniform4fv(uniforms.uLabelColor, labelColors);
  gl.uniform1fv(uniforms.uOpacity, opacities);
  gl.uniform3fv(uniforms.uShape, shapes);
  gl.uniform4fv(uniforms.uPreviewShape, previewShapes);
  gl.uniform1iv(uniforms.uComplete, complete);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // The hidden canvas is bottom-left anchored when larger than the panel, so we copy its bottom-left part
  const ctx = target.getContext("2d");
  ctx.drawImage(
    gl.canvas as HTMLCanvasElement,
    0,
    gl.canvas.height - target.height,
    target.width,
    target.height,
    0,
    0,
    target.width,
    target.height
  );
}
