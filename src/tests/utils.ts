import type { MockInstance } from "vitest";

export function getParsedLoggedData(
  consoleSpy: MockInstance<typeof console.log>,
): unknown {
  const loggedData = consoleSpy.mock.calls[0]?.[0];
  if (!loggedData) {
    throw new Error("No logged data");
  }
  if (typeof loggedData !== "string") {
    throw new Error("logged data not string");
  }
  return JSON.parse(loggedData);
}
