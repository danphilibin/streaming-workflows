/**
 * Stream message types for workflow communication
 */

export type StreamMessage =
  | {
      type: "log";
      text: string;
    }
  | {
      type: "input_request";
      eventName: string;
      prompt: string;
    }
  | {
      type: "input_received";
      value: string;
    };

export function createLogMessage(text: string): StreamMessage {
  return { type: "log", text };
}

export function createInputRequest(
  eventName: string,
  prompt: string,
): StreamMessage {
  return { type: "input_request", eventName, prompt };
}

export function createInputReceived(value: string): StreamMessage {
  return { type: "input_received", value };
}
