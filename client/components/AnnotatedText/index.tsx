import React, { CSSProperties, useRef } from "react";
import { default as tokenize, PreprocessedStyle } from "./tokenize";
import Color from "color";
import {
  cachedReconcile,
  getDocumentSelectedRanges,
  makeModKeys,
  memoize,
  replaceObject,
} from "../../utils";
import {
  TextAnnotationStyle,
  TextAnnotation,
  TextData,
  TextMethods,
  TokenData,
} from "../../types";

import "./style.css";

const isMobileDevice = (): boolean => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    return /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
};

const toLuminance = (color: Color, y: number = 0.6) => {
  // This is mostly used to adapt to light/dark mode

  let [r, g, b, a] = [...color.rgb().color, color.alpha];
  // let y = ((0.299 * r) + ( 0.587 * g) + ( 0.114 * b)) / 255;
  let i = (0.596 * r + -0.275 * g + -0.321 * b) / 255;
  let q = (0.212 * r + -0.523 * g + 0.311 * b) / 255;

  r = (y + 0.956 * i + 0.621 * q) * 255;
  g = (y + -0.272 * i + -0.647 * q) * 255;
  b = (y + -1.105 * i + 1.702 * q) * 255;

  // bounds-checking
  if (r < 0) {
    r = 0;
  } else if (r > 255) {
    r = 255;
  }
  if (g < 0) {
    g = 0;
  } else if (g > 255) {
    g = 255;
  }
  if (b < 0) {
    b = 0;
  } else if (b > 255) {
    b = 255;
  }
  return Color.rgb(r, g, b).alpha(a);
};

const processStyle = ({
  color,
  shape,
  autoNestingLayout,
  labelPosition,
  ...rest
}: TextAnnotationStyle): PreprocessedStyle => {
  let colorObject, strongerColor;
  try {
    colorObject = Color(color).alpha(0.8);
  } catch (e) {
    colorObject = Color("lightgray");
  }
  let backgroundColor, textColor;
  if (colorObject.isLight()) {
    textColor = "#000000de";
    backgroundColor = colorObject.lighten(0.02).toString();
    strongerColor = colorObject.darken(0.05).toString();
  } else {
    textColor = "#ffffffde";
    backgroundColor = colorObject.darken(0.02).toString();
    strongerColor = colorObject.lighten(0.05).toString();
  }
  return {
    base: {
      borderColor: color,
      backgroundColor: shape === "underline" ? "transparent" : backgroundColor,
      color: shape === "underline" ? undefined : textColor,
      ...rest,
    },
    highlighted: {
      borderColor: strongerColor,
      backgroundColor: backgroundColor,
      color: textColor,
      ...rest,
    },
    autoNestingLayout,
    labelPosition,
    shape,
  };
};

