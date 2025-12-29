import type { InspectOptions } from "node:util";
import { inspect } from "node:util";

import type { LogFormatter } from "../types.js";

/**
 * Options for configuring the JsonLogFormatter.
 */
export interface JsonLogFormatterOptions {
  /** Compact output on single lines (default: false) */
  compact?: boolean;
}

/**
 * Default implementation of LogFormatter that handles JSON serialization
 * and formatting of various data types for logging purposes.
 */
export class JsonLogFormatter implements Required<LogFormatter> {
  private readonly compact: boolean;
  private readonly jsonStringifySpace: number | undefined;
  private readonly inspectOptions: InspectOptions;

  constructor(options: JsonLogFormatterOptions = {}) {
    this.compact = options.compact ?? false;
    this.jsonStringifySpace = this.compact ? undefined : 2;
    this.inspectOptions = this.compact
      ? {
          /**
           * Compact in prod so all the data is on a single log line.
           */
          compact: true,
        }
      : {
          /**
           * For local dev, we want to see as much of the object as possible.
           */
          depth: null,
          /**
           * Add formatting - has a similar effect to the `space` option of
           * `JSON.stringify`.
           */
          compact: false,
        };
  }

  /**
   * Formats any data type into a string suitable for logging.
   *
   * Attempts JSON serialization first with custom replacers,
   * falls back to Node.js inspect for circular or non-serializable objects.
   *
   * @param arg - The data to format
   * @returns Formatted string representation
   */
  formatLogData(arg: unknown): string {
    if (typeof arg !== "object") {
      return `${arg}`;
    }

    try {
      return JSON.stringify(
        arg,
        (key, value) => this.jsonReplacer(key, value),
        this.jsonStringifySpace,
      );
    } catch {
      return this.formatWithInspect(arg);
    }
  }

  /**
   * Custom JSON replacer function that handles special data types
   * that are not natively JSON serializable.
   *
   * @param key - The property key being stringified
   * @param value - The value being stringified
   * @returns Processed value suitable for JSON serialization
   */
  protected jsonReplacer(key: string, value: unknown): unknown {
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (value instanceof RegExp) {
      return `Regexp { /${value.source}/${value.flags} }`;
    }
    if (value instanceof Promise) {
      return this.formatPromise(key, value);
    }
    if (typeof value === "undefined") {
      return "FakeValue { undefined }";
    }

    if (value instanceof Error) {
      return this.formatError(key, value);
    }

    return value;
  }

  /**
   * Fallback formatting method using Node.js util.inspect.
   * Used when JSON.stringify fails due to circular references
   * or other non-serializable objects.
   *
   * @param arg - The object to format
   * @returns String representation using inspect
   */
  protected formatWithInspect(arg: unknown): string {
    /**
     * fallback to handle circular objects, or other non-json-serializable
     * objects. this `node:util#inspect` does similar to what `console.log`
     * and `console.dir` do.
     */
    return inspect(arg, this.inspectOptions);
  }

  /**
   * Formats an Error object into a plain object for JSON serialization.
   *
   * @param _key - The key where this error was found (unused)
   * @param error - The Error object to format
   * @returns Plain object representation of the error
   */
  formatError(_key: string, error: Error): Record<string, unknown> {
    return errorToObject(error, this);
  }

  /**
   * Formats a Promise object with a helpful message indicating
   * that promises should be awaited before logging.
   *
   * @param key - The key where this promise was found
   * @param promise - The Promise object (unused in implementation)
   * @returns Helpful message about awaiting the promise
   */
  protected formatPromise(key: string, _promise: Promise<unknown>): string {
    return `Promise { you tried to log a promise at ${key}. try awaiting it pls }`;
  }
}

/**
 * Converts an Error object to a plain object suitable for JSON serialization.
 *
 * Preserves standard error properties (name, message, stack) and includes
 * any custom properties. Handles nested error causes recursively and
 * respects custom toJSON methods if present.
 *
 * @param error - The Error object to convert
 * @param formatter - LogFormatter instance to use for formatting nested values
 * @returns Plain object representation of the error
 */
export function errorToObject(
  error: Error,
  formatter: LogFormatter,
): Record<string, unknown> {
  const errObject: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if ("toJSON" in error && typeof error.toJSON === "function") {
    Object.assign(errObject, error.toJSON());
  } else {
    for (const key in error) {
      if (key in errObject) {
        continue;
      }

      errObject[key] = formatter.formatLogData(
        error[key as keyof typeof error],
      );
    }
  }

  if (error.cause) {
    if (error.cause instanceof Error) {
      errObject.cause = errorToObject(error.cause, formatter);
    } else {
      errObject.cause = formatter.formatLogData(error.cause);
    }
  }

  return errObject;
}

