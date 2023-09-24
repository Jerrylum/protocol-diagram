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
