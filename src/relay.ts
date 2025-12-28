import { WorkflowEntrypoint, DurableObject } from "cloudflare:workers";
import {
  StreamMessage,
  createLogMessage,
  createInputRequest,
} from "./stream-message";

/**
 * Extended WorkflowEntrypoint that provides relay.write() functionality
 */
export class RelayWorkflowEntrypoint<Env, Params> extends WorkflowEntrypoint<
  Env,
  Params
> {
  protected stream: DurableObjectStub | null = null;
  protected instanceId: string | null = null;

  protected initRelay<T extends DurableObject>(
    instanceId: string,
    namespace: DurableObjectNamespace<T>,
  ) {
    this.instanceId = instanceId;
    const id = namespace.idFromName(instanceId);
    this.stream = namespace.get(id);
  }

  private async sendMessage(message: StreamMessage): Promise<void> {
    if (!this.stream) {
      throw new Error("Relay not initialized. Call initRelay() first.");
    }

    await this.stream.fetch("http://internal/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  }

  relay = {
    write: async (text: string): Promise<void> => {
      await this.sendMessage(createLogMessage(text));
    },

    requestInput: async (prompt: string): Promise<string> => {
      // Generate unique event name
      const eventName = `input-${crypto.randomUUID()}`;

      // Send input request to stream
      await this.sendMessage(createInputRequest(eventName, prompt));

      // Return the event name so caller can wait for it
      return eventName;
    },
  };
}
