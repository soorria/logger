import { ConsoleTransport, LogLayer } from "loglayer";
import { BaseLoggerAdapter, type LogLevel } from "../types.js";

class LogLayerAdapter extends BaseLoggerAdapter {
  name = "loglayer";
  private logger!: LogLayer;

  setup() {
    this.logger = new LogLayer({
      transport: new ConsoleTransport({
        logger: console,
      }),
    });
  }

  log(level: LogLevel, message: string, data?: unknown) {
    if (data !== undefined) {
      this.logger.withMetadata(data as Record<string, unknown>)[level](message);
    } else {
      this.logger[level](message);
    }
  }
}

// Note: LogLayer uses console by default which provides pretty output
// The JSON output would require a custom serializer

export const adapters = [new LogLayerAdapter()];
