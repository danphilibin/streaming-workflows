/**
 * Environment bindings expected by the Relay SDK.
 * Users provide these via their wrangler.jsonc configuration.
 */
interface Env {
  RELAY_EXECUTOR: DurableObjectNamespace;
  RELAY_APP_URL: string;
  RELAY_MCP_AGENT?: DurableObjectNamespace;
  /** Shared secret for JWT auth. When set, all requests must include a valid Bearer token. */
  RELAY_API_SECRET?: string;
}
