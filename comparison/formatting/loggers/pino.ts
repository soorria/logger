import pino from "pino";
import pinoPretty from "pino-pretty";
import { BaseLoggerAdapter, type LogLevel } from "../types.js";

class PinoAdapter extends BaseLoggerAdapter {
  name = "pino";
  private logger!: pino.Logger;

  setup() {
    // Use sync destination for predictable output ordering
    this.logger = pino({ level: "info" }, pino.destination({ sync: true }));
  }

  log(level: LogLevel, message: string, data?: unknown) {
    if (data !== undefined) {
      this.logger[level](data, message);
    } else {
      this.logger[level](message);
    }
  }
}

class PinoPrettyAdapter extends BaseLoggerAdapter {
  name = "pino-pretty";
  private logger!: pino.Logger;

  setup() {
    // Use pino-pretty as a stream (sync) instead of transport (async worker)
    const pretty = pinoPretty({ colorize: true, sync: true });
    this.logger = pino({ level: "info" }, pretty);
  }

  log(level: LogLevel, message: string, data?: unknown) {
    if (data !== undefined) {
      this.logger[level](data, message);
    } else {
      this.logger[level](message);
    }
  }
}

export const adapters = [new PinoAdapter(), new PinoPrettyAdapter()];
