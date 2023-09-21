import { Cancellable } from "../command/Commands";
import { Diagram, Memento } from "./Diagram";
import { Field } from "./Field";
import { Timeline } from "./Timeline";

class TestICancellable implements Cancellable {
  discriminator!: "DiagramModifier";
  countExecute: number = 0;

  execute() {
    this.countExecute++;
  }
}

class TestDiagram extends Diagram {
  countCreate: number = 0;
  countRestore: number = 0;
  createMemento(): Memento {
    this.countCreate++;
    return super.createMemento();
  }
  restoreFromMemento(memento: Memento) {
    this.countRestore++;
  }
}

test("Diagram timeline", () => {
  let d = new Diagram();
  let tl = new Timeline<TestICancellable>(d);

  d.addField(new Field("test", 3));
  let compare = new Diagram();
  let tic = new TestICancellable();
  tl.operate(tic);
  compare.restoreFromMemento(tl.getLatestMemento());
  expect(compare.toString()).toBe(d.toString());

  let tic2 = new TestICancellable();
  let td = new TestDiagram();
  let tl2 = new Timeline<TestICancellable>(td);
  expect(tic2.countExecute).toBe(0);
  expect(td.countCreate).toBe(1);
  expect(td.countRestore).toBe(0);
  tic2.execute();
  tl2.operate(tic2);
  expect(tic2.countExecute).toBe(1);
  expect(td.countCreate).toBe(2);
  expect(td.countRestore).toBe(0);
  expect(tl2.undo()).toBe(tic2);
  expect(tic2.countExecute).toBe(1);
  expect(td.countCreate).toBe(2);
  expect(td.countRestore).toBe(1);
  expect(tl2.redo()).toBe(tic2);
  expect(tic2.countExecute).toBe(2);
  expect(td.countCreate).toBe(3);
  expect(td.countRestore).toBe(1);

  let tic3 = new TestICancellable();
  let tic4 = new TestICancellable();

  tic3.execute();
  tl2.operate(tic3);
  tic4.execute();
  tl2.operate(tic4);
  expect(tic3.countExecute).toBe(1);
  expect(tic4.countExecute).toBe(1);
  expect(td.countCreate).toBe(5);
  expect(td.countRestore).toBe(1);

  expect(tl2.undo()).toBe(tic4);
  expect(tic3.countExecute).toBe(1);
  expect(tic4.countExecute).toBe(1);
  expect(td.countCreate).toBe(5);
  expect(td.countRestore).toBe(2);

  expect(tl2.undo()).toBe(tic3);
  expect(tic3.countExecute).toBe(1);
  expect(tic4.countExecute).toBe(1);
  expect(td.countCreate).toBe(5);
  expect(td.countRestore).toBe(3);

  expect(tl2.undo()).toBe(tic2);
  expect(tic3.countExecute).toBe(1);
  expect(tic4.countExecute).toBe(1);
  expect(td.countCreate).toBe(5);
  expect(td.countRestore).toBe(4);

  expect(tl2.undo()).toBe(null);
  expect(tl2.redo()).toBe(tic2);
  expect(tic2.countExecute).toBe(3);
  expect(tic3.countExecute).toBe(1);
  expect(tic4.countExecute).toBe(1);
  expect(td.countCreate).toBe(6);
  expect(td.countRestore).toBe(4);

  expect(tl2.redo()).toBe(tic3);
  expect(tic2.countExecute).toBe(3);
  expect(tic3.countExecute).toBe(2);
  expect(tic4.countExecute).toBe(1);
  expect(td.countCreate).toBe(7);
  expect(td.countRestore).toBe(4);

  expect(tl2.redo()).toBe(tic4);
  expect(tic2.countExecute).toBe(3);
  expect(tic3.countExecute).toBe(2);
  expect(tic4.countExecute).toBe(2);
  expect(td.countCreate).toBe(8);
  expect(td.countRestore).toBe(4);

  expect(tl2.redo()).toBe(null);
});
