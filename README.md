# @soorria/logger

Opinionated structured logging for Node.js with optional async context support.

[![xkcd: Standards](https://imgs.xkcd.com/comics/standards.png)](https://xkcd.com/927/)

## Features

- **Structured JSON logging** - Machine-readable logs for production
- **Pretty formatting** - Human-readable colored output for development
- **Async context tracking** - Automatically attach request IDs, job IDs, etc. to all logs within a context
- **Child loggers** - Create scoped loggers with additional metadata

## Installation

```bash
pnpm add @soorria/logger
```

## Quick Start

```typescript
import { Logger } from "@soorria/logger";
import { getDefaultConfig } from "@soorria/logger/default-config";

const logger = new Logger({
  ...getDefaultConfig({ production: process.env.NODE_ENV === "production" }),
});

logger.info("Hello world");
logger.error("Something went wrong", { userId: 123 });
```

## Formatters

### JSON Formatter

Outputs structured JSON, ideal for production environments and log aggregation services.

```typescript
import { JsonLogFormatter } from "@soorria/logger/json";

// Compact output (single line per log)
const formatter = new JsonLogFormatter({ compact: true });

// Pretty JSON (multi-line, for debugging)
const formatter = new JsonLogFormatter({ compact: false });
```

### Pretty Formatter

Colorful, human-readable output for local development.

```typescript
import { PrettyLogFormatter } from "@soorria/logger/pretty";

const formatter = new PrettyLogFormatter({ colors: true });
```

## Default Configuration

Use the built-in helper to get sensible defaults based on environment:

```typescript
import { Logger } from "@soorria/logger";
import { getDefaultConfig } from "@soorria/logger/default-config";

const logger = new Logger({
  ...getDefaultConfig({ production: process.env.NODE_ENV === "production" }),
});
```

This uses:

- **Production**: Compact JSON formatter
- **Development**: Pretty colored formatter

## Async Context

Automatically attach contextual information (like request IDs) to all logs within an async scope:

```typescript
import { Logger } from "@soorria/logger";
import { getLogContext, runWithContext } from "@soorria/logger/async-context";
import { getDefaultConfig } from "@soorria/logger/default-config";

const logger = new Logger({
  ...getDefaultConfig({ production: false }),
  getLogContext,
});

// In your request handler
runWithContext({ requestId: "abc-123" }, () => {
  logger.info("Processing request"); // Includes requestId in output
  doSomething();
});

function doSomething() {
  // Context is automatically available
  logger.info("Doing something"); // Also includes requestId
}
```

### Mutating Context

Add additional context within a scope:

```typescript
import { mutateContextScope } from "@soorria/logger/async-context";

runWithContext({ requestId: "abc-123" }, () => {
  // Later in the request...
  mutateContextScope({ userId: "user-456" });

  logger.info("User action"); // Includes both requestId and userId
});
```

## Child Loggers

Create loggers with additional scope attached to every log:

```typescript
const logger = new Logger({
  /* config */
});

const userLogger = logger.child({ module: "users" });
userLogger.info("User created"); // Includes module: "users"

const specificLogger = userLogger.child({ userId: 123 });
specificLogger.info("Password changed"); // Includes module and userId
```

## Log Levels

Available log levels (in order of severity):

```typescript
logger.debug("Detailed debugging info");
logger.info("General information");
logger.warn("Warning messages");
logger.error("Error messages");
logger.fatal("Critical errors");
logger.silent(); // No output
```

Configure minimum log level:

```typescript
import { Logger, LogLevel } from "@soorria/logger";

const logger = new Logger({
  logLevel: LogLevel.warn, // Only warn, error, fatal will be logged
  // or
  logLevel: "warn", // String version also works
  // ...
  logLevel: process.env.LOG_LEVEL,
});
```

## Error Handling

Errors are automatically serialized with stack traces and causes:

```typescript
try {
  throw new Error("Something broke", { cause: new Error("Root cause") });
} catch (error) {
  logger.error("Operation failed", error);
}
```

## Exports

| Export                           | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| `@soorria/logger`                | Core `Logger` class and types                           |
| `@soorria/logger/json`           | `JsonLogFormatter`                                      |
| `@soorria/logger/pretty`         | `PrettyLogFormatter`                                    |
| `@soorria/logger/console`        | `ConsoleTransport`                                      |
| `@soorria/logger/async-context`  | `runWithContext`, `getLogContext`, `mutateContextScope` |
| `@soorria/logger/default-config` | `getDefaultConfig` helper                               |

## License

MIT
