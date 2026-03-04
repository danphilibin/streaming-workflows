import type { CallResponseResult } from "../isomorphic/messages";
import { createDebugMessage } from "../isomorphic/messages";

type McpAction = "start" | "respond";

interface McpLogContext {
  env: Env;
  runId: string;
}

export function logMcpToolResult(
  result: CallResponseResult,
  formattedText: string,
  action: McpAction,
  ctx?: McpLogContext,
): void {
  const outputChars = formattedText.length;

  const data: Record<string, unknown> = {
    workflow_slug: result.workflow_slug,
    run_id: result.run_id,
    action,
    status: result.status,
    message_count: result.messages.length,
    output_chars: outputChars,
    token_estimate: Math.ceil(outputChars / 4),
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify({ type: "mcp_tool_result", ...data }));

  if (ctx) {
    const stub = ctx.env.RELAY_DURABLE_OBJECT.getByName(ctx.runId);
    const message = createDebugMessage(
      `debug-mcp-${Date.now()}`,
      "mcp_tool_result",
      data,
    );
    stub
      .fetch("http://internal/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      .catch(() => {
        // Best-effort — don't break the tool response if logging fails
      });
  }
}
