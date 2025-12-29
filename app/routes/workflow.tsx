import { useEffect, useRef, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router";
import type { Route } from "./+types/workflow";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.workflowName} - Workflow Stream` },
    { name: "description", content: "Workflow Stream" },
  ];
}

export default function Workflow() {
  const { workflowName, runId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState<JSX.Element[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!runId) return;

    const abortController = new AbortController();
    connectToStream(runId, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [runId]);

  async function submitInput(eventName: string, workflowId: string) {
    const inputEl = document.getElementById(
      `input-${eventName}`,
    ) as HTMLInputElement;
    const value = inputEl?.value;

    if (!value) {
      alert("Please enter a value");
      return;
    }

    inputEl.disabled = true;
    const button = inputEl.parentElement?.querySelector("button");
    if (button) {
      (button as HTMLButtonElement).disabled = true;
    }

    try {
      await fetch(`/workflow/${workflowId}/event/${eventName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
    } catch (error) {
      console.error("Failed to submit input:", error);
      alert("Failed to submit input");
    }
  }

  async function connectToStream(workflowId: string, signal: AbortSignal) {
    setMessages([]);
    setStatus("Connecting to stream...");

    try {
      const streamResponse = await fetch(`/stream/${workflowId}`, { signal });
      const reader = streamResponse.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      setStatus("Connected to stream. Receiving messages...");

      // Buffer for incomplete lines split across chunks
      let buffer = "";

      while (true) {
        if (signal.aborted) {
          reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;

        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });

        // Split by newlines and process complete lines
        const lines = buffer.split("\n");

        // Keep the last element in buffer (might be incomplete)
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          let message;
          try {
            message = JSON.parse(line);
          } catch (e) {
            console.error("Failed to parse JSON:", line, e);
            continue;
          }

          try {
            if (message.type === "log") {
              setMessages((prev) => [
                ...prev,
                <div key={prev.length} className="my-1">
                  {message.text}
                </div>,
              ]);
            } else if (message.type === "input_request") {
              setMessages((prev) => [
                ...prev,
                <div key={prev.length} className="my-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {message.prompt}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id={`input-${message.eventName}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          submitInput(message.eventName, workflowId);
                        }
                      }}
                    />
                    <button
                      onClick={() => submitInput(message.eventName, workflowId)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                </div>,
              ]);
            } else if (message.type === "input_received") {
              setMessages((prev) => [
                ...prev,
                <div key={prev.length} className="my-1 text-gray-600">
                  &gt; {message.value}
                </div>,
              ]);
            }
          } catch (e) {
            console.error("Failed to handle message:", message, e);
          }
        }
      }

      setStatus("Stream complete.");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // Stream was intentionally aborted, ignore
        return;
      }
      setStatus(`Error: ${(error as Error).message}`);
    }
  }

  function formatWorkflowName(name?: string): string {
    if (!name) return "";
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  async function startNewRun() {
    try {
      const response = await fetch("/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: workflowName }),
      });
      const data = await response.json();
      if (data.id) {
        navigate(`/${workflowName}/${data.id}`);
      }
    } catch (error) {
      console.error("Failed to start new workflow:", error);
    }
  }

  const isLoading = status === "Connecting to stream..." || status === "Connected to stream. Receiving messages...";
  const hasError = status.startsWith("Error:");
  const isComplete = status === "Stream complete.";

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/")}
            className="text-blue-500 hover:text-blue-600 text-sm mb-2 flex items-center gap-1"
          >
            ← Back to workflows
          </button>
          <h1 className="text-2xl font-bold">
            {formatWorkflowName(workflowName)}
          </h1>
        </div>
        <button
          onClick={startNewRun}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Run
        </button>
      </div>

      <div className="bg-gray-50 rounded p-4 min-h-[400px] font-mono text-sm">
        {isLoading && messages.length === 0 && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
            Waiting for messages...
          </div>
        )}
        {hasError && (
          <div className="text-red-500">{status}</div>
        )}
        {isComplete && messages.length === 0 && (
          <div className="text-gray-500">No messages received.</div>
        )}
        {messages}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
