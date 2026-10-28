import Konva from "konva";
import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { ImageAnnotationStyle, VolumeData, VolumeMethods, VolumeShape } from "../../types";
import {
  add,
  clampToVolume,
  isProjection,
  defaultOrientation,
  directionLetter,
  dot,
  invertAffine,
  panelFrame,
  planeAxes,
  polygonNormal,
  scale,
  screenToWorld,
  simplifyPath,
  slabSection,
  sliceAxis,
  stepCursor,
  sub,
  Vec3,
  voxelToWorld,
  worldToScreen,
} from "./geometry";
import { maxTextureSize, RenderLayer, renderPanel } from "./renderer";
import { fitVolume, getFrame, setWants } from "./volumes";

// Crosshair colors of each plane, and for each panel the planes shown by its horizontal and vertical lines
const PLANE_COLORS = { axial: "#e05252", sagittal: "#e0c452", coronal: "#52b052" };
const CROSS_PLANES = {
  axial: ["coronal", "sagittal"],
  coronal: ["axial", "sagittal"],
  sagittal: ["axial", "coronal"],
};
const CROSSHAIR_GAP = 12;
// A press that moves less than this many pixels is a click
const CLICK_TOLERANCE = 3;
// Duration of a cursor glide, in milliseconds
const GLIDE_MS = 300;
// Animation frame of the running glide, one per page since a glide moves the view shared by linked panels
let glideFrame = 0;

/**
 * Move the cursor from `start` to `end` with an ease out, calling `emit` with each position, eg to write the view
 * shared by linked panels. A new glide, or a wheel, key or press in a panel, stops the running one
 */
export function glideCursor(start: Vec3, end: Vec3, emit: (cursor: Vec3) => void) {
  cancelAnimationFrame(glideFrame);
  const began = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - began) / GLIDE_MS);
    emit(add(start, scale(sub(end, start), 1 - (1 - t) ** 3)));
    if (t < 1) glideFrame = requestAnimationFrame(step);
  };
  glideFrame = requestAnimationFrame(step);
}

const makeModKeys = (event: any) => {
  const modKeys: string[] = [];
  if (event.shiftKey) modKeys.push("Shift");
  if (event.ctrlKey) modKeys.push("Ctrl");
  if (event.altKey) modKeys.push("Alt");
  if (event.metaKey) modKeys.push("Meta");
  return modKeys;
};

type Drag = {
  kind: "pan" | "window" | "cursor" | "shape" | "vertex" | "band" | "draw" | "lasso" | "box";
  x: number;
  y: number;
  moved: boolean;
  center: Vec3;
  window: [number, number];
  shapeId?: any;
  vertex?: number;
  // Screen positions of the lasso path, simplified on release
  path?: [number, number][];
  // Pressed corner of a box in world millimetres, and the last pointer position, which the wheel keeps while it moves
  // the slice of the opposite corner
  start?: Vec3;
  last?: [number, number];
};

// Id and style of the box being drawn, shown by every panel of the view
const DRAWING_ID = "__drawing__";
const DRAWING_STYLE = { strokeColor: "#4fc3f7" };

// Points closer than this many pixels to the first point close the polygon being drawn
const CLOSE_DISTANCE = 8;
// Lasso paths are simplified to this many pixels, so rows keep a few points per centimetre of outline
const LASSO_TOLERANCE = 0.5;

// Stroke color shared by the shapes of one object, eg every outline of a lesion
const objectColor = (object: any) => {
  const code = [...String(object)].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7);
  return `hsl(${Math.round(((Math.abs(code) * 0.618034) % 1) * 360)}, 90%, 60%)`;
};

// Opacity of the slab cross-sections of an object
const BAND_OPACITY = 0.45;

/**
 * Cross-sections of one object drawn opaque then cached, so that the group opacity applies once and overlapping
 * slabs do not look darker
 */
const CachedGroup: React.FC<{ opacity: number; children: React.ReactNode }> = ({ opacity, children }) => {
  const group = useRef<Konva.Group>(null);
  useLayoutEffect(() => {
    group.current.clearCache();
    // Konva fails to draw a cache narrower than a pixel, eg the section of a slab seen edge on
    const { width, height } = group.current.getClientRect();
    if (width >= 1 && height >= 1) group.current.cache({ pixelRatio: window.devicePixelRatio || 1 });
  });
  return (
    <Group ref={group} opacity={opacity}>
      {children}
    </Group>
  );
};

