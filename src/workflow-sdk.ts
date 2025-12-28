import { WorkflowStep } from "cloudflare:workers";

export type WorkflowContext = {
  step: WorkflowStep;
  relay: {
    write: (msg: string) => Promise<void>;
    requestInput: (prompt: string) => Promise<string>;
  };
  params: any;
};

export type WorkflowHandler = (ctx: WorkflowContext) => Promise<void>;

export function defineWorkflow(fn: WorkflowHandler): WorkflowHandler {
  return fn;
}
