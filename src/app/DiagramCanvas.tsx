import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";
import { Layer, Stage, Text } from "react-konva";
import { Vector } from "../core/Vector";
import { clamp, getWindowSize } from "../core/Util";
import { useBetterMemo, useEventListener } from "../core/Hook";
import React from "react";
import Konva from "konva";
import { getRootStore } from "../core/Root";

export function isKonvaTouchEvent(event: Konva.KonvaEventObject<unknown>): event is Konva.KonvaEventObject<TouchEvent> {
  return !!window.TouchEvent && event.evt instanceof TouchEvent;
}

export function isTouchEvent(event: unknown): event is TouchEvent {
  return !!window.TouchEvent && event instanceof TouchEvent;
}

export function getClientXY(event: DragEvent | MouseEvent | TouchEvent): Vector {
  if (window.TouchEvent && event instanceof TouchEvent) {
    const touch = event.touches[0] || event.changedTouches[0];
    return touch ? new Vector(touch.clientX, touch.clientY) : new Vector(0, 0);
  } else {
    event = event as DragEvent | MouseEvent;
    return new Vector(event.clientX, event.clientY);
  }
}

export class DiagramCanvasController {
  private offsetStart: Vector | undefined = undefined;

  diagramSize: Vector = new Vector(0, 0);
  canvasSize: Vector = getWindowSize();

  container: HTMLElement | null = null;

  get viewOffset() {
    // return new Vector((this.diagramSize.x - this.diagramSize.y) / 2, 0);
    return new Vector((this.canvasSize.x - this.diagramSize.x) / 2, 0);
  }

  private updateCanvasSize() {
    this.canvasSize = getWindowSize();
  }

  constructor() {
    makeAutoObservable(this, { container: false, diagramSize: false, viewOffset: false });

    window.addEventListener("resize", () => this.updateCanvasSize());
  }

  startGrabAndMove(posInPx: Vector): void {
    // position with scale
    // UX: Move field if: middle click
    this.offsetStart = posInPx;
  }

  grabAndMove(posInPx: Vector): boolean {
    // position with scale
    if (this.isGrabAndMove === false) return false;

    const vec = posInPx.subtract(this.offsetStart!);
    this.offsetStart = posInPx;

    return this.panning(vec);
  }

  endGrabAndMove(): boolean {
    const isGrabbing = this.isGrabAndMove;
    this.offsetStart = undefined;
    return isGrabbing;
  }

  panning(vec: Vector): boolean {
    const { app } = getRootStore();

    const oldScale = app.diagramEditor.scale;
    const oldOffset = app.diagramEditor.offset;

    const newOffset = oldOffset.subtract(vec);

    const sizeNegX =
      this.viewOffset.x + this.diagramSize.x / oldScale + (this.canvasSize.x + this.diagramSize.x) / -oldScale;
    const sizePosX = (this.canvasSize.x + this.diagramSize.x) / 2;
    const sizeNegY = Math.min(this.canvasSize.y, Math.max(this.diagramSize.y, this.canvasSize.y)) / -oldScale;
    const sizePosY = Math.max(this.diagramSize.y, Math.min(this.diagramSize.y, this.canvasSize.y));

    newOffset.x = clamp(newOffset.x, sizeNegX + 32, sizePosX - 32);
    newOffset.y = clamp(newOffset.y, sizeNegY + 32, sizePosY - 32);
    app.diagramEditor.offset = newOffset;

    return true;
  }

