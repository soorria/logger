import type { Roarr as RoarrType } from "roarr";
import type { JsonObject } from "roarr/dist/types.js";
import { BaseLoggerAdapter, type LogLevel } from "../types.js";

class RoarrAdapter extends BaseLoggerAdapter {
  name = "roarr";
  private Roarr!: typeof RoarrType;

  async setup() {
    // Roarr requires ROARR_LOG=true and a write function BEFORE import
    process.env.ROARR_LOG = "true";

    // Set up the global ROARR writer before importing
    (globalThis as any).ROARR = {
      write: (message: string) => {
        console.log(message);
      },
    };

    // Dynamic import after setup
    const roarrModule = await import("roarr");
    this.Roarr = roarrModule.Roarr;
  }

  log(level: LogLevel, message: string, data?: unknown) {
    const context =
      data && typeof data === "object" ? (data as JsonObject) : {};
    if (level === "info") this.Roarr.info(context, message);
    else if (level === "warn") this.Roarr.warn(context, message);
    else if (level === "error") this.Roarr.error(context, message);
  }
}

// Note: Roarr doesn't have built-in pretty printing
// Use `@roarr/cli` to pipe output: `pnpm format-test | roarr`

export const adapters = [new RoarrAdapter()];
