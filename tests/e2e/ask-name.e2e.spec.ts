import { expect, test } from "./fixtures";

test("ask-name workflow completes after submitting a name", async ({
  page,
  openWorkflow,
}) => {
  const name = `Playwright User ${Date.now()}`;

  await openWorkflow("ask-name");

  await expect(
    page.getByText("Hello! I'd like to get to know you."),
  ).toBeVisible();

  await page.getByRole("textbox").first().fill(name);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(`Nice to meet you, ${name}!`)).toBeVisible();
});
