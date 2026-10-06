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
