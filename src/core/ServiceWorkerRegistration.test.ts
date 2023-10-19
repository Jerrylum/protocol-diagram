import { register, unregister, isLocalhost } from "./ServiceWorkerRegistration";
test("register", () => {
  register();
  Object.defineProperty(window, 'location', {
    value: {
      hostname: 'mock'
    },
    writable: true // possibility to override
  });
  expect(window.location.hostname).toBe('mock');
  Object.defineProperty(global.navigator, 'serviceWorker', {
    value: {
      register: jest.fn() // Choose your favourite mocking library
    }
  });
  expect("serviceWorker" in navigator).toBe(true);
  // register();
});