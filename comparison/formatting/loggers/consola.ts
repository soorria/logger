import { createConsola } from "consola";
import { BaseLoggerAdapter, type LogLevel } from "../types.js";

class ConsolaAdapter extends BaseLoggerAdapter {
  name = "consola";
  private logger!: ReturnType<typeof createConsola>;

  setup() {
    this.logger = createConsola();
  }

  log(level: LogLevel, message: string, data?: unknown) {
    if (level === "info") this.logger.info(message, data);
    else if (level === "warn") this.logger.warn(message, data);
    else if (level === "error") this.logger.error(message, data);
  }
}

// Note: consola doesn't have a built-in JSON mode

export const adapters = [new ConsolaAdapter()];