/**
 * One panel of a volume viewer: the layers resliced along a plane through the view cursor, with the crosshair and
 * the annotation points and polygons lying on that plane.
 *
 * The component holds no view state: wheel, keys and drags emit partial views through `onViewChange`, and panels
 * passed the same view from a shared Store stay linked.
 */
export const AnnotatedVolume: React.FC<VolumeData & VolumeMethods> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const drag = useRef<Drag | null>(null);
  const pressedShape = useRef<any>(null);
  // Polygon whose cross-section was pressed, a click on it moves the cursor onto the polygon plane
  const pressedBand = useRef<any>(null);
  const displayedWindow = useRef<[number, number]>([0, 1]);
  // Moved shape or moved vertex shown while dragging, emitted once on release
  const [shapeShift, setShapeShift] = useState<{ id: any; delta: Vec3; vertex?: number } | null>(null);
  const pressedVertex = useRef<number | null>(null);
  // Polygon or lasso being drawn, in world millimetres, and the pointer that previews the next polygon point
  const [draft, setDraft] = useState<Vec3[] | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  useEffect(() => setDraft(null), [props.mode, props.tool]);
  // Identifies this panel in the slice scheduler, which stops loading its volumes when it unmounts
  const panelToken = useRef({});
  useEffect(() => () => setWants(panelToken.current, []), []);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { volumes, layers, view, plane } = props;
  const maxSize = maxTextureSize();
  const metas = Object.fromEntries(volumes.map((meta) => [meta.id, fitVolume(meta, maxSize)]));

  // The first layer is the reference: it sets the slice step, the default orientation, cursor and window
  const ref = metas[layers[0]?.volume];
  const ready = ref && size.width > 0 && size.height > 0;
  let frame = null;
  let cursor: Vec3 = null;
  let spacing = 1;
  let invRef = null;
  let axes = null;
  let volumeCenter: Vec3 = null;
  let flat = false;
  if (ref) {
    const [nk, nj, ni] = ref.shape;
    volumeCenter = voxelToWorld(ref.affine, [(ni - 1) / 2, (nj - 1) / 2, (nk - 1) / 2]);
    axes = planeAxes(view.orientation || defaultOrientation(ref.affine), plane);
    invRef = invertAffine(ref.affine);
    cursor = view.cursor || stepCursor(ref.affine, invRef, ref.shape, axes[2], volumeCenter, 0);
    spacing = sliceAxis(ref.affine, axes[2]).spacing;
    flat = isProjection(ref.affine, ref.shape, axes[2]);
  }
  if (ready) {
    frame = panelFrame(
      axes,
      ref.affine,
      ref.shape,
      cursor,
      view.center || volumeCenter,
      view.zoom || 1,
      size.width,
      size.height
    );
  }

  // After each render, tell the slice scheduler which frames this panel shows around its cursor, and which volumes
  // no layer shows, to load next in their order, then draw the slices received so far. Each new group of slices of a
  // shown frame renders the panel again
  useLayoutEffect(() => {
    const shown = layers
      .filter((layer) => metas[layer.volume])
      .map((layer) => ({
        meta: metas[layer.volume],
        frame: (view.frames || {})[layer.volume] || 0,
        order: 0,
        cursor,
        loadSlices: props.loadSlices,
        onLoad: refresh,
      }));
    const next = volumes
      .filter((meta) => !layers.some((layer) => layer.volume === meta.id))
      .map((meta, idx) => ({ meta: metas[meta.id], frame: 0, order: idx + 1, loadSlices: props.loadSlices }));
    setWants(panelToken.current, [...shown, ...next]);
    if (!ready) return;
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    const drawn: RenderLayer[] = [];
    for (const layer of layers) {
      const meta = metas[layer.volume];
      if (!meta) continue;
      const loaded = getFrame(meta.id, (view.frames || {})[meta.id] || 0);
      if (!loaded) continue;
      const win = (view.windows || {})[meta.id] ||
        meta.window || [(loaded.low + loaded.high) / 2, loaded.high - loaded.low];
      if (meta === ref) displayedWindow.current = win;
      drawn.push({
        frame: loaded,
        affine: meta.affine,
        window: win,
        colormap: layer.colormap || "gray",
        color: layer.color,
        opacity: layer.opacity ?? 1,
        flat: isProjection(meta.affine, meta.shape, axes[2]),
      });
    }
    renderPanel(canvas, frame, drawn);
  });

  // Wheel scrolls slices, or zooms around the pointer with ctrl or cmd. React wheel listeners are passive and cannot
  // stop the notebook from scrolling, so we listen natively.
  const latest = useRef(null);
  latest.current = { props, frame, cursor, invRef, ref, flat };
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const { props, frame, cursor, invRef, ref, flat } = latest.current;
      cancelAnimationFrame(glideFrame);
      if (!frame) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = containerRef.current.getBoundingClientRect();
        const [x, y] = [e.clientX - rect.left, e.clientY - rect.top];
        // Zoom 1 fits the volume in the panel, and the view cannot zoom out of it
        const zoom = props.view.zoom || 1;
        const factor = Math.max(1, zoom * Math.exp(-e.deltaY * 0.002)) / zoom;
        if (factor === 1) return;
        // The world point under the pointer stays under it
        const pointed = screenToWorld(frame, x, y);
        const offset = add(scale(frame.right, frame.width / 2 - x), scale(frame.down, frame.height / 2 - y));
        props.onViewChange?.({
          zoom: zoom * factor,
          center: clampToVolume(ref.affine, invRef, ref.shape, add(pointed, scale(offset, 1 / factor)), flat),
        });
      } else if (!flat) {
        props.onViewChange?.({
          cursor: stepCursor(ref.affine, invRef, ref.shape, frame.normal, cursor, e.deltaY < 0 ? 1 : -1),
        });
      }
    };
    const container = containerRef.current;
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  // Box from the pressed corner to the pointer on the panel slice, as the 4 corners of its middle slice and the depth
  // between the two slices plus one slice as thickness, emitted while drawing and on release
  const boxFrom = (start: Vec3, x: number, y: number): Pick<VolumeShape, "kind" | "points" | "thickness"> => {
    const end = screenToWorld(frame, x, y);
    const depth = dot(sub(end, start), frame.normal);
    const middle = add(start, scale(frame.normal, depth / 2));
    const [right, down] = [scale(frame.right, 1 / frame.mmPerPx), scale(frame.down, 1 / frame.mmPerPx)];
    const across = scale(right, dot(sub(end, start), right));
    const below = scale(down, dot(sub(end, start), down));
    const points = [middle, add(middle, across), add(add(middle, across), below), add(middle, below)];
    return { kind: "box", points: points as VolumeShape["points"], thickness: Math.abs(depth) + spacing };
  };

  // The wheel moves the slice while a box is drawn, which gives the box its depth
  useEffect(() => {
    const d = drag.current;
    if (d?.kind !== "box" || !frame) return;
    d.moved = true;
    props.onViewChange?.({ drawing: boxFrom(d.start, ...d.last) });
  }, [cursor && cursor.join()]);

  if (!ready)
    return <div ref={containerRef} style={{ width: "100%", height: "100%", background: "black", ...props.style }} />;

  const emitView = props.onViewChange || (() => {});
  const pointer = (e: React.PointerEvent) => {
    const rect = containerRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    containerRef.current.focus();
    cancelAnimationFrame(glideFrame);
    const [x, y] = pointer(e);
    const shape = props.shapes.find((s) => s.id === pressedShape.current);
    const vertex = pressedVertex.current;
    const band = pressedBand.current;
    pressedShape.current = pressedVertex.current = pressedBand.current = null;
    let kind: Drag["kind"] = e.button === 1 ? "pan" : e.button === 2 ? "window" : "cursor";
    // On a trackpad, moving two pressed fingers scrolls instead of dragging the right button, so Option (Alt) with
    // a left drag also sets the window
    if (e.button === 0 && e.altKey) kind = "window";
    else if (e.button === 0 && props.mode === "edit")
      kind = props.tool === "lasso" ? "lasso" : props.tool === "box" ? "box" : "draw";
    else if (e.button === 0 && shape && vertex !== null) kind = "vertex";
    else if (e.button === 0 && shape) kind = "shape";
    else if (e.button === 0 && band !== null) kind = "band";
    drag.current = {
      kind,
      x,
      y,
      moved: false,
      center: screenToWorld(frame, frame.width / 2, frame.height / 2),
      window: displayedWindow.current,
      shapeId: shape ? shape.id : band,
      vertex,
      path: [[x, y]],
      start: screenToWorld(frame, x, y),
      last: [x, y],
    };
    containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const [x, y] = pointer(e);
    if (!d) {
      if (draft) setHover([x, y]);
      return;
    }
    const [dx, dy] = [x - d.x, y - d.y];
    d.moved = d.moved || Math.abs(dx) + Math.abs(dy) > CLICK_TOLERANCE;
    if (!d.moved) return;
    const shift = add(scale(frame.right, dx), scale(frame.down, dy));
    if (d.kind === "pan" || d.kind === "cursor" || d.kind === "band") {
      // We emit the center the panel can show, so that a drag past the edge of the volume does not have to come back
      // before the view moves again
      const center = clampToVolume(ref.affine, invRef, ref.shape, sub(d.center, shift), flat);
      const moved = panelFrame(axes, ref.affine, ref.shape, cursor, center, view.zoom || 1, size.width, size.height);
      emitView({ center: screenToWorld(moved, size.width / 2, size.height / 2) });
    } else if (d.kind === "window") {
      // Dragging right widens the window (less contrast), dragging down raises the level (darker)
      const [level, width] = d.window;
      emitView({ windows: { ...view.windows, [ref.id]: [level + (dy * width) / 200, width * Math.exp(dx / 200)] } });
    } else if (d.kind === "shape" || d.kind === "vertex") {
      setShapeShift({ id: d.shapeId, delta: shift, vertex: d.kind === "vertex" ? d.vertex : undefined });
    } else if (d.kind === "box") {
      // The cursor follows the middle of the box on the panel slice, so that the other planes cut through the box and
      // show its depth while the wheel moves the slice
      d.last = [x, y];
      const box = boxFrom(d.start, x, y);
      const middle = scale(box.points.reduce(add), 1 / box.points.length);
      emitView({ drawing: box, cursor: add(middle, scale(frame.normal, dot(sub(cursor, middle), frame.normal))) });
    } else if (d.kind === "lasso") {
      const [lx, ly] = d.path[d.path.length - 1];
      if (Math.abs(x - lx) + Math.abs(y - ly) >= 2) {
        d.path.push([x, y]);
        setDraft(d.path.map(([px, py]) => screenToWorld(frame, px, py)));
      }
    }
  };

  // Emit a drawn polygon with the reference slice spacing as thickness, the slab it stands for in other planes
  const emitPolygon = (points: Vec3[], modKeys: string[]) => {
    setDraft(null);
    setHover(null);
    if (points.length >= 3) props.onMouseSelect?.(modKeys, [{ kind: "polygon", points, thickness: spacing }]);
  };

  // Close the polygon being drawn, without the duplicate points left by a double click
  const closeDraft = (modKeys: string[]) => {
    const screen = draft.map((p) => worldToScreen(frame, cursor, p));
    emitPolygon(
      draft.filter((_, idx) => {
        const [x, y] = screen[idx];
        const [nx, ny] = screen[(idx + 1) % screen.length];
        return Math.abs(x - nx) + Math.abs(y - ny) > CLICK_TOLERANCE;
      }),
      modKeys
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const [x, y] = pointer(e);
    const modKeys = makeModKeys(e);
    if (d.kind === "cursor" && !d.moved) {
      emitView({ cursor: clampToVolume(ref.affine, invRef, ref.shape, screenToWorld(frame, x, y), flat) });
      props.onClick?.(null, modKeys);
    } else if (d.kind === "shape" && !d.moved) {
      props.onClick?.(d.shapeId, modKeys);
    } else if (d.kind === "vertex" && !d.moved) {
      props.onClick?.(d.shapeId, modKeys);
    } else if (d.kind === "band" && !d.moved) {
      // The cursor glides along the polygon normal onto its plane, so that panels parallel to the polygon scroll to it
      // and a panel perpendicular to it keeps its slice
      const shape = props.shapes.find((s) => s.id === d.shapeId);
      const pointed = screenToWorld(frame, x, y);
      const normal = polygonNormal(shape.points);
      const onPlane = sub(pointed, scale(normal, dot(sub(pointed, shape.points[0]), normal)));
      glideCursor(cursor, clampToVolume(ref.affine, invRef, ref.shape, onPlane, flat), (p) => emitView({ cursor: p }));
      props.onClick?.(shape.id, modKeys);
    } else if (d.kind === "shape" || d.kind === "vertex") {
      // The moved shape or vertex is emitted once on release, the Store then records a single change
      const shape = props.shapes.find((s) => s.id === d.shapeId);
      const shift = add(scale(frame.right, x - d.x), scale(frame.down, y - d.y));
      setShapeShift(null);
      if (shape && shape.editable !== false)
        props.onShapeChange?.(
          shape.id,
          shape.points.map((p, idx) => (d.kind === "shape" || idx === d.vertex ? add(p, shift) : p))
        );
    } else if (d.kind === "draw" && !d.moved && props.tool === "point") {
      props.onMouseSelect?.(modKeys, [{ kind: "point", points: [screenToWorld(frame, x, y)] }]);
    } else if (d.kind === "draw" && !d.moved && props.tool === "polygon") {
      // A click near the first point closes the polygon, other clicks add a point
      const [fx, fy] = draft ? worldToScreen(frame, cursor, draft[0]) : [Infinity, Infinity];
      if (draft && draft.length >= 3 && Math.hypot(x - fx, y - fy) <= CLOSE_DISTANCE) closeDraft(modKeys);
      else setDraft([...(draft || []), screenToWorld(frame, x, y)]);
    } else if (d.kind === "box") {
      // A box needs some width and height on the panel, its depth may be a single slice
      emitView({ drawing: null });
      if (Math.abs(x - d.x) > CLICK_TOLERANCE && Math.abs(y - d.y) > CLICK_TOLERANCE)
        props.onMouseSelect?.(modKeys, [boxFrom(d.start, x, y)]);
    } else if (d.kind === "lasso") {
      const kept = simplifyPath(d.path, LASSO_TOLERANCE);
      emitPolygon(
        kept.map((idx) => screenToWorld(frame, d.path[idx][0], d.path[idx][1])),
        modKeys
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    cancelAnimationFrame(glideFrame);
    const steps = { ArrowUp: 1, PageUp: 1, ArrowDown: -1, PageDown: -1 };
    if (e.key in steps && !flat) {
      e.preventDefault();
      emitView({ cursor: stepCursor(ref.affine, invRef, ref.shape, frame.normal, cursor, steps[e.key]) });
    } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && ref.frames.length > 1) {
      e.preventDefault();
      const current = (view.frames || {})[ref.id] || 0;
      const next = Math.min(ref.frames.length - 1, Math.max(0, current + (e.key === "ArrowRight" ? 1 : -1)));
      emitView({ frames: { ...view.frames, [ref.id]: next } });
    } else if (draft && e.key === "Enter") {
      closeDraft(makeModKeys(e));
    } else if (draft && e.key === "Escape") {
      setDraft(null);
      setHover(null);
    } else {
      props.onKeyPress?.(e.key, makeModKeys(e));
    }
  };

  const styleOf = (shape: VolumeShape): Partial<ImageAnnotationStyle> => ({
    strokeColor: shape.object === undefined || shape.object === null ? "#ffd400" : objectColor(shape.object),
    strokeWidth: 2,
    fillColor: "transparent",
    opacity: 1,
    ...(typeof shape.style === "string" ? props.shapeStyles[shape.style] : shape.style),
  });
  const hoverListeners = (shape: VolumeShape) => ({
    onMouseEnter: (e: any) => props.onMouseEnterShape?.(shape.id, makeModKeys(e.evt)),
    onMouseLeave: (e: any) => props.onMouseLeaveShape?.(shape.id, makeModKeys(e.evt)),
  });

  // Whether a shape shows as itself on the panel slice rather than as a cross-section band: a point within half its
  // thickness (half a reference slice by default), or a polygon or box parallel to the panel within its slab. A box
  // seen edge on is a band even when it is thinner than its slab, eg a short box in a coronal panel through its middle
  const onSlice = (shape: VolumeShape, points: Vec3[]) =>
    flat ||
    ((shape.kind === "point" || Math.abs(dot(polygonNormal(points), frame.normal)) > 0.99) &&
      points.every((p) => Math.abs(dot(sub(p, cursor), frame.normal)) <= (shape.thickness ?? spacing) / 2 + 1e-3));

  const renderShape = (shape: VolumeShape) => {
    const shift = shapeShift && shapeShift.id === shape.id ? shapeShift : null;
    const moved = (p: Vec3, idx: number) =>
      shift && (shift.vertex === undefined || shift.vertex === idx) ? add(p, shift.delta) : p;
    if (!onSlice(shape, shape.points.map(moved))) return null;
    const projected = shape.points.map((p, idx) => worldToScreen(frame, cursor, moved(p, idx)));
    const selected = props.selected.includes(shape.id);
    const style = styleOf(shape);
    const strokeWidth = selected ? style.strokeWidth * 2 : style.strokeWidth;
    const listeners = { onPointerDown: () => (pressedShape.current = shape.id), ...hoverListeners(shape) };
    const [x, y] = projected[0];
    return (
      <React.Fragment key={shape.id}>
        {shape.kind === "point" ? (
          <Circle
            x={x}
            y={y}
            radius={5}
            stroke={style.strokeColor}
            strokeWidth={strokeWidth}
            fill={style.fillColor}
            opacity={style.opacity}
            {...listeners}
          />
        ) : (
          <Line
            points={projected.flatMap(([px, py]) => [px, py])}
            closed
            stroke={style.strokeColor}
            strokeWidth={strokeWidth}
            fill={style.fillColor}
            opacity={style.opacity}
            {...listeners}
          />
        )}
        {shape.kind === "polygon" && selected && props.mode === "move" && shape.editable !== false
          ? projected.map(([vx, vy], idx) => (
              // Handles of the selected polygon, dragging one moves that point only
              <Rect
                key={idx}
                x={vx - 4}
                y={vy - 4}
                width={8}
                height={8}
                fill="white"
                stroke={style.strokeColor}
                strokeWidth={1}
                onPointerDown={() => {
                  pressedShape.current = shape.id;
                  pressedVertex.current = idx;
                }}
              />
            ))
          : null}
        {shape.label ? (
          <Text
            text={shape.label}
            x={x + 8}
            y={y - 6}
            fontSize={12}
            fill={style.textColor || style.strokeColor}
            listening={false}
          />
        ) : null}
      </React.Fragment>
    );
  };

  // The shapes, and the box being drawn in a panel of the view
  const shapes: VolumeShape[] = view.drawing
    ? [...props.shapes, { ...view.drawing, id: DRAWING_ID, style: DRAWING_STYLE }]
    : props.shapes;

  // Cross-sections of the polygons and boxes that do not lie within the panel slice, grouped by object (or by shape
  // without object) to be drawn in one cached group each
  const sections = new Map<any, { shape: VolumeShape; pieces: number[][] }[]>();
  for (const shape of shapes) {
    if (shape.kind === "point" || onSlice(shape, shape.points)) continue;
    // A slab seen edge on shows at least 2 pixels wide, eg a box on one slice in a coronal panel
    const thickness = Math.max(shape.thickness ?? spacing, 2 * frame.mmPerPx);
    const pieces = slabSection(shape.points, thickness, cursor, frame.normal).map((piece) =>
      piece.flatMap((p) => worldToScreen(frame, cursor, p).slice(0, 2))
    );
    if (!pieces.length) continue;
    const key = shape.object === undefined || shape.object === null ? shape : shape.object;
    sections.set(key, [...(sections.get(key) || []), { shape, pieces }]);
  }
  const selectedSections = [...sections.values()].flat().filter(({ shape }) => props.selected.includes(shape.id));

  const [cx, cy] = worldToScreen(frame, cursor, cursor);
  const [horizontal, vertical] = CROSS_PLANES[plane];
  const { width, height } = size;
  const letter = (x: number, y: number, direction: Vec3) => (
    <Text
      text={directionLetter(direction, ref.affine, ref.axis_letters)}
      x={x}
      y={y}
      fontSize={13}
      fill="white"
      shadowColor="black"
      shadowBlur={2}
      listening={false}
    />
  );
  const frameIdx = (view.frames || {})[ref.id] || 0;
  // Slices of the shown reference frame still on their way, and whether the slice under the cursor still shows the
  // preview, so that nobody draws on it unaware
  const nk = ref.shape[0];
  const shownFrame = getFrame(ref.id, frameIdx);
  const loadedCount = shownFrame?.loadedCount || 0;
  const cursorSlice = Math.min(nk - 1, Math.max(0, Math.round(voxelToWorld(invRef, cursor)[2])));
  const previewed = shownFrame?.preview && !shownFrame.loaded[cursorSlice] ? "preview, " : "";
  const loadingLabel = loadedCount < nk ? `${previewed}slices ${loadedCount}/${nk}` : "";
  const frameLabel =
    ref.frames.length > 1 ? `${frameIdx + 1}/${ref.frames.length} ${(ref.frames[frameIdx] as any).label || ""}` : "";

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={(e) => draft && props.tool === "polygon" && closeDraft(makeModKeys(e))}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        outline: "none",
        background: "black",
        ...props.style,
      }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", left: 0, top: 0, width, height }} />
      <Stage width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
        <Layer>
          <Line
            points={[0, cy, cx - CROSSHAIR_GAP, cy]}
            stroke={PLANE_COLORS[horizontal]}
            strokeWidth={1}
            listening={false}
          />
          <Line
            points={[cx + CROSSHAIR_GAP, cy, width, cy]}
            stroke={PLANE_COLORS[horizontal]}
            strokeWidth={1}
            listening={false}
          />
          <Line
            points={[cx, 0, cx, cy - CROSSHAIR_GAP]}
            stroke={PLANE_COLORS[vertical]}
            strokeWidth={1}
            listening={false}
          />
          <Line
            points={[cx, cy + CROSSHAIR_GAP, cx, height]}
            stroke={PLANE_COLORS[vertical]}
            strokeWidth={1}
            listening={false}
          />
          {[...sections.values()].map((group) => (
            <CachedGroup key={group[0].shape.id} opacity={BAND_OPACITY}>
              {group.flatMap(({ shape, pieces }) =>
                pieces.map((piece, idx) => (
                  <Line
                    key={`${shape.id} ${idx}`}
                    name="band"
                    points={piece}
                    closed
                    fill={styleOf(shape).strokeColor}
                    onPointerDown={() => (pressedBand.current = shape.id)}
                    {...hoverListeners(shape)}
                  />
                ))
              )}
            </CachedGroup>
          ))}
          {selectedSections.flatMap(({ shape, pieces }) =>
            pieces.map((piece, idx) => (
              <Line
                key={`${shape.id} ${idx}`}
                points={piece}
                closed
                stroke={styleOf(shape).strokeColor}
                strokeWidth={2}
                listening={false}
              />
            ))
          )}
          {shapes.map(renderShape)}
          {draft ? (
            <Line
              points={[
                ...draft.map((p) => worldToScreen(frame, cursor, p).slice(0, 2)),
                ...(hover && props.tool === "polygon" ? [hover] : []),
              ].flat()}
              stroke="#4fc3f7"
              strokeWidth={2}
              dash={props.tool === "polygon" ? [6, 4] : undefined}
              listening={false}
            />
          ) : null}
          {letter(width - 16, height / 2 - 6, frame.right)}
          {letter(6, height / 2 - 6, scale(frame.right, -1))}
          {letter(width / 2 - 4, height - 18, frame.down)}
          {letter(width / 2 - 4, 6, scale(frame.down, -1))}
          {frameLabel ? (
            <Text text={frameLabel} x={6} y={height - 18} fontSize={12} fill="white" listening={false} />
          ) : null}
          {loadingLabel ? (
            // One right-aligned line, so that `slices n/N` stays in place when `preview, ` shows on its left
            <Text
              text={loadingLabel}
              x={6}
              y={height - 18}
              width={width - 12}
              align="right"
              wrap="none"
              fontSize={12}
              fill="white"
              listening={false}
            />
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
};

AnnotatedVolume.defaultProps = {
  layers: [],
  plane: "axial",
  view: {},
  shapes: [],
  shapeStyles: {},
  selected: [],
  mode: "move",
  tool: "point",
};
