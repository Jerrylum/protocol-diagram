import { Logger } from "./Logger";

test("Logger", () => {
  const logger = Logger("test");

  expect(logger.name).toBe("test");

  const methods = ["debug", "log", "warn", "error", "groupCollapsed", "groupEnd"];

  for (const method of methods) {
    expect((logger as any)[method]).toBeInstanceOf(Function);
  }

  logger.debug("debug");
  logger.log("log");
  logger.warn("warn");
  logger.error("error");
  logger.groupCollapsed("groupCollapsed");

  const currentUserAgent = navigator.userAgent;
  Object.defineProperty(navigator, "userAgent", { value: "safari", configurable: true });
  logger.groupCollapsed("groupCollapsed");
  Object.defineProperty(navigator, "userAgent", { value: currentUserAgent, configurable: true });

  logger.groupEnd();
  logger.print("log", "log");
});
