import { Cancellable } from "../command/Commands";
import { Diagram, Memento, Timeline } from "./Diagram";
import { Field } from "./Field";

test("Diagram add field", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  expect(dtest.getField(0).name).toBe("testadd");
  expect(dtest.getField(1).name).toBe("testadd2");
  expect(dtest.getField(2).name).toBe("testadd3");
  expect(dtest.getField(0).length).toBe(1);
  expect(dtest.getField(1).length).toBe(2);
  expect(dtest.getField(2).length).toBe(3);
  expect(dtest.size()).toBe(3);
});

test("Diagram delete field", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  dtest.removeField(1);
  expect(dtest.getField(0).name).toBe("testadd");
  expect(dtest.getField(1).name).toBe("testadd3");
  expect(dtest.getField(0).length).toBe(1);
  expect(dtest.getField(1).length).toBe(3);
  expect(dtest.size()).toBe(2);
  dtest.removeField(0);
  expect(dtest.getField(0).name).toBe("testadd3");
  expect(dtest.getField(0).length).toBe(3);
  expect(dtest.size()).toBe(1);
  dtest.removeField(0);
  expect(dtest.size()).toBe(0);
});

test("Diagram insert field", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  dtest.insertField(1, new Field("testadd4", 4));
  expect(dtest.getField(0).name).toBe("testadd");
  expect(dtest.getField(1).name).toBe("testadd4");
  expect(dtest.getField(2).name).toBe("testadd2");
  expect(dtest.getField(3).name).toBe("testadd3");
  expect(dtest.getField(0).length).toBe(1);
  expect(dtest.getField(1).length).toBe(4);
  expect(dtest.getField(2).length).toBe(2);
  expect(dtest.getField(3).length).toBe(3);
  expect(dtest.size()).toBe(4);
});

test("Diagram move field", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  dtest.moveField(0, 2);
  expect(dtest.getField(0).name).toBe("testadd2");
  expect(dtest.getField(1).name).toBe("testadd3");
  expect(dtest.getField(2).name).toBe("testadd");
  expect(dtest.getField(0).length).toBe(2);
  expect(dtest.getField(1).length).toBe(3);
  expect(dtest.getField(2).length).toBe(1);
  expect(dtest.size()).toBe(3);
});

test("Diagram clear", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  dtest.clear();
  expect(dtest.size()).toBe(0);
});

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
