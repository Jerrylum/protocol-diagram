import { act, render } from "@testing-library/react";
import { HelpModal, HelpModalSymbol } from "./HelpModal";
import { getRootStore } from "../core/Root";

test("Render HelpModal", () => {
  const { modals } = getRootStore();

  const components = (
    <div id="root-container">
      <HelpModal />
    </div>
  );

  const result = render(components);
  expect(result.container).toMatchSnapshot();
  const container = document.querySelector(".modal-container");
  expect(container).not.toBeInTheDocument();

  act(() => {
    modals.close();
    modals.open(HelpModalSymbol);
  });

  result.rerender(components);
  expect(result.container).toMatchSnapshot();

  const container2 = document.querySelector(".modal-container");
  expect(container2).toBeInTheDocument();

  act(() => {
    modals.close();
  });

  result.rerender(components);

  const container3 = document.querySelector(".modal-container");
  expect(container3).not.toBeInTheDocument();
});
