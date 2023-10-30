import { action, makeAutoObservable, makeObservable, observable, override } from "mobx";
import { observer } from "mobx-react-lite";
import { Box, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Layer, Stage, Text } from "react-konva";
import { Vector } from "../core/Vector";
import { clamp, getWindowSize } from "../core/Util";
import { useBetterMemo, useEventListener } from "../core/Hook";
import React, { forwardRef } from "react";
import Konva from "konva";
import { getRootStore } from "../core/Root";
import { Connector, DividerSegment, RowSegment, RowTail } from "../diagram/render/Segment";
import { CancellableCommand, Command } from "../command/Commands";
import { Matrix } from "../diagram/render/Matrix";
import { Field } from "../diagram/Field";
import { Diagram } from "../diagram/Diagram";
import { HandleResult, success } from "../command/HandleResult";
import { StylelessObserverInputProps, useStylelessObserverInput } from "../component/ObserverInput";

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

type FieldMemento = { field: Field; originLength: number };

export function toBitLengthPos(posInMatrix: Vector, matrix: Matrix): Vector {
  const minX = 0;
  const maxX = Math.floor((matrix.width - 2) / 2); // ((3 + 1) - 2) / 2 = 1
  const minY = 0;

  return new Vector(
    Math.max(minX, Math.min(Math.floor(posInMatrix.x / 2), maxX)),
    Math.max(minY, Math.floor(posInMatrix.y / 2))
  );
}

export interface InteractionEvent {
  readonly button: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly clientX: number;
  readonly clientY: number;
}

export abstract class Interaction {
  constructor(readonly handler: DiagramInteractionHandler) {
    makeObservable(this, {
      onMouseDown: action,
      onMouseMove: action,
      onMouseUp: action
    });
  }

  abstract onMouseDown(posInMatrix: Vector, event: InteractionEvent): Interaction | undefined;
  abstract onMouseMove(posInMatrix: Vector, event: InteractionEvent): Interaction | undefined;
  abstract onMouseUp(posInMatrix: Vector, event: InteractionEvent): Interaction | undefined;
}

export class ResizeFieldInteraction1 extends Interaction {
  private constructor(
    handler: DiagramInteractionHandler,
    readonly dragFromPosInMatrix: Vector,
    readonly leftField: FieldMemento,
    readonly rightField: FieldMemento | undefined
  ) {
    super(handler);

    makeObservable(this, {
      onMouseDown: override,
      onMouseMove: override,
      onMouseUp: override
    });
  }

  onMouseDown(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return undefined;
  }

  onMouseMove(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    if (posInMatrix.y % 2 === 0) return this; // divider line
    const matrix = this.handler.diagram.renderMatrix;

    const bitLength = Math.floor((matrix.width - 2) / 2);
    const dragFromPosInBitLength = toBitLengthPos(this.dragFromPosInMatrix, matrix);
    const dragFromBitLength = dragFromPosInBitLength.y * bitLength + dragFromPosInBitLength.x;
    const posInBitLength = toBitLengthPos(posInMatrix, matrix);
    const posBitLength = posInBitLength.y * bitLength + posInBitLength.x;

    const delta = posBitLength - dragFromBitLength;

    const leftField = this.leftField.field;
    const rightField = event.shiftKey ? this.rightField?.field : undefined;

    if (this.leftField.originLength + delta < 1) return this;
    if (rightField && this.rightField && this.rightField.originLength - delta < 1) return this;

    leftField.length = this.leftField.originLength + delta;
    if (rightField !== undefined) rightField.length = this.rightField!.originLength - delta;

    return this;
  }

  onMouseUp(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    this.handler.commitChange(success("Moved field(s)"));

    return undefined;
  }

  static onMouseDown(
    handler: DiagramInteractionHandler,
    posInMatrix: Vector,
    event: InteractionEvent
  ): ResizeFieldInteraction1 | undefined {
    if (event.button !== 0) return undefined; // handle left click only

    if (posInMatrix.y % 2 === 0) return undefined; // divider line
    const matrix = handler.diagram.renderMatrix;

    const element = matrix.get(posInMatrix.x, posInMatrix.y);
    if (element instanceof Connector === false) return undefined;

    const conn = element as Connector;
    if (conn.value !== (Connector.TOP | Connector.BOTTOM)) return undefined;

    const index = matrix.index(posInMatrix.x, posInMatrix.y);

    const findField = (index: number, direction: number): Field | undefined => {
      let searchIndex = index;
      while (true) {
        const searchElement = matrix.elements[(searchIndex += direction)];
        if (searchElement === undefined) return undefined;
        if (searchElement instanceof RowTail) return undefined;
        if (searchElement instanceof RowSegment)
          return handler.diagram.fields.find(field => field.uid === searchElement.represent.uid);
      }
    };

    const leftField = findField(index, -1);
    if (leftField === undefined) return undefined;

    const rightField = findField(index, 1);

    if (leftField === rightField) return undefined;

    return new ResizeFieldInteraction1(
      handler,
      posInMatrix,
      { field: leftField, originLength: leftField.length },
      rightField && { field: rightField, originLength: rightField.length }
    );
  }
}

