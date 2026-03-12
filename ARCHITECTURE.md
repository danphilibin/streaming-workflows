# Architecture

This document describes the high-level architecture of Relay, a workflow engine that pairs Cloudflare Workflows with Cloudflare Durable Objects to let developers define interactive, multi-step workflows in backend code and have them rendered automatically in a React frontend. If you want to familiarize yourself with the codebase, this is a good place to start.

## Bird's Eye View

A workflow author writes a handler using a small SDK (`createWorkflow`). The SDK provides primitives — `input`, `output`, `loading`, `confirm` — that each become a durable step in a Cloudflare Workflow. Each step sends a JSON message to a per-run Durable Object, which persists the message and broadcasts it over an NDJSON stream. A React SPA connects to that stream and renders structured UI (forms, spinners, confirmation dialogs, rich content) without any per-workflow frontend code.

There is also a synchronous call-response API for agents (MCP, CLI) that blocks until the next interaction point, so non-browser clients can drive workflows too.

## Codemap

The repo is a pnpm monorepo with two packages and one example app.

```
workflows-starter/
├── packages/
│   ├── sdk/              → Core SDK
│   │   └── src/
│   │       ├── isomorphic/   # Shared types/logic (no cloudflare:workers imports)
│   │       └── sdk/          # Cloudflare-specific implementation
│   └── web/              → React SPA (independently deployable)
│       └── app/
│           ├── components/workflow/
│           ├── hooks/
│           ├── lib/
│           └── routes/
├── apps/
│   ├── examples/         → Example Cloudflare Worker
│   │   └── src/
│   │       ├── index.ts      # Worker entrypoint
│   │       └── workflows/    # Example workflow definitions
│   └── e2e-tests/        → E2e test suite (workflows + Playwright specs)
│       ├── src/
│       │   ├── index.ts      # Worker entrypoint
│       │   └── workflows/    # One workflow per SDK primitive
│       └── specs/            # Playwright specs organized by primitive
├── mcp/                  # MCP server entrypoint (stdio transport)
├── tests/
│   └── e2e/              # Playwright end-to-end tests
└── package.json          # Workspace scripts only — no deployable code
```

### `packages/sdk`

The core SDK. Everything needed to build a Relay-powered Cloudflare Worker.

Three entry points:

- **`relay-sdk`** — Server-side. `createWorkflow`, `RelayWorkflow`, `RelayDurableObject`, `RelayMcpAgent`, `httpHandler`, registry functions.
- **`relay-sdk/client`** — Browser-safe. Message types, schemas, `parseStreamMessage`. No `cloudflare:workers` dependency.
- **`relay-sdk/mcp`** — Node.js. `createRelayMcpServer` factory for stdio-based MCP servers.

Internally split into two directories:

- **`src/isomorphic/`** — Shared types and logic with no Cloudflare runtime dependency. Message schemas (`messages.ts`), input field types (`input.ts`), output block types (`output.ts`), registry types, MCP text formatting.
- **`src/sdk/`** — Cloudflare-specific implementation. The key files:
  - `cf-workflow.ts` — `RelayWorkflow` class (`WorkflowEntrypoint`) and `createWorkflow()` factory
  - `cf-durable-object.ts` — `RelayDurableObject`, stores and streams messages per run
  - `cf-http.ts` — HTTP request handler with all routes
  - `cf-mcp-agent.ts` — `RelayMcpAgent`, Cloudflare-native MCP server (Durable Object)
  - `workflow-api.ts` — Core execution functions shared between the HTTP handler and MCP agent
  - `registry.ts` — Global workflow registry (`Map`), populated by `createWorkflow()`

### `packages/web`

React SPA (React 19, React Router v7, Tailwind v4). Independently deployable. Connects to a Relay worker via a configurable API URL.

The core hook is `useWorkflowStream` — it manages the full lifecycle of connecting to a run's NDJSON stream, parsing messages with Zod, and exposing state to the UI. Message rendering is driven by the `StreamMessage` discriminated union; the UI never needs to know what workflow it's displaying.

### `apps/examples`

Example Cloudflare Worker demonstrating the deployment shape: imports `relay-sdk`, defines workflows, deploys independently. Contains several example workflows covering simple to complex cases.

