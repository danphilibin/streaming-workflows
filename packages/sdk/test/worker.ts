/**
 * Minimal worker entrypoint for tests.
 * Exports the Durable Object classes so miniflare can instantiate them.
 */
export { RelayExecutor } from "../src/sdk/cf-executor";

export default {
  fetch: () => new Response("test worker"),
};
