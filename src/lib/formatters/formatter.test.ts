import { ClientRequest } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DefaultLogFormatter, errorToObject } from "./formatter.js";

describe(DefaultLogFormatter, () => {
  const formatter = new DefaultLogFormatter();
  describe(DefaultLogFormatter.prototype.formatLogData, () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("formats strings correctly", () => {
      const result = formatter.formatLogData("test string");
      expect(result).toBe("test string");
    });

    it("formats numbers correctly", () => {
      const result = formatter.formatLogData(42);
      expect(result).toBe("42");
    });

    it("formats objects as JSON without space in prod", () => {
      vi.stubEnv("NODE_ENV", "production");
      const obj = { key: "value", number: 123 };
      const result = new DefaultLogFormatter().formatLogData(obj);
      expect(result).toBe('{"key":"value","number":123}');
    });

    it("formats with development formatting", () => {
      const obj = { key: "value", nested: { inner: "data" } };
      const result = formatter.formatLogData(obj);
      expect(result).toContain("  "); // Should have indentation
      expect(JSON.parse(result)).toEqual(obj);
    });

    it("handles bigint values", () => {
      const obj = { bigNumber: BigInt(123456789) };
      const result = formatter.formatLogData(obj);
      const parsed = JSON.parse(result);
      expect(parsed.bigNumber).toBe("123456789");
    });

    it("handles RegExp values", () => {
      const obj = { pattern: /test/gi };
      const result = formatter.formatLogData(obj);
      const parsed = JSON.parse(result);
      expect(parsed.pattern).toBe("Regexp { /test/gi }");
    });

    it("handles undefined values", () => {
      const obj = { value: undefined };
      const result = formatter.formatLogData(obj);
      const parsed = JSON.parse(result);
      expect(parsed.value).toBe("FakeValue { undefined }");
    });

    it("handles Error values", () => {
      const error = new Error("test error");
      const obj = { error };
      const result = formatter.formatLogData(obj);
      const parsed = JSON.parse(result);
      expect(parsed.error.name).toBe("Error");
      expect(parsed.error.message).toBe("test error");
    });

    describe("JSON.stringify error handling", () => {
      it("handles circular references by falling back to inspect", () => {
        const obj: Record<string, unknown> = { name: "test" };
        obj.self = obj;

        const result = formatter.formatLogData(obj);

        expect(result).toEqual(
          `
<ref *1> {
  name: 'test',
  self: [Circular *1]
}
`.trim(),
        );
      });

      it("handles deeply nested circular references", () => {
        const parent: Record<string, unknown> = { name: "parent" };
        const child: Record<string, unknown> = { name: "child", parent };
        parent.child = child;

        const result = formatter.formatLogData(parent);

        expect(result).toEqual(
          `
<ref *1> {
  name: 'parent',
  child: {
    name: 'child',
    parent: [Circular *1]
  }
}
`.trim(),
        );
      });

      it("uses compact inspect format in production", () => {
        vi.stubEnv("NODE_ENV", "production");
        const obj: Record<string, unknown> = { name: "test" };
        obj.self = obj;

        const result = new DefaultLogFormatter().formatLogData(obj);

        expect(result).toEqual(
          "<ref *1> { name: 'test', self: [Circular *1] }",
        );
      });

      it("handles objects with getter that throws", () => {
        const obj = {
          normal: "value",
          get problematic() {
            throw new Error("getter error");
          },
        };

        const result = formatter.formatLogData(obj);

        expect(result).toEqual(
          `
{
  normal: 'value',
  problematic: [Getter]
}
`.trim(),
        );
      });

      it("handles objects with non-serializable functions", () => {
        const obj = {
          name: "test",
          method: function testMethod() {
            return "hello";
          },
          arrow: () => "world",
        };
        Object.assign(obj, { self: obj });

        const result = formatter.formatLogData(obj);

        expect(result).toEqual(
          `
<ref *1> {
  name: 'test',
  method: [Function: testMethod],
  arrow: [Function: arrow],
  self: [Circular *1]
}
`.trim(),
        );
      });

      it("handles mixed circular and serializable content", () => {
        const serializablePart = {
          data: "serializable",
          number: 42,
          nested: { deep: "value" },
        };
        const obj: Record<string, unknown> = {
          ...serializablePart,
          name: "root",
        };
        obj.circular = obj;

        const result = formatter.formatLogData(obj);

        expect(result).toEqual(
          `
<ref *1> {
  data: 'serializable',
  number: 42,
  nested: {
    deep: 'value'
  },
  name: 'root',
  circular: [Circular *1]
}
`.trim(),
        );
      });

      it("fallback to inspect when JSON.stringify fails due to other reasons", () => {
        const obj = {
          normal: "value",
        };

        const spy = vi.spyOn(JSON, "stringify").mockImplementation(() => {
          throw new Error("JSON.stringify failed");
        });

        try {
          const result = formatter.formatLogData(obj);
          expect(result).toEqual("{\n  normal: 'value'\n}");
        } finally {
          spy.mockRestore();
        }
      });

      it("should handle IncomingMessage objects", () => {
        const errorSimilarToOneThatWeProbablyTriedToLog =
          new (class extends Error {
            constructor(readonly request: ClientRequest) {
              super("bruh");
            }
          })(
            new ClientRequest(
              new URL("http://soorria.com/posts/mongo-minefield"),
            ),
          );

        expect(() =>
          formatter.formatLogData({
            error: errorSimilarToOneThatWeProbablyTriedToLog,
          }),
        ).not.toThrow();
      });
    });
  });

  describe("subclass", () => {
    it("can override formatLogData", () => {
      class CustomFormatter extends DefaultLogFormatter {
        formatLogData(arg: unknown): string {
          return super.formatLogData(arg) + " custom";
        }
      }

      const formatter = new CustomFormatter();

      const result = formatter.formatLogData("test string");
      expect(result).toBe("test string custom");
    });
  });
});

describe(errorToObject, () => {
  const formatter = new DefaultLogFormatter();
  it("converts error to object", () => {
    const error = new Error("test error");
    const result = errorToObject(error, formatter);

    expect(result.name).toBe("Error");
    expect(result.message).toBe("test error");
    expect(result.stack).toBeDefined();
  });

  it("handles error with cause", () => {
    const causeError = new Error("cause error");
    const error = new Error("main error", {
      cause: causeError,
    });

    const result = errorToObject(error, formatter);

    expect(result.name).toBe("Error");
    expect(result.message).toBe("main error");
    expect(result.cause).toBeDefined();
    expect((result.cause as Error).name).toBe("Error");
    expect((result.cause as Error).message).toBe("cause error");
  });

  it("handles non-error cause", () => {
    const error = new Error("main error", {
      cause: "string cause",
    });

    const result = errorToObject(error, formatter);

    expect(result.name).toBe("Error");
    expect(result.message).toBe("main error");
    expect(result.cause).toBe("string cause");
  });

  it("handles additional instance properties on custom errors", () => {
    const error = new (class extends Error {
      constructor(
        message: string,
        public customProperty: string,
      ) {
        super(message);
      }
    })("test error", "custom value");

    const result = errorToObject(error, formatter);

    expect(result.customProperty).toBe("custom value");
  });

  it("handles toJSON method", () => {
    const error = new (class extends Error {
      name = "NotCustomError";
      message = "not custom error";
      toJSON() {
        return { name: "CustomError", message: "custom error" };
      }
    })("test error");

    const result = errorToObject(error, formatter);

    expect(result.name).toBe("CustomError");
    expect(result.message).toBe("custom error");
  });
});

