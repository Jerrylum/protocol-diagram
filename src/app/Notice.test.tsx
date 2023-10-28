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
  enqueueErrorSnackbar(Logger("testError"), "testError", 5000);
  enqueueSuccessSnackbar(Logger("testSuccess"), "testSuccess", 5000);
  enqueueInfoSnackbar(Logger("testInfo"), "testInfo", 5000);
  result.rerender(components);
  expect(result.container).toMatchSnapshot();

  const barError = result.container.querySelectorAll("#notistack-snackbar")[0];
  const barSuccess = result.container.querySelectorAll("#notistack-snackbar")[1];
  const barInfo = result.container.querySelectorAll("#notistack-snackbar")[2];

  expect(barError.textContent).toBe("testError");
  expect(barSuccess.textContent).toBe("testSuccess");
  expect(barInfo.textContent).toBe("testInfo");
});
