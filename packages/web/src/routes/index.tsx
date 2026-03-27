import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workflows" },
      { name: "description", content: "Select a workflow to run" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="flex-1 flex items-center justify-center text-[#666]">
      <p className="text-base">Select a workflow to get started</p>
    </div>
  );
}
