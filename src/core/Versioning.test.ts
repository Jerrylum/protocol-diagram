import { APP_VERSION } from "./MainApp";
import { getRootStore } from "./Root";
import { checkForUpdates, fetchLatestVersionViaAPI, refreshLatestVersion, reportVersions } from "./Versioning";
import * as SWR from "./ServiceWorkerRegistration";
import { SemVer } from "semver";

test("reportVersions", async () => {
  const logSpy = jest.spyOn(console, "log");
  reportVersions();
  const { app } = getRootStore();
  const appVersion = APP_VERSION.version;
  const appLatestVersion = app.latestVersion?.version;
  const controllerVersion = await SWR.getCurrentSWVersion();
  const waitingVersion = await SWR.getWaitingSWVersion();
  const targetlog = `Current versions: app=${appVersion}, latest=${appLatestVersion}, controller SW=${controllerVersion?.version}, waiting SW=${waitingVersion?.version}`;
  expect(logSpy).toBeCalledWith(
    "%cVersioning",
    "background: #7F47B3;border-radius: 0.5em;color: white;font-weight: bold;padding: 2px 0.5em",
    targetlog
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
  expect(testTarget2).toBeInstanceOf(SemVer);
});

test("refreshLatestVersion", async () => {
  refreshLatestVersion();
  const version = (await SWR.getWaitingSWVersion()) || (await fetchLatestVersionViaAPI());
  const { app } = getRootStore();
  expect(app.latestVersion?.version).toBe(version);
});

test("checkForUpdate", async () => {
  const testTarget = await checkForUpdates();
  Object.defineProperty(navigator, "serviceWorker", {
    value: { getRegistration: () => Promise.resolve({ installing: {} } as any) },
    configurable: true
  });
  const testTarget2 = await checkForUpdates();
});
