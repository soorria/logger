import type { LoggerAdapter } from "./types.js";

// Test fixtures
function createDeepObject(depth: number): object {
  if (depth === 0) return { leaf: "value" };
  return { level: depth, nested: createDeepObject(depth - 1) };
}

function createCircularObject(): object {
  const obj: Record<string, unknown> = { name: "circular" };
  obj.self = obj;
  return obj;
}

function createErrorWithCauses(): Error {
  const root = new Error("Root cause");
  const middle = new Error("Middle error", { cause: root });
  const top = new Error("Top level error", { cause: middle });
  return top;
}

// Custom error class with additional properties
class CustomError extends Error {
  code: string;
  statusCode: number;
  attributes: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    attributes: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "CustomError";
    this.code = code;
    this.statusCode = statusCode;
    this.attributes = attributes;
  }
}

function createErrorWithAssignedProps(): Error {
  const error = new Error("Database connection failed");
  (error as any).code = "ECONNREFUSED";
  (error as any).host = "localhost";
  (error as any).port = 5432;
  (error as any).retryable = true;
  return error;
}

interface TestCaseDefinition {
  name: string;
  run: (adapter: LoggerAdapter) => void;
}

export interface TestCase extends TestCaseDefinition {
  id: number;
}

const testCaseDefinitions: TestCaseDefinition[] = [
  {
    name: "Standard structured logging",
    run: (adapter: LoggerAdapter) => {
      adapter.log("info", "User logged in", {
        userId: 123,
        username: "alice",
        roles: ["admin", "user"],
        metadata: { ip: "192.168.1.1", userAgent: "Mozilla/5.0" },
      });
    },
  },
  {
    name: "Error logging",
    run: (adapter: LoggerAdapter) => {
      const error = new Error("Something went wrong");
      adapter.log("error", "An error occurred", { error });
    },
  },
  {
    name: "Error causes (3 levels)",
    run: (adapter: LoggerAdapter) => {
      const error = createErrorWithCauses();
      adapter.log("error", "Error with cause chain", { error });
    },
  },
  {
    name: "Error subclass with properties",
    run: (adapter: LoggerAdapter) => {
      const error = new CustomError(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { field: "email", reason: "invalid format", value: "not-an-email" },
      );
      adapter.log("error", "Custom error with properties", { error });
    },
  },
  {
    name: "Error with assigned properties",
    run: (adapter: LoggerAdapter) => {
      const error = createErrorWithAssignedProps();
      adapter.log("error", "Error with dynamically assigned props", { error });
    },
  },
  {
    name: "Circular objects",
    run: (adapter: LoggerAdapter) => {
      const circular = createCircularObject();
      adapter.log("info", "Circular reference", { data: circular });
    },
  },
  {
    name: "Undefined values",
    run: (adapter: LoggerAdapter) => {
      adapter.log("info", "Object with undefined", {
        defined: "value",
        notDefined: undefined,
        nested: { also: undefined, present: true },
      });
    },
  },
  {
    name: "BigInt values",
    run: (adapter: LoggerAdapter) => {
      adapter.log("info", "BigInt test", {
        bigNumber: BigInt("9007199254740993"),
        normalNumber: 42,
      });
    },
  },
  {
    name: "Symbol values",
    run: (adapter: LoggerAdapter) => {
      adapter.log("info", "Symbol test", {
        sym: Symbol("mySymbol"),
        symFor: Symbol.for("globalSymbol"),
        normal: "string",
      });
    },
  },
  {
    name: "Date objects",
    run: (adapter: LoggerAdapter) => {
      adapter.log("info", "Date test", {
        now: new Date("2024-01-15T10:30:00Z"),
        epoch: new Date(0),
      });
    },
  },
  {
    name: "Map and Set",
    run: (adapter: LoggerAdapter) => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      const set = new Set([1, 2, 3]);
      adapter.log("info", "Map and Set test", { map, set });
    },
  },
  {
    name: "NaN and Infinity",
    run: (adapter: LoggerAdapter) => {
      adapter.log("info", "Special numbers", {
        nan: NaN,
        positiveInfinity: Infinity,
        negativeInfinity: -Infinity,
        normal: 42,
      });
    },
  },
  {
    name: "Deeply nested objects",
    run: (adapter: LoggerAdapter) => {
      const deep = createDeepObject(3);
      adapter.log("info", "Deep nesting test", { data: deep });
    },
  },
];

// Generate IDs from array index (1-based)
export const testCases: TestCase[] = testCaseDefinitions.map((tc, i) => ({
  ...tc,
  id: i + 1,
}));

export interface RunOptions {
  caseIds?: number[];
}

export async function runTestSuite(
  adapter: LoggerAdapter,
  options: RunOptions = {},
): Promise<void> {
  const { caseIds } = options;
  const casesToRun = caseIds
    ? testCases.filter((tc) => caseIds.includes(tc.id))
    : testCases;

  const W = 70;
  console.log(`\n${"═".repeat(W)}`);
  console.log(`  ${adapter.name.toUpperCase()}`);
  console.log(`${"═".repeat(W)}\n`);

  await adapter.setup();

  for (let i = 0; i < casesToRun.length; i++) {
    const testCase = casesToRun[i];
    const label = `${testCase.id}. ${testCase.name}`;
    console.log(`┌─ ${label} ${"─".repeat(W - label.length - 5)}┐`);
    try {
      testCase.run(adapter);
    } catch (err) {
      console.log(`[CRASHED] ${err}`);
    }
    console.log(`└${"─".repeat(W - 2)}┘`);
    if (i < casesToRun.length - 1) {
      console.log("");
    }
  }

  await adapter.teardown?.();
}

export function listTestCases(): void {
  console.log("\nAvailable test cases:\n");
  for (const tc of testCases) {
    console.log(`  ${tc.id.toString().padStart(2)}. ${tc.name}`);
  }
  console.log("");
}