export class ResizeFieldInteraction2 extends Interaction {
  private constructor(
    handler: DiagramInteractionHandler,
    readonly dragFromYInMatrix: number,
    readonly topField: FieldMemento,
    readonly bottomField: FieldMemento | undefined
  ) {
    super(handler);

    makeObservable(this, {
      onMouseDown: override,
      onMouseMove: override,
      onMouseUp: override
    });
  }

  onMouseDown(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return undefined;
  }

  onMouseMove(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    const matrix = this.handler.diagram.renderMatrix;

    const dragFromYInBitLength = Math.floor((this.dragFromYInMatrix - 1) / 2);
    const yInBitLength = Math.floor((posInMatrix.y - 1) / 2);

    const bitLength = Math.floor((matrix.width - 2) / 2);
    const delta = (yInBitLength - dragFromYInBitLength) * bitLength;

    const topField = this.topField.field;
    const bottomField = event.shiftKey ? this.bottomField?.field : undefined;

    if (this.topField.originLength + delta < 1) return this;
    if (bottomField && this.bottomField && this.bottomField.originLength - delta < 1) return this;

    topField.length = this.topField.originLength + delta;
    if (bottomField !== undefined) bottomField.length = this.bottomField!.originLength - delta;

    return this;
  }

  onMouseUp(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    this.handler.commitChange(success("Moved field(s)"));

    return undefined;
  }

  static onMouseDown(
    handler: DiagramInteractionHandler,
    posInMatrix: Vector,
    event: InteractionEvent
  ): ResizeFieldInteraction2 | undefined {
    if (event.button !== 0) return undefined; // handle left click only

    const diagram = handler.diagram;

    if (posInMatrix.y % 2 !== 0) return undefined; // divider line
    const matrix = diagram.renderMatrix;

    const element = matrix.get(posInMatrix.x, posInMatrix.y);
    if (element instanceof DividerSegment === false) return undefined;

    const div = element as DividerSegment;
    if (div.represent !== null) return undefined;

    const top = matrix.get(posInMatrix.x, posInMatrix.y - 1);
    if (top instanceof RowSegment === false) return undefined;
    const topField = diagram.fields.find(field => field.uid === (top as RowSegment).represent.uid);
    if (topField === undefined) return undefined;

    const bottom = matrix.get(posInMatrix.x, posInMatrix.y + 1);
    const bottomField =
      bottom instanceof RowSegment ? diagram.fields.find(field => field.uid === bottom.represent.uid) : undefined;

    return new ResizeFieldInteraction2(
      handler,
      posInMatrix.y,
      { field: topField, originLength: topField.length },
      bottomField && { field: bottomField, originLength: bottomField.length }
    );
  }
}

export class RenameFieldInteraction extends Interaction {
  /**
   * 0 = First mouse down
   * 1 = First mouse up
   * 2 = Second mouse down
   * 3 = Second mouse up (show text field)
   * 4 = Third mouse down (hide text field)
   */
  public clickSequence: 0 | 1 | 2 | 3 | 4 = 0;

  private constructor(
    handler: DiagramInteractionHandler,
    readonly field: Field,
    readonly originMatrixPos: Vector,
    readonly originClientPos: Vector,
    readonly startTime: number
  ) {
    super(handler);

    makeObservable(this, {
      clickSequence: observable,
      onMouseDown: override,
      onMouseMove: override,
      onMouseUp: override
    });
  }

  onMouseDown(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    if (event.button !== 0) return undefined; // handle left click only

    const currClientPos = new Vector(event.clientX, event.clientY);
    const nowTime = Date.now();

    if (this.clickSequence === 1) {
      if (
        posInMatrix.distance(this.originMatrixPos) > 1 ||
        currClientPos.distance(this.originClientPos) > 16 ||
        nowTime - this.startTime > 1000
      ) {
        return undefined;
      } else {
        this.clickSequence++;
        return this;
      }
    } else if (this.clickSequence === 3) {
      this.clickSequence++;
      return this;
    } else {
      return undefined;
    }
  }

