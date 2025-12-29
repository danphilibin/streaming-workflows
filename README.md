# Cloudflare Relay Prototype

This is a very early Relay prototype that connects Cloudflare Workflows to Durable Objects, with the goal of exposing a single persistent readable stream per workflow run. (This is similar to what Vercel Workflows does - every workflow run automatically gets a readable stream where we store UI instructions.)

Sketching out my understanding of how this works to help build my mental model.

Using **Workflows** and **Durable Objects** from Cloudflare, which are two primitives built on top of **Workers:**

- Workflows = Inngest-like durable functions with steps, events and retries
- Durable Objects = special type of worker with persistent storage

What we are effectively doing is giving each Workflow a Durable Object with a persistent readable stream, just like Vercel Workflows.

Each of these is assigned to `ENV` via `RELAY_WORKFLOW` and `RELAY_DURABLE_OBJECT`.

Entrypoint is in `src/index.ts`. This file contains the **Workflow** - both the `RelayWorkflow` class and the default export which handles HTTP requests.

## Questions

- Should the default export be the Workflow + HTTP handler, or some other primitive like a plain worker?
- Why do we have `RelayWorkflow` and `RelayWorkflowEntrypoint`? Too many layers?
  - `RelayWorkflow` is the actual handler that extends the underlying class
  - It is responsible for actually running each action
  - Which action to run is sent as `event.payload.type`
  - **Answered**: nope, don't need two! I think this is a relic - since we're just using one underlying orchestrator then we don't need two workflows.
- What does an SDK version of this look like? We don't want users to have to do anything but define their workflows, so the SDK would have to provide the default `fetch` handler and the `WorkflowEntrypoint` abstraction.
