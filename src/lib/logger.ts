import type {
  BlessedLogParameters,
  ILogger,
  LogData,
  LogFormatter,
  LoggerConfig,
  ResolvedLogConfig,
} from "./types.js";
import { LogLevel } from "./types.js";
import { isObject } from "./utils.js";

export class Logger implements ILogger {
  private config: ResolvedLogConfig;

  constructor(config: LoggerConfig) {
    let logLevel: LogLevel = LogLevel.debug;
    if (config.logLevel) {
      if (typeof config.logLevel === "number") {
        logLevel = config.logLevel;
      } else if (
        typeof config.logLevel === "string" &&
        config.logLevel in LogLevel
      ) {
        logLevel = LogLevel[config.logLevel as keyof typeof LogLevel];
      }
    }

    this.config = {
      ...config,
      logLevel,
    };
  }

  child(scope: Record<string, unknown>): this {
    return new Logger({
      ...this.config,
      scope: {
        ...this.config.scope,
        ...scope,
      },
    }) as typeof this;
  }

  debug(...args: BlessedLogParameters): void {
    this.log(LogLevel.debug, ...args);
  }

  info(...args: BlessedLogParameters): void {
    this.log(LogLevel.info, ...args);
  }

  warn(...args: BlessedLogParameters): void {
    this.log(LogLevel.warn, ...args);
  }

  error(...args: BlessedLogParameters): void {
    this.log(LogLevel.error, ...args);
  }

  fatal(...args: BlessedLogParameters): void {
    this.log(LogLevel.fatal, ...args);
  }

  silent(): void {
    // do nothing, be silent
  }

  private log(
    verbosity: LogLevel,
    ...[message, data]: BlessedLogParameters
  ): void {
    if ((verbosity as unknown as number) < this.config.logLevel) {
      return;
    }

    const logData = this.getLogData({
      level: verbosity,
      message,
      data,
      scope: this.config.scope,
      formatter: this.config.formatter,
    });

    // eslint-disable-next-line no-console
    console.log(this.config.formatter.formatLogData(logData));
  }

  private getLogData({
    level,
    message,
    data,
    scope,
    formatter,
  }: {
    level: LogLevel;
    message: string;
    data: unknown | undefined;
    scope: Record<string, unknown> | undefined;
    formatter: LogFormatter;
  }): LogData {
    const logData: LogData = { level, message };

    const logContext = this.config.getLogContext?.();
    if (logContext) {
      logData.context = logContext;
    }

    if (data || scope) {
      const dataToAdd = {
        ...scope,
      };

      if (data instanceof Error) {
        Object.assign(dataToAdd, formatter.formatError("", data));
      } else {
        Object.assign(dataToAdd, isObject(data) ? data : { data });
      }

      logData.data = dataToAdd;
    }

    return logData;
  }
}
