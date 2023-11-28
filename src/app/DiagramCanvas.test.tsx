import {
  isKonvaTouchEvent,
  isTouchEvent,
  getClientXY,
  toBitLengthPos,
  DiagramCanvas,
  DiagramCanvasController,
  DiagramInput,
  DiagramInsertFieldButton,
  ResizeFieldInteraction1,
  DiagramInteractionHandler,
  InteractionEvent,
  DiagramInteractionCommand,
  ResizeFieldInteraction2,
  AddFieldInteraction,
  InsertFieldInteraction,
  RenameFieldInteraction,
  DragAndDropFieldInteraction,
  DeleteFieldInteraction,
  useDiagramButton,
  getInsertPositions
} from "./DiagramCanvas";
import { Vector } from "../core/Vector";
import { Diagram } from "../diagram/Diagram";
import { Field } from "../diagram/Field";
import { fireEvent, render } from "@testing-library/react";
import { getRootStore } from "../core/Root";
import { act } from "react-dom/test-utils";
import React from "react";
import { HandleResult } from "../command/HandleResult";
import { buildParameters } from "../token/Tokens";

test("isKonvaTouchEvent", () => {
  global.TouchEvent = jest.fn();
  const mockKonvaEvent = {
    evt: new TouchEvent("touchstart")
  };
  expect(isKonvaTouchEvent(mockKonvaEvent as any)).toBe(true);
  expect(isKonvaTouchEvent({} as any)).toBe(false);
});

test("isTouchEvent", () => {
  global.TouchEvent = jest.fn();
  const mockTouchEvent = new TouchEvent("touchstart");
  expect(isTouchEvent(mockTouchEvent as any)).toBe(true);
  expect(isTouchEvent({} as any)).toBe(false);
});

test("getClientXY", () => {
  global.TouchEvent = jest.fn();
  const mockTouchEvent = new TouchEvent("touchstart");
  (mockTouchEvent as any).touches = [{ clientX: 1, clientY: 2 }];
  expect(getClientXY(mockTouchEvent)).toEqual({ x: 1, y: 2 });

  (mockTouchEvent as any).touches = [null];
  (mockTouchEvent as any).changedTouches = [{ clientX: 3, clientY: 4 }];
  expect(getClientXY(mockTouchEvent)).toEqual({ x: 3, y: 4 });

  (mockTouchEvent as any).changedTouches = [null];
  expect(getClientXY(mockTouchEvent)).toEqual({ x: 0, y: 0 });

  expect(getClientXY({ clientX: 5, clientY: 6 } as any)).toEqual({ x: 5, y: 6 });
});

test("toBitLengthPos", () => {
  const d = new Diagram();
  d.addField(new Field("a", 12));
  d.toString();

  expect(toBitLengthPos(new Vector(0, 0), d.renderMatrix)).toEqual(new Vector(0, 0)); //d.render.Matrix.width = 66

  const maxX = Math.floor((d.renderMatrix.width - 2) / 2);
  expect(toBitLengthPos(new Vector(200, 0), d.renderMatrix)).toEqual(new Vector(maxX, 0));

  expect(toBitLengthPos(new Vector(-2, 0), d.renderMatrix)).toEqual(new Vector(0, 0));

  expect(toBitLengthPos(new Vector(0, 12), d.renderMatrix)).toEqual(new Vector(0, 6));

  expect(toBitLengthPos(new Vector(0, -12), d.renderMatrix)).toEqual(new Vector(0, 0));
});

