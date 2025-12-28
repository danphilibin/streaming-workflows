import { defineWorkflow } from "../src/workflow-sdk";

export const fetchHackernews = defineWorkflow(
  async ({ step, relay, params }) => {
    await relay.write("Fetching top Hacker News posts...");

    const topStoryIds = await step.do("fetch top stories", async () => {
      await relay.write("Requesting story IDs from HN API...");
      const res = await fetch(
        "https://hacker-news.firebaseio.com/v0/topstories.json",
      );
      const ids = await res.json<number[]>();
      const top5 = ids.slice(0, 5);
      await relay.write(`Got ${top5.length} story IDs`);
      return top5;
    });

    await relay.write("Fetching story details...");

    for (let i = 0; i < topStoryIds.length; i++) {
      const id = topStoryIds[i];
      await step.do(`fetch story ${id}`, async () => {
        const res = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
        );
        const story = await res.json<{ title: string; by: string; score: number }>();
        await relay.write(
          `${i + 1}. ${story.title} (${story.score} points by ${story.by})`,
        );
      });
    }

    await relay.write("Hacker News fetch complete!");
  },
);
