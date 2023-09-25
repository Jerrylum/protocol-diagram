import { DiagramEditor } from "./DiagramEditor";
import { Vector } from "./Vector";

test("DiagramEditor", () => {
  const editor = new DiagramEditor();

  expect(editor.offset.x).toBe(0);
  expect(editor.offset.y).toBe(0);
  expect(editor.scale).toBe(1);

  editor.offset = new Vector(1, 2);
  editor.scale = 2;

  expect(editor.offset.x).toBe(1);
  expect(editor.offset.y).toBe(2);
  expect(editor.scale).toBe(2);

  editor.scale = 0.74;

  expect(editor.scale).toBe(0.75);

  editor.scale = 2.01;

  expect(editor.scale).toBe(2);
});
