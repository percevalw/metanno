import React from "react";
import "./style.css";
import PropTypes from 'prop-types';
import {replaceObject, spanToTextChunks} from "../../utils"
import Color from 'color';
import {memoize} from "../../utils";
import XArrow from 'react-xarrows';
import {hyperlinkPublish} from "../../hyperlinkPubSub";
import cachedReconcile from "../../reconcile";

const make_mod_keys = (event) => {
    const modkeys = [];
    if (event.shiftKey || event.key === 'Shift')
        modkeys.push("Shift");
    if (event.metaKey || event.key === 'Meta')
        modkeys.push("Meta");
    if (event.ctrlKey || event.key === 'Ctrl')
        modkeys.push("Ctrl");
    return modkeys;
};

const scrollToElement = (element, inside, metadata_list, offset = 0) => {
    element.scrollIntoView();
};

const processStyles = ({color, border, alpha}) => {
    const backgroundColor = Color(color);
    const textColor = backgroundColor.isLight() ? '#000000de' : '#ffffffde';
    const borderColor = border ? Color(border) : backgroundColor.darken(0.01);
    return {
        '--border-color': borderColor.toString(),
        '--background-color': backgroundColor.alpha(alpha || 0.8).toString(),
        'color': textColor,
    };
};

const processAllStyles = memoize(
    styles => Object.assign({}, ...Object.keys(styles).map(key => ({[key]: processStyles(styles[key])})))
);

const Token = React.memo(({
                              text,
                              span_begin,
                              span_end,
                              is_first,
                              is_last,
                              metadata_list,
                              refs,
                              styles,
                              handleMouseEnterSpan,
                              handleMouseLeaveSpan,
                              handleClickSpan,
                          }) => {
    //const key = String(span_begin) + "-" + String(span_end);
    let annotations = []
    for (let metadata_i = 0; metadata_i < metadata_list.length; metadata_i++) {
        const metadata = metadata_list[metadata_i];
        if (metadata.mouseSelected) {
            annotations.push(
                <span
                    key="mouse-selection"
                    className={`mention_token mouse_selected`}/>
            );
        } else {
            annotations.push(
                <span
                    key={`annotation-${metadata_i}`}
                    onMouseEnter={(event) => handleMouseEnterSpan(event, metadata.id)}
                    onMouseLeave={(event) => handleMouseLeaveSpan(event, metadata.id)}
                    onMouseDown={(event) => {
                        handleClickSpan(event, metadata.id);
                        hyperlinkPublish({text: metadata.text, key: metadata.id}, event);
                    }}
                    className={`mention_token
                                ${metadata.highlighted ? 'highlighted' : ''}
                                ${metadata.selected ? 'selected' : ''}
                                ${metadata.first_token && is_first && !metadata.openleft ? "closedleft" : ""}
                                ${is_last && !metadata.openright ? "closedright" : ""}`}
                    style={{...styles[metadata.style], '--vertical-offset': `${7 + 2 * metadata.depth - (metadata.highlighted ? 2 : 0)}px`, zIndex: 1 + metadata.depth}}
                />
            );
        }
    }
    const n_labels = metadata_list.reduce((total, metadata) => (metadata.first_token ? total + 1 : total), 0);
    let label_idx = 0;
    return (

        <span
            //id={is_first ? (key): undefined}
            className="text-chunk"
            span_begin={span_begin}
            span_end={span_end}
        >{annotations}<span className="text-chunk-content"
                            span_begin={span_begin}
                            span_end={span_end}
                            style={{color: styles?.[metadata_list?.[metadata_list.length - 1]?.style]?.color}}>{text}</span>
            {is_first && metadata_list.map((metadata, i) => {
                if (metadata.first_token && metadata.label) {
                    label_idx += 1;
                    return (
                        <span
                            onMouseEnter={(event) => handleMouseEnterSpan(event, metadata.id)}
                            onMouseLeave={(event) => handleMouseLeaveSpan(event, metadata.id)}
                            className={`label ${(metadata.highlighted || metadata.selected) ? 'highlighted' : ''}`}
                            ref={is_first ? refs[metadata.id] : null}
                            key={metadata.id}
                            style={{
                                borderColor: styles[metadata.style]?.['--border-color'],
                                //top: `${2 * metadata.depth - 2}px`,
                                left: `${(n_labels - label_idx) * 4}px`,
                                zIndex: 50 + metadata.depth
                            }}>{metadata.label.toUpperCase()}</span>
                    )
                }
            })}
            </span>
    );
});

