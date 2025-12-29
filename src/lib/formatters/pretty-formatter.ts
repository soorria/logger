import { inspect } from "node:util";

import type { LogData, LogFormatter } from "../types.js";
import { LogLevel } from "../types.js";
import { JsonLogFormatter } from "./json-formatter.js";

// ANSI escape codes for terminal coloring
const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgRed: "\x1b[41m",
  black: "\x1b[30m",
} as const;

/**
 * Options for configuring the PrettyLogFormatter.
 */
export interface PrettyLogFormatterOptions {
  /** Enable colored output (default: true) */
  colors?: boolean;
}

/**
 * Pretty log formatter inspired by pino-pretty.
 * Formats logs with colors and human-readable formatting for development.
 * Extends DefaultLogFormatter to reuse error formatting and serialization logic.
 */
export class PrettyLogFormatter
  extends JsonLogFormatter
  implements Required<LogFormatter>
{
  private readonly useColors: boolean;

  constructor(options: PrettyLogFormatterOptions = {}) {
    super();
    this.useColors = options.colors ?? true;
  }

  /**
   * Applies ANSI color codes to text if colors are enabled.
   */
  private colorize(text: string, ...codes: string[]): string {
    if (!this.useColors) return text;
    return `${codes.join("")}${text}${ANSI.reset}`;
  }

  /**
   * Formats log data into a pretty, human-readable string with colors.
   * Overrides the parent method to handle LogData structure instead of raw data.
   */
  override formatLogData(logData: LogData): string {
    const parts: string[] = [
      `${this.colorize(this.formatTimestamp(), ANSI.gray)} ${this.formatLevel(logData.level)} ${this.colorize(logData.message, ANSI.blue)}`,
    ];

    if (logData.context) {
      const contextStr = this.formatContext(logData.context);
      if (contextStr) {
        parts.push(contextStr);
      }
    }

    // Additional data
    if (logData.data) {
      const dataStr = this.formatData(logData.data);
      if (dataStr) {
        parts.push(dataStr);
      }
    }

    return parts.join("\n");
  }

  /**
   * Formats the timestamp for display.
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Formats the log level with appropriate color and icon.
   */
  private formatLevel(level: LogLevel): string {
    const { codes, label } = LOG_LEVEL_FORMATTING[level];

    return this.colorize(` ${label} `, ...codes);
  }

  /**
   * Formats context information (requestId, jobId, etc.).
   */
  private formatContext(context: NonNullable<LogData["context"]>): string {
    return this.indent(
      Object.entries(context)
        .map(([key, value]) => {
          return `${this.colorize("context.", ANSI.dim)}${key}: ${this.formatInspect(value)}`;
        })
        .join("\n"),
    );
  }

  /**
   * Formats additional data objects.
   * Uses parent's serialization logic but respects singleLine option.
   */
  private formatData(data: unknown): string {
    if (Array.isArray(data) || !data || typeof data !== "object") {
      return this.indent(this.formatInspect(data));
    }

    return this.indent(
      Object.entries(data)
        .map(([key, value]) => {
          return `${this.colorize("data.", ANSI.dim)}${key}: ${this.formatInspect(value)}`;
        })
        .join("\n"),
    );
  }

  /**
   * Formats data using Node.js util.inspect as fallback.
   * Overrides parent to add colors and multi-line formatting.
   */
  protected override formatWithInspect(arg: unknown): string {
    const inspected = this.formatInspect(arg);

    return (
      "\n" +
      inspected
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n")
    );
  }

  private formatInspect(value: unknown): string {
    return inspect(value, {
      depth: null,
      colors: this.useColors,
      breakLength: 80,
      compact: false,
    });
  }

  private indent(text: string, times = 1): string {
    const indentation = TAB.repeat(times);
    return text
      .split("\n")
      .map((line) => `${indentation}${line}`)
      .join("\n");
  }
}

const TAB = " ".repeat(4);

const LOG_LEVEL_FORMATTING: Record<
  LogLevel,
  { codes: string[]; label: string }
> = {
  [LogLevel.debug]: {
    codes: [ANSI.bgBlue, ANSI.black],
    label: "DEBUG?",
  },
  [LogLevel.info]: {
    codes: [ANSI.bgGreen, ANSI.black],
    label: " INFO ",
  },
  [LogLevel.warn]: {
    codes: [ANSI.bgYellow, ANSI.black],
    label: " WARN ",
  },
  [LogLevel.error]: {
    codes: [ANSI.bgRed, ANSI.black],
    label: "ERROR!",
  },
  [LogLevel.fatal]: {
    codes: [ANSI.bgRed, ANSI.black],
    label: "FATAL!",
  },
  [LogLevel.silent]: {
    codes: [],
    label: "",
  },
};
