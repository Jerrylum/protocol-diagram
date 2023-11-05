import { NoticeProvider, enqueueSuccessSnackbar, enqueueInfoSnackbar, enqueueErrorSnackbar } from "./Notice";
import { render } from "@testing-library/react";
import { Logger } from "../core/Logger";

test("Render NoticeProvider", () => {
  const components = (
    <div id="root-container">
      <NoticeProvider />
    </div>
  );
  const result = render(components);

  enqueueSuccessSnackbar(Logger("testSuccess"), "testSuccess");
  enqueueSuccessSnackbar(Logger("testSuccess"), "testSuccess", 5000);

  enqueueInfoSnackbar(Logger("testInfo"), "testInfo");
  enqueueInfoSnackbar(Logger("testInfo"), "testInfo", 5000);

  enqueueErrorSnackbar(Logger("testError"), "testError");
  enqueueErrorSnackbar(Logger("testError"), "testError", 5000);
  enqueueErrorSnackbar(Logger("testError"), new Error("testError"), 5000);

  result.rerender(components);
  expect(result.container).toMatchSnapshot();
});