  onMouseMove(posInMatrix: Vector, event: InteractionEvent): Interaction | undefined {
    const currClientPos = new Vector(event.clientX, event.clientY);

    if (this.clickSequence === 0) {
      console.log("RenameFieldInteraction.onMouseMove", currClientPos.distance(this.originClientPos));
      if (currClientPos.distance(this.originClientPos) > 16)
        return DragAndDropFieldInteraction.onStartDrag(this.handler, this.originMatrixPos, event);
    }

    return this;
  }

  onMouseUp(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    if (event.button !== 0) return undefined; // handle left click only

    const currClientPos = new Vector(event.clientX, event.clientY);
    const nowTime = Date.now();

    if (this.clickSequence === 0 || this.clickSequence === 2) {
      if (
        posInMatrix.distance(this.originMatrixPos) > 1 ||
        currClientPos.distance(this.originClientPos) > 16 ||
        nowTime - this.startTime > 1000
      ) {
        return undefined;
      } else {
        this.clickSequence++;
        return this;
      }
    } else {
      return undefined;
    }
  }

  static onMouseDown(
    handler: DiagramInteractionHandler,
    posInMatrix: Vector,
    event: InteractionEvent
  ): RenameFieldInteraction | undefined {
    if (event.button !== 0) return undefined; // handle left click only

    const matrix = handler.diagram.renderMatrix;

    const element = matrix.get(posInMatrix.x, posInMatrix.y);

    if (element instanceof RowSegment || element instanceof DividerSegment) {
      const field = handler.diagram.fields.find(field => field.uid === element.represent?.uid);
      if (field !== undefined) {
        return new RenameFieldInteraction(
          handler,
          field,
          posInMatrix,
          new Vector(event.clientX, event.clientY),
          Date.now()
        );
      }
    }

    return undefined;
  }
}

export class DeleteFieldInteraction extends Interaction {
  private constructor(handler: DiagramInteractionHandler, readonly field: Field) {
    super(handler);

    makeObservable(this, {
      onMouseDown: override,
      onMouseMove: override,
      onMouseUp: override
    });
  }

  onMouseDown(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return undefined;
  }

  onMouseMove(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return this;
  }

  onMouseUp(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    if (event.button !== 2) return this; // handle right click only

    const matrix = this.handler.diagram.renderMatrix;

    const element = matrix.get(posInMatrix.x, posInMatrix.y);

    if (element instanceof RowSegment || element instanceof DividerSegment) {
      if (this.field.uid !== element.represent?.uid) return undefined;
    }

    const diagram = this.handler.diagram;

    const index = diagram.fields.findIndex(f => f.uid === this.field.uid);
    diagram.removeField(index);

    this.handler.commitChange(success('Deleted field "' + this.field.name + '".'));

    return undefined;
  }

  static onMouseDown(
    handler: DiagramInteractionHandler,
    posInMatrix: Vector,
    event: InteractionEvent
  ): DeleteFieldInteraction | undefined {
    if (event.button !== 2) return undefined; // handle right click only

    const matrix = handler.diagram.renderMatrix;

    const element = matrix.get(posInMatrix.x, posInMatrix.y);

    if (element instanceof RowSegment || element instanceof DividerSegment) {
      const field = element.represent;
      if (field !== null) {
        return new DeleteFieldInteraction(handler, field);
      }
    }

    return undefined;
  }
}

export class AddFieldInteraction extends Interaction {
  private constructor(handler: DiagramInteractionHandler, readonly clientXY: Vector) {
    super(handler);

    makeObservable(this, {
      onMouseDown: override,
      onMouseMove: override,
      onMouseUp: override
    });
  }

  onMouseDown(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return undefined;
  }

  onMouseMove(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return this;
  }

  onMouseUp(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return undefined;
  }

  static onAddButtonClick(handler: DiagramInteractionHandler, event: InteractionEvent): AddFieldInteraction {
    return new AddFieldInteraction(handler, new Vector(event.clientX, event.clientY));
  }
}

export class InsertFieldInteraction extends Interaction {
  private constructor(handler: DiagramInteractionHandler, readonly fieldUid: number | null, readonly clientXY: Vector) {
    super(handler);

    makeObservable(this, {
      onMouseDown: override,
      onMouseMove: override,
      onMouseUp: override
    });
  }

