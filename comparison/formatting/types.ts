export type LogLevel = "info" | "warn" | "error";

export interface LoggerAdapter {
  name: string;

  /** Setup the logger, configure for JSON output */
  setup(): Promise<void> | void;

  /** Log a message with optional structured data */
  log(level: LogLevel, message: string, data?: unknown): void;

  /** Optional cleanup */
  teardown?(): Promise<void> | void;
}

/** Base class for logger adapters - extend this to create new adapters */
export abstract class BaseLoggerAdapter implements LoggerAdapter {
  abstract name: string;
  abstract setup(): Promise<void> | void;
  abstract log(level: LogLevel, message: string, data?: unknown): void;
  teardown?(): Promise<void> | void;
}