  zooming(variable: number, posInPx: Vector): boolean {
    const { app } = getRootStore();

    const oldScale = app.diagramEditor.scale;
    const oldOffset = app.diagramEditor.offset;

    const newScale = clamp(variable, 0.75, 2);

    // offset is offset in Konva coordinate system (KC)
    // offsetInCC is offset in HTML Canvas coordinate system (CC)
    const offsetInCC = oldOffset.multiply(oldScale).multiply(-1);

    const canvasHalfSizeWithScale = (this.diagramSize.y * oldScale) / 2;
    const newCanvasHalfSizeWithScale = (this.diagramSize.y * newScale) / 2;

    // UX: Maintain zoom center at mouse pointer
    const fieldCenter = offsetInCC.add(canvasHalfSizeWithScale);
    const newFieldCenter = offsetInCC.add(newCanvasHalfSizeWithScale);
    const relativePos = posInPx.subtract(fieldCenter).divide(oldScale);
    const newPos = newFieldCenter.add(relativePos.multiply(newScale));
    const newOffsetInCC = posInPx.subtract(newPos).add(offsetInCC);
    const newOffsetInKC = newOffsetInCC.multiply(-1).divide(newScale);

    app.diagramEditor.scale = newScale;
    app.diagramEditor.offset = newOffsetInKC;

    return true;
  }

  onWheelStage(evt: WheelEvent): void {
    const { app } = getRootStore();

    if (evt.ctrlKey === false && (evt.deltaX !== 0 || evt.deltaY !== 0) && this.isGrabAndMove === false) {
      // UX: Panning if: ctrl key up + wheel/mouse pad + no "Grab & Move" + not changing heading value with scroll wheel in the last 300ms

      evt.preventDefault();

      this.panning(new Vector(evt.deltaX * -0.5, evt.deltaY * -0.5));
    } else if (evt.ctrlKey === true && evt.deltaY !== 0) {
      // UX: Zoom in/out if: wheel while ctrl key down

      evt.preventDefault();

      const pos = this.getUnboundedPxFromNativeEvent(evt, false, false);
      if (pos === undefined) return;

      this.zooming(app.diagramEditor.scale * (1 - evt.deltaY / 1000), pos);
    }
  }

  onMouseDownStage(evt: MouseEvent): void {
    if (evt.button === 1) {
      // middle click
      // UX: Start "Grab & Move" if: middle click at any position
      evt.preventDefault(); // UX: Prevent default action (scrolling)

      const posWithoutOffsetInPx = this.getUnboundedPxFromNativeEvent(evt, false);
      if (posWithoutOffsetInPx === undefined) return;
      this.startGrabAndMove(posWithoutOffsetInPx);
    }
  }

  onMouseMoveOrDragStage(evt: DragEvent | MouseEvent) {
    const posWithoutOffsetInPx = this.getUnboundedPxFromNativeEvent(evt, false);
    if (posWithoutOffsetInPx === undefined) return;

    this.grabAndMove(posWithoutOffsetInPx);
  }

  onMouseUpStage(evt: MouseEvent) {
    if (evt.button === 1) {
      // middle click
      this.endGrabAndMove();
    }
  }

  getUnboundedPx(clientXY: Vector, useOffset = true, useScale = true): Vector | undefined {
    const { app } = getRootStore();

    const canvasPos = this.container?.getBoundingClientRect();
    if (canvasPos === undefined) return;

    const offset = useOffset ? app.diagramEditor.offset.subtract(this.viewOffset) : 0;

    const scale = useScale ? app.diagramEditor.scale : 1;

    const rtn = clientXY.subtract(new Vector(canvasPos.left, canvasPos.top));

    // UX: Calculate the position of the control point by the client mouse position
    return rtn.divide(scale).add(offset);
  }

  getUnboundedPxFromNativeEvent(
    event: DragEvent | MouseEvent | TouchEvent,
    useOffset = true,
    useScale = true
  ): Vector | undefined {
    return this.getUnboundedPx(getClientXY(event), useOffset, useScale);
  }

  getUnboundedPxFromEvent(
    event: Konva.KonvaEventObject<DragEvent | MouseEvent | TouchEvent>,
    useOffset = true,
    useScale = true
  ): Vector | undefined {
    return this.getUnboundedPxFromNativeEvent(event.evt, useOffset, useScale);
  }

  get isGrabAndMove() {
    return this.offsetStart !== undefined;
  }
}

