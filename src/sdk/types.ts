import { WorkflowStep } from "cloudflare:workers";

export type WorkflowContext = {
  step: WorkflowStep;
  relay: {
    input: (prompt: string) => Promise<string>;
    output: (msg: string) => Promise<void>;
  };
  params: any;
};

export type ActionHandler = (ctx: WorkflowContext) => Promise<void>;

export function createAction(fn: ActionHandler): ActionHandler {
  return fn;
}

export type ActionRegistry = Record<string, ActionHandler>;
