/**
 * Auth is optional at the app level — it's enabled when WorkOS
 * environment variables are configured, disabled otherwise.
 *
 * This lets the app run without authentication in local dev
 * while enforcing it in deployed environments.
 */

/** Whether WorkOS auth is configured. Safe to call on the server only. */
export function isAuthEnabled(): boolean {
  try {
    return !!globalThis?.process?.env?.WORKOS_CLIENT_ID;
  } catch {
    return false;
  }
}
