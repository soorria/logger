import { Logger } from "tslog";
import { BaseLoggerAdapter, type LogLevel } from "../types.js";

class TslogAdapter extends BaseLoggerAdapter {
  name = "tslog";
  private logger!: Logger<unknown>;

  setup() {
    this.logger = new Logger({ type: "json" });
  }

  log(level: LogLevel, message: string, data?: unknown) {
    if (level === "info") this.logger.info(message, data);
    else if (level === "warn") this.logger.warn(message, data);
    else if (level === "error") this.logger.error(message, data);
  }
}

class TslogPrettyAdapter extends BaseLoggerAdapter {
  name = "tslog-pretty";
  private logger!: Logger<unknown>;

  setup() {
    this.logger = new Logger({ type: "pretty" });
  }

  log(level: LogLevel, message: string, data?: unknown) {
    if (level === "info") this.logger.info(message, data);
    else if (level === "warn") this.logger.warn(message, data);
    else if (level === "error") this.logger.error(message, data);
  }
}

export const adapters = [new TslogAdapter(), new TslogPrettyAdapter()];