test("DiagramCanvasController", () => {
  const { app, logger } = getRootStore();
  const controller = new DiagramCanvasController();
  fireEvent.resize(window);
  expect(controller.diagram).toStrictEqual(app.diagram);
  app.diagram.addField(new Field("test1", 12));
  app.diagram.toString();

  // Test zooming
  controller.onWheelStage(new WheelEvent("wheel", { ctrlKey: true, deltaY: 0 }));
  controller.onWheelStage(new WheelEvent("wheel", { ctrlKey: true, deltaY: 1 }));

  // Test panning
  controller.onMouseDownStage(new MouseEvent("mousedown", { button: 1 }));
  controller.onMouseMoveOrDragStage(new MouseEvent("mousemove", { button: 1 }));
  controller.onMouseUpStage(new MouseEvent("mouseup", { button: 1 }));

  controller.container = document.createElement("div");
  expect(controller.toClientXY(new Vector(1, 1), false, false)).toStrictEqual(new Vector(1, 1));

  const offset = app.diagramEditor.offset.subtract(controller.viewOffset);
  expect(controller.getUnboundedPx(new Vector(1, 1))).toStrictEqual(new Vector(1, 1).add(offset));

  // Test panning
  controller.onMouseDownStage(new MouseEvent("mousedown", { button: 1 }));
  controller.onMouseMoveOrDragStage(new MouseEvent("mousemove", { button: 1 }));
  controller.onMouseUpStage(new MouseEvent("mouseup", { button: 1 }));

  expect(controller.getPosInMatrix(new Vector(12, 8))).toStrictEqual(new Vector(1, -2));
  expect(controller.getPosInMatrix(new Vector(12, 16))).toStrictEqual(new Vector(1, -1));

  controller.commitChange(new HandleResult(false, null));
  controller.commitChange(HandleResult.NOT_HANDLED);

  expect(logger.logs.length).toBe(0);
  controller.commitChange(new HandleResult(true, "test"));
  expect(logger.logs.length).toBe(1);
  expect(logger.logs[0].message).toBe("test");
  expect(logger.logs[0].level).toBe("info");

  controller.commitChange(new HandleResult(false, "test2"));
  expect(logger.logs.length).toBe(2);
  expect(logger.logs[1].message).toBe("test2");
  expect(logger.logs[1].level).toBe("error");
});

test("render DiagramCanvas", async () => {
  const { app } = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas />
    </div>
  );
  const result = render(component);
  act(() => {
    app.diagram = new Diagram();
  });

  const eventTargetKonva = result.container.querySelector("#root-container > div > div > div");
  const eventTargetCanvasContainerRef = result.container.querySelector("#root-container > div");

  act(() => {
    fireEvent.contextMenu(eventTargetKonva as any);
  });

  act(() => {
    fireEvent.mouseDown(eventTargetKonva as any, { clientX: 0, clientY: 0 });
  });

  act(() => {
    fireEvent.mouseMove(eventTargetKonva as any, { clientX: 1, clientY: 1 });
  });

  act(() => {
    fireEvent.wheel(eventTargetCanvasContainerRef as any, { deltaY: 1 });
  });

  document.dispatchEvent(new MouseEvent("mouseup", { clientX: 1, clientY: 1 }));

  document.dispatchEvent(new MouseEvent("mouseup", { clientX: 0, clientY: 0 }));

  const addBtn = result.container.querySelector("button");
  act(() => {
    fireEvent.click(addBtn as Element);
  });

  const inputAdd = result.container.querySelector("input")!;

  act(() => {
    fireEvent.mouseUp(inputAdd, { clientX: 0, clientY: 0 });
  });

  result.unmount();
});

test("DiagramCanvas add field", async () => {
  const { app } = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas enableCanvas={false} />
    </div>
  );
  const result = render(component);
  app.diagram = new Diagram();
  result.rerender(component);
  const addBtn = result.container.querySelector("button");
  act(() => {
    fireEvent.click(addBtn as Element);
  });

  const inputAdd = result.container.querySelector("input")!;

  act(() => {
    fireEvent.input(inputAdd, { target: { value: "test1" } });
    fireEvent.keyDown(inputAdd, { key: "Enter", code: "Enter" });
  });

  expect(app.diagram.fields.length).toBe(1);
  expect(app.diagram.fields[0].name).toBe("test1");

  result.unmount();
});

test("DiagramCanvas rename field", async () => {
  const { app } = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas enableCanvas={false} />
    </div>
  );
  app.diagram = new Diagram();
  const result = render(component);
  act(() => {
    app.diagram.addField(new Field("test1", 12));
  });

  const eventTargetKonva = result.container.querySelector("#root-container > div > div > div") as HTMLElement;
  const controller = new DiagramCanvasController();
  controller.container = eventTargetKonva;

  const pos_1_1 = controller.toClientXY(controller.toUnboundedPx(new Vector(1, 1)))!;

  act(() => {
    fireEvent.mouseDown(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y });
    fireEvent.mouseUp(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y });
    fireEvent.mouseDown(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y });
    fireEvent.mouseUp(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y });
  });

  const inputAdd = result.container.querySelector("input")!;

  act(() => {
    fireEvent.input(inputAdd, { target: { value: "test2" } });
    fireEvent.keyDown(inputAdd, { key: "Enter", code: "Enter" });
  });

  expect(app.diagram.fields[0].length).toBe(12);
  expect(app.diagram.fields[0].name).toBe("test2");

  result.unmount();
});

