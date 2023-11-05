import { observer } from "mobx-react-lite";
import { useDragDropFile, DragDropBackdrop } from "./DragDropBackdrop";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

const MockElement = observer((prop: { bool: boolean; func: (f: File) => {} }) => {
  const { isDraggingFile, getRootProps: getRootPropsForDragDropBackdrop } = useDragDropFile(prop.bool, prop.func);
  const { onDragEnter, onDragLeave, onDragOver, onDrop } = getRootPropsForDragDropBackdrop();
  return (
    <div id="root-container">
      {isDraggingFile && <button />}
      <DragDropBackdrop {...{ onDragEnter, onDragLeave, onDragOver, onDrop }} />
    </div>
  );
});

test("DragDropBackdrop", () => {
  const testfn = jest.fn();
  const components = <MockElement bool={false} func={testfn} />;
  const result = render(components);
  const dragDropBackdrop = result.container.querySelector("#root-container > div")!;
  expect(result.container.querySelector("button")).toBeNull();
  act(() => {
    fireEvent.dragOver(dragDropBackdrop, { dataTransfer: { types: ["Files"] } });
    fireEvent.dragEnter(dragDropBackdrop, { dataTransfer: { types: ["Files"] } });
  });
  expect(result.container.querySelector("button")).not.toBeNull();

  act(() => {
    fireEvent.dragLeave(dragDropBackdrop, { dataTransfer: { types: ["Files"] } });
  });
  expect(result.container.querySelector("button")).toBeNull();

  act(() => {
    fireEvent.dragEnter(dragDropBackdrop, { dataTransfer: { types: ["Files"] } });
  });
  expect(result.container.querySelector("button")).not.toBeNull();

  act(() => {
    fireEvent.drop(dragDropBackdrop, { dataTransfer: { files: [new File([""], "filename")] } });
  });
  expect(result.container.querySelector("button")).toBeNull();
  expect(testfn).toBeCalledTimes(0);

  result.unmount();

  const components2 = <MockElement bool={true} func={testfn} />;
  const result2 = render(components2);
  const dragDropBackdrop2 = result2.container.querySelector("#root-container > div")!;

  act(() => {
    fireEvent.dragEnter(dragDropBackdrop2, { dataTransfer: { types: ["Files"] } });
    fireEvent.drop(dragDropBackdrop2, { dataTransfer: { files: [new File([""], "filename")] } });
  });
  expect(testfn).toBeCalledTimes(1);

  act(() => {
    fireEvent.dragEnter(dragDropBackdrop2, { dataTransfer: { types: ["Files"] } });
    fireEvent.drop(dragDropBackdrop2, { dataTransfer: { files: [undefined] } });
  });
  expect(testfn).toBeCalledTimes(1);
});
