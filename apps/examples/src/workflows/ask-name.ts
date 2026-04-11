import { createWorkflow } from "@relay-tools/sdk";

export const askName = createWorkflow({
  name: "Ask Name",
  mcp: true,
  handler: async ({ input, output }) => {
    await output.markdown("Hello! I'd like to get to know you.");
    const name = await input.text("What's your name?");
    await output.markdown(`Nice to meet you, ${name}!`);
  },
});