test("DiagramCanvas delete field", () => {
  const { app } = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas enableCanvas={false} />
    </div>
  );
  app.diagram = new Diagram();
  const result = render(component);
  act(() => {
    app.diagram.addField(new Field("test1", 12));
  });

  const eventTargetKonva = result.container.querySelector("#root-container > div > div > div") as HTMLElement;
  const controller = new DiagramCanvasController();
  controller.container = eventTargetKonva;

  const pos_1_1 = controller.toClientXY(controller.toUnboundedPx(new Vector(1, 1)))!;

  act(() => {
    fireEvent.mouseDown(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y, button: 2 });
    fireEvent.mouseUp(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y, button: 2 });
  });

  expect(app.diagram.fields.length).toBe(0);
  result.unmount();
});

test("DiagramCanvas insert field", async () => {
  const { app } = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas enableCanvas={false} />
    </div>
  );
  app.diagram = new Diagram();
  const result = render(component);
  act(() => {
    app.diagram.addField(new Field("test1", 12));
  });

  const eventTargetKonva = result.container.querySelector("#root-container > div > div > div") as HTMLElement;
  const controller = new DiagramCanvasController();
  controller.container = eventTargetKonva;

  const insertBtn1 = result.container.querySelectorAll("button")[0];

  act(() => {
    fireEvent.click(insertBtn1 as Element);
  });

  let inputInsert = result.container.querySelector("input")!;

  act(() => {
    fireEvent.input(inputInsert, { target: { value: "test2" } });
    fireEvent.keyDown(inputInsert, { key: "Enter", code: "Enter" });
  });

  expect(app.diagram.fields[0].name).toBe("test2");
  expect(app.diagram.fields[1].name).toBe("test1");

  const insertBtn2 = result.container.querySelectorAll("button")[1];

  act(() => {
    fireEvent.click(insertBtn2 as Element);
  });

  inputInsert = result.container.querySelector("input")!;

  act(() => {
    fireEvent.input(inputInsert, { target: { value: "test3" } });
    fireEvent.keyDown(inputInsert, { key: "Enter", code: "Enter" });
  });

  expect(app.diagram.fields[0].name).toBe("test2");
  expect(app.diagram.fields[1].name).toBe("test3");
  expect(app.diagram.fields[2].name).toBe("test1");
  result.unmount();
});

test("DiagramCanvasController calculation", () => {
  const component = (
    <div id="root-container">
      <div id="main" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
  const result = render(component);

  const controller = new DiagramCanvasController();
  controller.container = document.querySelector("#main");

  const a = controller.toClientXY(new Vector(24, 1))!;
  const b = controller.getUnboundedPx(a)!;

  expect(new Vector(24, 1)).toStrictEqual(b);
});

test("DiagramCanvas drag to change field length", () => {
  const { app } = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas enableCanvas={false} />
    </div>
  );
  app.diagram = new Diagram();
  const result = render(component);
  act(() => {
    app.diagram.addField(new Field("test1", 12));
    app.diagram.addField(new Field("test2", 12));
  });

  const eventTargetKonva = result.container.querySelector("#root-container > div > div > div") as HTMLElement;
  const controller = new DiagramCanvasController();
  {
    const diagramText = app.diagram.toString();

    const diagramLines = diagramText.split("\n");
    const diagramLineLength = diagramLines[0].length;
    controller.diagramSize = new Vector(diagramLineLength * 12, diagramLines.length * 16);
  }
  controller.container = eventTargetKonva;

  const pos_24_1 = controller.toClientXY(controller.toUnboundedPx(new Vector(24, 1)))!;
  const pos_20_1 = controller.toClientXY(controller.toUnboundedPx(new Vector(24 - 4, 1)))!;

  act(() => {
    fireEvent.mouseDown(eventTargetKonva as Element, { clientX: pos_24_1.x, clientY: pos_24_1.y, button: 0 });
    fireEvent.mouseMove(eventTargetKonva as Element, { clientX: pos_20_1.x, clientY: pos_20_1.y });
    fireEvent.mouseUp(eventTargetKonva as Element, { clientX: pos_20_1.x, clientY: pos_20_1.y, button: 0 });
  });

  expect(app.diagram.fields[0].length).toBe(12 - 2); // not - 4, because the diagram is displayed in the center

  {
    const diagramText = app.diagram.toString();

    const diagramLines = diagramText.split("\n");
    const diagramLineLength = diagramLines[0].length;
    controller.diagramSize = new Vector(diagramLineLength * 12, diagramLines.length * 16);
  }
  const pos_1_2 = controller.toClientXY(controller.toUnboundedPx(new Vector(1, 2.5)))!;
  const pos_1_4 = controller.toClientXY(controller.toUnboundedPx(new Vector(1, 4)))!;

  act(() => {
    fireEvent.mouseDown(eventTargetKonva as Element, { clientX: pos_1_2.x, clientY: pos_1_2.y, button: 0 });
    fireEvent.mouseMove(eventTargetKonva as Element, { clientX: pos_1_4.x, clientY: pos_1_4.y });
    fireEvent.mouseUp(eventTargetKonva as Element, { clientX: pos_1_4.x, clientY: pos_1_4.y, button: 0 });
  });

  expect(app.diagram.fields[0].length).toBe(12 - 2 + 32);
});

