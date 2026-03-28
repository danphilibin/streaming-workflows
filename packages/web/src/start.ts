import { createStart } from "@tanstack/react-start";
import { authkitMiddleware } from "@workos/authkit-tanstack-react-start";
import { isAuthEnabled } from "./lib/auth";

export const startInstance = createStart(() => ({
  // Only attach the WorkOS middleware when auth is configured.
  // Without the WORKOS_* env vars, the app runs unauthenticated.
  requestMiddleware: isAuthEnabled() ? [authkitMiddleware()] : [],
}));