const Token = React.memo(
  ({
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
    refs: { [key: string]: React.MutableRefObject<HTMLSpanElement> };
    styles: { [key: string]: PreprocessedStyle };
    mouseElements: React.MutableRefObject<{ [key: string]: HTMLElement }>;
  }) => {
    let lastAnnotation = token_annotations[0];
    const labelIdx = { box: 0, underline: 0 };
    const nLabels = {
      box: 0,
      underline: 0,
    };
    let shape;
    const zIndices = {};
    token_annotations.forEach((a) => {
      if (a.mouseSelected) return;
      if (
        a.highlighted > lastAnnotation.highlighted ||
        (a.highlighted === lastAnnotation.highlighted &&
          a.depth > lastAnnotation.depth)
      ) {
        lastAnnotation = a;
      }
      if (a.isFirstTokenOfSpan && a.label)
        if (styles[a.style]?.shape !== "underline") {
          nLabels.box++;
        } else {
          nLabels.underline++;
        }
      zIndices[a.id] = a.zIndex;
    });

    let annotations = [];
    let verticalOffset = 0;
    for (
      let annotation_i = 0;
      annotation_i < token_annotations.length;
      annotation_i++
    ) {
      const annotation = token_annotations[annotation_i];
      const isUnderline = styles?.[annotation.style]?.shape === "underline";
      if (annotation.mouseSelected) {
        annotations.push(
          <span
            key="mouse-selection"
            className={`mention_token mouse_selected`}
          />
        );
      } else {
        verticalOffset = annotation.depth * 3 - 2;
        annotations.push(
          <span
            key={`annotation-${annotation_i}`}
            id={`span-${begin}-${end}`}
            // @ts-ignore
            span_key={annotation.id}
            ref={(element) => {
              if (element) {
                mouseElements.current[
                  `${annotation.id}-span-${annotation_i}-${tokenIndexInChunk}`
                ] = element;
              } else {
                delete mouseElements.current[
                  `${annotation.id}-span-${annotation_i}-${tokenIndexInChunk}`
                ];
              }
              if (isFirstTokenOfChunk && refs[annotation.id]) {
                refs[annotation.id].current = element;
              }
            }}
            className={`mention_token mention_${
              isUnderline && !annotation.highlighted ? "underline" : "box"
            }
                               ${annotation.highlighted ? "highlighted" : ""}
                               ${annotation.selected ? "selected" : ""}
                               ${
                                 isFirstTokenOfChunk && !annotation.openleft
                                   ? "closedleft"
                                   : ""
                               }
                               ${
                                 isLastTokenOfChunk && !annotation.openright
                                   ? "closedright"
                                   : ""
                               }`}
            style={
              {
                top:
                  isUnderline && !annotation.highlighted
                    ? undefined
                    : verticalOffset,
                bottom: verticalOffset,
                zIndex:
                  annotation.zIndex + 2 + (annotation.highlighted ? 50 : 0),
                ...styles?.[annotation.style]?.[
                  annotation.highlighted ? "highlighted" : "base"
                ],
              } as CSSProperties
            }
          />
        );
      }
    }
    return (
      <span
        className="text-chunk"
        // @ts-ignore
        span_begin={begin}
      >
        {annotations}
        <span
          className="text-chunk-content"
          // @ts-ignore
          style={{
            color:
              styles?.[lastAnnotation?.style]?.[
                lastAnnotation?.highlighted ? "highlighted" : "base"
              ]?.color,
          }}
        >
          {text}
        </span>
        {isFirstTokenOfChunk &&
          token_annotations.map((annotation, annotation_i) => {
            if (annotation.isFirstTokenOfSpan && annotation.label) {
              shape = styles[annotation.style]?.shape || "box";
              const verticalOffset = annotation.depth * 2.5 - 2;
              const isUnderline = shape === "underline";
              labelIdx[shape] += 1;
              return (
                <span
                  className={`label ${
                    annotation.highlighted || annotation.selected
                      ? "highlighted"
                      : ""
                  }`}
                  ref={(element) => {
                    if (element) {
                      mouseElements.current[
                        `${annotation.id}-label-${annotation_i}`
                      ] = element;
                    } else {
                      delete mouseElements.current[
                        `${annotation.id}-label-${annotation_i}`
                      ];
                    }
                  }}
                  key={annotation.id}
                  // @ts-ignore
                  span_key={annotation.id}
                  style={
                    {
                      borderColor:
                        styles?.[annotation?.style]?.[
                          annotation?.highlighted ? "highlighted" : "base"
                        ]?.borderColor,
                      [isUnderline ? "bottom" : "top"]: -9 + verticalOffset,
                      left:
                        (nLabels[shape] - labelIdx[shape]) * 6 +
                        (shape === "box" ? -1 : 2),
                      // Labels are above every text entity overlay, except when this entity is highlighted
                      zIndex:
                        50 +
                        annotation.zIndex +
                        (annotation.highlighted ? 50 : 0),
                    } as CSSProperties
                  }
                >
                  {annotation.label.toUpperCase()}
                </span>
              );
            }
          })}
      </span>
    );
  }
);

