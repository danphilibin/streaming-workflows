/**
 * Server function that mints short-lived JWTs for authenticating
 * browser requests to the Relay worker.
 *
 * The RELAY_API_SECRET lives only on the server (Cloudflare Worker env) —
 * it never reaches the client bundle. The client calls this function
 * to get a token, then attaches it to direct worker API calls.
 *
 * In local dev with no secret configured, returns null (auth is skipped).
 */
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import jwt from "@tsndr/cloudflare-worker-jwt";

interface WebEnv {
  RELAY_API_SECRET?: string;
}

export const getToken = createServerFn({ method: "GET" }).handler(async () => {
  const secret = (env as WebEnv).RELAY_API_SECRET;
  if (!secret) return null;

  return await jwt.sign(
    {
      iss: "relay-web",
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    },
    secret,
  );
});