  onMouseDown(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return undefined;
  }

  onMouseMove(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return this;
  }

  onMouseUp(posInMatrix: Vector, event: InteractionEvent): this | undefined {
    return undefined;
  }

  static onInsertButtonClick(
    handler: DiagramInteractionHandler,
    fieldUid: number | null,
    event: InteractionEvent
  ): InsertFieldInteraction {
    return new InsertFieldInteraction(handler, fieldUid, new Vector(event.clientX, event.clientY));
  }
}

export class DragAndDropFieldInteraction extends Interaction {
  public lastDragTime: number = 0;

  private constructor(handler: DiagramInteractionHandler, readonly field: Field, readonly originIdx: number) {
    super(handler);
  }

  onMouseDown(posInMatrix: Vector, event: InteractionEvent): Interaction | undefined {
    return undefined;
  }

  onMouseMove(posInMatrix: Vector, event: InteractionEvent): Interaction | undefined {
    // To prevent the field from being moved too fast
    if (Date.now() - this.lastDragTime < 100) return this;
    this.lastDragTime = Date.now();

    const diagram = this.handler.diagram;
    const matrix = diagram.renderMatrix;

    const targetFieldIdx = diagram.fields.findIndex(field => field === this.field);

    if ((posInMatrix.x <= 0 && posInMatrix.y === 1) || posInMatrix.y <= 0) {
      // insert position before any fields
      diagram.moveField(targetFieldIdx, 0);
    } else if (
      (posInMatrix.x >= matrix.width - 1 && posInMatrix.y === matrix.height - 2) ||
      posInMatrix.y >= matrix.height - 1
    ) {
      // insert position after any fields
      diagram.moveField(targetFieldIdx, diagram.size());
    } else {
      const insertPositions = getInsertPositions(matrix, true, true);

      const find = getClosestPositionWithTheSameY(posInMatrix, insertPositions);
      if (find === null) return this;

      const destFieldIdx = diagram.fields.findIndex(field => field.uid === find.fieldUid);

      if (destFieldIdx < targetFieldIdx && posInMatrix.x <= find.pos.x) {
        diagram.moveField(targetFieldIdx, destFieldIdx);
      } else if (targetFieldIdx <= destFieldIdx && find.pos.x < posInMatrix.x) {
        diagram.moveField(targetFieldIdx, destFieldIdx + 1); // Add 1 to destFieldIdx because the field is removed from the array.
      }
    }

    return this;
  }

  onMouseUp(posInMatrix: Vector, event: InteractionEvent): Interaction | undefined {
    const diagram = this.handler.diagram;

    const currentIdx = diagram.fields.findIndex(field => field === this.field);

    if (currentIdx === this.originIdx) return undefined;

    let msg: string;

    if (currentIdx === 0) msg = 'Dragged field "' + this.field.name + '" to the beginning.';
    else if (currentIdx === diagram.size() - 1) msg = 'Dragged field "' + this.field.name + '" to the end.';
    else msg = 'Dragged field "' + this.field.name + '" after "' + diagram.getField(currentIdx - 1).name + '".';

    this.handler.commitChange(success(msg));

    return undefined;
  }

  static onStartDrag(
    handler: DiagramInteractionHandler,
    posInMatrix: Vector,
    event: InteractionEvent
  ): DragAndDropFieldInteraction | undefined {
    if (event.button !== 0) return undefined; // handle right click only

    const matrix = handler.diagram.renderMatrix;

    const element = matrix.get(posInMatrix.x, posInMatrix.y);

    if (element instanceof RowSegment || element instanceof DividerSegment) {
      const field = handler.diagram.fields.find(field => field.uid === element.represent?.uid);
      const fieldIdx = handler.diagram.fields.findIndex(field => field.uid === element.represent?.uid);
      if (field !== undefined) {
        return new DragAndDropFieldInteraction(handler, field, fieldIdx);
      }
    }
  }
}

export interface DiagramInteractionHandler {
  get diagram(): Diagram;
  commitChange(result: HandleResult): void;
}

export class DiagramInteractionCommand extends Command implements CancellableCommand {
  readonly discriminator = "DiagramModifier";

  constructor(private result: HandleResult) {
    super("interaction", null, "an interaction in the user interface");
  }

  execute(): void {
    // noop
  }

  handle(): HandleResult {
    return this.result;
  }
}

