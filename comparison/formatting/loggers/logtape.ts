import type { Logger } from "@logtape/logtape";
import { configure, getConsoleSink, getLogger, reset } from "@logtape/logtape";

import type { LogLevel } from "../types.js";
import { BaseLoggerAdapter } from "../types.js";

class LogtapeAdapter extends BaseLoggerAdapter {
  name = "logtape";

  private logger!: Logger;

  async setup() {
    await configure({
      sinks: {
        console: getConsoleSink(),
      },
      loggers: [
        {
          category: ["comparison"],
          sinks: ["console"],
          lowestLevel: "debug",
        },
      ],
      reset: true,
    });
    this.logger = getLogger(["comparison"]);
  }

  log(level: LogLevel, message: string, data?: unknown) {
    const props =
      data && typeof data === "object"
        ? (data as Record<string, unknown>)
        : { data };
    if (level === "info") this.logger.info(message, props);
    else if (level === "warn") this.logger.warn(message, props);
    else if (level === "error") this.logger.error(message, props);
  }

  async teardown() {
    await reset();
  }
}

// Note: logtape doesn't have a built-in JSON mode

export const adapters = [new LogtapeAdapter()];
