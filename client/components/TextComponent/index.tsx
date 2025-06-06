import React, {CSSProperties, useRef} from "react";
import {default as tokenize, PreprocessedStyle} from "./tokenize"
import Color from 'color';
import {cachedReconcile, getDocumentSelectedRanges, makeModKeys, memoize, replaceObject} from "../../utils";
import {TextAnnotationStyle, TextAnnotation, TextData, TextMethods, TokenData} from '../../types';

import "./style.css";

const toLuminance = (color: Color, y: number=0.6) => {
    // This is mostly used to adapt to light/dark mode

    let [r, g, b, a] = [...color.rgb().color, color.alpha];
	// let y = ((0.299 * r) + ( 0.587 * g) + ( 0.114 * b)) / 255;
	let i = ((0.596 * r) + (-0.275 * g) + (-0.321 * b)) / 255;
	let q = ((0.212 * r) + (-0.523 * g) + ( 0.311 * b)) / 255;

	r = (y + ( 0.956 * i) + ( 0.621 * q)) * 255;
	g = (y + (-0.272 * i) + (-0.647 * q)) * 255;
	b = (y + (-1.105 * i) + ( 1.702 * q)) * 255;

    // bounds-checking
	if (r < 0){ r=0; } else if (r > 255){ r = 255};
	if (g < 0){ g=0; } else if (g > 255){ g = 255};
	if (b < 0){ b=0; } else if (b > 255){ b = 255};

    return Color.rgb(r, g, b).alpha(a);
}

const processStyle = ({color, shape, autoNestingLayout, labelPosition, ...rest}: TextAnnotationStyle): PreprocessedStyle => {
    let colorObject;
    try {
        colorObject = Color(color).alpha(0.8);
    } catch (e) {
        colorObject = Color('lightgray')
    }
    let highlightedColor, highlightedTextColor, backgroundColor, textColor;
    highlightedColor = toLuminance(colorObject.saturate(1.), 0.6).toString()
    if (colorObject.isLight() || shape === 'underline') {
        highlightedTextColor = '#ffffffde';
        textColor = '#000000de';
        backgroundColor = colorObject.lighten(0.02).toString();
    } else {
        highlightedTextColor = '#000000de';
        textColor = '#ffffffde'
        backgroundColor = colorObject.darken(0.02).toString();
    }
    if (shape === 'underline')
        textColor = '#000000de';
    return {
        base: {
            'borderColor': color,
            'backgroundColor': shape === 'underline' ? 'transparent' : backgroundColor,
            'color': textColor,
            ...rest,
        },
        highlighted: {
            'borderColor': color,
            'backgroundColor': backgroundColor,
            'color': textColor,
            ...rest,
        },
        autoNestingLayout,
        labelPosition,
        shape,
    };
};

// Create your Styles. Remember, since React-JSS uses the default preset,
// most plugins are available without further configuration needed.