export class DiagramCanvasController implements DiagramInteractionHandler {
  private offsetStart: Vector | undefined = undefined;

  diagramSize: Vector = new Vector(0, 0);
  canvasSize: Vector = getWindowSize();

  container: HTMLElement | null = null;

  private _interaction: Interaction | undefined = undefined;

  get interaction(): Interaction | undefined {
    return this._interaction;
  }

  set interaction(interaction: Interaction | undefined) {
    this._interaction = interaction;
  }

  get viewOffset() {
    return new Vector((this.canvasSize.x - this.diagramSize.x) / 2, 0);
  }

  get diagram() {
    return getRootStore().app.diagram;
  }

  commitChange(result: HandleResult): void {
    const { app, logger } = getRootStore();
    if (result === HandleResult.NOT_HANDLED || result.message === null) return;
    if (result.success) logger.info(result.message);
    else logger.error(result.message);

    app.operate(new DiagramInteractionCommand(result));
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
    const posWithoutOffsetInPx = this.getUnboundedPxFromNativeEvent(evt, false);
    const posInPx = this.getUnboundedPxFromNativeEvent(evt);
    if (posWithoutOffsetInPx === undefined || posInPx === undefined) return;
    const posInMatrix = this.getPosInMatrix(posInPx);

    this.interaction =
      this.interaction?.onMouseDown(posInMatrix, evt) ||
      ResizeFieldInteraction1.onMouseDown(this, posInMatrix, evt) ||
      ResizeFieldInteraction2.onMouseDown(this, posInMatrix, evt) ||
      DeleteFieldInteraction.onMouseDown(this, posInMatrix, evt) ||
      RenameFieldInteraction.onMouseDown(this, posInMatrix, evt);

    if (evt.button === 1) {
      // middle click
      // UX: Start "Grab & Move" if: middle click at any position
      evt.preventDefault(); // UX: Prevent default action (scrolling)

      this.startGrabAndMove(posWithoutOffsetInPx);
    }
  }

  onMouseMoveOrDragStage(evt: DragEvent | MouseEvent) {
    const posWithoutOffsetInPx = this.getUnboundedPxFromNativeEvent(evt, false);
    const posInPx = this.getUnboundedPxFromNativeEvent(evt);
    if (posWithoutOffsetInPx === undefined || posInPx === undefined) return;
    const posInMatrix = this.getPosInMatrix(posInPx);

    this.interaction = this.interaction?.onMouseMove(posInMatrix, evt);

    if (this.grabAndMove(posWithoutOffsetInPx)) return;
  }

  onMouseUpStage(evt: MouseEvent) {
    const posWithoutOffsetInPx = this.getUnboundedPxFromNativeEvent(evt, false);
    const posInPx = this.getUnboundedPxFromNativeEvent(evt);
    if (posWithoutOffsetInPx === undefined || posInPx === undefined) return;
    const posInMatrix = this.getPosInMatrix(posInPx);

    this.interaction = this.interaction?.onMouseUp(posInMatrix, evt);

    if (evt.button === 1) {
      // middle click
      this.endGrabAndMove();
    }
  }

  getPosInMatrix(posInPx: Vector): Vector {
    const { app } = getRootStore();
    const diagram = app.diagram;
    const yOffset = diagram.header === "" ? 0 : 2;

    const floatingPosInScale = posInPx.divide(new Vector(12, 16)).subtract(new Vector(0, yOffset));
    const flooredPosInMatrix = new Vector(Math.floor(floatingPosInScale.x), Math.floor(floatingPosInScale.y));
    if (flooredPosInMatrix.y % 2 === 0) {
      const i = Math.abs(flooredPosInMatrix.y - floatingPosInScale.y);
      flooredPosInMatrix.y += i >= 0.7 ? 1 : i <= 0.3 ? -1 : 0;
    }

    return flooredPosInMatrix;
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

  toUnboundedPx(posInMatrix: Vector): Vector {
    const { app } = getRootStore();
    const diagram = app.diagram;
    const yOffset = diagram.header === "" ? 0 : 2;

    const rtn = posInMatrix.add(new Vector(0, yOffset)).multiply(new Vector(12, 16));

    return rtn;
  }

  toClientXY(posInPx: Vector, useOffset = true, useScale = true): Vector | undefined {
    const { app } = getRootStore();

    const canvasPos = this.container?.getBoundingClientRect();
    if (canvasPos === undefined) return;

    const offset = useOffset ? app.diagramEditor.offset.subtract(this.viewOffset) : 0;

    const scale = useScale ? app.diagramEditor.scale : 1;

    const rtn = posInPx.subtract(offset).multiply(scale);

    // UX: Calculate the position of the control point by the client mouse position
    return rtn.add(new Vector(canvasPos.left, canvasPos.top));
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
          fontFamily={"Ubuntu Mono"}
          fill={"black"}
          width={16}
          height={16}
          align="center"
        />
      ))}
    </>
  );
});

