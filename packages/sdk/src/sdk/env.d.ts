/**
 * Environment bindings expected by the Relay SDK.
 * Users provide these via their wrangler.jsonc configuration.
 */
interface Env {
  RELAY_EXECUTOR: DurableObjectNamespace;
  RELAY_APP_URL: string;
  RELAY_MCP_AGENT?: DurableObjectNamespace;
  /** Secret used to sign/verify JWTs between the web app and worker. Never exposed to end users. */
  RELAY_SIGNING_KEY?: string;
  /** API key issued to MCP/CLI clients for direct bearer auth. Cannot be used to mint JWTs. */
  RELAY_API_KEY?: string;
}
