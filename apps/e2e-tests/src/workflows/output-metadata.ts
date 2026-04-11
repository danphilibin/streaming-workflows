import { createWorkflow } from "@relay-tools/sdk";

/**
 * Tests output.metadata() with label and mixed value types.
 */
export const outputMetadata = createWorkflow({
  name: "Output Metadata",
  handler: async ({ output }) => {
    await output.metadata({
      label: "Order Summary",
      data: {
        "Order ID": "ORD-12345",
        Amount: 99.99,
        Shipped: true,
        "Tracking Number": null,
      },
    });
  },
});
