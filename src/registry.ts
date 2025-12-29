import { fetchHackernews } from "../workflows/fetch-hackernews";
import { processFiles } from "../workflows/process-files";
import { askName } from "../workflows/ask-name";
import { ActionRegistry } from "./sdk/types";

export const workflows: ActionRegistry = {
  "fetch-hackernews": fetchHackernews,
  "process-files": processFiles,
  "ask-name": askName,
};

export function getWorkflowTypes(): string[] {
  return Object.keys(workflows);
}
