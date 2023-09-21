import { CancellableCommand } from "../command/Commands";
import { Diagram, Memento } from "../diagram/Diagram";
import { Timeline } from "../diagram/Timeline";
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
  private isModifiedFlag!: boolean;

  constructor() {
    super(null as any);
    this.newDiagram();
  }

  /**
   * an instance method that gets the diagram from Main
   */
  get diagram(): Diagram {
    const { app } = getRootStore();
    return app.diagram;
  }

  /**
   * an instance method that sets the diagram to Main
   *
   * @param diagram the diagram to be set
   */
  set diagram(diagram: Diagram) {
    const { app } = getRootStore();
    app.diagram = diagram;
  }

  /**
   * a method that eliminates all previous diagram-related logic, and re-creates a
   * new diagram
   */
  newDiagram() {
    this.diagram = new Diagram();
    this.resetHistory();
  }

  /**
   * a method that checks whether the diagram is modified, returns true if the
   * flag `isModified` is true or the file is not saved
   *
   * @return whether the diagram is modified
   */
  isModified(): boolean {
    return this.isModifiedFlag || this.sourceCurrentMemento != this.getLatestMemento();
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
    this.isModifiedFlag = isModified;
  }

  /**
   * a method that eliminates all history and set the flag `isModified` to false
   */
  resetHistory() {
    super.resetHistory();
    this.sourceCurrentMemento = this.getLatestMemento();
    this.isModifiedFlag = false;
  }
}