### `apps/e2e-tests`

E2e test suite — colocates the test Cloudflare Worker (workflows) and Playwright specs. One workflow per SDK primitive, designed for automated testing rather than demos. Runs on separate ports (worker:8788, web:5174) so it doesn't conflict with `pnpm dev`. See `apps/e2e-tests/README.md`.

### `mcp/`

Thin MCP server entrypoint that delegates to `relay-sdk/mcp`. Used for running a local MCP server over stdio.

## Ground Rules

- **`isomorphic/` has no Cloudflare runtime imports.** Everything in `src/isomorphic/` must be safe to import from both the Worker and the browser. The `relay-sdk/client` entry point re-exports only from this directory.
- **Workflows self-register.** `createWorkflow()` pushes into a global `Map`. There is no manual wiring step — importing a workflow file is sufficient.
- **Every SDK primitive is a `step.do()` call.** `output`, `input`, `loading`, and `confirm` all go through Cloudflare's `step.do()`, making them replay-safe and durable.
- **The frontend is workflow-agnostic.** The React app renders any workflow purely from the `StreamMessage` stream. There is no per-workflow UI code.
- **The Durable Object is the source of truth.** All messages are persisted in the DO. The stream replays full history on reconnect, so the client can recover from disconnects or page reloads.

## Cross-Cutting Concerns

**Message protocol:** The `StreamMessage` Zod-validated discriminated union (on `type`) is the contract between SDK, DO, HTTP layer, and frontend. All message types are defined once in `isomorphic/messages.ts`.

**Input schema / type inference:** Relay now has two builder entry points for two different phases. `field.*` is used at workflow definition time in `createWorkflow({ input })` to declare upfront inputs. `input.*` is used inside a running workflow handler to request interactive inputs, and `input.group(title?, fields, options?)` composes multiple runtime field builders into one interaction. Both forms compile to `InputSchema` field definitions (`text`, `number`, `checkbox`, `select`) for the stream protocol and frontend renderer. `InputSchema` remains the transport/intermediate representation, not the primary public authoring API.

**Dual API surface:** Both the interactive API (browser: stream + events) and the call-response API (agents: blocking POST) share the same core execution functions in `workflow-api.ts`, avoiding divergence.

## SDK Primitives

Top-level workflow definition helpers:

| Property                          | Signature                       | What it does                                             |
| --------------------------------- | ------------------------------- | -------------------------------------------------------- |
| `field.text(label, options?)`     | `=> InputFieldBuilder<string>`  | Defines an upfront text field for `createWorkflow()`     |
| `field.select(label, options)`    | `=> InputFieldBuilder<string>`  | Defines an upfront select field for `createWorkflow()`   |
| `field.number(label, options?)`   | `=> InputFieldBuilder<number>`  | Defines an upfront number field for `createWorkflow()`   |
| `field.checkbox(label, options?)` | `=> InputFieldBuilder<boolean>` | Defines an upfront checkbox field for `createWorkflow()` |

The handler context (`RelayContext`) passed to every workflow:

| Property                                     | Signature                        | What it does                                            |
| -------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| `output.markdown(content)`                   | `(string) => Promise<void>`      | Sends a markdown block                                  |
| `output.table({ title?, data })`             | `=> Promise<void>`               | Sends a data table                                      |
| `output.table({ source, ... })`              | `=> Promise<void>`               | Sends a loader-backed paginated table                   |
| `output.code({ code, language? })`           | `=> Promise<void>`               | Sends a code block                                      |
| `output.image({ src, alt? })`                | `=> Promise<void>`               | Sends an image                                          |
| `output.link({ url, title?, description? })` | `=> Promise<void>`               | Sends a link card                                       |
| `output.buttons(buttons)`                    | `=> Promise<void>`               | Sends action buttons                                    |
| `input(prompt)`                              | `(string) => Promise<string>`    | Text input, waits for response                          |
| `input.text(label, options?)`                | `=> InputFieldBuilder<string>`   | Awaitable text field builder                            |
| `input.select(label, options)`               | `=> InputFieldBuilder<string>`   | Awaitable select field builder                          |
| `input.number(label, options?)`              | `=> InputFieldBuilder<number>`   | Awaitable number field builder                          |
| `input.checkbox(label, options?)`            | `=> InputFieldBuilder<boolean>`  | Awaitable checkbox field builder                        |
| `input.table(options)`                       | `=> Promise<TRow \| TRow[]>`     | Select rows from a loader-backed table and resolve them |
| `input.group(title?, fields, options?)`      | `=> Promise<{ ...fields }>`      | Compose multiple field builders into one interaction    |
| `input(prompt, { buttons })`                 | `=> Promise<{ value, $choice }>` | Text input with custom buttons                          |
| `loading(msg, callback)`                     | `(string, cb) => Promise<void>`  | Shows spinner during async work                         |
| `confirm(msg)`                               | `(string) => Promise<boolean>`   | Approve/reject dialog                                   |
| `step`                                       | `WorkflowStep`                   | Raw Cloudflare step (`step.do()`, `step.sleep()`, etc.) |
| `data`                                       | `InferBuilderGroupResult<T>`     | Typed upfront input (only when field builders provided) |

