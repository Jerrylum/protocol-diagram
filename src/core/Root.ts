import { Modals } from "./Modals";

export type RootStore = typeof rootStore;

const rootStore = {
  modals: new Modals()
} as const;

export function getRootStore(): RootStore {
  return rootStore;
}

