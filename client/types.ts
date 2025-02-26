import React, {CSSProperties} from "react";

export type Hyperlink = {
    key: string;
    text: string;
}

export type Annotation = {
    id?: string;
    label?: string;
    style?: string;
    selected?: boolean;
    highlighted?: boolean;
}

// Text types

export type TextRange = {
    begin: number;
    end: number;
};

export type TextAnnotation = {
    mouseSelected: boolean;
} & TextRange & Annotation;

export type TokenAnnotation = {
    depth: number;
    zIndex: number;
    openleft: boolean;
    openright: boolean;
    isFirstTokenOfSpan: boolean;
    mouseSelected: boolean;
} & Annotation;

export type TokenData = {
    text: string;
    isFirstTokenOfChunk: boolean,
    isLastTokenOfChunk: boolean,
    tokenIndexInChunk: number,
    key: string;
    token_annotations: TokenAnnotation[],
} & TextRange;

export type TextAnnotationStyle = {
    backgroundColor: string;
    borderColor: string
    autoNestingLayout: boolean;
    labelPosition: string;
    shape: string,
} & CSSProperties;

export type TextData = {
    text: string;
    spans: TextAnnotation[];
    mouseSelection: TextRange[];
    styles: { [style_name: string]: TextAnnotationStyle };
}

export type TextMethods = {
    actions?: {
        scroll_to_line?: (number) => void,
        scroll_to_span?: () => void,
        clear_current_mouse_selection?: () => void,
    };
    onKeyPress?: (key: string, modkeys: string[], ranges: TextRange[]) => void;
    onClickSpan?: (span_id: any, modkeys: string[]) => void;
    onMouseEnterSpan?: (span_id: any, modkeys: string[]) => void;
    onMouseLeaveSpan?: (span_id: any, modkeys: string[]) => void;
    onMouseSelect?: (modkeys: string[], ranges: TextRange[]) => void
}

// Image types

export type ImageAnnotationStyle = {
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
    opacity: number;
    shape: string;
    labelPosition: string;
    fontSize: number;
    align: "left" | "center" | "right";
    verticalAlign: "top" | "middle" | "bottom";
}

export type Shape = {
    type: string;
    points: number[];
}

export type ImageAnnotation = {
    mouseSelected: boolean;
} & Shape & Annotation;


export type ImageData = {
    image: string;
    annotations: ImageAnnotation[];
    mouseSelection: Shape[];
    styles: { [style_name: string]: ImageAnnotationStyle };
}

export type ImageMethods = {
    actions?: {};
    onKeyPress?: (key: string, modkeys: string[]) => void;
    onClickShape?: (shape_id: any, modkeys: string[]) => void;
    onMouseEnterShape?: (shape_id: any, modkeys: string[]) => void;
    onMouseLeaveShape?: (shape_id: any, modkeys: string[]) => void;
    onMouseSelect?: (modkeys: string[], shapes: Shape[]) => void
}

// Table types

export type ColumnData = {
    key: string;
    name: string;
    type: string;
    editable: boolean;
    filterable: boolean;
};

export type RowData = {
    [other: string]: any;
};

export type Filters = {
    [key: string]: any;
};

export type TableData = {
    rows: RowData[];
    rowKey: string;
    highlightedRows: string[];
    columns: ColumnData[];
    suggestions?: (Hyperlink | string)[],
    filters: Filters;
    inputValue: any;
    position?: {row_id: string, col: string, mode: "EDIT" | "SELECT"};
}


export type TableMethods = {
    actions?: {
        scroll_to_row?: (number) => void,
        focus?: () => void,
    };
    onPositionChange?: (row_id: string, name: string, mode: string, cause: string) => void;
    onFiltersChange?: (values: {[key: string]: string}, column: string) => void;
    onClickCellContent?: (row_id: string, name: string, value?: any) => void;
    onKeyPress?: () => void;
    onMouseEnterRow?: (row_id: any, mod_keys: string[]) => void;
    onMouseLeaveRow?: (row_id: any, mod_keys: string[]) => void;
    onCellChange?: (row_id: any, name: string, value: any) => void;
    onInputChange: (row_id: any, name: string, value: any, cause: string) => void;
    onScrollBottom: (event: React.UIEvent<HTMLDivElement> | { isAtBottom: boolean }) => any;
}
