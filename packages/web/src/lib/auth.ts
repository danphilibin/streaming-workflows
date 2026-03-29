/**
 * Auth gate exposed as server functions so they can be called from
 * isomorphic route loaders without leaking server-only imports
 * (cloudflare:workers, WorkOS SDK) into the client bundle.
 *
 * Imports are dynamic to avoid pulling env.server.ts into the
 * client module graph (which triggers import-protection).
 */
import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

/**
 * Returns whether auth is enabled for this deployment. The client
 * uses this to conditionally render the AuthKitProvider and auth UI.
 */
export const getAuthConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    const { env } = await import("../env.server");
    return { authEnabled: !!env.WORKOS_CLIENT_ID };
  },
);

/**
 * Checks auth and redirects to sign-in if needed.
 * No-ops when WorkOS is not configured (local dev / open access).
 */
export const requireAuth = createServerFn({ method: "GET" }).handler(
  async () => {
    const { env } = await import("../env.server");
    if (!env.WORKOS_CLIENT_ID) return;

    const { getAuth, getSignInUrl } =
      await import("@workos/authkit-tanstack-react-start");
    const { user } = await getAuth();

    if (!user) {
      const signInUrl = await getSignInUrl();
      throw redirect({ href: signInUrl });
    }
  },
);