## HTTP API

### Interactive API (browser clients)

| Method | Path                                 | Action                                                  |
| ------ | ------------------------------------ | ------------------------------------------------------- |
| `GET`  | `/workflows`                         | Returns workflow metadata list from registry            |
| `POST` | `/workflows`                         | Creates a new workflow instance, returns `{ id, name }` |
| `GET`  | `/workflows/:id/stream`              | Proxies to the DO's NDJSON stream                       |
| `POST` | `/workflows/:id/event/:name`         | Submits user response (input value or confirm decision) |
| `POST` | `/workflows/:id/table/:stepId/query` | Runs a DO-backed table query for pagination/search      |

## Loaders And Table Renderers

Loaders let a workflow emit a table without persisting all rows into the NDJSON
stream. Instead, `output.table({ source, ... })` streams only table metadata and
the browser queries pages on demand via
`POST /workflows/:id/table/:stepId/query`.

The loader itself is still registered globally with the workflow definition, but
the handler receives a serializable `LoaderRef` rather than a direct callback.
That ref captures any bound params from the workflow run. When a table is
emitted, `RelayWorkflow` stores a small table descriptor in the run's Durable
Object keyed by `stepId`. Later browser queries use that descriptor to
reconstruct the loader call server-side.

Table renderers are the reusable, named version of table display logic. They
hold column definitions, including `renderCell` callbacks, on the server side.
When a loader-backed table uses a table renderer, the streamed block only includes:

- a server-built `loader.path` that points at the run/step query endpoint
- optional `pageSize`

The `loader.path` is treated as opaque browser-side, but it is now just a stable
resource path. The data-source and display configuration live in Durable Object
storage rather than in the URL.

The loader fetch response is display-oriented:

```ts
{
  columns: [{ key: "email", label: "Email" }],
  rows: [{ rowKey: "user_123", cells: { email: "jane@example.com" } }],
  totalCount: 42,
}
```

This keeps render callbacks and transport-specific normalization out of the UI.
The React app just fetches, renders server-provided columns/cells, manages
selection state, and submits selected `rowKey` values back to the workflow.

### Call-response API (agents)

| Method | Path                   | Action                                                  |
| ------ | ---------------------- | ------------------------------------------------------- |
| `POST` | `/api/run`             | Starts a workflow, blocks until first interaction point |
| `POST` | `/api/run/:id/respond` | Submits a response, blocks until next interaction point |

Both return a `CallResponseResult`:

```ts
{
  run_id: string;
  status: "awaiting_input" | "awaiting_confirm" | "complete";
  messages: StreamMessage[];      // all messages since last interaction
  interaction: InputRequestMessage | ConfirmRequestMessage | null;
}
```

## How `input()` suspends and resumes

1. `field.*` and `input.*` builders compile into an `InputSchema`
2. `step.do(requestEvent)` → sends `input_request` message to DO stream
3. `step.waitForEvent(eventName)` → suspends the Workflow
4. Client submits form → `POST /workflows/:id/event/:name` → sends `input_received` to DO + calls `instance.sendEvent()` to resume
5. Workflow continues with the submitted payload