const Line = React.memo(
  <StyleRest extends object>({
    index,
    styles,
    tokens,
    spansRef,
    handleMouseEnterSpan,
    handleMouseLeaveSpan,
    handleClickSpan,
    divRef,
  }: {
    index: number;
    styles: { [key: string]: PreprocessedStyle };
    tokens: TokenData[];
    handleMouseEnterSpan: (
      event: React.MouseEvent<HTMLSpanElement>,
      id: string
    ) => void;
    handleMouseLeaveSpan: (
      event: React.MouseEvent<HTMLSpanElement>,
      id: string
    ) => void;
    handleClickSpan: (
      event: React.MouseEvent<HTMLSpanElement>,
      id: string
    ) => void;
    spansRef: { [key: string]: React.MutableRefObject<HTMLSpanElement> };
    divRef: React.RefObject<HTMLDivElement>;
  }) => {
    const hoveredKeys = useRef(new Set<string>());
    const elements = useRef<{ [key: string]: HTMLElement }>({});

    const getClientCoords = (e) => {
      const t =
        (e.touches && e.touches[0]) ||
        (e.changedTouches && e.changedTouches[0]);
      return {
        clientX: t ? t.clientX : e.clientX,
        clientY: t ? t.clientY : e.clientY,
      };
    };

    const onMouseMove = (e) => {
      if (!elements || !hoveredKeys) return;
      const { clientX, clientY } = getClientCoords(e);
      let hitElements = Object.values(elements.current)
        .map((element) => {
          if (!element) return;
          const rect = element.getBoundingClientRect();
          if (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
          ) {
            return element; //.getAttribute("span_key");
          }
        })
        .filter((e) => !!e);
      let newSet = new Set(hitElements.map((e) => e.getAttribute("span_key")));
      // @ts-ignore
      hoveredKeys.current.forEach(
        (x) => !newSet.has(x) && handleMouseLeaveSpan(e, x)
      );
      // @ts-ignore
      newSet.forEach(
        (x) => !hoveredKeys.current.has(x) && handleMouseEnterSpan(e, x)
      );
      hoveredKeys.current = newSet;
    };
    /*onMouseEnter={(event) => token_annotations.map(annotation => handleMouseEnterSpan(event, annotation.id))}*/
    const onMouseLeave = (event) => {
      if (!hoveredKeys) return;
      // @ts-ignore
      hoveredKeys.current.forEach((x) => handleMouseLeaveSpan(event, x));
      hoveredKeys.current.clear();
    };
    const onMouseUp = (e) => {
      const { clientX, clientY } = getClientCoords(e);
      let hitElements = Object.values(elements.current)
        .map((element) => {
          if (!element) return;
          const rect = element.getBoundingClientRect();
          if (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
            //&& (e.className.includes("underline")
            //    ? (e.clientY <= rect.bottom)
            //    : (e.clientY >= rect.top && e.clientY <= rect.bottom))
          ) {
            return element; //.getAttribute("span_key");
          }
        })
        .filter((e) => !!e);
      if (hitElements.length > 1) {
        hitElements = hitElements
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return element.className.includes("underline")
              ? clientY <= rect.bottom
              : clientY >= rect.top && clientY <= rect.bottom;
          })
          .sort(
            (a, b) =>
              Number.parseInt(a.style.zIndex) - Number.parseInt(b.style.zIndex)
          );
      }

      if (hitElements.length > 0) {
        handleClickSpan(e, hitElements[0].getAttribute("span_key"));
      }
    };

    const onTouchStart = (e) => {
      /* no op */
    };
    const onTouchMove = (e) => {
      onMouseMove(e);
    };
    const onTouchEnd = (e) => {
      onMouseUp(e);
      onMouseLeave(e); // clear hover state after touch ends
    };
    const onTouchCancel = (e) => {
      onMouseLeave(e);
    };

    return (
      <div
        ref={divRef}
        className="line"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        style={{ touchAction: "manipulation" }}
      >
        <span className="line-number" key="line-number">
          {index}
        </span>
        {tokens.map((token) => (
          <Token
            {...token}
            refs={spansRef}
            styles={styles}
            mouseElements={elements}
          />
        ))}
      </div>
    );
  }
);

