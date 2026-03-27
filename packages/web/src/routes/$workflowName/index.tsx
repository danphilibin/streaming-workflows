import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "../../components/workflow/WorkflowPage";

export const Route = createFileRoute("/$workflowName/")({
  head: ({ params }) => ({
    meta: [
      { title: `${formatTitle(params.workflowName)} - Workflow` },
      { name: "description", content: "Workflow Stream" },
    ],
  }),
  component: WorkflowIndex,
});

function WorkflowIndex() {
  const { workflowName } = Route.useParams();
  return <WorkflowPage workflowName={workflowName} />;
}

function formatTitle(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
