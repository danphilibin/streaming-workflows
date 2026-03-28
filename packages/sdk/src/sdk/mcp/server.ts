import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallResponseResult } from "../../isomorphic/messages";
import {
  registerRelayTools,
  type WorkflowInfo,
  type RelayMcpBackend,
} from "./tools";

export type CreateRelayMcpServerOptions = {
  /** Base URL for the Relay API (e.g. "http://localhost:8787") */
  apiUrl: string;
  /** Shared secret for authenticating with the worker (RELAY_API_SECRET). */
  apiSecret?: string;
  /** MCP server name (default: "relay") */
  name?: string;
  /** MCP server version (default: "0.1.0") */
  version?: string;
};

// ── Relay API client ─────────────────────────────────────────────

/** Parse a JSON response, throwing a descriptive error for non-OK statuses. */
async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // The worker returns JSON `{ error: "..." }` for known errors.
    // Fall back to the raw body (truncated) for unexpected HTML error pages.
    const body = await res.text().catch(() => "");
    let message: string;
    try {
      const parsed = JSON.parse(body) as { error?: string };
      message = parsed.error || body.slice(0, 200);
    } catch {
      message = body.slice(0, 200) || `${res.status} ${res.statusText}`;
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

function createApiClient(apiUrl: string, apiSecret?: string): RelayMcpBackend {
  // Build base headers — when apiSecret is set, include it as a raw Bearer
  // token (no JWT minting needed for MCP/CLI, the worker accepts raw keys).
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiSecret) {
    baseHeaders["Authorization"] = `Bearer ${apiSecret}`;
  }

  return {
    async listWorkflows(): Promise<WorkflowInfo[]> {
      const res = await fetch(`${apiUrl}/workflows`, { headers: baseHeaders });
      const data = await jsonOrThrow<{
        workflows: (WorkflowInfo & { mcp?: boolean })[];
      }>(res);
      return data.workflows.filter((w) => w.mcp === true);
    },

    async startWorkflow(
      slug: string,
      data?: Record<string, unknown>,
    ): Promise<CallResponseResult> {
      const res = await fetch(`${apiUrl}/api/run`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ workflow: slug, data }),
      });
      return jsonOrThrow<CallResponseResult>(res);
    },

    async respondToWorkflow(
      runId: string,
      event: string,
      data: Record<string, unknown>,
    ): Promise<CallResponseResult> {
      const res = await fetch(`${apiUrl}/api/run/${runId}/respond`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ event, data }),
      });
      return jsonOrThrow<CallResponseResult>(res);
    },
  };
}

/**
 * Standalone MCP server for running locally (e.g. connecting Claude Desktop
 * to a running Relay instance). Talks to the Relay API over HTTP and
 * communicates with the MCP client over stdio. For the hosted Cloudflare
 * variant, see cf-mcp-agent.ts.
 */
export function createRelayMcpServer(options: CreateRelayMcpServerOptions) {
  const { apiUrl, apiSecret, name = "relay", version = "0.1.0" } = options;

  const server = new McpServer({ name, version });

  return {
    async start() {
      await registerRelayTools(server, createApiClient(apiUrl, apiSecret));
      const transport = new StdioServerTransport();
      await server.connect(transport);
    },
  };
}
