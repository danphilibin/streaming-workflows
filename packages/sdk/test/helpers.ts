import { env } from "cloudflare:workers";
import type { ExecutionResult } from "../src/sdk/cf-executor";

/**
 * Get an executor DO stub for a given run ID.
 * Wraps the idFromName + get boilerplate that every test needs.
 */
export function getExecutor(runId: string): DurableObjectStub {
  return env.RELAY_EXECUTOR.get(env.RELAY_EXECUTOR.idFromName(runId));
}

/**
 * POST JSON to a DO stub endpoint and parse the typed response.
 */
export async function postToStub(
  stub: DurableObjectStub,
  path: string,
  body: unknown,
): Promise<ExecutionResult> {
  const res = await stub.fetch(
    new Request(`http://do${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return res.json<ExecutionResult>();
}