export const DiagramCanvas = observer((props: { enableCanvas?: boolean }) => {
  const { app } = getRootStore();

  const controller = useBetterMemo(() => new DiagramCanvasController(), []);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<Konva.Stage>(null);
  const inputFieldRef = React.useRef<HTMLInputElement>(null);
  const diagramEditor = app.diagramEditor;

  const diagramText = app.diagram.toString();

  const canvasSize = controller.canvasSize;

  const diagramLines = diagramText.split("\n");
  const diagramLineLength = diagramLines[0].length;

  const diagramSize = new Vector(diagramLineLength * 12, diagramLines.length * 16);
  controller.diagramSize = diagramSize;

  controller.container = stageRef.current?.container() ?? null;

  useEventListener(
    canvasContainerRef.current,
    "wheel",
    evt => {
      controller.onWheelStage(evt);
    },
    { passive: false }
  );

  useEventListener(controller.container, "mousedown", evt => {
    controller.onMouseDownStage(evt);
  });

  useEventListener(controller.container, "mousemove", evt => {
    controller.onMouseMoveOrDragStage(evt);
  });

  useEventListener(document, "mouseup", evt => {
    const target = evt.target as HTMLElement;

    const rect = stageRef.current!.container().getBoundingClientRect();

    const { x: clientX, y: clientY } = getClientXY(evt);

    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      controller.endGrabAndMove();
    }

    if (inputFieldRef.current === target) return;
    controller.onMouseUpStage(evt);
  });

  const interaction = controller.interaction;

  return (
    <Box ref={canvasContainerRef} sx={{ position: "fixed", top: 0, left: 0, bottom: 0, right: 0 }}>
      <Stage
        className="diagram-canvas"
        ref={stageRef}
        width={canvasSize.x}
        height={canvasSize.y}
        scale={new Vector(diagramEditor.scale, diagramEditor.scale)}
        offset={diagramEditor.offset.subtract(controller.viewOffset)}
        onContextMenu={e => e.evt.preventDefault()}>
        <Layer>
          {props.enableCanvas !== false &&
            diagramLines.map((line, index) => <DiagramTextLineElement key={index} line={line} lineNumber={index} />)}
        </Layer>
      </Stage>

      {getInsertPositions(app.diagram.renderMatrix, true, false).map(info => (
        <DiagramInsertFieldButton
          key={info.fieldUid ?? "null"}
          controller={controller}
          fieldUid={info.fieldUid}
          posInMatrix={info.pos.add(new Vector(0, 1))}
        />
      ))}

      <DiagramAddFieldButton controller={controller} />

      {interaction instanceof RenameFieldInteraction && interaction.clickSequence === 3 && (
        <DiagramInput
          ref={inputFieldRef}
          clientXY={interaction.originClientPos}
          label="Enter to rename"
          getValue={() => interaction.field.name}
          setValue={value => {
            const oldName = interaction.field.name;
            interaction.field.name = value;

            if (oldName !== value) {
              controller.commitChange(success('Renamed field from "' + oldName + '" to "' + value + '".'));
            }
            controller.interaction = undefined;
          }}
          isValidIntermediate={() => true}
          isValidValue={() => true}
        />
      )}
      {interaction instanceof AddFieldInteraction && (
        <DiagramInput
          ref={inputFieldRef}
          clientXY={interaction.clientXY}
          label="Enter to add field"
          getValue={() => ""}
          setValue={(value, debounceCheck) => {
            if (debounceCheck === true) {
              const suggestedLength = Math.min(Math.ceil(value.length / 2) + 1, 32);

              app.diagram.addField(new Field(value, suggestedLength));

              controller.commitChange(success('Added field "' + value + '".'));
            }

            controller.interaction = undefined;
          }}
          isValidIntermediate={() => true}
          isValidValue={value => [value !== "", value !== ""]}
        />
      )}
      {interaction instanceof InsertFieldInteraction && (
        <DiagramInput
          ref={inputFieldRef}
          clientXY={interaction.clientXY}
          label="Enter to insert field"
          getValue={() => ""}
          setValue={(value, debounceCheck) => {
            if (debounceCheck === true) {
              const suggestedLength = Math.min(Math.ceil(value.length / 2) + 1, 32);

              const afterFieldUid = interaction.fieldUid;
              const fieldIndex = app.diagram.fields.findIndex(field => field.uid === afterFieldUid);
              const insertIndex = fieldIndex + 1;

              app.diagram.insertField(insertIndex, new Field(value, suggestedLength));

              let msg: string;
              if (insertIndex === 0) msg = 'Inserted field "' + value + '" to the beginning.';
              else msg = 'Inserted field "' + value + '" after "' + app.diagram.getField(insertIndex - 1).name + '".';

              controller.commitChange(success(msg));
            }

            controller.interaction = undefined;
          }}
          isValidIntermediate={() => true}
          isValidValue={value => [value !== "", value !== ""]}
        />
      )}
    </Box>
  );
});

