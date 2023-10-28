import { getControllingClientsCount, register } from "./ServiceWorkerRegistration";


test ("Register", async () => {
  register();
  Object.defineProperty(window, "location", {
    value: { hostname: "notLocalHost" },
    configurable: true
  });
  register();
  (navigator as any).serviceWorker = true;
  (process.env as any).PUBLIC_URL = "https://example.com"
  register();
  (window.location as any).origin = "https://example.com";
  // register();
});
