import { render } from "@testing-library/react";
import { MarkdownOverwrittenComponents } from "./MarkdownComponents";

test("Render MDX", () => {
  Object.keys(MarkdownOverwrittenComponents).forEach(key => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = (MarkdownOverwrittenComponents as any)[key];

    const result = render(key === "img" ? <Component /> : <Component>Test</Component>);
    expect(result.container).toMatchSnapshot();
  });
});

