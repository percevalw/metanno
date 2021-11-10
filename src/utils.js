import isEqual from "react-fast-compare";
import React from "react";

export {isEqual};
export const shallowCompare = (obj1, obj2) =>
    obj1 === obj2 ||
    (typeof obj1 === 'object' && typeof obj2 == 'object' &&
    obj1 !== null && obj2 !== null &&
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]));


function segment(spans, text) {
    // Find the minimum text split indices, ie the entities boundaries + split each new chunk into tokens
    let indices = [];
    for (let span_i = 0; span_i < spans.length; span_i++) {
        const begin = spans[span_i].begin;
        const end = spans[span_i].end;
        indices.push(begin, end);
    }
    indices.push(0, text.length);
    indices = indices.sort((a, b) => a - b);
    let text_chunks = [];
    let begin, end, text_slice;
    for (let indice_i = 1; indice_i < indices.length; indice_i++) {
        begin = indices[indice_i - 1];
        end = indices[indice_i];
        text_slice = text.slice(begin, end);
        text_chunks.push({
            begin: indices[indice_i - 1],
            end: indices[indice_i],
            metadata_list: [],
            tokens: text_slice.length > 0
                ? text_slice
                    .match(/\n|[^ \n]+|[ ]+/g)
                    .filter(text => text.length > 0)
                : [""]
        });
    }
    return text_chunks;
}

function styleTextChunks_(text_chunks, spans) {
    const isNot = filled => !filled;
    spans.forEach(({begin, end, label, style, ...meta}) => {
        let newDepth = null;
        for (let text_chunk_i = 0; text_chunk_i < text_chunks.length; text_chunk_i++) {
            if (text_chunks[text_chunk_i].begin < end && begin < text_chunks[text_chunk_i].end) {
                if (text_chunks[text_chunk_i].begin === begin) {
                    text_chunks[text_chunk_i].label = label;
                }
                if (newDepth === null && !meta.mouseSelected) {
                    let missingDepths = [undefined];
                    for (const {depth, mouseSelected} of text_chunks[text_chunk_i].metadata_list) {
                        if (!mouseSelected) {
                            missingDepths[depth] = true;
                        }
                    }
                    newDepth = missingDepths.findIndex(isNot);
                    if (newDepth === -1) {
                        newDepth = missingDepths.length;
                    }
                }
                text_chunks[text_chunk_i].metadata_list.unshift({
                    depth: newDepth,
                    openleft: text_chunks[text_chunk_i].begin !== begin,
                    openright: text_chunks[text_chunk_i].end !== end,
                    label: label,
                    first_token: text_chunks[text_chunk_i].begin === begin,
                    style: style,
                    ...meta,
                });
            }
        }
    });
}

function splitLines(text_chunks) {
    let current_line = [];
    const all_lines = [];
    for (let i = 0; i < text_chunks.length; i++) {
        const text_chunk = text_chunks[i];
        const begin = text_chunk.begin;
        const tokens = text_chunk.tokens;
        const metadata_list = text_chunk.metadata_list;

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
                    span_begin: span_begin,
                    span_end: span_end,
                    metadata_list: metadata_list,
                    is_first: token_i === 0,
                    is_last: token_i === tokens.length - 1,
                });
            }
            offset_in_text_chunk += tokens[token_i].length;
        }
    }
    return all_lines;
}

export function spanToTextChunks(spans, text, selections, highlights) {

    // Sort the original spans to display
    spans = spans.sort(
        ({begin: begin_a, end: end_a, mouseSelected: mouseSelected_a}, {begin: begin_b, end: end_b, mouseSelected: mouseSelected_b}) =>
            mouseSelected_a === mouseSelected_b
                ? begin_a !== begin_b ? begin_a - begin_b : end_b - end_a
                : (mouseSelected_a ? -1 : 1)
    ).map(span => ({...span, text: text.slice(span.begin, span.end)}));

    const text_chunks = segment(spans, text);
    styleTextChunks_(text_chunks, spans);

    const ids = spans.map(span => span.id);
    const lines = splitLines(text_chunks);

    return {lines: lines, ids: ids}; //.filter(({ metadata_list }) => metadata_list.length > 0);
}

export const replaceObject = (obj, new_obj) => {
    Object.keys(obj).forEach(key => {
      delete obj[key];
    })
    Object.assign(obj, new_obj);
}

export const memoize = (factory, checkDeps=(input => input), shallow = false, post = false) => {
    let last = null;
    let cache = null;
    return (...args) => {
        if (post) {
            const new_state = factory(...args);
            if (!(shallow && shallowCompare(new_state, cache) || isEqual(new_state, cache))) {
                cache = new_state;
            }
            return cache;
        }
        else {
            const state = checkDeps(...args);
            if (!(shallow && shallowCompare(last, state) || isEqual(last, state))) {
                last = state;
                cache = factory(...args);
            }
            return cache;
        }
    }
};