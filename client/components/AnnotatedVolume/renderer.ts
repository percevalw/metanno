// WebGL2 reslicing of volume layers, shared by every AnnotatedVolume panel of the page. Browsers keep about 16 live
// WebGL contexts per page and drop the oldest, so we render every panel with one hidden canvas then copy the pixels
// into the panel's own 2D canvas.

import { invertAffine, Mat4, PanelFrame, Vec3 } from "./geometry";
import { onFrameRelease, VolumeFrame } from "./volumes";

const MAX_LAYERS = 4;
const COLORMAPS = { gray: 0, hot: 1, labels: 2 };

/**
 * One layer to draw: a loaded frame, its affine, the window as level and width, a colormap and an opacity
 */
export type RenderLayer = {
  frame: VolumeFrame;
  affine: Mat4;
  window: [number, number];
  colormap: keyof typeof COLORMAPS;
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
// over a black background. Positions outside a volume leave that layer transparent.
const FRAGMENT = `#version 300 es
precision highp float;
precision highp sampler3D;
uniform vec2 uSize;
uniform vec3 uTopLeft;
uniform vec3 uRight;
uniform vec3 uDown;
uniform sampler3D uTex0;
uniform sampler3D uTex1;
uniform sampler3D uTex2;
uniform sampler3D uTex3;
uniform mat4 uWorldToTex[${MAX_LAYERS}];
uniform vec2 uWindow[${MAX_LAYERS}];
uniform int uColormap[${MAX_LAYERS}];
uniform float uOpacity[${MAX_LAYERS}];
uniform int uCount;
out vec4 color;

vec4 shade(sampler3D tex, int idx, vec3 world) {
  vec3 coord = (uWorldToTex[idx] * vec4(world, 1.0)).xyz;
  if (any(lessThan(coord, vec3(0.0))) || any(greaterThan(coord, vec3(1.0)))) return vec4(0.0);
  float value = texture(tex, coord).r;
  if (uColormap[idx] == 2) {
    float label = floor(value + 0.5);
    if (label <= 0.0) return vec4(0.0);
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
  if (uCount > 0) { c = shade(uTex0, 0, world); rgb = mix(rgb, c.rgb, c.a); }
  if (uCount > 1) { c = shade(uTex1, 1, world); rgb = mix(rgb, c.rgb, c.a); }
  if (uCount > 2) { c = shade(uTex2, 2, world); rgb = mix(rgb, c.rgb, c.a); }
  if (uCount > 3) { c = shade(uTex3, 3, world); rgb = mix(rgb, c.rgb, c.a); }
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
  textures: Map<string, { texture: WebGLTexture; uploaded: Uint8Array }>;
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
    "uOpacity",
  ])
    uniforms[name] = gl.getUniformLocation(program, name);
  for (let idx = 0; idx < MAX_LAYERS; idx++) gl.uniform1i(gl.getUniformLocation(program, `uTex${idx}`), idx);

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
  const textures = new Map<string, { texture: WebGLTexture; uploaded: Uint8Array }>();
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
  state.gl.deleteTexture(state.textures.get(key).texture);
  state.textures.delete(key);
});

/**
 * Return the texture of a frame, allocated at full size on first use, after uploading the slices received since the
 * last render. Slices still on their way stay at 0.
 */
function getTexture({ gl, floatFormat, textures }: GlState, frame: VolumeFrame) {
  const [nk, nj, ni] = frame.shape;
  let entry = textures.get(frame.key);
  if (!entry) {
    entry = { texture: gl.createTexture(), uploaded: new Uint8Array(nk) };
    gl.bindTexture(gl.TEXTURE_3D, entry.texture);
    gl.texStorage3D(gl.TEXTURE_3D, 1, floatFormat, ni, nj, nk);
    textures.set(frame.key, entry);
  }
  gl.bindTexture(gl.TEXTURE_3D, entry.texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  // Upload each run of received slices in one call
  for (let start = 0; start < nk; start++) {
    if (!frame.loaded[start] || entry.uploaded[start]) continue;
    let stop = start;
    while (stop < nk && frame.loaded[stop] && !entry.uploaded[stop]) stop++;
    const values = new Float32Array(frame.data.subarray(start * nj * ni, stop * nj * ni));
    gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, start, ni, nj, stop - start, gl.RED, gl.FLOAT, values);
    entry.uploaded.fill(1, start, stop);
    start = stop;
  }
  return entry.texture;
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
  const opacities = new Float32Array(MAX_LAYERS);
  drawn.forEach((layer, idx) => {
    gl.activeTexture(gl.TEXTURE0 + idx);
    gl.bindTexture(gl.TEXTURE_3D, getTexture(glState, layer.frame));
    gl.bindSampler(idx, layer.colormap === "labels" ? glState.nearest : glState.linear);
    // Texture coordinates of a voxel centre (i, j, k) are ((i + 0.5) / ni, (j + 0.5) / nj, (k + 0.5) / nk)
    const [nk, nj, ni] = layer.frame.shape;
    const inv = invertAffine(layer.affine);
    const sizes: Vec3 = [ni, nj, nk];
    for (let col = 0; col < 4; col++)
      for (let row = 0; row < 3; row++)
        worldToTex[idx * 16 + col * 4 + row] =
          row === 2 && layer.flat ? (col === 3 ? 0.5 : 0) : (inv[row][col] + (col === 3 ? 0.5 : 0)) / sizes[row];
    worldToTex[idx * 16 + 15] = 1;
    windows.set([layer.window[0], Math.max(layer.window[1], 1e-6)], idx * 2);
    colormaps[idx] = COLORMAPS[layer.colormap];
    opacities[idx] = layer.opacity;
  });
  gl.uniformMatrix4fv(uniforms.uWorldToTex, false, worldToTex);
  gl.uniform2fv(uniforms.uWindow, windows);
  gl.uniform1iv(uniforms.uColormap, colormaps);
  gl.uniform1fv(uniforms.uOpacity, opacities);
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
