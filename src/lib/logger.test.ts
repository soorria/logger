import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getParsedLoggedData } from "../tests/utils.js";
import { DefaultLogFormatter } from "./formatter.js";
import { Logger } from "./logger.js";
import { LogLevel } from "./types.js";

describe(Logger, () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("LOG_LEVEL", "debug");
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  describe("basic logging", () => {
    it.each(["debug", "info", "warn", "error", "fatal"] satisfies Array<
      keyof typeof LogLevel
    >)("logs %s messages", (level) => {
      const logger = new Logger(undefined);
      logger[level]("test message", { data: "value" });

      expect(consoleSpy).toHaveBeenCalledOnce();
      const loggedData = getParsedLoggedData(consoleSpy);
      expect(loggedData).toMatchObject({
        level: LogLevel[level],
        message: "test message",
        data: {
          data: "value",
        },
      });
    });

    it("silent method does nothing", () => {
      const logger = new Logger();
      logger.silent();

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe("child logging", () => {
    it("includes scope in log data", () => {
      const logger = new Logger({
        logLevel: LogLevel.debug,
      });
      const scopedLogger = logger.child({ userId: "123", action: "test" });
      scopedLogger.debug("scoped message", { additional: "data" });

      expect(consoleSpy).toHaveBeenCalledOnce();
      const loggedData = getParsedLoggedData(consoleSpy);
      expect(loggedData).toMatchObject({
        data: {
          userId: "123",
          action: "test",
          additional: "data",
        },
      });
    });

    it("creates new logger with additional scope", () => {
      const logger = new Logger({
        logLevel: LogLevel.debug,
      });
      const scopedLogger = logger
        .child({ userId: "123" })
        .child({ requestId: "456" });

      scopedLogger.debug("test message");

      expect(consoleSpy).toHaveBeenCalledOnce();
      const loggedData = getParsedLoggedData(consoleSpy);
      expect(loggedData).toMatchObject({
        data: {
          userId: "123",
          requestId: "456",
        },
      });
    });
  });

  describe("error logging", () => {
    it("properly formats errors", () => {
      const logger = new Logger({
        logLevel: LogLevel.debug,
      });
      const error = new Error("test error");
      logger.debug("error occurred", error);

      expect(consoleSpy).toHaveBeenCalledOnce();
      const loggedData = getParsedLoggedData(consoleSpy);
      expect(loggedData).toMatchObject({
        data: {
          name: "Error",
          message: "test error",
          stack: expect.any(String),
        },
      });
    });

    it("should correctly use formatter overrides when error is passed directly", () => {
      const logger = new Logger({
        formatter: new (class extends DefaultLogFormatter {
          override formatError(
            _key: string,
            error: Error,
          ): Record<string, unknown> {
            return {
              name: "CustomError",
              message: "custom error",
            };
          }
        })(),
      });

      logger.debug("error occurred", new Error("test error"));

      expect(consoleSpy).toHaveBeenCalledOnce();
      const loggedData = getParsedLoggedData(consoleSpy);
      expect(loggedData).toMatchObject({
        data: {
          name: "CustomError",
          message: "custom error",
        },
      });
    });
  });

  describe("log level filtering", () => {
    it("respects log level configuration", () => {
      const logger = new Logger({
        logLevel: LogLevel.warn,
      });

      logger.debug("debug message");
      logger.info("info message");
      expect(consoleSpy).not.toHaveBeenCalled();

      logger.warn("warn message");
      expect(consoleSpy).toHaveBeenCalledOnce();
    });

    it("uses LOG_LEVEL env var when config.logLevel is not provided", () => {
      vi.stubEnv("LOG_LEVEL", "warn");

      const logger = new Logger();

      logger.debug("debug message");
      logger.info("info message");
      expect(consoleSpy).not.toHaveBeenCalled();

      logger.warn("warn message");
      expect(consoleSpy).toHaveBeenCalledOnce();

      vi.unstubAllEnvs();
    });

    it("config.logLevel takes precedence over LOG_LEVEL env var", () => {
      vi.stubEnv("LOG_LEVEL", "warn");

      const logger = new Logger({
        logLevel: LogLevel.debug,
      });

      logger.debug("debug message");
      expect(consoleSpy).toHaveBeenCalledOnce();

      vi.unstubAllEnvs();
    });

    it("defaults to debug when LOG_LEVEL env var is invalid", () => {
      vi.stubEnv("LOG_LEVEL", "invalid");

      const logger = new Logger();

      logger.debug("debug message");
      expect(consoleSpy).toHaveBeenCalledOnce();

      vi.unstubAllEnvs();
    });

    it("defaults to debug when neither config.logLevel nor LOG_LEVEL env var is set", () => {
      vi.stubEnv("LOG_LEVEL", "");

      const logger = new Logger();

      logger.debug("debug message");
      expect(consoleSpy).toHaveBeenCalledOnce();

      vi.unstubAllEnvs();
    });
  });
});
