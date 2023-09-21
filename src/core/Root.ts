import { Diagram } from "../diagram/Diagram";
// import { MainApp } from "./MainApp"; // To be continued...
import { Modals } from "./Modals";

export type RootStore = typeof rootStore;

const rootStore = {
  diagram: new Diagram(),
  modals: new Modals()
} as const;

export function getRootStore(): RootStore {
  return rootStore;
}
