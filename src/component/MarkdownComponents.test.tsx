import { render } from "@testing-library/react";
import { MarkdownOverwrittenComponents } from "./MarkdownComponents";

test("Render MDX", () => {
  Object.keys(MarkdownOverwrittenComponents).forEach(key => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = (MarkdownOverwrittenComponents as any)[key];

    const result = (() => {
      if (key === "img") {
        return render(<Component />);
      } else if (key === "td" || key === "th") {
        return render(
          <table>
            <tbody>
              <tr>
                <Component>Test</Component>
              </tr>
            </tbody>
          </table>
        );
      } else {
        return render(<Component>Test</Component>);
      }
    })();
    expect(result.container).toMatchSnapshot();
  });
});
