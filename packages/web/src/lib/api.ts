// In dev, falls back to empty string so requests use relative paths (handled by Vite proxy).
// In production, VITE_RELAY_WORKER_URL is set in .env.production and baked into the build.
const configuredApiUrl = (import.meta.env.VITE_RELAY_WORKER_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

export function apiPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return configuredApiUrl
    ? `${configuredApiUrl}/${normalizedPath}`
    : `/${normalizedPath}`;
}
