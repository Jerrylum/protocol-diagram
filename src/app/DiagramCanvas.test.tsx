import {
  isKonvaTouchEvent,
  isTouchEvent,
  getClientXY,
  toBitLengthPos,
  DiagramCanvas,
  DiagramCanvasController,
  DiagramInput,
  DiagramInsertFieldButton,
  useDiagramButton,
  ResizeFieldInteraction1
} from "./DiagramCanvas";
import { Vector } from "../core/Vector";
import { Diagram } from "../diagram/Diagram";
import { Field } from "../diagram/Field";
import { fireEvent, render } from "@testing-library/react";
import { getRootStore } from "../core/Root";
import { act } from "react-dom/test-utils";
import React from "react";
import { HandleResult } from "../command/HandleResult";

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

  controller.onWheelStage(new WheelEvent("wheel", { ctrlKey: true, deltaY: 0 }));
  controller.onWheelStage(new WheelEvent("wheel", { ctrlKey: true, deltaY: 1 }));
  controller.onMouseDownStage(new MouseEvent("mousedown", { button: 1 }));
  controller.onMouseMoveOrDragStage(new MouseEvent("mousedown", { button: 1 }));
  controller.onMouseUpStage(new MouseEvent("mousedown", { button: 1 }));

  controller.container = document.createElement("div");
  expect(controller.toClientXY(new Vector(1, 1), false, false)).toStrictEqual(new Vector(1, 1));
  const offset = app.diagramEditor.offset.subtract(controller.viewOffset);
  expect(controller.getUnboundedPx(new Vector(1, 1))).toStrictEqual(new Vector(1, 1).add(offset));
  controller.onMouseDownStage(new MouseEvent("mousedown", { button: 1 }));
  controller.onMouseMoveOrDragStage(new MouseEvent("mousedown", { button: 1 }));
  controller.onMouseUpStage(new MouseEvent("mousedown", { button: 1 }));

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

// test("DiagramCanvas drag to change field length", () => {
//   const { app } = getRootStore();

//   const component = (
//     <div id="root-container">
//       <DiagramCanvas enableCanvas={false} />
//     </div>
//   );
//   app.diagram = new Diagram();
//   const result = render(component);
//   act(() => {
//     app.diagram.addField(new Field("test1", 12));
//     app.diagram.addField(new Field("test2", 12));
//   });

//   const eventTargetKonva = result.container.querySelector("#root-container > div > div > div") as HTMLElement;
//   const controller = new DiagramCanvasController();
//   controller.container = eventTargetKonva;

//   const pos_24_1 = controller.toClientXY(controller.toUnboundedPx(new Vector(24, 1)))!;
//   const pos_24_2 = controller.toClientXY(controller.toUnboundedPx(new Vector(20, 1)))!;

//   act(() => {
//     fireEvent.mouseDown(eventTargetKonva as Element, { clientX: pos_24_1.x, clientY: pos_24_1.y, button: 1 });
//     fireEvent.mouseMove(eventTargetKonva as Element, { clientX: pos_24_2.x, clientY: pos_24_2.y });
//     fireEvent.mouseUp(eventTargetKonva as Element, { clientX: pos_24_2.x, clientY: pos_24_2.y, button: 1 });
//   });

//   expect(app.diagram.fields[0].length).not.toBe(12);
// });

test("render DiagramInput", () => {
  const { app } = getRootStore();
  const ref = React.createRef<HTMLInputElement>();

  const component = (
    <div id="root-container">
      <DiagramInput
        ref={ref}
        clientXY={new Vector(0, 0)}
        getValue={() => "getValue"}
        setValue={value => {
          console.log(value);
        }}
        isValidIntermediate={() => true}
        isValidValue={() => true}
      />
    </div>
  );

  const result = render(component);
  result.unmount();

  // act(() => {
  //   (ref as any).current = null;
  // });
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
