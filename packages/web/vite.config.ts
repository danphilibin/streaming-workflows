import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => {
  // Allow overriding the worker URL for e2e tests (e.g., port 8788)
  const workerUrl = process.env.RELAY_WORKER_URL ?? "http://localhost:8787";

  return {
    plugins: [
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      tanstackStart(),
      tailwindcss(),
      viteReact(),
      tsconfigPaths({
        skip: (dir) => dir.includes("opensrc"),
      }),
    ],
    server: {
      proxy: {
        "/stream": workerUrl,
        "/workflows": workerUrl,
      },
    },
    build: {
      reportCompressedSize: false,
    },
    logLevel: command === "build" ? "warn" : "info",
  };
});