const Line = React.memo(({index, styles, tokens, labelsRefs, handleMouseEnterSpan, handleMouseLeaveSpan, handleClickSpan, divRef}) => {
    return (
        <div ref={divRef} className="line">
            <span className="line-number" key="line-number">{index}</span>
            {tokens.map(token => <Token
                {...token}
                refs={labelsRefs}
                styles={styles}
                handleMouseEnterSpan={handleMouseEnterSpan}
                handleMouseLeaveSpan={handleMouseLeaveSpan}
                handleClickSpan={handleClickSpan}
            />)}
        </div>
    );
});

export function getDocumentSelectedRanges() {
    const ranges = [];
    if (window.getSelection) {
        const selection = window.getSelection();
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            const start_container_begin = parseInt(
                range.startContainer.parentElement.parentNode.getAttribute("span_begin"),
                10
            );
            if (isNaN(start_container_begin)) continue;
            const end_container_begin = parseInt(
                range.endContainer.parentElement.parentNode.getAttribute("span_begin"),
                10
            );
            if (isNaN(end_container_begin)) continue;
            const begin = range.startOffset + start_container_begin;
            const end = range.endOffset + end_container_begin;
            if (begin !== end) {
                ranges.push({
                    begin: begin,
                    end: end,
                });
            }
        }
        return ranges;
    } else if (document.selection && document.selection.type !== "Control") {
    }
    return ranges
}

class SpanComponent extends React.Component {
    constructor(props) {
        super(props);
        props.registerActions({
            scroll_to_line: (line) => {
                if (line >= 0 && line < this.lineRefs.length) {
                    scrollToElement(this.lineRefs[line].current, this.containerRef.current);
                }
            },
            scroll_to_span: (span_id) => {
                if (this.labelsRefs[span_id]) {
                    scrollToElement(this.labelsRefs[span_id].current, this.containerRef.current, -5);
                }
            },
            clear_current_mouse_selection: () => {
                window.getSelection().removeAllRanges();
            }
        });
        this.lineRefs = [];
        this.labelsRefs = {};
        this.containerRef = React.createRef();
        this.previousSelectedSpans = "";
        this.spanToTextChunks = cachedReconcile(spanToTextChunks)
    }

    handleKeyUp = event => {
        // if (event.metaKey || event.key === 'Meta' || event.shiftKey || event.key === 'Shift') {
        //     return;
        // }
        let key = event.key;
        if (key === 'Spacebar' || key === " ") {
            key = " ";
        }
        const spans = getDocumentSelectedRanges();
        if (this.props.onKeyPress(
            key,
            make_mod_keys(event),
            [...this.props.mouse_selection, ...spans.map(({begin, end}) => ({begin, end}))],
        )) {
            event.stopPropagation();
            event.preventDefault();
        }
    };


    handleKeyDown = event => {
        if (event.key === 'Spacebar' || event.key === " ") {
            event.preventDefault();
        }
    };

    handleMouseUp = event => {
        if (event.type === "mouseup") {
            const spans = getDocumentSelectedRanges();
            window.getSelection().removeAllRanges();
            if (spans.length > 0) {
                //this.props.onMouseSelect([...this.props.mouse_selection, ...spans]);
                this.props.onMouseSelect(make_mod_keys(event), spans);
            } else {
                this.props.onMouseSelect(make_mod_keys(event), []);
            }
        }
    };

    handleClickSpan = (event, indice) => {
        if (this.props.onClickSpan && this.props.onClickSpan(indice, make_mod_keys(event))) {
            event.preventDefault();
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
        }
    };

    handleMouseEnterSpan = (event, indice) => {
        if (this.props.onEnterSpan && this.props.onEnterSpan(indice, make_mod_keys(event))) {
        }
    };

    handleMouseLeaveSpan = (event, indice) => {
        if (this.props.onLeaveSpan && this.props.onLeaveSpan(indice, make_mod_keys(event))) {
        }
    };

