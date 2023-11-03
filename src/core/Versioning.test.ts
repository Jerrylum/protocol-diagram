import { APP_VERSION } from "./MainApp";
import { getRootStore } from "./Root";
import {
  checkForUpdates,
  closeUpdatePrompt,
  fetchLatestVersionViaAPI,
  getVersioningBroadcastChannel,
  promptUpdate,
  refreshLatestVersion,
  reportVersions
} from "./Versioning";
import * as SWR from "./ServiceWorkerRegistration";
import { SemVer } from "semver";
import { registerServiceWorker, resetServiceWorker, ServiceWorkerMock } from "./ServiceWorkerRegistration.test";
import { sleep } from "./Util";

test("reportVersions", async () => {
  const logSpy = jest.spyOn(console, "log");

  reportVersions();

  const { app } = getRootStore();
  const appVersion = APP_VERSION.version;
  const appLatestVersion = app.latestVersion?.version;
  const controllerVersion = await SWR.getCurrentSWVersion();
  const waitingVersion = await SWR.getWaitingSWVersion();

  const targetLog = `Current versions: app=${appVersion}, latest=${appLatestVersion}, controller SW=${controllerVersion?.version}, waiting SW=${waitingVersion?.version}`;
  expect(logSpy).toBeCalledWith(
    "%cVersioning",
    "background: #7F47B3;border-radius: 0.5em;color: white;font-weight: bold;padding: 2px 0.5em",
    targetLog
  );
});

test("fetchLatestVersionViaAPI", async () => {
  const testTarget = await fetchLatestVersionViaAPI();
  expect(testTarget).toBeUndefined();

  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve("1.0.0")
    } as any)
  );
  const testTarget2 = await fetchLatestVersionViaAPI();
  expect(testTarget2).toStrictEqual(new SemVer("1.0.0"));
});

test("refreshLatestVersion", async () => {
  const { app } = getRootStore();

  await resetServiceWorker();
  app.latestVersion = undefined;
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve("")
    } as any)
  );

  await refreshLatestVersion();

  expect(app.latestVersion).toBeUndefined();

  ///

  resetServiceWorker();
  app.latestVersion = undefined;
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve("4.5.6")
    } as any)
  );

  await refreshLatestVersion();

  expect(app.latestVersion).toStrictEqual(new SemVer("4.5.6"));

  ///

  await resetServiceWorker();

  const { swr } = await registerServiceWorker();

  swr.waiting = new ServiceWorkerMock();
  swr.waiting.postMessage = jest.fn((data: unknown, transfer: unknown) => {
    (transfer as [{ _parent: MessageChannel }])[0]._parent.port1.onmessage?.({ data: "1.2.3" } as MessageEvent);
  });
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve("4.5.6")
    } as any)
  );

  await refreshLatestVersion();

  expect(app.latestVersion).toStrictEqual(new SemVer("1.2.3"));
});

test("checkForUpdate", async () => {
  await resetServiceWorker();

  const { swr } = await registerServiceWorker();
  swr.update = jest.fn(async () => {});

  await checkForUpdates();

  expect(swr.update).toBeCalledTimes(1);

  ///

  await resetServiceWorker();

  const { swr: swr2 } = await registerServiceWorker();
  swr2.installing = new ServiceWorkerMock();
  swr2.update = jest.fn(async () => {});

  await checkForUpdates();

  expect(swr.update).toBeCalledTimes(1);
});

test("getVersioningBroadcastChannel", () => {
  delete (window as any).BroadcastChannel;

  expect(getVersioningBroadcastChannel()).toBeUndefined();

  (window as any).BroadcastChannel = jest.fn(() => ({}));

  expect(getVersioningBroadcastChannel()).toBeDefined();
});

test("getVersioningBroadcastChannel & onMessage", () => {
  (window as any).BroadcastChannel = jest.fn(() => ({
    onmessage: jest.fn()
  }));

  const bc = getVersioningBroadcastChannel();

  bc?.onmessage?.({ data: "PROMPT_UPDATE" } as MessageEvent);
  bc?.onmessage?.({ data: "CLOSE_UPDATE_PROMPT" } as MessageEvent);
  bc?.onmessage?.({ data: "anything" } as MessageEvent);
});

test("promptUpdate", async () => {
  const { app, confirmation } = getRootStore();

  app.latestVersion = undefined;

  // No latest version
  await promptUpdate(false);

  app.latestVersion = new SemVer("1.2.3");

  // Okay
  const promise = promptUpdate(false);

  await sleep(1100);
  // fast forward 1100ms
  // jest.advanceTimersByTime(1100);

  expect(confirmation.isOpen).toBe(true);

  // isPromptingUpdate == true
  await promptUpdate(false);

  await closeUpdatePrompt(false);

  await promise;

  expect(confirmation.isOpen).toBe(false);
});

test("promptUpdate & broadcast = true", async () => {
  const { app, confirmation } = getRootStore();

  app.latestVersion = undefined;

  // No latest version
  await promptUpdate(true);

  app.latestVersion = new SemVer("1.2.3");

  // Okay
  const promise = promptUpdate();

  await sleep(1100);
  // fast forward 1100ms
  // jest.advanceTimersByTime(1100);

  expect(confirmation.isOpen).toBe(true);

  // isPromptingUpdate == true
  await promptUpdate(true);

  closeUpdatePrompt();

  await promise;

  expect(confirmation.isOpen).toBe(false);
});

test("promptUpdate & getControllingClientsCount = 2", async () => {
  const { app, confirmation } = getRootStore();

  await resetServiceWorker();

  const { swc } = await registerServiceWorker();

  swc.controller = new ServiceWorkerMock();
  swc.controller.postMessage = jest.fn((data: unknown, transfer: unknown) => {
    (transfer as [{ _parent: MessageChannel }])[0]._parent.port1.onmessage?.({ data: 123 } as MessageEvent);
  });
  app.latestVersion = new SemVer("1.2.3");

  // Okay
  const promise = promptUpdate(false);

  await sleep(400);

  closeUpdatePrompt(false);

  await promise;

  expect(confirmation.isOpen).toBe(false);
});

test("promptUpdate & other conditions", async () => {
  const { app, confirmation } = getRootStore();

  await resetServiceWorker();

  app.latestVersion = new SemVer("1.2.3");

  confirmation.prompt({
    title: "Test",
    description: "Test",
    buttons: []
  });

  // Okay
  const promise = promptUpdate(false);

  confirmation.close();

  await sleep(400);

  closeUpdatePrompt(false);

  await promise;

  expect(confirmation.isOpen).toBe(false);
});

test("promptUpdate & other conditions 2", async () => {
  const { app, confirmation } = getRootStore();

  await resetServiceWorker();

  confirmation.close();
  app.latestVersion = null;

  // Okay
  promptUpdate(false);

  app.latestVersion = new SemVer("1.2.3");

  closeUpdatePrompt(false);
});

test("closeUpdatePrompt & isPromptingUpdate = false", async () => {
  closeUpdatePrompt(false);
});

