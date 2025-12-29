import { inspect } from "node:util";
import kleur from "kleur";
import { DefaultLogFormatter } from "./formatter.js";
import type { LogData, LogFormatter } from "./types.js";
import { LogLevel } from "./types.js";

/**
 * Pretty log formatter inspired by pino-pretty.
 * Formats logs with colors and human-readable formatting for development.
 * Extends DefaultLogFormatter to reuse error formatting and serialization logic.
 */
export class PrettyLogFormatter
  extends DefaultLogFormatter
  implements Required<LogFormatter>
{
  private readonly useColors: boolean;

  constructor() {
    super();
    // Auto-detect if colors are supported (not in CI or when explicitly disabled)
    this.useColors =
      process.env.CI !== "true" &&
      process.env.NO_COLOR !== "1" &&
      process.stdout.isTTY;

    // Configure kleur to respect our useColors setting
    kleur.enabled = this.useColors;
  }

  /**
   * Formats log data into a pretty, human-readable string with colors.
   * Overrides the parent method to handle LogData structure instead of raw data.
   */
  override formatLogData(logData: LogData): string {
    const parts: string[] = [
      `${kleur.gray(this.formatTimestamp())} ${this.formatLevel(logData.level)} ${kleur.blue(logData.message)}`,
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
    const { colorize, label } = LOG_LEVEL_FORMATTING[level];

    return colorize(` ${label} `);
  }

  /**
   * Formats context information (requestId, jobId, etc.).
   */
  private formatContext(context: NonNullable<LogData["context"]>): string {
    return this.indent(
      Object.entries(context)
        .map(([key, value]) => {
          return `${kleur.dim("context.")}${key}: ${this.formatInspect(value)}`;
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
          return `${kleur.dim("data.")}${key}: ${this.formatInspect(value)}`;
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
  { colorize: (text: string) => string; label: string }
> = {
  [LogLevel.debug]: {
    colorize: kleur.bgBlue().black,
    label: "DEBUG?",
  },
  [LogLevel.info]: {
    colorize: kleur.bgGreen().black,
    label: " INFO ",
  },
  [LogLevel.warn]: {
    colorize: kleur.bgYellow().black,
    label: " WARN ",
  },
  [LogLevel.error]: {
    colorize: kleur.bgRed().black,
    label: "ERROR!",
  },
  [LogLevel.fatal]: {
    colorize: kleur.bgRed().black,
    label: "FATAL!",
  },
  [LogLevel.silent]: {
    colorize: (text) => text,
    label: "",
  },
};
