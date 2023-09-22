import { convertFieldsToRow, displayNameAtTheCentralSegment, mergeRowsAndDividers, spliceDividers } from "../Diagram";
import { Field } from "../Field";
import { Connector } from "./Element";
import { Matrix } from "./Matrix";

test("Connector", () => {
  const list: Field[] = [];
  list.push(new Field("test1", 8));
  list.push(new Field("test2", 48));

  const rows = convertFieldsToRow(32, list, true);
  const dividers = spliceDividers(32, rows);
  const segments = mergeRowsAndDividers(rows, dividers);
  list.forEach((f) => displayNameAtTheCentralSegment(f, segments));

  const matrix = new Matrix(segments);
  matrix.process();
  matrix.process();

  expect(matrix.get(matrix.width - 2, 2) instanceof Connector).toBeTruthy();
  expect((matrix.get(matrix.width - 2, 2) as Connector).value).toBe(Connector.TOP + Connector.LEFT);
  expect(matrix.get(matrix.width - 2, 3) instanceof Connector).toBeTruthy();
  expect((matrix.get(matrix.width - 2, 3) as Connector).value).toBe(Connector.TOP + Connector.LEFT + Connector.BOTTOM);
  expect((matrix.get(matrix.width - 2, 3) as Connector).isIndividual).toBeTruthy();
  expect(matrix.get(matrix.width - 2, 4) instanceof Connector).toBeTruthy();
  expect((matrix.get(matrix.width - 2, 4) as Connector).value).toBe(0);
});
