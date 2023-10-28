import { when, runInAction } from "mobx";
import { SemVer } from "semver";
import { Logger } from "./Logger";
import * as SWR from "./ServiceWorkerRegistration";
import { sleep } from "./Util";
import { Typography } from "@mui/material";
import { getRootStore } from "./Root";
import { APP_VERSION } from "./MainApp";

const logger = Logger("Versioning");

export async function reportVersions() {
  const { app } = getRootStore();

  const appVersion = APP_VERSION.version;
  const appLatestVersion = app.latestVersion?.version;
  const controllerVersion = await SWR.getCurrentSWVersion();
  const waitingVersion = await SWR.getWaitingSWVersion();

  logger.log(
    `Current versions: app=${appVersion}, latest=${appLatestVersion}, controller SW=${controllerVersion?.version}, waiting SW=${waitingVersion?.version}`
  );
}

export async function fetchLatestVersionViaAPI(): Promise<SemVer | undefined> {
  logger.log("Fetch latest version via API");
  try {
    const reply = await fetch(`${process.env.PUBLIC_URL}/api/version`);
    const version = new SemVer(await reply.text());
    return version;
  } catch (error) {
    logger.error("Error fetching latest version via API:", error);
    return undefined;
  }
}

export async function refreshLatestVersion() {
  const { app } = getRootStore();

  // Reset to null to indicate that we are fetching the latest version
  app.latestVersion = null;
  // Fetch the latest version, can be undefined indicating that the latest version is not available
  const version = (await SWR.getWaitingSWVersion()) || (await fetchLatestVersionViaAPI());
  app.latestVersion = version;
}

export async function checkForUpdates() {
  logger.log("Check for updates");

  await SWR.update();
  /*
  ALGO:
  If there is no installing service worker, refreshLatestVersion() will not be called. This is usually because there
  is no update available or the network is down.
  
  We call refreshLatestVersion() manually to check if there is a new version available. It is important so that 
  app.latestVersion is updated. In this case, the method will fetch the latest version via API and update the 
  latestVersion observable. app.latestVersion will probably be undefined if no update available or the network is down
  
  It is also possible that the service worker can not change the state from installing to waiting due to parsing error
  But this is out of our control, so we just ignore it
  */
  if ((await SWR.isInstalling()) === false) {
    await refreshLatestVersion();
  }
}

const PromptUpdateMessage = "PROMPT_UPDATE";
const CloseUpdatePromptMessage = "CLOSE_UPDATE_PROMPT";
const versioningBroadcastChannel: BroadcastChannel | undefined = (function () {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    const channel = new BroadcastChannel("versioning");
    channel.onmessage = event => {
      if (event.data === PromptUpdateMessage) promptUpdate(false);
      else if (event.data === CloseUpdatePromptMessage) closeUpdatePrompt(false);
    };
    return channel;
  } else {
    return undefined;
  }
})();

let isPromptingUpdate = false;

export async function promptUpdate(broadcast: boolean = true) {
  const { app } = getRootStore();

  if (app.latestVersion === undefined) return;
  if (isPromptingUpdate) return;

  isPromptingUpdate = true;

  if (broadcast) versioningBroadcastChannel?.postMessage(PromptUpdateMessage);

  await doPromptUpdate();
}

export function closeUpdatePrompt(broadcast: boolean = true) {
  if (isPromptingUpdate === false) return;

  const { confirmation: conf } = getRootStore();

  isPromptingUpdate = false;
  conf.close();

  if (broadcast) versioningBroadcastChannel?.postMessage(CloseUpdatePromptMessage);
}

async function doPromptUpdate() {
  if (isPromptingUpdate === false) return;

  const { app, confirmation: conf } = getRootStore();

  if (conf.isOpen) await when(() => conf.isOpen === false);

  if (!app.latestVersion) await when(() => !!app.latestVersion);

  const version = app.latestVersion!.version ?? "";

  function getDescription(clientsCount: number): React.ReactNode {
    return (
      <>
        <Typography gutterBottom variant="body1">
          {clientsCount <= 1
            ? "Restart the app by closing this tab and reopening it. Reload/Hard Reload will not work."
            : "Restart the app by closing all " + clientsCount + " tabs. Then, reopen them."}
        </Typography>
      </>
    );
  }

  const prompt = conf.prompt({
    title: `Apply Update v${version}`,
    description: getDescription(await SWR.getControllingClientsCount()),
    buttons: [
      {
        label: "Not Now",
        onClick: closeUpdatePrompt
      }
    ]
  });

  const clear = setInterval(async () => {
    conf.description = getDescription(await SWR.getControllingClientsCount());
  }, 1000);

  await prompt;

  clearInterval(clear);

  await sleep(300);

  await doPromptUpdate();
}
