import { CommandLogger } from "./CommandLog";
import { Confirmation } from "./Confirmation";
import { MainApp } from "./MainApp";
import { Modals } from "./Modals";

export type RootStore = {
  readonly app: MainApp;
  readonly confirmation: Confirmation;
  readonly modals: Modals;
  readonly logger: CommandLogger;
}

const rootStore = {
  app: new MainApp(),
  confirmation: new Confirmation(() => rootStore.modals),
  modals: new Modals(),
  logger: new CommandLogger()
} as RootStore;

export function getRootStore(): RootStore {
  return rootStore;
}
