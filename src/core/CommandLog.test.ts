import { CommandLogger } from "./CommandLog";

test("CommandLog", () => {
  const logger = new CommandLogger(3);
  
  logger.info("info1");

  expect(logger.logs).toStrictEqual([
    { uid: 0, level: "info", message: "info1" }
  ]);
  expect(logger.logCount).toBe(1);

  logger.info("info2");

  expect(logger.logs).toStrictEqual([
    { uid: 0, level: "info", message: "info1" },
    { uid: 1, level: "info", message: "info2" }
  ]);
  expect(logger.logCount).toBe(2);

  logger.error("error1");

  expect(logger.logs).toStrictEqual([
    { uid: 0, level: "info", message: "info1" },
    { uid: 1, level: "info", message: "info2" },
    { uid: 2, level: "error", message: "error1" }
  ]);
  expect(logger.logCount).toBe(3);

  logger.error("error2");

  expect(logger.logs).toStrictEqual([
    { uid: 1, level: "info", message: "info2" },
    { uid: 2, level: "error", message: "error1" },
    { uid: 3, level: "error", message: "error2" }
  ]);
  expect(logger.logCount).toBe(4);

  expect(logger.maxLogs).toBe(3);
  logger.maxLogs = 4;

  expect(logger.logs).toStrictEqual([
    { uid: 1, level: "info", message: "info2" },
    { uid: 2, level: "error", message: "error1" },
    { uid: 3, level: "error", message: "error2" }
  ]);

  logger.maxLogs = 3;

  expect(logger.logs).toStrictEqual([
    { uid: 1, level: "info", message: "info2" },
    { uid: 2, level: "error", message: "error1" },
    { uid: 3, level: "error", message: "error2" }
  ]);

  logger.maxLogs = 2;

  expect(logger.logs).toStrictEqual([
    { uid: 2, level: "error", message: "error1" },
    { uid: 3, level: "error", message: "error2" }
  ]);

  logger.clear();

  expect(logger.logs).toStrictEqual([]);

  logger.info("info3");

  expect(logger.logs).toStrictEqual([
    { uid: 4, level: "info", message: "info3" }
  ]);
  expect(logger.logCount).toBe(5);  
});
