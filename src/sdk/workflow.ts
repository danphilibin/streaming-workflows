import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";
import { workflows } from "../registry";
import {
  createInputRequest,
  createLogMessage,
  type StreamMessage,
  type InputSchema,
  type InferInputResult,
} from "./stream";

// Params passed to workflows
type WorkflowParams = {
  type: string;
  params?: any;
};

/**
 * Input function type with overloads for simple and structured inputs
 */
export type RelayInputFn = {
  (prompt: string): Promise<string>;
  <T extends InputSchema>(
    prompt: string,
    schema: T,
  ): Promise<InferInputResult<T>>;
};

/**
 * Context passed to workflow handlers.
 * Use `input` and `output` to interact with the user.
 */
export type RelayContext = {
  step: WorkflowStep;
  input: RelayInputFn;
  output: RelayWorkflow["output"];
  params: any;
};

export type RelayHandler = (ctx: RelayContext) => Promise<void>;

export type RelayWorkflowRegistry = Record<string, RelayHandler>;

export class RelayWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
  protected stream: DurableObjectStub | null = null;
  protected step: WorkflowStep | null = null;

  async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
    this.step = step;

    // Durable Objects are named using the workflow's instance ID
    this.stream = this.env.RELAY_DURABLE_OBJECT.getByName(event.instanceId);

    const { type, params } = event.payload;
    const handler = workflows[type];

    if (!handler) {
      await this.output(`Error: Unknown workflow type: ${type}`);
      throw new Error(`Unknown workflow type: ${type}`);
    }

    await handler({ step, input: this.input, output: this.output, params });
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

  // Counter for generating unique step names
  private outputCounter = 0;
  private inputCounter = 0;

  /**
   * Output a message to the workflow stream.
   */
  output = async (text: string): Promise<void> => {
    if (!this.step) {
      throw new Error("Relay not initialized. Call initRelay() first.");
    }

    const stepName = `relay-output-${this.outputCounter++}`;
    await this.step.do(stepName, async () => {
      await this.sendMessage(createLogMessage(text));
    });
  };

  /**
   * Request input from the user and wait for a response.
   * Supports simple string prompts or structured input with a schema.
   */
  input: RelayInputFn = (async (prompt: string, schema?: InputSchema) => {
    if (!this.step) {
      throw new Error("Relay not initialized. Call initRelay() first.");
    }

    // Generate unique event name based on counter for deterministic naming
    const eventName = `input-${this.inputCounter++}`;

    // Send input request inside a step (idempotent on replay)
    await this.step.do(`relay-input-request-${eventName}`, async () => {
      await this.sendMessage(createInputRequest(eventName, prompt, schema));
    });

    // Wait for the user to respond
    const event = await this.step.waitForEvent(eventName, {
      type: eventName,
      timeout: "5 minutes",
    });

    // Return the payload - either a string or structured object based on schema
    return event.payload;
  }) as RelayInputFn;
}
