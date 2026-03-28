import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      // Isomorphic / pure-Node tests (existing)
      {
        test: {
          include: ["src/**/__tests__/**/*.test.ts"],
          name: "unit",
        },
      },
      // Worker tests — run inside miniflare with real DO storage
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: "./test/wrangler.jsonc" },
          }),
        ],
        test: {
          include: ["test/**/*.test.ts"],
          name: "workers",
        },
      },
    ],
  },
});
