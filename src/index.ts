import { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { RelayWorkflowEntrypoint } from "./relay";
import { WorkflowObject } from "./workflow-object";
import html from "./index.html";

// Export the Durable Object
export { WorkflowObject };

/**
 * Welcome to Cloudflare Workers! This is your first Workflows application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Workflow in action
 * - Run `npm run deploy` to publish your application
 *
 * Learn more at https://developers.cloudflare.com/workflows
 */

// User-defined params passed to your Workflow
type Params = {
  email: string;
  metadata: Record<string, string>;
};

export class RelayWorkflow extends RelayWorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    this.initRelay(event.instanceId, this.env.WORKFLOW_OBJECT);
    await this.relay.write("Workflow started");

    const files = await step.do("fetch files", async () => {
      await this.relay.write("Fetching files from API...");
      const files = [
        "doc_7392_rev3.pdf",
        "report_x29_final.pdf",
        "memo_2024_05_12.pdf",
        "file_089_update.pdf",
        "proj_alpha_v2.pdf",
        "data_analysis_q2.pdf",
        "notes_meeting_52.pdf",
        "summary_fy24_draft.pdf",
      ];
      await this.relay.write(`Found ${files.length} files`);
      return files;
    });

    await step.sleep("pause", "3 seconds");
    await this.relay.write("Starting file processing...");

    for (let i = 0; i < files.length; i++) {
      await step.do(`process file ${i}`, async () => {
        await this.relay.write(`Processing ${files[i]}...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        await this.relay.write(`✓ Completed ${files[i]}`);
      });
    }

    await this.relay.write("Workflow completed successfully!");
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/favicon")) {
      return Response.json({}, { status: 404 });
    }

    // GET / - serve the frontend
    if (url.pathname === "/") {
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // GET /stream/:id - connect to workflow stream
    const streamMatch = url.pathname.match(/^\/stream\/(.+)$/);
    if (streamMatch) {
      const workflowId = streamMatch[1];
      const stub = env.WORKFLOW_OBJECT.getByName(workflowId);
      return stub.fetch("http://internal/stream");
    }

    // POST /workflow - spawn a new workflow instance
    if (req.method === "POST" && url.pathname === "/workflow") {
      const instance = await env.RELAY_WORKFLOW.create();
      return Response.json({
        id: instance.id,
        streamUrl: `/stream/${instance.id}`,
      });
    }

    // Default: return OK for any other requests
    return new Response("OK", { status: 200 });
  },
};
