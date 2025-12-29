import { JsonLogFormatter } from "../lib/formatters/json-formatter.js";
import { PrettyLogFormatter } from "../lib/formatters/pretty-formatter.js";
import { ConsoleTransport } from "../lib/transports/console-transport.js";
import type { LoggerConfig } from "../lib/types.js";

export function getDefaultConfig(): Pick<LoggerConfig, "formatter" | "transport"> {
  return {
    formatter:
      process.env.NODE_ENV === "production"
        ? new JsonLogFormatter()
        : new PrettyLogFormatter(),
    transport: new ConsoleTransport(),
  };
}