const setOnMapping = (
  mapping: Map<string, any> | { [key: string]: any },
  key: string,
  value: any
) => {
  if (mapping instanceof Map) {
    mapping.set(key, value);
  } else {
    mapping[key] = value;
  }
};

/**
 * A React component for rendering text with annotations and spans.
 *
 * @param {TextData} props.text The text content to display.
 * @param {TextAnnotation[]} props.spans An array of text annotations.
 * @param {TextAnnotationStyle} props.annotationStyles Styles for annotations.
 * @param {Function} [props.onMouseSelect] Callback for mouse selection events.
 * @param {Function} [props.onClickSpan] Callback for click events on spans.
 * @param {Function} [props.onMouseEnterSpan] Callback for mouse enter events on spans.
 * @param {Function} [props.onMouseLeaveSpan] Callback for mouse leave events on spans.
 * @param {CSSProperties} [props.style] Custom styles for the component.
 */
export class AnnotatedText extends React.Component<TextData & TextMethods> {
  public static defaultProps = {
    spans: [],
    mouseSelection: [],
    text: "",
    annotationStyles: {},
  };

  private readonly tokenize: (
    spans: TextAnnotation[],
    text: string,
    styles: { [key: string]: PreprocessedStyle }
  ) => { ids: any[]; lines: TokenData[][] };
  private readonly containerRef: React.RefObject<HTMLDivElement>;
  private readonly spansRef: {
    [span_id: string]: React.MutableRefObject<HTMLSpanElement>;
  };
  private linesRef: React.RefObject<HTMLDivElement>[];
  private previousSelectedSpans: string;
  private processStyles: (style: {
    [style_name: string]: TextAnnotationStyle;
  }) => { [style_name: string]: PreprocessedStyle };
  private _ignoreSelectionChange: boolean;
  private _boundSelectionChange: () => void;

  constructor(props) {
    super(props);
    if (props.actions) {
      // Problem: props.actions may be an object OR a mapping, I don't know when it is which
      setOnMapping(
        props.actions,
        "scroll_to_line",
        (line, behavior: ScrollBehavior = "smooth") => {
          if (line >= 0 && line < this.linesRef.length && this.linesRef[line]) {
            this.linesRef[line].current?.scrollIntoView({
              behavior: behavior,
              block: "center",
            });
          }
        }
      );
      setOnMapping(
        props.actions,
        "scroll_to_span",
        (span_id, behavior: ScrollBehavior = "smooth") => {
          setTimeout(() => {
            if (this.spansRef[span_id]) {
              this.spansRef[span_id].current?.scrollIntoView({
                behavior: behavior,
                block: "center",
              });
            }
          }, 10);
        }
      );
      setOnMapping(props.actions, "clear_current_mouse_selection", () => {
        window.getSelection().removeAllRanges();
      });
    }
    this.linesRef = [];
    this.spansRef = {};
    this.containerRef = React.createRef();
    this.previousSelectedSpans = "";
    this.tokenize = cachedReconcile(tokenize);
    this.processStyles = memoize((styles) =>
      Object.assign(
        {},
        ...Object.keys(styles).map((key) => ({
          [key]: processStyle(styles[key]),
        }))
      )
    );
    this._ignoreSelectionChange = false;
    this._boundSelectionChange = this.handleSelectionChange.bind(this);
  }

  componentDidMount() {
    if (!isMobileDevice()) return;
    document.addEventListener("selectionchange", this._boundSelectionChange);
  }

  componentWillUnmount() {
    if (!isMobileDevice()) return;
    document.removeEventListener("selectionchange", this._boundSelectionChange);
  }

  private isNodeInside = (node: Node | null) => {
    const container = this.containerRef.current;
    return (
      !!container &&
      !!node &&
      (node === container || container.contains(node as Node))
    );
  };

