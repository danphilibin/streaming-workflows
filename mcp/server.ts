/**
 * MCP server entrypoint.
 *
 * Usage:
 *   RELAY_WORKER_URL=http://localhost:8787 npx tsx mcp/server.ts
 */

import { createRelayMcpServer } from "relay-sdk/mcp";

const server = createRelayMcpServer({
  apiUrl: process.env.RELAY_WORKER_URL || "http://localhost:8787",
  apiSecret: process.env.RELAY_API_SECRET,
});

server.start().catch(console.error);
