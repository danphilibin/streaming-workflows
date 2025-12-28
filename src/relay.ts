import { WorkflowEntrypoint, DurableObject } from "cloudflare:workers";

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

  relay = {
    write: async (message: string): Promise<void> => {
      if (!this.stream) {
        throw new Error("Relay not initialized. Call initRelay() first.");
      }

      await this.stream.fetch("http://internal/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
    },
  };
}