export const findField = (matrix: Matrix, index: number, direction: number): Field | undefined => {
  let searchIndex = index;
  while (true) {
    const searchElement = matrix.elements[(searchIndex += direction)];
    if (searchElement === undefined) return undefined;
    if (searchElement instanceof RowTail) return undefined;
    if (searchElement instanceof RowSegment) return searchElement.represent;
  }
};

export const getClosestPositionWithTheSameY = (
  target: Vector,
  positions: { fieldUid: number | null; pos: Vector }[]
) => {
  type Mapping = { fieldUid: number | null; pos: Vector };

  let closet: [Mapping, number] | null = null;

  for (let i = 0; i < positions.length; i++) {
    const check = positions[i];
    if (check.pos.x === target.x && check.pos.y === target.y) return check;

    const distance = Math.abs(check.pos.x - target.x);
    if ((closet === null || distance < closet[1]) && check.pos.y === target.y) closet = [check, distance];
  }

  if (closet === null) return null;
  return closet[0];
};

export const getInsertPositions = (matrix: Matrix, includeBeginning: boolean, includeEnd: boolean) => {
  const insertPos: { fieldUid: number | null; pos: Vector }[] = [];
  for (let y = 1; y < matrix.height; y += 2) {
    for (let x = 0; x < matrix.width; x++) {
      const element = matrix.get(x, y);
      if (element instanceof Connector === false) continue;

      const conn = element as Connector;
      if (conn.value !== (Connector.TOP | Connector.BOTTOM)) continue;

      const index = matrix.index(x, y);

      const leftField = findField(matrix, index, -1);
      if (leftField === undefined) {
        if (includeBeginning) insertPos.push({ fieldUid: null, pos: new Vector(x, y) });
      } else {
        const rightField = findField(matrix, index, 1);

        if (leftField.uid === rightField?.uid) continue;

        if (rightField === undefined && includeEnd === false) continue;

        insertPos.push({ fieldUid: leftField.uid, pos: new Vector(x, y) });
      }
    }
  }

  return insertPos;
};

type DiagramInputProps = StylelessObserverInputProps &
  React.InputHTMLAttributes<HTMLInputElement> & {
    clientXY: Vector;
    label?: string;
  };

export const DiagramInput = observer(
  forwardRef<HTMLInputElement, DiagramInputProps>((props: DiagramInputProps, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { getRootProps } = useStylelessObserverInput(props);
    const { clientXY, label, ...rest } = getRootProps();

    React.useEffect(() => {
      if (inputRef.current === null) return;

      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }, [inputRef.current]);

    React.useImperativeHandle(ref, () => inputRef.current!);

    return (
      <Box
        sx={{
          position: "fixed",
          top: clientXY.y + 16 + "px",
          left: clientXY.x + 16 + "px",
          width: "150px",
          height: label !== undefined ? "44px" : "28px",
          backgroundColor: "rgb(250, 250, 250)",
          border: "1px solid rgba(0, 0, 0, 0.23)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column"
        }}>
        <input
          ref={inputRef}
          style={{
            border: "none",
            outline: "none",
            width: "calc(100% - 10px)",
            height: "18px",
            backgroundColor: "rgb(235 235 235 / 25%)",
            lineHeight: "18px",
            fontSize: "16px"
          }}
          {...rest}
        />
        {label && (
          <Typography
            variant="caption"
            sx={{ color: "rgba(0, 0, 0, 0.54)", paddingLeft: "5px", width: "calc(100% - 5px)" }}>
            {label}
          </Typography>
        )}
      </Box>
    );
  })
);

