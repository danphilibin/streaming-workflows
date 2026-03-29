/**
 * Auth is optional at the app level — it's enabled when WorkOS
 * environment variables are configured, disabled otherwise.
 *
 * This lets the app run without authentication in local dev
 * while enforcing it in deployed environments.
 */
import { env } from "../env";

export function isAuthEnabled(): boolean {
  return !!env.WORKOS_CLIENT_ID;
}