test("getInsertPositions", () => {
  const diagram = new Diagram();
  diagram.addField(new Field("test1", 12));
  diagram.toString();

  expect(getInsertPositions(diagram.renderMatrix, true, false).length).toBe(1);
  expect(getInsertPositions(diagram.renderMatrix, false, false).length).toBe(0);
  expect(getInsertPositions(diagram.renderMatrix, false, true).length).toBe(1);
});

test("render DiagramInput", () => {
  const ref = React.createRef<HTMLInputElement>();

  const component = (
    <div id="root-container">
      <DiagramInput
        ref={ref}
        clientXY={new Vector(0, 0)}
        getValue={() => "getValue"}
        setValue={() => {}}
        isValidIntermediate={() => true}
        isValidValue={() => true}
      />
    </div>
  );

  const result = render(component);
  result.unmount();
});

test("render DiagramInsertFieldButton", () => {
  const { app } = getRootStore();
  const controller = new DiagramCanvasController();

  const component = (
    <div id="root-container">
      <DiagramInsertFieldButton controller={controller} fieldUid={null} posInMatrix={new Vector(0, 0)} />
    </div>
  );

  const result = render(component);
  result.unmount();
});

test("wheelZoom", () => {
  const { app } = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas enableCanvas={false} />
    </div>
  );
  act(() => {
    app.diagram = new Diagram();
  });

  const result = render(component);
  act(() => {
    app.diagram.addField(new Field("test1", 12));
  });

  const eventTargetKonva = result.container.querySelector("#root-container > div > div > div") as HTMLElement;

  act(() => {
    fireEvent.wheel(eventTargetKonva as any, { deltaY: 1, ctrlKey: true });
  });
});

class DiagramInteractionHandlerTestStub implements DiagramInteractionHandler {
  public diagram: Diagram = new Diagram();

  commitChange(result: HandleResult): void {}
}

function interact(x: number, y: number, button = 1, shift = true): [Vector, InteractionEvent] {
  return [
    new Vector(x, y),
    {
      button,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: shift,
      clientX: x * 12,
      clientY: y * 16
    } satisfies InteractionEvent
  ];
}

test("ResizeFieldInteraction1", () => {
  const handler = new DiagramInteractionHandlerTestStub();

  handler.diagram.addField(new Field("test1", 1));
  handler.diagram.addField(new Field("test1", 2));
  handler.diagram.addField(new Field("test1", 10));
  handler.diagram.config.setValue("bit", buildParameters("10")[0]);
  handler.diagram.config.setValue("left-space-placeholder", buildParameters("true")[0]);
  handler.diagram.toString();

  // not left click
  expect(ResizeFieldInteraction1.onMouseDown(handler, ...interact(0, 1, 1))).toBeUndefined();

  // divider line
  expect(ResizeFieldInteraction1.onMouseDown(handler, ...interact(0, 0, 0))).toBeUndefined();

  // not connector
  expect(ResizeFieldInteraction1.onMouseDown(handler, ...interact(1, 1, 0))).toBeUndefined();

  // no left field
  expect(ResizeFieldInteraction1.onMouseDown(handler, ...interact(0, 1, 0))).toBeUndefined();

  // left == right
  expect(ResizeFieldInteraction1.onMouseDown(handler, ...interact(20, 1, 0))).toBeUndefined();

  // searchElement instanceof RowTail
  handler.diagram.config.setValue("left-space-placeholder", buildParameters("false")[0]);
  handler.diagram.toString();
  expect(ResizeFieldInteraction1.onMouseDown(handler, ...interact(6, 3, 0))).not.toBeUndefined();

  const interaction = ResizeFieldInteraction1.onMouseDown(handler, ...interact(6, 1, 0))!;

  expect(interaction.onMouseDown(...interact(6, 1, 0))).toBeUndefined();

  expect(interaction.onMouseMove(...interact(6, 2, 0))).toBe(interaction);

  expect(interaction.onMouseMove(...interact(6, 1, 0))).toBe(interaction);

  // too small for left field
  expect(interaction.onMouseMove(...interact(1, 1, 0))).toBe(interaction);

  expect(interaction.onMouseMove(...interact(8, 1, 0))).toBe(interaction);

  expect(interaction.onMouseMove(...interact(8, 1, 0, true))).toBe(interaction);

  // too small for right field
  expect(interaction.onMouseMove(...interact(18, 3, 0, true))).toBe(interaction);

  expect(interaction.onMouseUp(...interact(6, 1, 0))).toBeUndefined();
});

