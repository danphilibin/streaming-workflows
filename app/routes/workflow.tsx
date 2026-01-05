import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import type { Route } from "./+types/workflow";
import { useWorkflowStream } from "../hooks/useWorkflowStream";
import { MessageList } from "../components/workflow";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.workflowName} - Workflow` },
    { name: "description", content: "Workflow Stream" },
  ];
}

export default function Workflow() {
  const { workflowName, runId } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const { status, messages, currentRunId, submitInput, startNewRun } =
    useWorkflowStream({
      workflowName: workflowName!,
      runId,
    });

  // Auto-scroll on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full w-full">
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#fafafa]">
              {formatWorkflowName(workflowName)}
            </h1>
            <button
              onClick={startNewRun}
              className="px-3 py-1.5 text-sm font-medium text-[#888] border border-[#333] rounded-md hover:bg-[#1a1a1a] hover:text-white transition-colors"
            >
              New Run
            </button>
          </div>

          {/* Connecting state */}
          {status === "connecting" && (
            <div className="py-3 text-base text-[#666] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#666] animate-pulse-dot" />
              Connecting...
            </div>
          )}

          {/* Messages */}
          <MessageList
            messages={messages}
            workflowId={currentRunId}
            onSubmitInput={submitInput}
          />

          {/* Complete state with no messages */}
          {status === "complete" && messages.length === 0 && (
            <div className="py-3 text-base text-[#666]">
              No messages received.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatWorkflowName(name?: string): string {
  if (!name) return "";
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