    render() {
        const styles = processAllStyles(this.props.styles);
        const text = this.props.text;
        const newSelectedSpans = JSON.stringify(this.props.spans.filter(span => span.selected).map(span => span.id));
        if (newSelectedSpans != this.previousSelectedSpans) {
            document.documentElement.style.setProperty("--blink-animation", '');
            setTimeout(() => {
                document.documentElement.style.setProperty("--blink-animation", 'blink .5s step-end infinite alternate');
            }, 1);
            this.previousSelectedSpans = newSelectedSpans;
        }
        const {lines, ids} = this.spanToTextChunks([
            ...this.props.mouse_selection.map(span => ({...span, 'mouseSelected': true})),
            ...this.props.spans], text);

        // Define the right number of references
        for (let line_i = this.lineRefs.length; line_i < lines.length; line_i++) {
            this.lineRefs.push(React.createRef());
        }
        this.lineRefs = this.lineRefs.slice(0, lines.length);
        replaceObject(this.labelsRefs, Object.fromEntries(ids.map(id => {
            return [id, this.labelsRefs[id] || React.createRef()];
        })));


        // Return jsx elements
        return (
            <div className="span-editor"
                 ref={this.containerRef}
            >
                <div className={`text`}
                     onMouseUp={this.handleMouseUp}
                     onKeyDown={this.handleKeyDown}
                     onKeyUp={this.handleKeyUp}
                     tabIndex="0">
                    {lines.map((tokens, line_i) =>
                        <Line
                            key={line_i}
                            divRef={this.lineRefs[line_i]}
                            labelsRefs={this.labelsRefs}
                            index={line_i}
                            styles={styles}
                            tokens={tokens}
                            handleMouseEnterSpan={this.handleMouseEnterSpan}
                            handleMouseLeaveSpan={this.handleMouseLeaveSpan}
                            handleClickSpan={this.handleClickSpan}
                        />
                    )}
                </div>
                {/*<XArrow start={"127-130"} end={"144-147"} />*/}
            </div>
        );
        let current_line = [];
        const all_lines = [];
        let line_i = 0;
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
                    if (this.lineRefs.length - 1 < line_i) {
                        this.lineRefs.push(React.createRef());
                    }
                    all_lines.push(
                        <div className="line" key={line_i} ref={this.lineRefs[line_i]}>
                            <span className="line-number" key="line-number">{line_i}</span>
                            {current_line}
                        </div>
                    );
                    current_line = [];
                    line_i++;
                } else {
                    current_line.push(
                        make_text_chunk({
                            text: tokens[token_i],
                            key: current_line.length,
                            span_begin: span_begin,
                            span_end: span_end,
                            metadata_list: metadata_list,
                            styles: styles,
                            refs: refs,
                            is_first: token_i === 0,
                            is_last: token_i === tokens.length - 1,
                            handleMouseEnterSpan: this.handleMouseEnterSpan,
                            handleMouseLeaveSpan: this.handleMouseLeaveSpan,
                            handleClickSpan: this.handleClickSpan,
                        }));
                }
                offset_in_text_chunk += tokens[token_i].length;
            }
        }
        this.labelsRefs = newLabelsRefs;
        if (this.lineRefs.length - 1 < line_i) {
            this.lineRefs.push(React.createRef());
        }
        all_lines.push(
            <div className="line" key={line_i} ref={this.lineRefs[line_i]}>
                <span className="line-number">{line_i}</span>
                {current_line}
            </div>
        );
        return (
            <div className="span-editor"
                 ref={this.containerRef}
            >
                <div className={`text`}
                     onMouseUp={this.handleMouseUp}
                     onKeyDown={this.handleKeyDown}
                     onKeyUp={this.handleKeyUp}
                     tabIndex="0">
                    {all_lines}
                </div>
                {/*<XArrow start={"127-130"} end={"144-147"} />*/}
            </div>
        );
    }
}

SpanComponent.propTypes = {
    id: PropTypes.string,
    spans: PropTypes.arrayOf(PropTypes.object),
    mouse_selection: PropTypes.arrayOf(PropTypes.object),
    onKeyPress: PropTypes.func,
    onClickSpan: PropTypes.func,
    onEnterSpan: PropTypes.func,
    onLeaveSpan: PropTypes.func,
    onMouseSelect: PropTypes.func,
    registerActions: PropTypes.func,
    text: PropTypes.string,
    styles: PropTypes.object,
};

SpanComponent.defaultProps = {
    spans: [],
    mouse_selection: [],
    text: "",
    styles: {},
};

export default SpanComponent;