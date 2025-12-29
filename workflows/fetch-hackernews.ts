import { createWorkflow } from "../src/sdk/types";

export const fetchHackernews = createWorkflow(async ({ step, relay }) => {
  await relay.output("Fetching top Hacker News posts...");
  await relay.output("Requesting story IDs from HN API...");

  const topStoryIds = await step.do("fetch top stories", async () => {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
    );
    const ids = await res.json<number[]>();
    return ids.slice(0, 5);
  });

  await relay.output(`Got ${topStoryIds.length} story IDs`);
  await relay.output("Fetching story details...");

  for (let i = 0; i < topStoryIds.length; i++) {
    const id = topStoryIds[i];
    const story = await step.do(`fetch story ${id}`, async () => {
      const res = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
      return res.json<{
        title: string;
        by: string;
        score: number;
      }>();
    });
    await relay.output(
      `${i + 1}. ${story.title} (${story.score} points by ${story.by})`,
    );
  }

  await relay.output("Hacker News fetch complete!");
});
