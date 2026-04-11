import { createWorkflow } from "@relay-tools/sdk";

/**
 * Tests output.buttons() with different intents and URL buttons.
 */
export const outputButtons = createWorkflow({
  name: "Output Buttons",
  handler: async ({ output }) => {
    await output.buttons([
      { label: "Primary Action", intent: "primary" },
      { label: "Secondary Action", intent: "secondary" },
      { label: "Danger Action", intent: "danger" },
      { label: "Link Button", url: "https://example.com", intent: "primary" },
    ]);
  },
});
