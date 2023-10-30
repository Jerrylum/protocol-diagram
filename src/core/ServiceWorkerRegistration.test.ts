import { SemVer } from "semver";
import {
  getControllingClientsCount,
  getCurrentSWVersion,
  getWaitingSWVersion,
  isInstalling,
  register,
  unregister,
  update
} from "./ServiceWorkerRegistration";
import { sleep } from "./Util";

test("getControllingClientsCount", async () => {
  getControllingClientsCount();
});

class ServiceWorkerContainerMock implements ServiceWorkerContainer {
  controller: ServiceWorker | null = null;

  oncontrollerchange: ((this: ServiceWorkerContainer, ev: Event) => any) | null = null;

  onmessage: ((this: ServiceWorkerContainer, ev: MessageEvent) => any) | null = null;
  onmessageerror: ((this: ServiceWorkerContainer, ev: MessageEvent<any>) => any) | null = null;

  ready: Promise<ServiceWorkerRegistration> = new Promise(() => {});

  getRegistration(scope?: string | undefined): Promise<ServiceWorkerRegistration | undefined> {
    throw new Error("Method not implemented.");
  }
  getRegistrations(): Promise<ServiceWorkerRegistration[]> {
    throw new Error("Method not implemented.");
  }
  register(scriptURL: string, options?: RegistrationOptions | undefined): Promise<ServiceWorkerRegistration> {
    throw new Error("Method not implemented.");
  }
  startMessages(): void {
    throw new Error("Method not implemented.");
  }

