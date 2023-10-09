import { CommandLogger } from "./CommandLog";
import { Confirmation } from "./Confirmation";
import { MainApp } from "./MainApp";
import { Modals } from "./Modals";

export type RootStore = typeof rootStore;

const rootStore = {
  app: new MainApp(),
  confirmation: new Confirmation(),
  modals: new Modals(),
  logger: new CommandLogger()
} as const;

export function getRootStore(): RootStore {
  return rootStore;
}
