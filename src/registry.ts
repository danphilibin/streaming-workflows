import { fetchHackernews } from "@/workflows/fetch-hackernews";
import { processFiles } from "@/workflows/process-files";
import { askName } from "@/workflows/ask-name";
import { newsletterSignup } from "@/workflows/newsletter-signup";
import { type RelayWorkflowRegistry } from "./sdk/workflow";

export const workflows: RelayWorkflowRegistry = {
  "fetch-hackernews": fetchHackernews,
  "process-files": processFiles,
  "ask-name": askName,
  "newsletter-signup": newsletterSignup,
};

export function getWorkflowTypes(): string[] {
  return Object.keys(workflows);
}
