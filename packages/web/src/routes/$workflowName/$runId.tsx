import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "../../components/workflow/WorkflowPage";

export const Route = createFileRoute("/$workflowName/$runId")({
  head: ({ params }) => ({
    meta: [
      { title: `${formatTitle(params.workflowName)} - Workflow` },
      { name: "description", content: "Workflow Stream" },
    ],
  }),
  component: WorkflowWithRun,
});

function WorkflowWithRun() {
  const { workflowName, runId } = Route.useParams();
  return <WorkflowPage workflowName={workflowName} runId={runId} />;
}

function formatTitle(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
