import LoggerImpl from "./LoggerImpl";

test("LoggerImpl", () => {
  const impl = new LoggerImpl("test");

  expect(impl.name).toBe("test");

  const methods = ["debug", "log", "warn", "error", "groupCollapsed", "groupEnd"];

  for (const method of methods) {
    expect((impl as any)[method]).toBeInstanceOf(Function);
  }

  impl.debug("debug");
  impl.log("log");
  impl.warn("warn");
  impl.error("error");
  impl.groupCollapsed("groupCollapsed");

  const currentUserAgent = navigator.userAgent;
  Object.defineProperty(navigator, "userAgent", { value: "safari", configurable: true });
  impl.groupCollapsed("groupCollapsed");
  Object.defineProperty(navigator, "userAgent", { value: currentUserAgent, configurable: true });

  impl.groupEnd();
  impl.print("log", "log");
});
