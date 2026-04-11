import { createFileRoute } from "@tanstack/react-router";
import { useWorkflows } from "../lib/workflows-context";

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
  const { workflows, loading, error } = useWorkflows();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#555]">
        <p className="text-base">Loading workflows…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#666]">
        <div className="text-center max-w-md">
          <p className="text-base font-medium text-[#999] mb-2">
            Couldn't connect to the Relay server
          </p>
          <p className="text-sm text-[#555]">{error}</p>
        </div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#666]">
        <p className="text-base">No workflows registered yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center text-[#666]">
      <p className="text-base">Select a workflow to get started</p>
    </div>
  );
}
