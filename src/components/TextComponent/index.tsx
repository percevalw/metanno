import React, {CSSProperties} from "react";
import {default as tokenize, PreprocessedStyle} from "./tokenize"
import Color from 'color';
import {makeModKeys, memoize, replaceObject} from "../../utils";
import cachedReconcile from "../../utils";
import {SpanData, TokenData, TextRange, QuickStyle, TextData, TextMethods} from '../../types';

import "./style.css";

const processStyle = ({color, border, alpha, ...rest}: QuickStyle): PreprocessedStyle => {
    const backgroundColor = Color(color);
    const textColor = backgroundColor.isLight() ? '#000000de' : '#ffffffde';
    const borderColor = border ? Color(border) : backgroundColor.darken(0.02);
    return {
        '--border-color': borderColor.toString(),
        '--background-color': backgroundColor.alpha(alpha || 0.8).toString(),
        'color': textColor,
        ...rest,
    };
};

export function getDocumentSelectedRanges(): TextRange[] {
    const ranges: TextRange[] = [];
    if (window.getSelection) {
        const selection = window.getSelection();
        let begin = null, end = null;
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            const startContainerBegin = parseInt(
                // @ts-ignore
                range.startContainer.parentElement.parentNode.getAttribute("span_begin"),
                10
            );
            const endContainerBegin = parseInt(
                // @ts-ignore
                range.endContainer.parentElement.parentNode.getAttribute("span_begin"),
                10
            );
            if (!isNaN(startContainerBegin)) {
                begin = range.startOffset + startContainerBegin;
            }
            if (!isNaN(endContainerBegin)) {
                end = range.endOffset + endContainerBegin;
            }
            if (isNaN(startContainerBegin) || isNaN(endContainerBegin)) {
                continue;
            }
            if (begin !== end) {
                ranges.push({
                    begin: begin,
                    end: end,
                });
            }
        }
        if (ranges.length === 0 && !isNaN(begin) && begin !== null && !isNaN(end) && end !== null && begin !== end) {
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

const Token = React.memo((
    {
        text,
        begin,
        end,
        isFirstTokenOfChunk,
        isLastTokenOfChunk,
        token_annotations,
        refs,
        styles,
        handleMouseEnterSpan,
        handleMouseLeaveSpan,
        handleClickSpan,
    }: TokenData & {
        refs: { [key: string]: React.RefObject<HTMLSpanElement> },
        styles: {[key: string]: PreprocessedStyle},
        handleMouseEnterSpan: (event: React.MouseEvent<HTMLSpanElement>, id: string) => void,
        handleMouseLeaveSpan: (event: React.MouseEvent<HTMLSpanElement>, id: string) => void,
        handleClickSpan: (event: React.MouseEvent<HTMLSpanElement>, id: string) => void,
    }) => {

    let annotations = []
    for (let annotation_i = 0; annotation_i < token_annotations.length; annotation_i++) {
        const annotation = token_annotations[annotation_i];
        if (annotation.mouseSelected) {
            annotations.push(
                <span
                    key="mouse-selection"
                    className={`mention_token mouse_selected`}/>
            );
        } else {
            annotations.push(
                <span
                    key={`annotation-${annotation_i}`}
                    id={`span-${begin}-${end}`}
                    onMouseEnter={(event) => handleMouseEnterSpan(event, annotation.id)}
                    onMouseLeave={(event) => handleMouseLeaveSpan(event, annotation.id)}
                    onMouseDown={(event) => handleClickSpan(event, annotation.id)}
                    className={`mention_token
                                ${annotation.highlighted ? 'highlighted' : ''}
                                ${annotation.selected ? 'selected' : ''}
                                ${isFirstTokenOfChunk && !annotation.openleft ? 'closedleft' : ""}
                                ${isLastTokenOfChunk && !annotation.openright ? 'closedright' : ""}`}
                    style={{
                        ...styles[annotation.style],
                        ...(styles[annotation.style]?.shape === "fullHeight" ? {top: 0, bottom: 0} : {}),
                        '--vertical-offset': `${7 + 2 * annotation.depth - (annotation.highlighted ? 2 : 0)}px`,
                        '--z-index': styles[annotation.style]?.shape === "fullHeight" ? 1 : 2 + annotation.depth,
                    } as CSSProperties}
                />
            );
        }
    }
    const n_labels = token_annotations.reduce((total, annotation) => (annotation.isFirstTokenOfSpan && annotation.label ? total + 1 : total), 0);
    let label_idx = 0;
    return (

        <span
            className="text-chunk"
            // @ts-ignore
            span_begin={begin}
        >{annotations}<span className="text-chunk-content"
            // @ts-ignore
            span_begin={begin}
            onMouseEnter={(event) => token_annotations.map(annotation => handleMouseEnterSpan(event, annotation.id))}
            onMouseLeave={(event) => token_annotations.map(annotation => handleMouseLeaveSpan(event, annotation.id))}
            onMouseDown={(event) => {token_annotations.map(annotation => handleClickSpan(event, annotation.id))}}

            style={{color: styles?.[token_annotations?.[token_annotations.length - 1]?.style]?.color}}>{text}</span>
            {isFirstTokenOfChunk && token_annotations.map((annotation) => {
                if (annotation.isFirstTokenOfSpan && annotation.label) {
                    label_idx += 1;
                    return (
                        <span
                            onMouseEnter={(event) => handleMouseEnterSpan(event, annotation.id)}
                            onMouseLeave={(event) => handleMouseLeaveSpan(event, annotation.id)}
                            onMouseDown={(event) => {
                                handleClickSpan(event, annotation.id);
                            }}
                            className={`label ${(annotation.highlighted || annotation.selected) ? 'highlighted' : ''}`}
                            ref={isFirstTokenOfChunk ? refs[annotation.id] : null}
                            key={annotation.id}
                            style={{
                                borderColor: styles[annotation.style]?.['--border-color'],
                                //top: `${2 * annotation.depth - 2}px`,
                                left: `${(n_labels - label_idx) * 4}px`,
                                '--z-index': 50 + annotation.depth
                            } as CSSProperties}>{annotation.label.toUpperCase()}</span>
                    )
                }
            })}
            </span>
    );
});

const Line = React.memo(<StyleRest extends object>({index, styles, tokens, spansRef, handleMouseEnterSpan, handleMouseLeaveSpan, handleClickSpan, divRef}: {
    index: number;
    styles: {[key: string]: PreprocessedStyle};
    tokens: TokenData[];
    handleMouseEnterSpan: (event: React.MouseEvent<HTMLSpanElement>, id: string) => void;
    handleMouseLeaveSpan: (event: React.MouseEvent<HTMLSpanElement>, id: string) => void;
    handleClickSpan: (event: React.MouseEvent<HTMLSpanElement>, id: string) => void;
    spansRef: { [key: string]: React.RefObject<HTMLSpanElement> };
    divRef: React.RefObject<HTMLDivElement>;
}) => {
    return (
        <div ref={divRef} className="line">
            <span className="line-number" key="line-number">{index}</span>
            {tokens.map(token => <Token
                {...token}
                refs={spansRef}
                styles={styles}
                handleMouseEnterSpan={handleMouseEnterSpan}
                handleMouseLeaveSpan={handleMouseLeaveSpan}
                handleClickSpan={handleClickSpan}
            />)}
        </div>
    );
});


class TextComponent extends React.Component<{ id: string; } & TextData & TextMethods> {
    public defaultProps = {
        spans: [],
        mouse_selection: [],
        text: "",
        styles: {},
    };

    private readonly tokenize: (spans: SpanData[], text: string, styles: {[key: string]: PreprocessedStyle}) => { ids: any[]; lines: TokenData[][] };
    private readonly containerRef: React.RefObject<HTMLDivElement>;
    private readonly spansRef: { [span_id: string]: React.RefObject<HTMLSpanElement> };
    private linesRef: React.RefObject<HTMLDivElement>[];
    private previousSelectedSpans: string;
    private processStyles: ((style: {[style_name: string]: QuickStyle}) => {[style_name: string]: PreprocessedStyle});
    private hoveredCounts: {[span_id: string]: number};

    constructor(props) {
        super(props);
        props.registerActions({
            scroll_to_line: (line) => {
                if (line >= 0 && line < this.linesRef.length) {
                    this.linesRef[line].current?.scrollIntoView({behavior: 'smooth', block: 'center'})
                }
            },
            scroll_to_span: (span_id) => {
                if (this.spansRef[span_id]) {
                    this.spansRef[span_id].current?.scrollIntoView({behavior: 'smooth', block: 'center'})
                }
            },
            clear_current_mouse_selection: () => {
                window.getSelection().removeAllRanges();
            }
        });
        this.linesRef = [];
        this.spansRef = {};
        this.containerRef = React.createRef();
        this.previousSelectedSpans = "";
        this.tokenize = cachedReconcile(tokenize);
        this.hoveredCounts = {};
        this.processStyles = memoize(styles => Object.assign({}, ...Object.keys(styles).map(key => ({...styles[key], [key]: processStyle(styles[key])}))));
    }

    handleKeyUp = (event: React.KeyboardEvent) => {
        // if (event.metaKey || event.key === 'Meta' || event.shiftKey || event.key === 'Shift') {
        //     return;
        // }
        let key = event.key;
        if (key === 'Spacebar' || key === " ") {
            key = " ";
        }
        const spans = getDocumentSelectedRanges();
        this.props.onKeyPress(
            key,
            makeModKeys(event),
            [...this.props.mouse_selection, ...spans],
        );
    };


    handleKeyDown = event => {
        if (event.key === 'Spacebar' || event.key === " ") {
            event.preventDefault();
        }
    };

    handleMouseUp = (event: React.MouseEvent<HTMLElement>) => {
        if (event.type === "mouseup") {
            const spans = getDocumentSelectedRanges();
            window.getSelection().removeAllRanges();
            if (spans.length > 0) {
                //this.props.onMouseSelect([...this.props.mouse_selection, ...spans]);
                this.props.onMouseSelect(makeModKeys(event), spans);
            } else {
                this.props.onMouseSelect(makeModKeys(event), []);
            }
        }
    };

    handleClickSpan = (event, span_id) => {
        this.props.onClickSpan(span_id, makeModKeys(event));
    };

    handleMouseEnterSpan = (event: React.MouseEvent<HTMLElement>, span_id: any) => {
        if (!this.hoveredCounts[span_id]) {
            this.props.onMouseEnterSpan && this.props.onMouseEnterSpan(span_id, makeModKeys(event));
            this.hoveredCounts[span_id] = 0;
        }
        this.hoveredCounts[span_id] ++;
    };

    handleMouseLeaveSpan = (event: React.MouseEvent<HTMLElement>, span_id: any) => {
        setTimeout(() => {
            if (this.hoveredCounts[span_id] == 1) {
                this.props.onMouseLeaveSpan && this.props.onMouseLeaveSpan(span_id, makeModKeys(event));
                this.hoveredCounts[span_id] = 1;
            }
            this.hoveredCounts[span_id]--;
        }, 10)
    };

    render() {
        const styles = this.processStyles(this.props.styles);
        const text = this.props.text;
        const newSelectedSpans = JSON.stringify(this.props.spans.filter(span => span.selected).map(span => span.id));
        if (newSelectedSpans != this.previousSelectedSpans) {
            document.documentElement.style.setProperty("--blink-animation", '');
            setTimeout(() => {
                document.documentElement.style.setProperty("--blink-animation", 'blink .5s step-end infinite alternate');
            }, 1);
            this.previousSelectedSpans = newSelectedSpans;
        }
        const {lines, ids} = this.tokenize([
            ...this.props.mouse_selection.map(span => ({...span, 'mouseSelected': true})),
            ...this.props.spans], text, styles);

        // Define the right number of references
        for (let line_i = this.linesRef.length; line_i < lines.length; line_i++) {
            this.linesRef.push(React.createRef());
        }
        this.linesRef = this.linesRef.slice(0, lines.length);
        replaceObject(this.spansRef, Object.fromEntries(ids.map(id => {
            return [id, this.spansRef[id] || React.createRef()];
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
                     tabIndex={0}>
                    {lines.map((tokens, lineIndex) =>
                        <Line
                            key={lineIndex}
                            divRef={this.linesRef[lineIndex]}
                            spansRef={this.spansRef}
                            index={lineIndex}
                            tokens={tokens}
                            styles={styles}
                            handleMouseEnterSpan={this.handleMouseEnterSpan}
                            handleMouseLeaveSpan={this.handleMouseLeaveSpan}
                            handleClickSpan={this.handleClickSpan}
                        />
                    )}
                </div>
            </div>
        );
    }
}

export default TextComponent;