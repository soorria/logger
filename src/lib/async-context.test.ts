import { describe, expect, it } from "vitest";

import {
  getLogContext,
  mutateContextScope,
  runWithContext,
} from "./async-context.js";

describe("async-context", () => {
  describe(getLogContext, () => {
    it("returns undefined when no context is set", () => {
      const context = getLogContext();
      expect(context).toBeUndefined();
    });
  });

  describe(runWithContext, () => {
    it("provides context within the async function", async () => {
      const context = await runWithContext(
        { requestId: "req-789" },
        async () => {
          return getLogContext();
        },
      );

      expect(context).toMatchObject({
        requestId: "req-789",
      });
    });

    it("merges parent and child context", async () => {
      const context = await runWithContext(
        { requestId: "req-123" },
        async () => {
          return runWithContext({ jobId: "job-456" }, async () => {
            return getLogContext();
          });
        },
      );

      expect(context).toMatchObject({
        requestId: "req-123",
        jobId: "job-456",
      });
    });

    it("merges scope objects correctly", async () => {
      const context = await runWithContext(
        { userId: "user123", action: "banana" },
        async () => {
          return await runWithContext({ action: "login" }, async () => {
            return getLogContext();
          });
        },
      );

      expect(context).toMatchObject({
        userId: "user123",
        action: "login",
      });
    });
  });

  describe(mutateContextScope, () => {
    it("adds scope to existing context", async () => {
      const context = await runWithContext(
        { requestId: "req-123" },
        async () => {
          mutateContextScope({ userId: "user456" });

          return getLogContext();
        },
      );

      expect(context).toMatchObject({
        requestId: "req-123",
        userId: "user456",
      });
    });

    it("does nothing when no context exists", () => {
      expect(() => {
        mutateContextScope({ userId: "user123" });
      }).not.toThrow();
    });
  });
});