export const DiagramTextLineElement = observer((props: { line: string; lineNumber: number }) => {
  return (
    <>
      {props.line.split("").map((char, index) => (
        <Text
          key={index}
          text={char}
          x={12 * index}
          y={16 * props.lineNumber}
          fontSize={16}
          fontFamily={"Ubuntu Mono Arial"}
          fill={"black"}
          width={16}
          height={16}
          align="center"
        />
      ))}
    </>
  );
});

export const DiagramCanvas = observer(() => {
  const { app } = getRootStore();

  const controller = useBetterMemo(() => new DiagramCanvasController(), []);
  const stageRef = React.useRef<Konva.Stage>(null);
  const diagramEditor = app.diagramEditor;

  const diagramText = app.diagram.toString();

  const canvasSize = controller.canvasSize;

  const diagramLines = diagramText.split("\n");
  const diagramLineLength = diagramLines[0].length ?? 0;

  const diagramSize = new Vector(diagramLineLength * 12, diagramLines.length * 16);
  controller.diagramSize = diagramSize;

  controller.container = stageRef.current?.container() ?? null;

  useEventListener(document, "mouseup", evt => controller.onMouseUpStage(evt));

  function onMouseMoveOrMouseDragOrTouchDragStage(event: Konva.KonvaEventObject<DragEvent | MouseEvent | TouchEvent>) {
    /*
    UX:
    Both mouse move and drag events will trigger this function. it allows users to perform area selection and 
    "Grab & Move" outside the canvas. Both events are needed to maximize usability.

    Normally, both events will be triggered at the same time. (but I don't know why onDragMove returns MouseEvent)
    After the mouse is dragged outside the canvas, only drag event will be triggered. Also, the dragging state will 
    come to an end when any mouse button is down. When it is happened only mouse move event will be triggered.

    In addition, touch drag event will also trigger this function. 
    */

    // UX: It is not actually dragged "stage", reset the position to (0, 0)
    if (event.target instanceof Konva.Stage) event.target.setPosition(new Vector(0, 0));

    if (isKonvaTouchEvent(event) === false) {
      controller.onMouseMoveOrDragStage(event.evt as DragEvent | MouseEvent);
    }
  }

  function onDragEndStage(event: Konva.KonvaEventObject<DragEvent | TouchEvent>) {
    /*
    UX:
    If the mouse is down(any buttons), the drag end event is triggered.
    After that, without dragging, we lose the information of the mouse position outside the canvas.
    We reset everything if the mouse is down outside the canvas.
    */

    // UX: No need to call touchend event handler here

    const rect = stageRef.current?.container().getBoundingClientRect();
    if (rect === undefined) return;

    if (event.evt === undefined) return; // XXX: Drag end event from segment control

    const { x: clientX, y: clientY } = getClientXY(event.evt);

    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      controller.endGrabAndMove();
    }
  }

  return (
    <Box sx={{ position: "fixed", top: 0, left: 0, bottom: 0, right: 0 }}>
      <Stage
        className="diagram-canvas"
        ref={stageRef}
        width={canvasSize.x}
        height={canvasSize.y}
        scale={new Vector(diagramEditor.scale, diagramEditor.scale)}
        offset={diagramEditor.offset.subtract(controller.viewOffset)}
        draggable
        onContextMenu={e => e.evt.preventDefault()}
        onWheel={event => controller.onWheelStage(event.evt)}
        onMouseDown={event => controller.onMouseDownStage(event.evt)}
        onMouseMove={action(onMouseMoveOrMouseDragOrTouchDragStage)}
        // onMouseUp={event => controller.onMouseUpStage(event)}
        onDragMove={action(onMouseMoveOrMouseDragOrTouchDragStage)}
        onDragEnd={action(onDragEndStage)}>
        <Layer>
          {diagramLines.map((line, index) => (
            <DiagramTextLineElement key={index} line={line} lineNumber={index} />
          ))}
        </Layer>
      </Stage>
    </Box>
  );
});
