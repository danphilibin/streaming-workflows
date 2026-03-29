import { env as cfEnv } from "cloudflare:workers";

// Values are set via `wrangler secret put` or the Cloudflare dashboard.
type RelayWebEnv = {
  // URL of the Relay worker backend.
  VITE_RELAY_WORKER_URL: string;

  // WorkOS AuthKit — when absent, auth is disabled (local dev).
  WORKOS_CLIENT_ID?: string;
  WORKOS_API_KEY?: string;
  WORKOS_REDIRECT_URI?: string;
  WORKOS_COOKIE_PASSWORD?: string;

  // Relay worker auth — when absent, browser→worker requests skip auth.
  RELAY_SIGNING_KEY?: string;
};

export const env = cfEnv as RelayWebEnv;
