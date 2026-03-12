import { DurableObject } from "cloudflare:workers";
import { type StreamMessage } from "../isomorphic/messages";
import type { SerializedColumnDef } from "../isomorphic/output";

type TableDescriptor = {
  workflowSlug: string;
  loaderName: string;
  params: Record<string, unknown>;
  tableRendererName?: string;
  columns?: SerializedColumnDef[];
  pageSize?: number;
};

/**
 * Durable Object that stores and streams messages for a workflow run.
 *
 * Endpoints:
 * - GET  /stream - NDJSON stream (replay + live) for browser clients and call-response consumers
 * - POST /stream - appends a message to the stream
 */
export class RelayDurableObject extends DurableObject {
  private controllers: ReadableStreamDefaultController<Uint8Array>[] = [];

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // POST /stream - append a message
    if (request.method === "POST" && url.pathname === "/stream") {
      const { message } = await request.json<{ message: StreamMessage }>();

      // Read existing messages from durable storage
      const messages =
        (await this.ctx.storage.get<StreamMessage[]>("messages")) || [];
      messages.push(message);

      // Persist to durable storage
      await this.ctx.storage.put("messages", messages);

      // Broadcast to all connected clients
      const encoded = new TextEncoder().encode(JSON.stringify(message) + "\n");
      for (const controller of this.controllers) {
        try {
          controller.enqueue(encoded);
        } catch {
          // Controller might be closed, ignore
        }
      }

      return new Response("OK");
    }

    // GET /stream - return a ReadableStream
    if (request.method === "GET" && url.pathname === "/stream") {
      let streamController: ReadableStreamDefaultController<Uint8Array>;
      const stream = new ReadableStream({
        start: async (controller) => {
          streamController = controller;
          // Read historical messages from durable storage
          const messages =
            (await this.ctx.storage.get<StreamMessage[]>("messages")) || [];

          // Send all historical messages
          for (const message of messages) {
            const encoded = new TextEncoder().encode(
              JSON.stringify(message) + "\n",
            );
            controller.enqueue(encoded);
          }

          // Add to active controllers for future messages
          this.controllers.push(controller);
        },
        cancel: () => {
          // Remove from active controllers when client disconnects
          const index = this.controllers.indexOf(streamController);
          if (index > -1) {
            this.controllers.splice(index, 1);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Cache-Control": "no-cache",
        },
      });
    }

    // POST /metadata - store workflow metadata (slug)
    if (request.method === "POST" && url.pathname === "/metadata") {
      const { slug } = await request.json<{ slug: string }>();
      await this.ctx.storage.put("slug", slug);
      return new Response("OK");
    }

    // GET /metadata - retrieve workflow metadata
    if (request.method === "GET" && url.pathname === "/metadata") {
      const slug = await this.ctx.storage.get<string>("slug");
      return Response.json({ slug: slug ?? null });
    }

    const tableMatch = url.pathname.match(/^\/tables\/([^/]+)$/);

    // POST /tables/:id - store table descriptor for later queries
    if (request.method === "POST" && tableMatch) {
      const [, tableId] = tableMatch;
      const descriptor = await request.json<TableDescriptor>();
      await this.ctx.storage.put(`table:${tableId}`, descriptor);
      return new Response("OK");
    }

    // GET /tables/:id - retrieve stored table descriptor
    if (request.method === "GET" && tableMatch) {
      const [, tableId] = tableMatch;
      const descriptor = await this.ctx.storage.get<TableDescriptor>(
        `table:${tableId}`,
      );

      if (!descriptor) {
        return Response.json(
          { error: `Unknown table descriptor: ${tableId}` },
          { status: 404 },
        );
      }

      return Response.json(descriptor);
    }

    return new Response("Not found", { status: 404 });
  }
}