export const DiagramAddFieldButton = observer((props: { controller: DiagramCanvasController }) => {
  const { app } = getRootStore();
  const diagram = app.diagram;
  const matrix = diagram.renderMatrix;

  const changeByFields = diagram.fields.map(field => ({ ...field }));
  const changeByOptions = diagram.config.options.map(option => ({ ...option }));

  // this effect is used to trigger re-render when any field or option is changed
  React.useEffect(() => {
    // noop
  }, [changeByFields, changeByOptions]);

  // find the last row segment but not row tail
  let i = matrix.elements.length - 1;
  for (; i >= 0; i--) {
    const element = matrix.elements[i];
    if (element instanceof RowSegment && element instanceof RowTail === false) {
      i += 2;
      break;
    }
  }

  const posInMatrix =
    matrix.width === 0 ? new Vector(0, 0) : new Vector(i % matrix.width, Math.floor(i / matrix.width));
  const posInPx = props.controller.toUnboundedPx(posInMatrix);
  const posInClient = props.controller.toClientXY(posInPx);
  const buttonPos = posInClient?.add(new Vector(0, (app.diagramEditor.scale * (32 - 16)) / -2));
  const buttonSize = 32 * app.diagramEditor.scale;
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  useDiagramButton(buttonRef);

  if (buttonPos === undefined) return null;

  return (
    <IconButton
      ref={buttonRef}
      sx={{
        position: "fixed",
        top: buttonPos.y + "px",
        left: buttonPos.x + "px",
        width: buttonSize + "px",
        height: buttonSize + "px",
        backgroundColor: "rgb(250, 250, 250)",
        opacity: 0,
        touchAction: "none"
      }}
      size="small"
      onClick={event => {
        props.controller.interaction ??= AddFieldInteraction.onAddButtonClick(props.controller, event);
      }}>
      <AddIcon color="primary" />
    </IconButton>
  );
});

export const DiagramInsertFieldButton = observer(
  (props: { controller: DiagramCanvasController; fieldUid: number | null; posInMatrix: Vector }) => {
    const { app } = getRootStore();
    const diagram = app.diagram;

    const changeByFields = diagram.fields.map(field => ({ ...field }));
    const changeByOptions = diagram.config.options.map(option => ({ ...option }));

    // this effect is used to trigger re-render when any field or option is changed
    React.useEffect(() => {
      // noop
    }, [changeByFields, changeByOptions]);

    const posInPx = props.controller.toUnboundedPx(props.posInMatrix);
    const posInClient = props.controller.toClientXY(posInPx);
    const buttonPos = posInClient?.add(new Vector(0, (app.diagramEditor.scale * (16 - 16)) / -2));
    const buttonSize = 16 * app.diagramEditor.scale;
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    useDiagramButton(buttonRef);

    if (buttonPos === undefined) return null;

    return (
      <IconButton
        ref={buttonRef}
        sx={{
          position: "fixed",
          top: buttonPos.y + "px",
          left: buttonPos.x + "px",
          width: buttonSize + "px",
          height: buttonSize + "px",
          backgroundColor: "rgb(250, 250, 250)",
          opacity: 0,
          touchAction: "none",
          "&:hover": {
            backgroundColor: "rgb(250, 250, 250)"
          }
        }}
        size="small"
        onClick={event => {
          props.controller.interaction ??= InsertFieldInteraction.onInsertButtonClick(
            props.controller,
            props.fieldUid,
            event
          );
        }}>
        <ExpandLessIcon color="primary" />
      </IconButton>
    );
  }
);

export const useDiagramButton = (buttonRef: React.RefObject<HTMLButtonElement>) => {
  useEventListener(document, "mousemove", evt => {
    const button = buttonRef.current;
    if (button === null) return;

    const rect = button.getBoundingClientRect();
    const center = new Vector(rect.left + rect.width / 2, rect.top + rect.height / 2);

    const distance = center.distance(new Vector(evt.clientX, evt.clientY));

    const minThreshold = 16;
    const maxThreshold = 64;
    const distanceCalc = Math.min(Math.max(distance, minThreshold), maxThreshold) - minThreshold;
    const opacity = 1 - distanceCalc / (maxThreshold - minThreshold);

    button.style.opacity = opacity.toString();
  });

  useEventListener(
    buttonRef.current,
    "wheel",
    evt => {
      evt.preventDefault();
    },
    { passive: false }
  );
};
