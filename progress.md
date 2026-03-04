# Progress Log

## First-class MCP call log per workflow run (R-54)

Added a dedicated MCP call log data channel to the per-run Durable Object. When agent tool calls happen (via MCP or HTTP call-response API), the formatted text returned to the agent is captured and stored separately from the message stream. The DevConsole now has a Stream/MCP mode toggle — MCP mode shows exactly what an MCP agent received for each tool call, with timestamps and character counts.

Changes:

- `McpCallLogEntry` type in `mcp-translation.ts`
- `POST /mcp-log` and `GET /mcp-log` endpoints on `RelayDurableObject`
- `startWorkflowRun` and `respondToWorkflowRun` write log entries after computing results
- `GET /workflows/:id/mcp-log` HTTP route
- DevConsole: Stream/MCP mode toggle, MCP log fetch and rendering
