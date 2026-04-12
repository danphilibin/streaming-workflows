import { describe, it, expect } from "vitest";
import { env } from "cloudflare:workers";
import { registerWorkflow, getWorkflow } from "../src/sdk/registry";
import { httpHandler } from "../src/sdk/cf-http";
import { getExecutor, postToStub } from "./helpers";

/**
 * Register minimal test workflows once. The registry is module-scoped
 * so these are visible to the RelayExecutor DO when it calls getWorkflow().
 */

// Simple workflow: no input, calls step.do once, completes immediately.
if (!getWorkflow("simple-test")) {
  registerWorkflow({
    title: "Simple Test",
    handler: async ({ step }) => {
      await step.do("greet", async () => "hello");
    },
  });
}

// Input workflow: requires upfront input, then completes.
if (!getWorkflow("input-test")) {
  registerWorkflow({
    title: "Input Test",
    handler: async (ctx) => {
      await ctx.step.do("echo", async () => (ctx as any).data);
    },
    // schema — single text field
    input: { name: { type: "text", label: "Name" } },
  });
}

describe("RelayExecutor", () => {
  describe("simple workflow (no input)", () => {
    it("completes on /start and emits workflow_complete", async () => {
      const stub = getExecutor("simple-run");

      const result = await postToStub(stub, "/start", {
        slug: "simple-test",
        runId: "simple-run",
      });

      expect(result.status).toBe("complete");
      expect(result.messages.length).toBeGreaterThan(0);

      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage.type).toBe("workflow_complete");
    });
  });

  describe("workflow with input (suspend / resume)", () => {
    it("suspends on /start then completes on /event", async () => {
      const stub = getExecutor("input-run");

      // Start should suspend — waiting for upfront input
      const startResult = await postToStub(stub, "/start", {
        slug: "input-test",
        runId: "input-run",
      });

      expect(startResult.status).toBe("suspended");
      expect(startResult.pendingEvent).toBeDefined();

      // The pending event is the input event name the DO is waiting for
      const eventName = startResult.pendingEvent!;

      // There should be an input_request message in the stream
      const inputRequest = startResult.messages.find(
        (m) => m.type === "input_request",
      );
      expect(inputRequest).toBeDefined();

      // Deliver the input event
      const resumeResult = await postToStub(stub, `/event/${eventName}`, {
        name: "Alice",
      });

      expect(resumeResult.status).toBe("complete");

      const lastMessage =
        resumeResult.messages[resumeResult.messages.length - 1];
      expect(lastMessage.type).toBe("workflow_complete");
    });

    it("completes immediately when prefilled data is provided", async () => {
      const stub = getExecutor("prefilled-run");

      const result = await postToStub(stub, "/start", {
        slug: "input-test",
        runId: "prefilled-run",
        data: { name: "Bob" },
      });

      expect(result.status).toBe("complete");

      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage.type).toBe("workflow_complete");
    });
  });
});

describe("httpHandler", () => {
  it("requires auth before routing MCP requests when auth is configured", async () => {
    const response = await httpHandler(
      new Request("http://relay.test/mcp"),
      {
        ...(env as unknown as Env),
        RELAY_API_KEY: "test-api-key",
        // The guard must run before RelayMcpAgent.serve(), so a truthy stub is
        // enough to catch accidental auth bypasses without opening a real MCP DO.
        RELAY_MCP_AGENT: {} as DurableObjectNamespace,
      },
      {
        waitUntil() {},
        passThroughOnException() {},
      } as unknown as ExecutionContext,
    );

    expect(response.status).toBe(401);
  });
});