  addEventListener<K extends keyof ServiceWorkerContainerEventMap>(
    type: K,
    listener: (this: ServiceWorkerContainer, ev: ServiceWorkerContainerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {}
  removeEventListener<K extends keyof ServiceWorkerContainerEventMap>(
    type: K,
    listener: (this: ServiceWorkerContainer, ev: ServiceWorkerContainerEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {}
  dispatchEvent(event: Event): boolean {
    throw new Error("Method not implemented.");
  }
}

class ServiceWorkerRegistrationMock implements ServiceWorkerRegistration {
  active: ServiceWorker | null = null;
  installing: ServiceWorker | null = null;
  navigationPreload: NavigationPreloadManager = {} as NavigationPreloadManager;
  onupdatefound: ((this: ServiceWorkerRegistration, ev: Event) => any) | null = null;
  pushManager: PushManager = {} as PushManager;
  scope: string = "";
  updateViaCache: ServiceWorkerUpdateViaCache = "all";
  waiting: ServiceWorker | null = null;

  getNotifications(filter?: GetNotificationOptions | undefined): Promise<Notification[]> {
    throw new Error("Method not implemented.");
  }
  getPushSubscription(): Promise<PushSubscription | null> {
    throw new Error("Method not implemented.");
  }
  getPushSubscriptionOptions(): Promise<PushSubscriptionOptions | null> {
    throw new Error("Method not implemented.");
  }
  unregister(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  update(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  showNotification(title: string, options?: NotificationOptions | undefined): Promise<void> {
    throw new Error("Method not implemented.");
  }
  toJSON(): any {
    throw new Error("Method not implemented.");
  }
  addEventListener<K extends keyof ServiceWorkerRegistrationEventMap>(
    type: K,
    listener: (this: ServiceWorkerRegistration, ev: ServiceWorkerRegistrationEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {}
  removeEventListener<K extends keyof ServiceWorkerRegistrationEventMap>(
    type: K,
    listener: (this: ServiceWorkerRegistration, ev: ServiceWorkerRegistrationEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {}
  dispatchEvent(event: Event): boolean {
    throw new Error("Method not implemented.");
  }
}

class ServiceWorkerMock implements ServiceWorker {
  state: ServiceWorkerState = "activated";
  scriptURL: string = "";

  onstatechange: ((this: AbstractWorker, ev: Event) => any) | null = null;
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null;

  postMessage(message: any, transfer: Transferable[] | StructuredSerializeOptions | undefined): void {}

  addEventListener<K extends keyof ServiceWorkerEventMap>(
    type: K,
    listener: (this: ServiceWorker, ev: ServiceWorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {}
  removeEventListener<K extends keyof ServiceWorkerEventMap>(
    type: K,
    listener: (this: ServiceWorker, ev: ServiceWorkerEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {}

  dispatchEvent(event: Event): boolean {
    throw new Error("Method not implemented.");
  }
}

async function resetServiceWorker() {
  const swc = new ServiceWorkerContainerMock();
  const swr = new ServiceWorkerRegistrationMock();

  (navigator as any).serviceWorker = swc;
  swc.ready = Promise.resolve(swr);
  swr.unregister = jest.fn(async () => true);

  await unregister();

  delete (navigator as any).serviceWorker;

  (window as any).MessageChannel = class MessageChannel {
    port1: {
      _parent: MessageChannel;
      onmessage: ((ev: MessageEvent) => any) | null;
    };
    port2: {
      _parent: MessageChannel;
    };

    constructor() {
      this.port1 = { _parent: this, onmessage: null };
      this.port2 = { _parent: this };
    }
  };
}

function setupServiceWorkerEnv() {
  delete (window as any).location;
  (window as any).location = new URL("https://www.example.com");

  const swc = new ServiceWorkerContainerMock();
  (navigator as any).serviceWorker = swc;

  (process.env as any).PUBLIC_URL = "https://www.example.com";

  const swr = new ServiceWorkerRegistrationMock();
  swc.getRegistration = jest.fn(() => Promise.resolve(swr));
  swc.getRegistrations = jest.fn(() => Promise.resolve([swr]));
  swc.register = jest.fn(() => Promise.resolve(swr));

  return { swc, swr };
}

async function registerServiceWorker() {
  const { swc, swr } = setupServiceWorkerEnv();

  await register();

  return { swc, swr };
}

test("getControllingClientsCount", async () => {
  await resetServiceWorker();

  // no service worker
  expect(await getControllingClientsCount()).toBe(0);

  const { swc } = await registerServiceWorker();

  // no controller
  expect(await getControllingClientsCount()).toBe(0);

  swc.controller = new ServiceWorkerMock();
  swc.controller.postMessage = jest.fn((data: unknown, transfer: unknown) => {
    (transfer as [{ _parent: MessageChannel }])[0]._parent.port1.onmessage?.({ data: 123 } as MessageEvent);
  });

  expect(await getControllingClientsCount()).toBe(123);
});

test("getCurrentSWVersion", async () => {
  await resetServiceWorker();

  // no service worker
  expect(await getCurrentSWVersion()).toBe(undefined);

  const { swc } = await registerServiceWorker();

  // no controller
  expect(await getCurrentSWVersion()).toBe(undefined);

  swc.controller = new ServiceWorkerMock();
  swc.controller.postMessage = jest.fn((data: unknown, transfer: unknown) => {
    (transfer as [{ _parent: MessageChannel }])[0]._parent.port1.onmessage?.({ data: "1.0.0" } as MessageEvent);
  });

  expect(await getCurrentSWVersion()).toStrictEqual(new SemVer("1.0.0"));
});

test("getWaitingSWVersion", async () => {
  await resetServiceWorker();

  // no service worker
  expect(await getWaitingSWVersion()).toBe(undefined);

  const { swr } = await registerServiceWorker();

  // no waiting
  expect(await getWaitingSWVersion()).toBe(undefined);

  swr.waiting = new ServiceWorkerMock();
  swr.waiting.postMessage = jest.fn((data: unknown, transfer: unknown) => {
    (transfer as [{ _parent: MessageChannel }])[0]._parent.port1.onmessage?.({ data: "1.0.0" } as MessageEvent);
  });

  expect(await getWaitingSWVersion()).toStrictEqual(new SemVer("1.0.0"));
});

test("update", async () => {
  await resetServiceWorker();

  expect(await update()).toBe(false);

  const { swr } = await registerServiceWorker();

  swr.update = jest.fn(async () => {});
  expect(await update()).toBe(true);
  expect(swr.update).toBeCalled();
});

test("isInstalling", async () => {
  await resetServiceWorker();

  expect(await isInstalling()).toBe(false);

  const { swr } = await registerServiceWorker();

  expect(await isInstalling()).toBe(false);

  swr.installing = new ServiceWorkerMock();
  expect(await isInstalling()).toBe(true);
});

test("register", async () => {
  await resetServiceWorker();

  {
    const swc = new ServiceWorkerContainerMock();
    const swr = new ServiceWorkerRegistrationMock();

    (navigator as any).serviceWorker = swc;
    swc.ready = Promise.resolve(swr);
    swr.unregister = jest.fn(async () => true);
    delete (window as any).location;
    (window as any).location = new URL("http://localhost");
  }

  // localhost
  await register();

  await resetServiceWorker();
  delete (window as any).location;
  (window as any).location = new URL("https://www.example.com");

  // no service worker
  await register();

  const swc = new ServiceWorkerContainerMock();
  (navigator as any).serviceWorker = swc;
  (process.env as any).PUBLIC_URL = "https://anything.com";

  // public url check fail
  await register();

  (process.env as any).PUBLIC_URL = "https://www.example.com";
  const swr = new ServiceWorkerRegistrationMock();
  swc.getRegistration = jest.fn(() => Promise.resolve(swr));
  swc.getRegistrations = jest.fn(() => Promise.resolve([swr]));
  swc.register = jest.fn(() => Promise.resolve(swr));

  await register();

  // duplicate registration
  await register();
});

test("register & reload", async () => {
  const { swr, swc } = setupServiceWorkerEnv();

  swr.active = new ServiceWorkerMock();
  swc.controller = null;

  const reloadFn = jest.fn(() => {});
  (window as any).location.reload = reloadFn;

  // doesn't seems to work

  await register();
});

test("unregister", async () => {
  await resetServiceWorker();

  await unregister();

  const swc = new ServiceWorkerContainerMock();
  const swr = new ServiceWorkerRegistrationMock();

  (navigator as any).serviceWorker = swc;
  swc.ready = Promise.resolve(swr);

  swr.unregister = jest.fn(async () => true);

  await unregister();

  expect(swr.unregister).toBeCalled();

  swr.unregister = jest.fn(async () => {
    throw new Error("test");
  });

  await unregister();

  expect(swr.unregister).toBeCalled();
});