const Token = React.memo((
    {
        text,
        begin,
        end,
        isFirstTokenOfChunk,
        isLastTokenOfChunk,
        tokenIndexInChunk,
        token_annotations,
        refs,
        styles,
        mouseElements,
    }: TokenData & {
        refs: { [key: string]: React.MutableRefObject<HTMLSpanElement> },
        styles: {[key: string]: PreprocessedStyle},
        mouseElements: React.MutableRefObject<{[key: string]: HTMLElement}>,
    }) => {


    let lastAnnotation = token_annotations[0];
    const labelIdx = {box: 0, underline: 0};
    const nLabels = {
        box: 0,
        underline: 0,
    };
    let shape;
    const zIndices = {};
    token_annotations.forEach(a => {
        if (a.mouseSelected)
            return;
        if (a.highlighted > lastAnnotation.highlighted || a.highlighted === lastAnnotation.highlighted && a.depth > lastAnnotation.depth) {
            lastAnnotation = a;
        }
        if (a.isFirstTokenOfSpan && a.label)
            if (styles[a.style]?.shape !== 'underline') {
                nLabels.box ++;
            } else {
                nLabels.underline++;
            }
        zIndices[a.id] = a.zIndex;
    });

    let annotations = []
    let verticalOffset = 0;
    for (let annotation_i = 0; annotation_i < token_annotations.length; annotation_i++) {
        const annotation = token_annotations[annotation_i];
        const isUnderline = styles?.[annotation.style]?.shape === 'underline';
        if (annotation.mouseSelected) {
            annotations.push(
                <span
                    key="mouse-selection"
                    className={`mention_token mouse_selected`}/>
            );
        } else {
            verticalOffset = annotation.depth * 2.5 - 2;
            annotations.push(
                <span
                    key={`annotation-${annotation_i}`}
                    id={`span-${begin}-${end}`}
                    // @ts-ignore
                    span_key={annotation.id}
                    ref={element => {
                        if (element) {
                            mouseElements.current[`${annotation.id}-span-${annotation_i}-${tokenIndexInChunk}`] = element
                        } else {
                            delete mouseElements.current[`${annotation.id}-span-${annotation_i}-${tokenIndexInChunk}`];
                        }
                        if (isFirstTokenOfChunk && refs[annotation.id]) {
                            refs[annotation.id].current = element;
                        }
                    }}
                    className={`mention_token mention_${isUnderline && !annotation.highlighted ? 'underline' : 'box'}
                               ${annotation.highlighted ? 'highlighted' : ''}
                               ${annotation.selected ? 'selected' : ''}
                               ${isFirstTokenOfChunk && !annotation.openleft ? 'closedleft' : ""}
                               ${isLastTokenOfChunk && !annotation.openright ? 'closedright' : ""}`}
                    style={{
                        top: (isUnderline && !annotation.highlighted) ? 22 : verticalOffset,
                        bottom: verticalOffset,
                        zIndex: annotation.zIndex + 2 + (annotation.highlighted ? 50 : 0),
                        ...styles?.[annotation.style]?.[annotation.highlighted ? 'highlighted' : 'base'],
                    } as CSSProperties}
                />
            );
        }
    }
    return (
        <span
            className="text-chunk"
            // @ts-ignore
            span_begin={begin}
            /*style={{color: styles?.[token_annotations?.[token_annotations.length - 1]?.style]?.color}}*/
        >{
            annotations
        }<span
            className="text-chunk-content"
            // @ts-ignore
            style={{color: styles?.[lastAnnotation?.style]?.[lastAnnotation?.highlighted ? 'highlighted' : 'base']?.color}}
        >{
            text
        }</span>{
            isFirstTokenOfChunk && token_annotations.map((annotation, annotation_i) => {
            if (annotation.isFirstTokenOfSpan && annotation.label) {
                shape = styles[annotation.style]?.shape || 'box';
                const isUnderline = shape === 'underline';
                labelIdx[shape] += 1;
                return (
                    <span
                        className={`label ${(annotation.highlighted || annotation.selected) ? 'highlighted' : ''}`}
                        ref={element => {
                            if (element) {
                                mouseElements.current[`${annotation.id}-label-${annotation_i}`] = element
                            } else {
                                delete mouseElements.current[`${annotation.id}-label-${annotation_i}`];
                            }
                        }}
                        key={annotation.id}
                        // @ts-ignore
                        span_key={annotation.id}
                        style={{
                            borderColor: styles?.[annotation?.style]?.[annotation?.highlighted ? 'highlighted' : 'base']?.borderColor,
                            [isUnderline ? 'bottom' : 'top']: -9,
                            left: (nLabels[shape] - labelIdx[shape]) * 6 + (shape === 'box' ? -1 : 2),
                            // Labels are above every text entity overlay, except when this entity is highlighted
                            zIndex: 50 + annotation.zIndex + (annotation.highlighted ? 50 : 0)
                        } as CSSProperties}>{annotation.label.toUpperCase()}</span>
                );
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
    spansRef: { [key: string]: React.MutableRefObject<HTMLSpanElement> };
    divRef: React.RefObject<HTMLDivElement>;
}) => {
    const hoveredKeys = useRef(new Set<string>());
    const elements = useRef<{[key: string]: HTMLElement}>({});

    const onMouseMove = (e) => {
        if (!elements || !hoveredKeys)
            return;
        let hitElements = Object.values(elements.current).map(element => {
            if (!element)
                return;
            const rect = element.getBoundingClientRect();
            if (
                e.clientX >= rect.left && e.clientX <= rect.right &&
                (e.clientY >= rect.top && e.clientY <= rect.bottom)
            ) {
                return element;//.getAttribute("span_key");
            }
        }).filter(e => !!e);
        let newSet = new Set(hitElements.map(e => e.getAttribute("span_key")));
        // @ts-ignore
        hoveredKeys.current.forEach(x => !newSet.has(x) && handleMouseLeaveSpan(e, x));
        // @ts-ignore
        newSet.forEach(x => !hoveredKeys.current.has(x) && handleMouseEnterSpan(e, x));
        hoveredKeys.current = newSet;
    }
    /*onMouseEnter={(event) => token_annotations.map(annotation => handleMouseEnterSpan(event, annotation.id))}*/
    const onMouseLeave = (event) => {
        if (!hoveredKeys)
            return;
        // @ts-ignore
        hoveredKeys.current.forEach(x => handleMouseLeaveSpan(event, x));
        hoveredKeys.current.clear();
    }
    const onMouseUp = (e) => {
        let hitElements = Object.values(elements.current).map(element => {
            if (!element)
                return;
            const rect = element.getBoundingClientRect();
            if (
                e.clientX >= rect.left && e.clientX <= rect.right &&
                (e.clientY >= rect.top && e.clientY <= rect.bottom)
                //&& (e.className.includes("underline")
                //    ? (e.clientY <= rect.bottom)
                //    : (e.clientY >= rect.top && e.clientY <= rect.bottom))
            ) {
                return element;//.getAttribute("span_key");
            }
        }).filter(e => !!e);
        if (hitElements.length > 1) {
            hitElements = hitElements.filter(element => {
                const rect = element.getBoundingClientRect();
                return element.className.includes("underline")
                    ? (e.clientY <= rect.bottom)
                    : (e.clientY >= rect.top && e.clientY <= rect.bottom);
            }).sort((a, b) => Number.parseInt(a.style.zIndex) - Number.parseInt(b.style.zIndex))
        }

        if (hitElements.length > 0) {
            handleClickSpan(e, hitElements[0].getAttribute("span_key"));
        }
    }

    return (
        <div
            ref={divRef}
            className="line"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
        >
            <span className="line-number" key="line-number">{index}</span>
            {tokens.map(token => <Token
                {...token}
                refs={spansRef}
                styles={styles}
                mouseElements={elements}
            />)}
        </div>
    );
});


const setOnMapping = (mapping: Map<string, any>|{[key: string]: any}, key: string, value: any) => {
    if (mapping instanceof Map) {
        mapping.set(key, value);
    } else {
        mapping[key] = value;
    }
}


export class TextComponent extends React.Component<TextData & TextMethods> {
    public static defaultProps = {
        spans: [],
        mouseSelection: [],
        text: "",
        annotationStyles: {},
    };

    private readonly tokenize: (spans: TextAnnotation[], text: string, styles: {[key: string]: PreprocessedStyle}) => { ids: any[]; lines: TokenData[][] };
    private readonly containerRef: React.RefObject<HTMLDivElement>;
    private readonly spansRef: { [span_id: string]: React.MutableRefObject<HTMLSpanElement> };
    private linesRef: React.RefObject<HTMLDivElement>[];
    private previousSelectedSpans: string;
    private processStyles: ((style: {[style_name: string]: TextAnnotationStyle}) => {[style_name: string]: PreprocessedStyle});
    constructor(props) {
        super(props);
        if (props.actions) {
            // Problem: props.actions may be an object OR a mapping, I don't know when it is which
            setOnMapping(props.actions, "scroll_to_line", (line, behavior: ScrollBehavior = 'smooth') => {
                if (line >= 0 && line < this.linesRef.length && this.linesRef[line]) {
                    this.linesRef[line].current?.scrollIntoView({behavior: behavior, block: 'center'})
                }
            });
            setOnMapping(props.actions, "scroll_to_span", (span_id, behavior: ScrollBehavior = 'smooth') => {
                setTimeout(() => {
                    if (this.spansRef[span_id]) {
                        this.spansRef[span_id].current?.scrollIntoView({behavior: behavior, block: 'center'});
                    }
                }, 10)
            });
            setOnMapping(props.actions, "clear_current_mouse_selection", () => {
                window.getSelection().removeAllRanges();
            });
        }
        this.linesRef = [];
        this.spansRef = {};
        this.containerRef = React.createRef();
        this.previousSelectedSpans = "";
        this.tokenize = cachedReconcile(tokenize);
        this.processStyles = memoize(styles => Object.assign({}, ...Object.keys(styles).map(key => ({[key]: processStyle(styles[key])}))));
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
        this.props.onKeyPress?.(
            key,
            [...this.props.mouseSelection, ...spans],
            makeModKeys(event),
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
                this.props.onMouseSelect?.(spans, makeModKeys(event));
            } else {
                this.props.onMouseSelect?.([], makeModKeys(event));
            }
        }
    };

    handleClickSpan = (event, span_id) => {
        this.props.onClickSpan?.(span_id, makeModKeys(event));
        /*event.stopPropagation();
        event.preventDefault();*/
    };

    handleMouseEnterSpan = (event: React.MouseEvent<HTMLElement>, span_id: any) => {
        this.props.onMouseEnterSpan?.(span_id, makeModKeys(event));
    };

    handleMouseLeaveSpan = (event: React.MouseEvent<HTMLElement>, span_id: any) => {
        this.props.onMouseLeaveSpan?.(span_id, makeModKeys(event));
    };

    render() {
        const styles = this.processStyles(this.props.spanStyles);
        const text = this.props.text || "";
        const newSelectedSpans = JSON.stringify(this.props.spans.filter(span => span.selected).map(span => span.id));
        if (newSelectedSpans != this.previousSelectedSpans) {
            document.documentElement.style.setProperty("--blink-animation", '');
            setTimeout(() => {
                document.documentElement.style.setProperty("--blink-animation", 'blink .5s step-end infinite alternate');
            }, 1);
            this.previousSelectedSpans = newSelectedSpans;
        }
        const {lines, ids} = this.tokenize([
            ...this.props.mouseSelection.map(span => ({...span, 'mouseSelected': true})),
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
            <div className="metanno-text-view"
                 ref={this.containerRef}
                 onMouseUp={this.handleMouseUp}
                 onKeyDown={this.handleKeyDown}
                 onKeyUp={this.handleKeyUp}
                 tabIndex={0}
                 style={this.props.style}
            >
                <div className={`text`}>
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
