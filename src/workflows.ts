import { fetchHackernews } from "../workflows/fetch-hackernews";
import { processFiles } from "../workflows/process-files";
import { askName } from "../workflows/ask-name";
import { WorkflowHandler } from "./workflow-sdk";

export const workflows: Record<string, WorkflowHandler> = {
  "fetch-hackernews": fetchHackernews,
  "process-files": processFiles,
  "ask-name": askName,
};

export function getWorkflowTypes(): string[] {
  return Object.keys(workflows);
}