  handleSelectionChange = () => {
    if (this._ignoreSelectionChange) return;
    const sel = typeof window !== "undefined" ? window.getSelection?.() : null;
    if (!sel || sel.isCollapsed) return;
    if (!this.isNodeInside(sel.anchorNode) && !this.isNodeInside(sel.focusNode))
      return;
    // Wait a tick so the browser finalizes the selection on mobile
    setTimeout(() => {
      const spans = getDocumentSelectedRanges();
      if (spans && spans.length > 0) {
        this._ignoreSelectionChange = true;
        this.props.onMouseSelect?.(spans, makeModKeys({} as any));
        try {
          window.getSelection()?.removeAllRanges();
        } catch {}
        setTimeout(() => {
          this._ignoreSelectionChange = false;
        }, 0);
      }
    }, 0);
  };

  handleKeyUp = (event: React.KeyboardEvent) => {
    // if (event.metaKey || event.key === 'Meta' || event.shiftKey || event.key === 'Shift') {
    //     return;
    // }
    let key = event.key;
    if (key === "Spacebar" || key === " ") {
      key = " ";
    }
    const spans = getDocumentSelectedRanges();
    this.props.onKeyPress?.(
      key,
      [...this.props.mouseSelection, ...spans],
      makeModKeys(event)
    );
  };

  handleKeyDown = (event) => {
    if (event.key === "Spacebar" || event.key === " ") {
      event.preventDefault();
    }
  };

  handleTouchUp = (
    event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>
  ) => {
    const spans = getDocumentSelectedRanges();
    this._ignoreSelectionChange = true; // prevent our own clear from retriggering
    try {
      window.getSelection()?.removeAllRanges();
    } catch {}
    if (spans.length > 0) {
      this.props.onMouseSelect?.(spans, makeModKeys(event as any));
    } else {
      this.props.onMouseSelect?.([], makeModKeys(event as any));
    }
    setTimeout(() => {
      this._ignoreSelectionChange = false;
    }, 0);
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
  };

  handleMouseEnterSpan = (
    event: React.MouseEvent<HTMLElement>,
    span_id: any
  ) => {
    this.props.onMouseEnterSpan?.(span_id, makeModKeys(event));
  };

  handleMouseLeaveSpan = (
    event: React.MouseEvent<HTMLElement>,
    span_id: any
  ) => {
    this.props.onMouseLeaveSpan?.(span_id, makeModKeys(event));
  };

  render() {
    const styles = this.processStyles(this.props.annotationStyles);
    const text = this.props.text || "";
    const newSelectedSpans = JSON.stringify(
      this.props.spans.filter((span) => span.selected).map((span) => span.id)
    );
    if (newSelectedSpans != this.previousSelectedSpans) {
      document.documentElement.style.setProperty("--blink-animation", "");
      setTimeout(() => {
        document.documentElement.style.setProperty(
          "--blink-animation",
          "blink .5s step-end infinite alternate"
        );
      }, 1);
      this.previousSelectedSpans = newSelectedSpans;
    }
    const { lines, ids } = this.tokenize(
      [
        ...this.props.mouseSelection.map((span) => ({
          ...span,
          mouseSelected: true,
        })),
        ...this.props.spans,
      ],
      text,
      styles
    );

    // Define the right number of references
    for (let line_i = this.linesRef.length; line_i < lines.length; line_i++) {
      this.linesRef.push(React.createRef());
    }
    this.linesRef = this.linesRef.slice(0, lines.length);
    replaceObject(
      this.spansRef,
      Object.fromEntries(
        ids.map((id) => {
          return [id, this.spansRef[id] || React.createRef()];
        })
      )
    );

    return (
      <div
        className="metanno-text-view"
        ref={this.containerRef}
        onMouseUp={this.handleMouseUp}
        onTouchEnd={(e) => {
          e.persist?.();
          setTimeout(() => this.handleTouchUp(e as any), 0);
        }}
        onTouchCancel={(e) => this.props.onMouseSelect?.([], makeModKeys(e))}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        tabIndex={0}
        style={this.props.style}
      >
        <div className={`text`}>
          {lines.map((tokens, lineIndex) => (
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
          ))}
        </div>
      </div>
    );
  }
}