test("ResizeFieldInteraction2", () => {
  const handler = new DiagramInteractionHandlerTestStub();

  handler.diagram.addField(new Field("test1", 1));
  handler.diagram.addField(new Field("test1", 2));
  handler.diagram.addField(new Field("test1", 32));
  handler.diagram.config.setValue("bit", buildParameters("10")[0]);
  handler.diagram.config.setValue("left-space-placeholder", buildParameters("true")[0]);
  handler.diagram.toString();

  // static onMouseDown

  // not left click
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(1, 2, 1))).toBeUndefined();

  // not divider line
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(1, 1, 0))).toBeUndefined();

  // not divider
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(0, 2, 0))).toBeUndefined();

  // top is undefined
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(3, 0, 0))).toBeUndefined();

  // top is not represents a field, a divider segment below the row tail
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(13, 8, 0))).toBeUndefined();

  // a row segment
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(13, 7, 0))).toBeUndefined();

  // bottom is same field
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(16, 2, 0))).toBeUndefined();

  // bottom is not same field
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(4, 2, 0))).not.toBeUndefined();

  // bottom is row tail
  expect(ResizeFieldInteraction2.onMouseDown(handler, ...interact(13, 6, 0))).not.toBeUndefined();

  const interaction = ResizeFieldInteraction2.onMouseDown(handler, ...interact(4, 2, 0))!;

  // interaction functions

  // onMouseDown
  expect(interaction.onMouseDown(...interact(4, 2, 0))).toBeUndefined();

  // onMouseMove
  expect(interaction.onMouseMove(...interact(4, -100, 0, true))).toBe(interaction);

  expect(interaction.onMouseMove(...interact(4, 100, 0))).toBe(interaction);

  expect(interaction.onMouseMove(...interact(4, 2, 0))).toBe(interaction);
});

