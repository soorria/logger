import { AsyncLocalStorage } from "async_hooks";

import type { LogContext } from "./types.js";

let storage: AsyncLocalStorage<LogContext> | undefined;
function getLogContextStorage(): AsyncLocalStorage<LogContext> {
  if (!storage) {
    storage = new AsyncLocalStorage<LogContext>();
  }
  return storage;
}

export function getLogContext(): LogContext | undefined {
  if (storage) {
    return storage.getStore();
  }
  return undefined;
}

/**
 * Run a function with additional log context.
 * - Merges with parent context to not lose track of e.g. request_id, unless intentionally overridden.
 */
export function runWithContext<T>(
  logContext: LogContext,
  handlerFn: () => T,
): T {
  const parentContext = getLogContext();
  const contextStore = getLogContextStorage();

  const mergedContext: LogContext = {
    ...(parentContext ?? {}),
    ...logContext,
  };

  return contextStore.run(mergedContext, handlerFn);
}

export function mutateContextScope(
  additionalScope: Record<string, string>,
): void {
  const currentContext = getLogContext();
  if (!currentContext) {
    return;
  }

  Object.assign(currentContext, additionalScope);
}
