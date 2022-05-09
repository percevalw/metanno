import {CSSProperties} from "react";

export type Hyperlink = {
    key: string;
    text: string;
}

export type SpanAnnotation = {
    id?: string;
    label?: string;
    style?: string;
    selected?: boolean;
    highlighted?: boolean;
}


export type TextRange = {
    begin: number;
    end: number;
};

export type SpanData = {
    mouseSelected: boolean;
} & TextRange & SpanAnnotation;

export type TokenAnnotation = {
    depth: number;
    openleft: boolean;
    openright: boolean;
    isFirstTokenOfSpan: boolean;
    mouseSelected: boolean;
} & SpanAnnotation;

export type TokenData = {
    text: string;
    isFirstTokenOfChunk: boolean,
    isLastTokenOfChunk: boolean,
    key: string;
    token_annotations: TokenAnnotation[],
} & TextRange;

export type QuickStyle = {
    color: string;
    border: string;
    alpha: number;
    shape: string;
} & CSSProperties;

export type TextData = {
    text: string;
    spans: SpanData[];
    mouse_selection: TextRange[];
    styles: { [style_name: string]: QuickStyle };
}


export type ColumnData = {
    key: string;
    name: string;
    type: string;
    mutable: boolean;
    filterable: boolean;
};

export type RowData = {
    [other: string]: any;
};

export type Filters = {
    [key: string]: any;
};

export type ButtonData = {
    type?: string;
    label: string;
    secondary?: string;
    color?: string;
    onMouseDown: (event: React.MouseEvent<HTMLSpanElement>) => void;
};

export type ToolbarData = {
    buttons: ButtonData[],
}

export type TableData = {
    rows: RowData[];
    rowKey: string;
    selectedRows: string[];
    highlightedRows: string[];
    columns: ColumnData[];
    suggestions?: (Hyperlink | string)[],
    filters: Filters;
    inputValue: any;
}