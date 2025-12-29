/**
 * Contextual information that can be attached to log entries
 * to help with debugging and tracing across requests and jobs.
 */
export interface LogContext extends Record<string, string> {}

/**
 * Configuration options for creating a logger instance.
 */
export interface LoggerConfig {
  /**
   * Scope to add to all log entries.
   */
  scope?: Record<string, unknown>;

  /**
   * Log level verbosity (default: debug)
   *
   * If not provided, or not a valid LogLevel, `LogLevel.debug` is used.
   */
  logLevel?: LogLevel | keyof typeof LogLevel | (string & {});

  /**
   * Formatter to use for formatting log data.
   */
  formatter: LogFormatter;

  /**
   * Transport to write log entries to.
   */
  transport: LogTransport;

  /**
   * Function to get the current log context, e.g. from async-local storage
   *
   * @returns The current log context
   */
  getLogContext?: () => LogContext | undefined;
}

/**
 * Structure of a complete log entry with all metadata.
 */
export interface LogData {
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: LogContext;
}

/**
 * Enumeration of log levels with numeric values for filtering.
 * Higher numbers indicate more severe log levels.
 */
export enum LogLevel {
  debug = 10,
  info = 20,
  warn = 30,
  error = 40,
  fatal = 50,
  silent = 100,
}

/**
 * Standard parameter structure for log function calls.
 */
export type BlessedLogParameters = [message: string, data?: unknown];

/**
 * Function signature for individual log level methods.
 */
type LogFunction = (...args: BlessedLogParameters) => void;

/**
 * Mapped type that creates log methods for each named log level.
 */
type LoggerMap = {
  [K in keyof typeof LogLevel as K extends number ? never : K]: LogFunction;
};

/**
 * Main logger interface that provides log methods for each level
 * and the ability to create child loggers with additional context.
 */
export interface ILogger extends LoggerMap {
  child: (scope: Record<string, unknown>, input?: unknown) => this;
}

/**
 * Interface for custom log formatting implementations.
 * Provides methods to format different types of data for logging.
 */
export interface LogFormatter {
  /**
   * Formats any data type into a string suitable for logging.
   *
   * @param value - The data to format
   * @returns Formatted string representation
   */
  formatLogData(value: unknown): string;

  /**
   * Formats Error objects into plain objects for serialization.
   *
   * @param key - The key where this error was found
   * @param error - The Error object to format
   * @returns Plain object representation of the error
   */
  formatError(key: string, error: Error): Record<string, unknown>;
}

export interface LogTransport {
  /**
   * Write a log entry to the transport.
   * @param log - The log entry to write
   */
  writeLog(log: string): void;
}

export type ResolvedLogConfig = Omit<LoggerConfig, "logLevel"> & {
  logLevel: LogLevel;
};
