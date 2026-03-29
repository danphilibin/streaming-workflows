import { getToken } from "./token";

// In dev, falls back to empty string so requests use relative paths (handled by Vite proxy).
// In production, VITE_RELAY_WORKER_URL is set in .env.production and baked into the build.
const configuredApiUrl = (import.meta.env.VITE_RELAY_WORKER_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

function apiPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return configuredApiUrl
    ? `${configuredApiUrl}/${normalizedPath}`
    : `/${normalizedPath}`;
}

// ── App-to-worker auth token cache ────────────────────────────────
// This token is only for authorizing direct browser -> worker requests.
// It is not the user's dashboard/login session token.
//
// Keep it in memory only, refresh shortly before expiry, and avoid
// duplicate token fetches when several requests start at once.

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let inflightTokenPromise: Promise<string | null> | null = null;

function decodeJwtPayload(token: string): { exp?: number } | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function clearCachedToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

async function loadToken(): Promise<string | null> {
  if (!inflightTokenPromise) {
    inflightTokenPromise = getToken().finally(() => {
      inflightTokenPromise = null;
    });
  }

  return inflightTokenPromise;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const now = Date.now() / 1000;

  if (cachedToken && now < tokenExpiresAt - 60) {
    return { Authorization: `Bearer ${cachedToken}` };
  }

  const token = await loadToken();
  if (!token) {
    clearCachedToken();
    return {};
  }

  const payload = decodeJwtPayload(token);
  cachedToken = token;
  tokenExpiresAt = payload?.exp ?? now + 60;
  return { Authorization: `Bearer ${token}` };
}

function withAuthHeaders(
  init: RequestInit | undefined,
  authHeaders: Record<string, string>,
): RequestInit {
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }

  return {
    ...init,
    headers,
  };
}

/**
 * Fetch wrapper that handles API URL resolution and auth.
 * All worker API calls should go through this.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = apiPath(path);
  const authHeaders = await getAuthHeaders();

  let response = await fetch(url, withAuthHeaders(init, authHeaders));
  if (response.status !== 401 || !authHeaders.Authorization) {
    return response;
  }

  clearCachedToken();

  const refreshedAuthHeaders = await getAuthHeaders();
  response = await fetch(url, withAuthHeaders(init, refreshedAuthHeaders));
  return response;
}
