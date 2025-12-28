import { fetchHackernews } from "../workflows/fetch-hackernews";
import { processFiles } from "../workflows/process-files";
import { WorkflowHandler } from "./workflow-sdk";

export const workflows: Record<string, WorkflowHandler> = {
  "fetch-hackernews": fetchHackernews,
  "process-files": processFiles,
};

export function getWorkflowTypes(): string[] {
  return Object.keys(workflows);
}