test("RenameFieldInteraction", () => {
  const handler = new DiagramInteractionHandlerTestStub();

  handler.diagram.addField(new Field("test1", 1));
  handler.diagram.addField(new Field("test1", 2));
  handler.diagram.addField(new Field("test1", 17));
  handler.diagram.config.setValue("bit", buildParameters("10")[0]);
  handler.diagram.config.setValue("left-space-placeholder", buildParameters("true")[0]);
  handler.diagram.toString();

  // static onMouseDown

  // not left click
  expect(RenameFieldInteraction.onMouseDown(handler, ...interact(1, 2, 1))).toBeUndefined();

  // not a row/divider segment
  expect(RenameFieldInteraction.onMouseDown(handler, ...interact(0, 0, 0))).toBeUndefined();

  // a divider segment
  expect(RenameFieldInteraction.onMouseDown(handler, ...interact(1, 0, 0))).toBeUndefined();

  const interaction = RenameFieldInteraction.onMouseDown(handler, ...interact(1, 1, 0))!;

  //a row segment
  expect(RenameFieldInteraction.onMouseDown(handler, ...interact(1, 1, 0))).not.toBeUndefined();
  expect(RenameFieldInteraction.onMouseDown(handler, ...interact(1, 1, 0)) instanceof RenameFieldInteraction).toBe(
    true
  );

  // interaction functions

  // not left click
  expect(interaction.onMouseDown(...interact(1, 1, 1))).toBeUndefined();

  // clickSequence != 1 or 3
  interaction.clickSequence = 2;
  expect(interaction.onMouseDown(...interact(1, 1, 0))).toBeUndefined();

  // clickSequence === 1
  interaction.clickSequence = 1;
  expect(interaction.onMouseDown(...interact(1, 1, 0))).toBe(interaction);
  expect(interaction.clickSequence).toBe(2);

  // onMouseMove, clickSequence === 1, posInMatrix.distance(this.originMatrixPos) > 1
  interaction.clickSequence = 1;
  expect(interaction.onMouseDown(...interact(100, 100, 0))).toBeUndefined();

  // onMouseMove, clickSequence === 3
  interaction.clickSequence = 3;
  expect(interaction.onMouseDown(...interact(1, 1, 0))).toBe(interaction);
  expect(interaction.clickSequence).toBe(4);

  // onMouseMove, clickSequence != 0
  expect(interaction.onMouseMove(...interact(1, 1, 0))).toBe(interaction);

  // onMouseMove, clickSequence === 0, currClientPos.distance(this.originClientPos) <= 16
  interaction.clickSequence = 0;
  expect(interaction.onMouseMove(...interact(1, 1, 0))).toBe(interaction);

  // onMouseMove, clickSequence === 0, currClientPos.distance(this.originClientPos) > 16
  interaction.clickSequence = 0;
  expect(interaction.onMouseMove(...interact(100, 100, 0)) instanceof DragAndDropFieldInteraction).toBe(true);

  // onMouseUp, not left click
  expect(interaction.onMouseUp(...interact(1, 1, 1))).toBeUndefined();

  // onMouseUp, clickSequence !== 0 or 2
  interaction.clickSequence = 1;
  expect(interaction.onMouseUp(...interact(1, 1, 0))).toBeUndefined();

  // onMouseUp, clickSequence === 0
  interaction.clickSequence = 0;
  expect(interaction.onMouseUp(...interact(100, 100, 0))).toBeUndefined();

  // onMouseUp, clickSequence === 2
  interaction.clickSequence = 2;
  expect(interaction.onMouseUp(...interact(1, 1, 0))).toBe(interaction);
  expect(interaction.clickSequence).toBe(3);
});

test("DeleteFieldInteraction", () => {
  const handler = new DiagramInteractionHandlerTestStub();

  handler.diagram.addField(new Field("test1", 1));
  handler.diagram.addField(new Field("test1", 2));
  handler.diagram.addField(new Field("test1", 17));
  handler.diagram.config.setValue("bit", buildParameters("10")[0]);
  handler.diagram.config.setValue("left-space-placeholder", buildParameters("true")[0]);
  handler.diagram.toString();

  // static onMouseDown

  // not right click
  expect(DeleteFieldInteraction.onMouseDown(handler, ...interact(1, 2, 1))).toBeUndefined();

  // not a row/divider segment
  expect(DeleteFieldInteraction.onMouseDown(handler, ...interact(0, 0, 2))).toBeUndefined();

  // a divider segment
  expect(DeleteFieldInteraction.onMouseDown(handler, ...interact(1, 0, 2))).toBeUndefined();

  // a row segment
  expect(DeleteFieldInteraction.onMouseDown(handler, ...interact(1, 1, 2)) instanceof DeleteFieldInteraction).toBe(
    true
  );

  const interaction = DeleteFieldInteraction.onMouseDown(handler, ...interact(1, 1, 2))!;

  // interaction functions

  // onMouseDown
  expect(interaction.onMouseDown(...interact(1, 1, 2))).toBeUndefined();

  // onMouseMove
  expect(interaction.onMouseMove(...interact(1, 1, 2))).toBe(interaction);

  // onMouseUp, not right click
  expect(interaction.onMouseUp(...interact(1, 1, 1))).toBe(interaction);

  // onMouseUp, right click, a divider segment, not same field
  expect(interaction.onMouseUp(...interact(1, 4, 2))).toBeUndefined();

  // onMouseUp, right click, a row segment, not same field
  expect(interaction.onMouseUp(...interact(8, 1, 2))).toBeUndefined();

  // onMouseUp, right click, a connector
  expect(interaction.onMouseUp(...interact(0, 0, 2))).toBeUndefined();

  // onMouseUp, right click, same field
  expect(interaction.onMouseUp(...interact(1, 1, 2))).toBeUndefined();
  expect(handler.diagram.fields.length).toBe(2);
});

