import {TextRange} from "../types";

export function getDocumentSelectedRanges(): TextRange[] {
    const ranges: TextRange[] = [];
    let range = null;
    const get_span_begin = (range) => {
        return (range?.getAttribute?.("span_begin")
            || range.parentElement.getAttribute("span_begin")
            || range.parentElement.parentElement.getAttribute("span_begin"))
    }
    if (window.getSelection) {
        const selection = window.getSelection();
        let begin = null, end = null;
        for (let i = 0; i < selection.rangeCount; i++) {
            range = selection.getRangeAt(i);
            const startContainerBegin = parseInt(
                // @ts-ignore
                get_span_begin(range.startContainer),
                10
            );
            const endContainerBegin = parseInt(
                // @ts-ignore
                get_span_begin(range.endContainer),
                10
            );
            if (!isNaN(startContainerBegin)) {
                if (!isNaN(begin) && begin !== null) {
                    begin = Math.min(begin, range.startOffset + startContainerBegin);
                } else {
                    begin = range.startOffset + startContainerBegin;
                }
            }
            if (!isNaN(endContainerBegin)) {
                if (!isNaN(begin) && begin !== null) {
                    end = Math.max(end, range.endOffset + endContainerBegin);
                } else {
                    end = range.endOffset + endContainerBegin;
                }
            }
        }
        if (!isNaN(begin) && begin !== null && !isNaN(end) && end !== null && begin !== end) {
            ranges.push({
                begin: begin,
                end: end,
            });
        }
        return ranges;
    } else { // @ts-ignore
        if (document.selection && document.selection.type !== "Control") {
        }
    }
    return ranges
}
