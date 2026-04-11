import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/sdk/index.ts",
    client: "src/sdk/client.ts",
    mcp: "src/sdk/mcp/server.ts",
  },
  format: "esm",
  dts: true,
  outDir: "dist",
  clean: true,
  // These are provided by the Cloudflare Workers runtime or the consumer's
  // own node_modules — they must not be bundled into the output.
  external: [
    "cloudflare:workers",
    "agents",
    "agents/mcp",
    "@modelcontextprotocol/sdk",
    "@modelcontextprotocol/sdk/server/mcp.js",
    "@modelcontextprotocol/sdk/server/stdio.js",
    "@tsndr/cloudflare-worker-jwt",
    "zod",
  ],
});
