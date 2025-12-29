import { createWorkflow } from "../src/sdk/types";

export const askName = createWorkflow(async ({ step, relay }) => {
  await relay.output("Hello! I'd like to get to know you.");
  const name = await relay.input("What's your name?");
  await relay.output(`Nice to meet you, ${name}!`);
});
