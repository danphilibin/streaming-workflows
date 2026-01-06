# Relay

A prototype app that pairs [Cloudflare Workflows](https://developers.cloudflare.com/workflows/) with [Durable Objects](https://developers.cloudflare.com/durable-objects/) to enable interactive backend functions that pause for user input, show progress, and stream UI instructions to the browser.

## How to run

```bash
pnpm install
pnpm dev
```

Open http://localhost:8787 in your browser, select a workflow, and click "Start Workflow".

## How it works

Workflows are defined with `createWorkflow(name, handler)`. The handler receives a context with `input()`, `output()`, and `loading()` helpers:

```ts
createWorkflow("newsletter-signup", async ({ input, output, loading }) => {
  const name = await input("What is your name?");

  const { email, subscribe } = await input("More info", {
    email: { type: "text", label: "Email" },
    subscribe: { type: "checkbox", label: "Subscribe?" },
  });

  await loading("Processing...", async ({ complete }) => {
    // do async work
    complete("Done!");
  });

  await output(`Thanks ${name}!`);
});
```

Each workflow instance gets a Durable Object (keyed by instance ID) that supplies a persistent message buffer. The `RelayWorkflow` entrypoint wraps `step.do()` and `step.waitForEvent()` under the hood—`input()` sends an input request message, then waits for an event with the user's response. Messages are durably stored and streamed to clients via NDJSON, so the stream survives page reloads.
