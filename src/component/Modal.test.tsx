import { Card } from "@mui/material";
import { act, render } from "@testing-library/react";
import { TestModal, TestModalSymbol } from "../app/TestModal";
import { getRootStore } from "../core/Root";
import { Modal } from "./Modal";

test("Render TestModal", () => {
  const { modals } = getRootStore();

  const components = (
    <div id="root-container">
      <TestModal />
    </div>
  );

  const result = render(components);
  const container = document.querySelector(".modal-container");
  expect(container).not.toBeInTheDocument();

  act(() => {
    modals.close();
    modals.open(TestModalSymbol);
  });

  result.rerender(components);

  const container2 = document.querySelector(".modal-container");
  expect(container2).toBeInTheDocument();

  act(() => {
    modals.close();
  });

  result.rerender(components);

  const container3 = document.querySelector(".modal-container");
  expect(container3).not.toBeInTheDocument();
});

test("Render Modal", () => {
  const { modals } = getRootStore();

  const onOpen = jest.fn();
  const onClose = jest.fn();

  const components = (
    <div id="root-container">
      <Modal symbol={TestModalSymbol} onOpen={onOpen} onClose={onClose}>
        <Card
          className="modal-container"
          sx={{
            padding: "16px",
            width: "768px",
            maxWidth: "80%",
            minHeight: "96px",
            outline: "none !important",
            height: "80%",
            overflowY: "auto"
          }}></Card>
      </Modal>
    </div>
  );

  const result = render(components);
  expect(result.container).toMatchSnapshot();

  const container = document.querySelector(".modal-container");
  expect(container).not.toBeInTheDocument();
  expect(onOpen).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();

  act(() => {
    modals.close();
    modals.open(TestModalSymbol);
  });

  result.rerender(components);
  expect(result.container).toMatchSnapshot();

  const container2 = document.querySelector(".modal-container");
  expect(container2).toBeInTheDocument();
  expect(onOpen).toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();

  act(() => {
    modals.close();
  });

  expect(onOpen).toBeCalledTimes(1);
  expect(onClose).toBeCalledTimes(1);

  act(() => {
    modals.open(TestModalSymbol);
  });

  result.rerender(components);

  expect(onOpen).toBeCalledTimes(2);
  expect(onClose).toBeCalledTimes(1);

  act(() => {
    (document.querySelector(".modal-backdrop") as HTMLElement).click();
  });

  expect(onOpen).toBeCalledTimes(2);
  expect(onClose).toBeCalledTimes(2);
});
