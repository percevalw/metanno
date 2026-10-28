import React, { CSSProperties, MutableRefObject, RefObject } from "react";

export type Hyperlink = {
  key: string;
  text: string;
};

export type Annotation = {
  id?: string;
  label?: string;
  style?: string;
  selected?: boolean;
  highlighted?: boolean;
};

// Text types

export type TextRange = {
  begin: number;
  end: number;
};

export type TextAnnotation = {
  mouseSelected: boolean;
  labelText: string;
} & TextRange &
  Annotation;

export type TokenAnnotation = {
  depth: number;
  zIndex: number;
  openleft: boolean;
  openright: boolean;
  isFirstTokenOfSpan: boolean;
  mouseSelected: boolean;
  labelText: string;
} & Annotation;

export type TokenData = {
  text: string;
  isFirstTokenOfChunk: boolean;
  isLastTokenOfChunk: boolean;
  tokenIndexInChunk: number;
  key: string;
  token_annotations: TokenAnnotation[];
} & TextRange;

export type TextAnnotationStyle = {
  color: string;
  backgroundColor: string;
  borderColor: string;
  autoNestingLayout: boolean;
  labelPosition: string;
  shape: string;
} & CSSProperties;

export type TextData = {
  text: string;
  spans: { [key: string]: any }[];
  mouseSelection: TextRange[];
  annotationStyles: { [styleName: string]: TextAnnotationStyle };
  style: CSSProperties;
  beginKey: string;
  endKey: string;
  labelKey: string;
  labelFormatter?: (span: { [key: string]: any }) => string;
  styleKey: string;
  highlightedKey: string;
  /** IDs of spans styled as highlighted without rendering the text again, such as hovered spans */
  highlighted?: (string | number)[];
  selectedKey: string;
  primaryKey: string;
};

export type TextMethods = {
  handle?: MutableRefObject<{
    scroll_to_line?: (line: number, behavior: ScrollBehavior) => void;
    scroll_to_span?: (span_id: string, behavior: ScrollBehavior) => void;
    clear_current_mouse_selection?: () => void;
  }>;
  onKeyPress?: (key: string, ranges: TextRange[], modkeys: string[]) => void;
  onClickSpan?: (span_id: any | null, modkeys: string[]) => void;
  onMouseEnterSpan?: (span_id: any, modkeys: string[]) => void;
  onMouseLeaveSpan?: (span_id: any, modkeys: string[]) => void;
  onMouseHoverSpans?: (
    span_ids: string[],
    modkeys: string[],
    spans?: RowData[]
  ) => void;
  onMouseSelect?: (ranges: TextRange[], modkeys: string[]) => void;
};

// Image types

export type ImageAnnotationStyle = {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  opacity: number;
  shape: string;
  fontSize: number;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  textColor?: string;
};

export type Shape = {
  type: string;
  points: number[];
};

export type ImageAnnotation = {
  mouseSelected: boolean;
} & Shape &
  Annotation;

export type ImageData = {
  image: string;
  annotations: ImageAnnotation[];
  mouseSelection: Shape[];
  annotationStyles: { [styleName: string]: ImageAnnotationStyle };
  style: CSSProperties;
};

export type ImageMethods = {
  handle?: MutableRefObject<{}>;
  onKeyPress?: (key: string, modkeys: string[]) => void;
  onClick?: (shape_id: any, modkeys: string[]) => void;
  onMouseEnterShape?: (shape_id: any, modkeys: string[]) => void;
  onMouseLeaveShape?: (shape_id: any, modkeys: string[]) => void;
  onMouseSelect?: (modkeys: string[], shapes: Shape[]) => void;
};

// Volume types, positions are millimetres in DICOM patient space (LPS)

export type VolumeMeta = {
  id: string;
  shape: number[];
  dtype: string;
  affine: number[][];
  frames: object[];
  window?: [number, number] | null;
  // Rows and columns kept by the panels, one every `step`, for volumes wider than the 3D textures of the GPU
  step?: number;
  // Patient directions of the i and j voxel axes, eg ["P", "L"], lettering the panel edges along them
  axis_letters?: string[] | null;
};

export type VolumeLayer = {
  volume: string;
  colormap?: "gray" | "hot" | "labels";
  opacity?: number;
};

export type VolumeView = {
  cursor?: [number, number, number];
  orientation?: number[][];
  center?: [number, number, number];
  zoom?: number;
  windows?: { [volumeId: string]: [number, number] };
  frames?: { [volumeId: string]: number };
};

