/**
 * Client-safe SDK exports for browser use.
 * This file must NOT import anything that depends on cloudflare:workers.
 */

export {
  type StreamMessage,
  type LogMessage,
  type InputRequestMessage,
  type InputReceivedMessage,
  type LoadingMessage,
  StreamMessageSchema,
  parseStreamMessage,
} from "./messages";

export type { InputSchema, NormalizedButton } from "./input";

// Re-export types and schemas that are safe for the client
// (these don't depend on cloudflare:workers)
export {
  WorkflowParamsSchema,
  type WorkflowParams,
  StartWorkflowParamsSchema,
  type StartWorkflowParams,
  type WorkflowMeta,
} from "./registry-types";

export type WorkflowStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "complete"
  | "error";
