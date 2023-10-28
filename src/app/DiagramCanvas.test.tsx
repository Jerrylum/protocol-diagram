import { isKonvaTouchEvent, isTouchEvent, getClientXY, toBitLengthPos, DiagramCanvas, DiagramCanvasController } from "./DiagramCanvas";
import { Vector } from "../core/Vector";
import { Diagram } from "../diagram/Diagram";
import { Field } from "../diagram/Field";
import { fireEvent, render } from "@testing-library/react";
import { getRootStore } from "../core/Root";
import { act } from "react-dom/test-utils";

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

  (mockTouchEvent as any).changedTouches = [null]
  expect(getClientXY(mockTouchEvent)).toEqual({ x: 0, y: 0 });

  expect(getClientXY({clientX: 5, clientY: 6} as any)).toEqual({ x: 5, y: 6 });
});

test ("toBitLengthPos", () => {
  const d = new Diagram();
  d.addField(new Field("a", 12));
  d.toString();

  expect(toBitLengthPos(new Vector(0,0), d.renderMatrix)).toEqual(new Vector(0,0)); //d.render.Matrix.width = 66

  const maxX = Math.floor((d.renderMatrix.width - 2) / 2);
  expect(toBitLengthPos(new Vector(200,0), d.renderMatrix)).toEqual(new Vector(maxX,0));

  expect(toBitLengthPos(new Vector(-2,0), d.renderMatrix)).toEqual(new Vector(0,0));

  expect(toBitLengthPos(new Vector(0,12), d.renderMatrix)).toEqual(new Vector(0,6));

  expect(toBitLengthPos(new Vector(0,-12), d.renderMatrix)).toEqual(new Vector(0,0));
});

// test("DiagramCanvasController", () => {
//   const controller = new DiagramCanvasController();
//   fireEvent.resize(window);
//   const {app} = getRootStore();
//   expect(controller.diagram).toStrictEqual(app.diagram);

// });

test ("DiagramCanvas", async () => {
  const {app} = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas />
    </div>
  )
  const result = render(component);
  app.diagram = new Diagram();
  result.rerender(component);

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
  result.rerender(component);

  const inputAdd = result.container.querySelector("input")!;

  act(() => {
    fireEvent.mouseUp(inputAdd, { clientX: 0, clientY: 0 });
  });

  result.unmount();
});

test ("DiagramCanvas add Field", async () => {
  const {app} = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas />
    </div>
  )
  const result = render(component);
  app.diagram = new Diagram();
  result.rerender(component);
  const addBtn = result.container.querySelector("button");
  act(() => {
    fireEvent.click(addBtn as Element);
  });
  result.rerender(component);

  const inputAdd = result.container.querySelector("input")!;


  act(() => {
    fireEvent.input(inputAdd, { target: { value: "test1" } });
    fireEvent.keyDown(inputAdd, { key: "Enter", code: "Enter" });
  });
  result.rerender(component);

  expect(app.diagram.fields.length).toBe(1);
  expect(app.diagram.fields[0].name).toBe("test1");

  result.unmount();
});

test ("DiagramCanvas rename Field", async () => {
  const {app} = getRootStore();

  const component = (
    <div id="root-container">
      <DiagramCanvas />
    </div>
  )
  app.diagram = new Diagram();
  const result = render(component);
  result.rerender(component);
  app.diagram.addField(new Field("test1", 12));

  const eventTargetKonva = result.container.querySelector("#root-container > div > div > div") as HTMLElement;
  const controller = new DiagramCanvasController();
  controller.container = eventTargetKonva;

  const pos_1_1 = controller.toClientXY(controller.toUnboundedPx(new Vector(1,1)))!;


  act(() => {
    fireEvent.mouseDown(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y });
    fireEvent.mouseUp(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y });
    fireEvent.mouseDown(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y });
    fireEvent.mouseUp(eventTargetKonva as Element, { clientX: pos_1_1.x, clientY: pos_1_1.y });
  });
  // result.rerender(component);
  // expect(result.container).toMatchSnapshot();
});