test("AddFieldInteraction", () => {
  const handler = new DiagramInteractionHandlerTestStub();

  const interaction = AddFieldInteraction.onAddButtonClick(handler, interact(0, 0, 0)[1]);

  interaction.onMouseDown(...interact(0, 0, 0));
  interaction.onMouseMove(...interact(0, 0, 0));
  interaction.onMouseUp(...interact(0, 0, 0));
});

test("InsertFieldInteraction", () => {
  const handler = new DiagramInteractionHandlerTestStub();

  const interaction = InsertFieldInteraction.onInsertButtonClick(handler, 0, interact(0, 0, 0)[1]);

  interaction.onMouseDown(...interact(0, 0, 0));
  interaction.onMouseMove(...interact(0, 0, 0));
  interaction.onMouseUp(...interact(0, 0, 0));
});

test("DragAndDropFieldInteraction", () => {
  const handler = new DiagramInteractionHandlerTestStub();

  handler.diagram.addField(new Field("test1", 1));
  handler.diagram.addField(new Field("test2", 2));
  handler.diagram.addField(new Field("test3", 32));
  handler.diagram.config.setValue("bit", buildParameters("10")[0]);
  // handler.diagram.config.setValue("left-space-placeholder", buildParameters("true")[0]);
  handler.diagram.toString();

  // static onStartDrag

  // not left click
  expect(DragAndDropFieldInteraction.onStartDrag(handler, ...interact(1, 2, 1))).toBeUndefined();

  // not a row/divider segment
  expect(DragAndDropFieldInteraction.onStartDrag(handler, ...interact(0, 0, 0))).toBeUndefined();

  // a divider segment, without represent
  expect(DragAndDropFieldInteraction.onStartDrag(handler, ...interact(1, 0, 0))).toBeUndefined();

  // a divider segment, with represent
  expect(
    DragAndDropFieldInteraction.onStartDrag(handler, ...interact(1, 4, 0)) instanceof DragAndDropFieldInteraction
  ).toBe(true);

  // a row segment
  expect(
    DragAndDropFieldInteraction.onStartDrag(handler, ...interact(1, 1, 0)) instanceof DragAndDropFieldInteraction
  ).toBe(true);

  // interaction functions
  const interaction = DragAndDropFieldInteraction.onStartDrag(handler, ...interact(10, 1, 0))!;

  // onMouseDown
  expect(interaction.onMouseDown(...interact(1, 1, 0))).toBeUndefined();

  // onMouseMove, posInMatrix.x <= 0 && posInMatrix.y === 1
  expect(interaction.onMouseMove(...interact(0, 1, 0))).toBe(interaction);
  expect(handler.diagram.fields[0].name).toBe("test3");
  expect(handler.diagram.fields[1].name).toBe("test1");
  expect(handler.diagram.fields[2].name).toBe("test2");

  // onMouseMove, posInMatrix.y <= 0
  expect(interaction.onMouseMove(...interact(0, 0, 0))).toBe(interaction);
  expect(handler.diagram.fields[0].name).toBe("test3");
  expect(handler.diagram.fields[1].name).toBe("test1");
  expect(handler.diagram.fields[2].name).toBe("test2");

  // onMouseMove, posInMatrix.x >= matrix.width - 1 && posInMatrix.y === matrix.height - 2
  expect(interaction.onMouseMove(...interact(100, 7, 0))).toBe(interaction);
  expect(handler.diagram.fields[0].name).toBe("test1");
  expect(handler.diagram.fields[1].name).toBe("test2");
  expect(handler.diagram.fields[2].name).toBe("test3");

  // onMouseMove, posInMatrix.y >= matrix.height - 1
  expect(interaction.onMouseMove(...interact(100, 8, 0))).toBe(interaction);
  expect(handler.diagram.fields[0].name).toBe("test1");
  expect(handler.diagram.fields[1].name).toBe("test2");
  expect(handler.diagram.fields[2].name).toBe("test3");

  const interaction2 = DragAndDropFieldInteraction.onStartDrag(handler, ...interact(3, 1, 0))!;

  // onMouseMove, move to same index as insertPosition
  expect(interaction2.onMouseMove(...interact(2, 1, 0))).toBe(interaction2);
  expect(handler.diagram.fields[0].name).toBe("test1");
  expect(handler.diagram.fields[1].name).toBe("test2");
  expect(handler.diagram.fields[2].name).toBe("test3");

  // onMouseMove, move to index + 1 as insertPosition
  expect(interaction2.onMouseMove(...interact(6, 1, 0))).toBe(interaction2);
  expect(handler.diagram.fields[0].name).toBe("test1");
  expect(handler.diagram.fields[1].name).toBe("test2");
  expect(handler.diagram.fields[2].name).toBe("test3");

  // onMouseMove, move to index + 1 as insertPosition
  handler.diagram.addField(new Field("test4", 32));
  handler.diagram.toString();
  expect(interaction2.onMouseMove(...interact(10, 7, 0))).toBe(interaction2);
  expect(handler.diagram.fields[0].name).toBe("test1");
  expect(handler.diagram.fields[1].name).toBe("test3");
  expect(handler.diagram.fields[2].name).toBe("test2");
  expect(handler.diagram.fields[3].name).toBe("test4");

  // onMouseMove, move to pervious index as insertPosition
  expect(interaction2.onMouseMove(...interact(2, 1, 0))).toBe(interaction2);
  expect(handler.diagram.fields[0].name).toBe("test1");
  expect(handler.diagram.fields[1].name).toBe("test2");
  expect(handler.diagram.fields[2].name).toBe("test3");
  expect(handler.diagram.fields[3].name).toBe("test4");

  // onMouseUp, at the same position with interaction beginning
  expect(interaction2.onMouseUp(...interact(2, 1, 0))).toBeUndefined();

  // onMouseUp, at the non-beginning/non-end position with interaction beginning
  expect(interaction2.onMouseMove(...interact(10, 7, 0))).toBe(interaction2);
  expect(handler.diagram.fields[0].name).toBe("test1");
  expect(handler.diagram.fields[1].name).toBe("test3");
  expect(handler.diagram.fields[2].name).toBe("test2");
  expect(handler.diagram.fields[3].name).toBe("test4");
  expect(interaction2.onMouseUp(...interact(10, 7, 0))).toBeUndefined();

  // onMouseUp, at the end position with interaction beginning
  expect(interaction2.onMouseMove(...interact(14, 13, 0))).toBe(interaction2);
  expect(handler.diagram.fields[0].name).toBe("test1");
  expect(handler.diagram.fields[1].name).toBe("test3");
  expect(handler.diagram.fields[2].name).toBe("test4");
  expect(handler.diagram.fields[3].name).toBe("test2");
  expect(interaction2.onMouseUp(...interact(14, 13, 0))).toBeUndefined();

  // onMouseUp, at the beginning position with interaction beginning
  expect(interaction2.onMouseMove(...interact(0, 1, 0))).toBe(interaction2);
  expect(handler.diagram.fields[0].name).toBe("test2");
  expect(handler.diagram.fields[1].name).toBe("test1");
  expect(handler.diagram.fields[2].name).toBe("test3");
  expect(handler.diagram.fields[3].name).toBe("test4");
  expect(interaction2.onMouseUp(...interact(0, 1, 0))).toBeUndefined();
});

