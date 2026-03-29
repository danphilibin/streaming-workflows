/**
 * Server function that mints short-lived JWTs for authenticating
 * browser requests to the Relay worker. The client calls this function
 * to get a token, then attaches it to direct worker API calls.
 *
 * In local dev with no signing key configured, returns null (auth is skipped).
 */
import { createServerFn } from "@tanstack/react-start";

export const getToken = createServerFn({ method: "GET" }).handler(async () => {
  const { env } = await import("../env.server");

  if (env.WORKOS_CLIENT_ID) {
    const { getAuth } = await import("@workos/authkit-tanstack-react-start");
    const { user } = await getAuth();
    if (!user) throw new Error("Unauthorized");
  }

  const signingKey = env.RELAY_SIGNING_KEY;
  if (!signingKey) return null;

  const jwt = (await import("@tsndr/cloudflare-worker-jwt")).default;
  return await jwt.sign(
    {
      iss: "relay-web",
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    },
    signingKey,
  );
});
