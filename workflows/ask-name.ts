import { defineWorkflow } from "../src/workflow-sdk";

export const askName = defineWorkflow(async ({ step, relay, params }) => {
  await relay.write("Hello! I'd like to get to know you.");

  // Request input from user
  const eventName = await relay.requestInput("What's your name?");

  // Wait for the user to respond
  const event = await step.waitForEvent(eventName, {
    type: eventName,
    timeout: "5 minutes",
  });

  // Extract the name from the event payload
  const name = event.payload as string;

  // Send confirmation that we received the input
  await relay.write(`Nice to meet you, ${name}!`);
});
