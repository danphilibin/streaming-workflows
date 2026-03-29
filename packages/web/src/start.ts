import { createStart, createMiddleware } from "@tanstack/react-start";

// Wrap authkitMiddleware so it's only loaded (and validated) when
// WORKOS_CLIENT_ID is configured. Without this gate, authkitMiddleware
// eagerly validates WorkOS env vars and throws on startup.
const authGate = createMiddleware().server(async (opts) => {
  const { env } = await import("./env.server");

  if (!env.WORKOS_CLIENT_ID) {
    return opts.next();
  }

  // authkitMiddleware() returns createMiddleware().server(handler),
  // so ._serverFn holds the actual handler function.
  const { authkitMiddleware } =
    await import("@workos/authkit-tanstack-react-start");
  const workosHandler = (authkitMiddleware() as any).options.server;
  return workosHandler(opts);
});

export const startInstance = createStart(() => ({
  requestMiddleware: [authGate],
}));