test("DiagramInteractionCommand", () => {
  const diagram = new Diagram();
  new DiagramInteractionCommand(diagram, HandleResult.HANDLED).execute();
  new DiagramInteractionCommand(diagram, HandleResult.HANDLED).handle();
});

test("useDiagramButton", () => {
  const CustomButton = (props: { title: string }) => {
    const btnRef = React.useRef<HTMLButtonElement>(null);

    useDiagramButton(btnRef);

    return (
      <button id="test-diagram-button" ref={btnRef}>
        {props.title}
      </button>
    );
  };

  const result = render(<CustomButton title="Test1" />);

  result.rerender(<CustomButton title="Test2" />); // force rerender

  const btn = result.container.querySelector("#test-diagram-button") as HTMLButtonElement;

  act(() => {
    // normal mouse move
    fireEvent.mouseMove(document, { clientX: 0, clientY: 0 });

    // trigger prevent default
    // fireEvent.wheel(document, { deltaY: 1, ctrlKey: true });
    btn.dispatchEvent(new WheelEvent("wheel", { deltaY: 1, ctrlKey: true }));
  });

  result.unmount();

  ///

  const CustomButton2 = () => {
    const btnRef = React.useRef<HTMLButtonElement>(null);

    useDiagramButton(btnRef);

    return <button />;
  };

  const result2 = render(<CustomButton2 />);

  act(() => {
    // trigger null check
    fireEvent.mouseMove(document, { clientX: 0, clientY: 0 });
  });

  result2.unmount();
});

