import type { CallResponseResult } from "../isomorphic/messages";

type McpAction = "start" | "respond";

export function logMcpToolResult(
  result: CallResponseResult,
  formattedText: string,
  action: McpAction,
): void {
  const outputChars = formattedText.length;

  console.log(
    JSON.stringify({
      type: "mcp_tool_result",
      workflow_slug: result.workflow_slug,
      run_id: result.run_id,
      action,
      status: result.status,
      message_count: result.messages.length,
      output_chars: outputChars,
      token_estimate: Math.ceil(outputChars / 4),
      timestamp: new Date().toISOString(),
    }),
  );
}
