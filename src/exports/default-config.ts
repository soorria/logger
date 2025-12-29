import type { LoggerConfig } from "../lib/types.js";
import { JsonLogFormatter } from "../lib/formatters/json-formatter.js";
import { PrettyLogFormatter } from "../lib/formatters/pretty-formatter.js";
import { ConsoleTransport } from "../lib/transports/console-transport.js";

export function getDefaultConfig(options: {
  production: boolean;
}): Pick<LoggerConfig, "formatter" | "transport"> {
  return {
    formatter: options.production
      ? new JsonLogFormatter({ compact: true })
      : new PrettyLogFormatter(),
    transport: new ConsoleTransport(),
  };
}
