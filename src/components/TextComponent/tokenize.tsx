import {CSSProperties} from "react";

import {SpanData, TokenAnnotation, TokenData} from '../../types';

type TextChunk = {
    begin: number;
    end: number;
    label: string;
    token_annotations: TokenAnnotation[];
    tokens: string[];
}

export interface PreprocessedStyle extends CSSProperties {
    shape: string;
    '--border-color'?: string;
    '--background-color'?: string;
    '--z-index'?: string;
}

function chunkText(spans: SpanData[], text: string): TextChunk[] {
    // Find the minimum text split indices, ie the entities boundaries + split each new chunk into tokens
    let indices = [];
    for (let span_i = 0; span_i < spans.length; span_i++) {
        const begin = spans[span_i].begin;
        const end = spans[span_i].end;
        indices.push(begin, end);
    }
    indices.push(0, text.length);
    indices = indices.sort((a, b) => a - b);
    let text_chunks: TextChunk[] = [];
    let begin, end, text_slice;
    for (let indice_i = 1; indice_i < indices.length; indice_i++) {
        begin = indices[indice_i - 1];
        end = indices[indice_i];
        text_slice = text.slice(begin, end);
        text_chunks.push({
            begin: indices[indice_i - 1],
            end: indices[indice_i],
            label: null,
            token_annotations: [],
            tokens: text_slice.length > 0
                ? text_slice
                    .match(/\n|[^ \n]+|[ ]+/g)
                    .filter(text => text.length > 0)
                : [""]
        });
    }
    return text_chunks;
}

function styleTextChunks_(text_chunks: TextChunk[], spans: SpanData[], styles: { [key: string]: PreprocessedStyle }) {
    const isNot = filled => !filled;
    spans.forEach(({begin, end, label, style, ...rest}) => {
        let newDepth = null;
        for (let text_chunk_i = 0; text_chunk_i < text_chunks.length; text_chunk_i++) {
            if (text_chunks[text_chunk_i].begin < end && begin < text_chunks[text_chunk_i].end) {
                if (text_chunks[text_chunk_i].begin === begin) {
                    text_chunks[text_chunk_i].label = label;
                }
                if (newDepth === null && !rest.mouseSelected && styles[style]?.shape !== "fullHeight") {
                    let missingDepths = [undefined];
                    for (const {depth, mouseSelected} of text_chunks[text_chunk_i].token_annotations) {
                        if (!mouseSelected) {
                            missingDepths[depth] = true;
                        }
                    }
                    newDepth = missingDepths.findIndex(isNot);
                    if (newDepth === -1) {
                        newDepth = missingDepths.length;
                    }
                }
                text_chunks[text_chunk_i].token_annotations.unshift({
                    depth: newDepth,
                    openleft: text_chunks[text_chunk_i].begin !== begin,
                    openright: text_chunks[text_chunk_i].end !== end,
                    label: label,
                    isFirstTokenOfSpan: text_chunks[text_chunk_i].begin === begin,
                    style: style,
                    ...rest,
                });
            }
        }
    });
}

/**
 * Split text chunks into multiple lines, each composed of a subset of the total text chunks
 * @param text_chunks: text chunks obtained by the `segment` function
 */
function tokenizeTextChunks(text_chunks: TextChunk[]): TokenData[][] {
    let current_line: TokenData[] = [];
    const all_lines: TokenData[][] = [];

    let tokens = [];
    for (let i = 0; i < text_chunks.length; i++) {
        const text_chunk = text_chunks[i];
        const begin = text_chunk.begin;
        const token_annotations = text_chunk.token_annotations;
        tokens = text_chunk.tokens;

        let offset_in_text_chunk = 0;
        for (let token_i = 0; token_i < tokens.length; token_i++) {
            const span_begin = begin + offset_in_text_chunk;
            const span_end = begin + offset_in_text_chunk + tokens[token_i].length;
            if (tokens[token_i] === "\n") {
                all_lines.push(current_line)
                current_line = [];
            } else {
                current_line.push({
                    text: tokens[token_i],
                    key: `${span_begin}-${span_end}`,
                    begin: span_begin,
                    end: span_end,
                    token_annotations: token_annotations,
                    isFirstTokenOfChunk: token_i === 0,
                    isLastTokenOfChunk: token_i === tokens.length - 1,
                });
            }
            offset_in_text_chunk += tokens[token_i].length;
        }
    }
    if (current_line.length > 0 || tokens.length && tokens[tokens.length - 1] === "\n") {
        all_lines.push(current_line)
    }
    return all_lines;
}

export default function tokenize(spans: SpanData[], text: string, styles: { [key: string]: PreprocessedStyle }): {
    lines: TokenData[][];
    ids: any[];
} {
    // Sort the original spans to display
    spans = spans.sort(
        ({begin: begin_a, end: end_a, mouseSelected: mouseSelected_a}, {begin: begin_b, end: end_b, mouseSelected: mouseSelected_b}) =>
            mouseSelected_a === mouseSelected_b
                ? begin_a !== begin_b ? begin_a - begin_b : end_b - end_a
                : (mouseSelected_a ? -1 : 1)
    ).map(span => ({...span, text: text.slice(span.begin, span.end)}));

    const text_chunks = chunkText(spans, text);
    styleTextChunks_(text_chunks, spans, styles);

    const ids = spans.map(span => span.id);
    const linesOfTokens = tokenizeTextChunks(text_chunks);

    return {lines: linesOfTokens, ids: ids}; //.filter(({ token_annotations }) => token_annotations.length > 0);
}