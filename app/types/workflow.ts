export type InputSchema = Record<
  string,
  {
    type: string;
    label: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
  }
>;

export type WorkflowMessage =
  | { type: "log"; text: string }
  | {
      type: "input_request";
      eventName: string;
      prompt: string;
      schema?: InputSchema;
    }
  | { type: "input_received"; value: unknown }
  | { type: "loading"; id: string; text: string; complete: boolean };

export type WorkflowStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "complete"
  | "error";
