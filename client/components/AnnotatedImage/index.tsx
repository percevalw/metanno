import Konva from "konva";
import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Line,
  Text,
  Group,
} from "react-konva";
import useImage from "use-image";
import {
  ImageData,
  ImageMethods,
  ImageAnnotation,
  Shape,
  ImageAnnotationStyle,
} from "../../types";

export const AnnotatedImage: React.FC<ImageData & ImageMethods> = (props) => {
  const [img] = useImage(props.image);
  const groupRef = useRef<any>(null);
  const imageRef = useRef<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  if (img) {
    scale = Math.min(
      containerSize.width / img.width,
      containerSize.height / img.height
    );
    offsetX = (containerSize.width - img.width * scale) / 2;
    offsetY = (containerSize.height - img.height * scale) / 2;
  }

  const makeModKeys = (event: any) => {
    const modKeys: string[] = [];
    if (event.shiftKey) modKeys.push("Shift");
    if (event.ctrlKey) modKeys.push("Ctrl");
    if (event.altKey) modKeys.push("Alt");
    if (event.metaKey) modKeys.push("Meta");
    return modKeys;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (props.onKeyPress) {
      props.onKeyPress(e.key, makeModKeys(e));
    }
  };

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.cancelBubble || e.evt?.cancelBubble) return; // Prevent further events if already handled
    if (!groupRef.current) return;
    const pos = groupRef.current.getRelativePointerPosition();
    selectionStartRef.current = pos;
    setIsSelecting(true);
    setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.cancelBubble || e.evt?.cancelBubble) return; // Prevent further events if already handled
    if (!isSelecting) return;
    if (!groupRef.current) return;
    const pos = groupRef.current.getRelativePointerPosition();
    const start = selectionStartRef.current;
    if (!start) return;
    setSelectionRect({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      width: Math.abs(pos.x - start.x),
      height: Math.abs(pos.y - start.y),
    });
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.cancelBubble || e.evt?.cancelBubble) return; // Prevent further events if already handled
    if (isSelecting) {
      setIsSelecting(false);
      if (props.onMouseSelect && selectionRect.width > 0 && selectionRect.height > 0) {
        const modKeys = makeModKeys(e.evt);
        // Create a shape for the selection (using 'rect' type)
        const shape: Shape = {
          type: "rect",
          points: [
            selectionRect.x,
            selectionRect.y,
            selectionRect.width,
            selectionRect.height,
          ],
        };
        props.onMouseSelect(modKeys, [shape]);
        e.evt.cancelBubble = true; // Prevent further onClick from being triggered
        e.cancelBubble = true; // Prevent onClick from being triggered
      }
      setSelectionRect({ x: 0, y: 0, width: 0, height: 0 });
    }
  };

  const handleClick = (e: any, index: number) => {
    if (e.cancelBubble || e.evt?.cancelBubble) return; // Prevent further events if already handled
    if (props.onClick) {
      props.onClick(index === undefined ? null : index, makeModKeys(e));
      e.evt.cancelBubble = true; // Prevent further onClick from being triggered
      e.cancelBubble = true; // Prevent further onClick from being triggered
    }
  };

  const handleAnnotationMouseEnter = (e: any, index: number) => {
    if (e.cancelBubble || e.evt?.cancelBubble) return; // Prevent further events if already handled
    if (props.onMouseEnterShape) {
      props.onMouseEnterShape(index, makeModKeys(e));
    }
  };

  const handleAnnotationMouseLeave = (e: any, index: number) => {
    if (e.cancelBubble || e.evt?.cancelBubble) return; // Prevent further events if already handled
    if (props.onMouseLeaveShape) {
      props.onMouseLeaveShape(index, makeModKeys(e));
    }
  };

  const renderAnnotation = (annotation: ImageAnnotation, index: number) => {
    const style: ImageAnnotationStyle = {
      strokeColor: "red",
      strokeWidth: 2,
      fillColor: "transparent",
      opacity: 1.0,
      shape: "rect",
      align: "center",
      verticalAlign: "middle",
      fontSize: 14,
      ...((typeof annotation.style !== "string"
        ? annotation.style
        : props.annotationStyles[annotation.style]) || {}),
    };

    // Render the annotation shape
    let shapeComponent = null;
    let bbox: { x: number; y: number; width: number; height: number };
    if (style.shape === "polygon") {
      shapeComponent = (
        <Line
          points={annotation.points}
          closed
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth}
          fill={style.fillColor}
          opacity={style.opacity}
          onClick={(e) => handleClick(e, index)}
          onMouseEnter={(e) => handleAnnotationMouseEnter(e, index)}
          onMouseLeave={(e) => handleAnnotationMouseLeave(e, index)}
        />
      );
      const pts = annotation.points;
      const xs = pts.filter((_, i) => i % 2 === 0);
      const ys = pts.filter((_, i) => i % 2 === 1);
      bbox = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    } else {
      // Fallback to rectangle
      shapeComponent = (
        <Rect
          x={annotation.points[0]}
          y={annotation.points[1]}
          width={annotation.points[2]}
          height={annotation.points[3]}
          stroke={style.strokeColor}
          strokeWidth={style.strokeWidth}
          fill={style.fillColor}
          opacity={style.opacity}
          onClick={(e) => handleClick(e, index)}
          onMouseEnter={(e) => handleAnnotationMouseEnter(e, index)}
          onMouseLeave={(e) => handleAnnotationMouseLeave(e, index)}
        />
      );
      bbox = {
        x: annotation.points[0],
        y: annotation.points[1],
        width: annotation.points[2],
        height: annotation.points[3],
      };
    }

    let labelComponent = null;
    if (annotation.label) {
      const padding = 5;
      labelComponent = (
        <Text
          text={annotation.label}
          fontSize={14}
          x={bbox.x + padding}
          y={bbox.y + padding}
          width={bbox.width - 2 * padding}
          height={bbox.height - 2 * padding}
          fill={style.textColor || "black"}
          align={style.align}
          verticalAlign={style.verticalAlign}
          listening={false}
        />
      );
    }

    return (
      <Group key={`annotation-${index}`}>
        {shapeComponent}
        {labelComponent}
      </Group>
    );
  };

  const renderSelectionShape = (shape: Shape, index: number) => {
    if (shape.type === "rect") {
      return (
        <Rect
          key={`selection-${index}`}
          x={shape.points[0]}
          y={shape.points[1]}
          width={shape.points[2]}
          height={shape.points[3]}
          fill="#89BCFA99"
          stroke="#89BCFA"
          strokeWidth={1}
        />
      );
    } else if (shape.type === "polygon") {
      return (
        <Line
          key={`selection-${index}`}
          points={shape.points}
          closed
          stroke="blue"
          strokeWidth={1}
          dash={[4, 4]}
        />
      );
    }
    return null;
  };

  return (
    // A focusable container so that key events are captured
    <div
      tabIndex={0}
      onKeyDown={handleKeyPress}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        outline: "none",
        ...props.style,
      }}
      ref={containerRef}
    >
      <Stage width={containerSize.width} height={containerSize.height}>
        <Layer
          x={offsetX}
          y={offsetY}
          scaleX={scale}
          scaleY={scale}
          onClick={handleClick as any}
        >
          <Group
            ref={groupRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {img && <KonvaImage image={img} ref={imageRef} />}
            {props.annotations.map((annotation, index) =>
              renderAnnotation(annotation, index)
            )}
            {props.mouseSelection.map((shape, index) =>
              renderSelectionShape(shape, index)
            )}
            {isSelecting && (
              <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="#89BCFA99"
                stroke="#89BCFA"
                strokeWidth={1}
              />
            )}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
};

AnnotatedImage.defaultProps = {
  annotations: [],
  mouseSelection: [],
  annotationStyles: {},
};