export type VolumeShape = {
  id: any;
  kind: "point" | "polygon";
  points: [number, number, number][];
  label?: string;
  style?: string | Partial<ImageAnnotationStyle>;
  editable?: boolean;
  // Shapes sharing an object, eg the outlines of one lesion, share a color
  object?: any;
  // Slab thickness of a polygon in millimetres, half on each side of its plane
  thickness?: number;
};

export type VolumeData = {
  volumes: VolumeMeta[];
  loadSlices: (
    volumeId: string,
    frame: number,
    start: number,
    stop: number,
    step?: number
  ) => Promise<{ shape: number[]; dtype: string; bytes: Uint8Array; compression?: "deflate" }>;
  layers: VolumeLayer[];
  plane: "axial" | "sagittal" | "coronal";
  view: VolumeView;
  shapes: VolumeShape[];
  shapeStyles: { [styleName: string]: Partial<ImageAnnotationStyle> };
  selected: any[];
  mode: "move" | "edit";
  tool: "point" | "polygon" | "lasso";
  style: CSSProperties;
};

export type VolumeMethods = {
  onViewChange?: (patch: VolumeView) => void;
  onMouseSelect?: (modkeys: string[], shapes: Pick<VolumeShape, "kind" | "points" | "thickness">[]) => void;
  onShapeChange?: (shape_id: any, points: [number, number, number][]) => void;
  onClick?: (shape_id: any, modkeys: string[]) => void;
  onMouseEnterShape?: (shape_id: any, modkeys: string[]) => void;
  onMouseLeaveShape?: (shape_id: any, modkeys: string[]) => void;
  onKeyPress?: (key: string, modkeys: string[]) => void;
};

// Table types

export type ColumnData = {
  key: string;
  name: string;
  kind: string;
  editable: boolean;
  filterable: boolean;
  choices?: any[];
  placeholder?: string;
};

export type RowData = {
  [other: string]: any;
};

export type Filters = {
  [key: string]: any;
};

// Same shape as the sort of PRET DataFrame queries
export type TableSort = { column: string; direction: "asc" | "desc" }[];

export type TableData = {
  rows: RowData[];
  rowSource?: import("react-data-grid").AsyncRowSource<RowData>;
  preserveSelection?: boolean;
  primaryKey?: string | null;
  highlightedRows: (string | RowData)[];
  isRowHighlighted?: (row: RowData) => boolean;
  columns: ColumnData[];
  suggestions?: (Hyperlink | string)[];
  filters: Filters;
  sort?: TableSort;
  inputValue: any;
  selection?: {
    row_idx: number | null;
    col: string | null;
    mode: "EDIT" | "SELECT";
    ranges?: { row_idx: number }[];
  };
  multiSelectionMode?: false | "rows";
  autoFilter?: boolean;
  subset?: number[];
  style: CSSProperties;
};

export type TableMethods = {
  handle?: MutableRefObject<
    | {
        scroll_to_row_idx?: (number) => void;
        scroll_to_row_id?: (string) => void;
        focus?: () => void;
      }
    | any
  >;
  onFiltersChange?: (values: { [key: string]: string }, column: string) => void;
  onSortChange?: (sort: TableSort) => void;
  onSelectionChange?: (
    row_id: React.Key | null,
    row_idx: number | null,
    name: string | null,
    mode: string,
    cause: string,
    ranges?: { row_idx: number }[],
    row?: RowData | null,
    selectedRows?: RowData[]
  ) => void;
  onClickCellContent?: (
    row_id: string,
    row_idx: number,
    name: string,
    value?: any
  ) => boolean | void;
  onMouseEnterRow?: (
    row_id: string,
    row_idx: number,
    mod_keys: string[]
  ) => void;
  onMouseLeaveRow?: (
    row_id: string,
    row_idx: number,
    mod_keys: string[]
  ) => void;
  onMouseHoverRow?: (
    row_id: string | null,
    row_idx: number | null,
    mod_keys: string[],
    row?: RowData | null
  ) => void;
  onCellChange?: (
    row_id: string,
    row_idx: number,
    name: string,
    value: any
  ) => void;
  onInputChange: (
    row_id: string,
    row_idx: number,
    name: string,
    value: any,
    cause: string
  ) => void;
  onScrollBottom: (
    event: React.UIEvent<HTMLDivElement> | { isAtBottom: boolean }
  ) => any;
  onSubsetChange?: (subset: number[]) => void;
};
