// Augment Cloudflare.Env so that `import { env } from "cloudflare:workers"`
// is correctly typed in tests. Mirrors the global Env from src/sdk/env.d.ts.
declare namespace Cloudflare {
  interface Env {
    RELAY_EXECUTOR: DurableObjectNamespace;
    RELAY_APP_URL: string;
    RELAY_MCP_AGENT?: DurableObjectNamespace;
  }
}
