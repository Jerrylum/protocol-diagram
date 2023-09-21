import { CancellableCommand } from "../command/Commands";
import { Diagram, Memento, Timeline } from "../diagram/Diagram";
import { MainApp } from "./MainApp";
import { Modals } from "./Modals";

export type RootStore = typeof rootStore;

const rootStore = {
  app: new MainApp(),
  modals: new Modals()
} as const;

export function getRootStore(): RootStore {
  return rootStore;
}

export class MainDiagramHandler extends Timeline<CancellableCommand> {
  // The current memento saved in the file or the first memento in the timeline
  private sourceCurrentMemento!: Memento | null;
  private isModifiedbool!: boolean;

  constructor() {
    super(null);
    this.newDiagram();
  }

  /**
     * an instance method that gets the diagram from Main
     */
  getDiagram(): Diagram {
    const { app } = getRootStore();
    return app.diagram;
  }

  /**
   * an instance method that sets the diagram to Main
   *
   * @param diagram the diagram to be set
   */
  setDiagram(diagram: Diagram) {
    const { app } = getRootStore();
    app.diagram = diagram;
  }

  /**
   * a method that eliminates all previous diagram-related logic, and re-creates a
   * new diagram
   */
  newDiagram() {
    this.setDiagram(new Diagram());
    this.resetHistory();
  }

  /**
   * a method that checks whether the diagram is modified, returns true if the
   * flag `isModified` is true or the file is not saved
   *
   * @return whether the diagram is modified
   */
  isModified(): boolean {
    return this.isModifiedbool || this.sourceCurrentMemento != this.getLatestMemento();
  }

  /**
   * a method that sets the flag `isModified` to the given value., note that
   * setting the flag to false does not mean the diagram is not modified
   *
   * @see #isModified()
   *
   * @param isModified the value to set
   */
  setModified(isModified: boolean) {
    this.isModifiedbool = isModified;
  }

  /**
   * a method that eliminates all history and set the flag `isModified` to false
   */
  resetHistory() {
    super.resetHistory();
    this.sourceCurrentMemento = this.getLatestMemento();
    this.isModifiedbool = false;
  }
}
