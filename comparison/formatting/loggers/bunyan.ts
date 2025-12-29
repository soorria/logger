import bunyan from "bunyan";

import type { LogLevel } from "../types.js";
import { BaseLoggerAdapter } from "../types.js";

class BunyanAdapter extends BaseLoggerAdapter {
  name = "bunyan";
  private logger!: bunyan;

  setup() {
    this.logger = bunyan.createLogger({
      name: "comparison",
      level: "info",
    });
  }

  log(level: LogLevel, message: string, data?: unknown) {
    if (data !== undefined) {
      this.logger[level](data, message);
    } else {
      this.logger[level](message);
    }
  }
}

// Note: Bunyan doesn't have built-in pretty printing - use `bunyan` CLI to pipe output

export const adapters = [new BunyanAdapter()];
