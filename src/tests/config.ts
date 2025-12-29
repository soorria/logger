import { JsonLogFormatter } from "../lib/formatters/json-formatter.js";
import { ConsoleTransport } from "../lib/transports/console-transport.js";

export const formatter = new JsonLogFormatter();
export const transport = new ConsoleTransport();
