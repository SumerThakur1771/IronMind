// Minimal structured logger. Emits a single-line JSON object so logs are
// greppable/queryable in Vercel and any log drain.

import { randomUUID } from "crypto";

/** Generate a request id to correlate logs for a single request. */
export function newRequestId(): string {
  return randomUUID();
}

type LogFields = Record<string, unknown>;

function emit(level: "info" | "warn" | "error", fields: LogFields) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** Log a handled error with its route and request id. */
export function logError(
  route: string,
  error: unknown,
  requestId?: string,
): void {
  emit("error", {
    route,
    requestId,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

/** Log an informational event. */
export function logInfo(
  route: string,
  message: string,
  requestId?: string,
  extra?: LogFields,
): void {
  emit("info", { route, requestId, message, ...extra });
}
