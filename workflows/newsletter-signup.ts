import type { RelayContext } from "../src/sdk/workflow";

export const newsletterSignup = async ({ input, output }: RelayContext) => {
  const name = await input("What is your name?");

  const { email, newsletter } = await input("Enter more info", {
    email: { type: "text", label: "Email address" },
    newsletter: { type: "checkbox", label: "Subscribe to updates?" },
  });

  if (newsletter) {
    // TODO: Task 3 & 4 - loading indicator not yet implemented
    // await loading("Subscribing to newsletter...", async ({ complete }) => {
    //   await sleep("2s");
    //   complete("Subscribed to newsletter!");
    // });
    await output("Subscribing to newsletter...");
  }

  await output(`Thanks, ${name}! Check ${email} for next steps.`);
};
