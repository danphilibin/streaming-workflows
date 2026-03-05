import { useCallback, useEffect, useState } from "react";
import { CaretDown, CaretRight, Terminal } from "@phosphor-icons/react";
import type {
  StreamMessage,
  WorkflowStatus,
  McpCallLogEntry,
} from "relay-sdk/client";
import { apiPath } from "../../lib/api";

type ConsoleMode = "stream" | "mcp";

interface DevConsoleProps {
  status: WorkflowStatus;
  runId: string | null;
  messages: StreamMessage[];
}

export function DevConsole({ status, runId, messages }: DevConsoleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<ConsoleMode>("stream");
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set(),
  );
  const [mcpLog, setMcpLog] = useState<McpCallLogEntry[]>([]);
  const [mcpLogLoading, setMcpLogLoading] = useState(false);

  const fetchMcpLog = useCallback(async () => {
    if (!runId) return;
    setMcpLogLoading(true);
    try {
      const res = await fetch(apiPath(`workflows/${runId}/mcp-log`));
      const data = (await res.json()) as { entries: McpCallLogEntry[] };
      setMcpLog(data.entries);
    } catch {
      // Silently fail — log may not exist yet
    } finally {
      setMcpLogLoading(false);
    }
  }, [runId]);

  // Fetch MCP log when switching to MCP mode, or when new messages arrive
  useEffect(() => {
    if (isVisible && mode === "mcp" && runId) {
      fetchMcpLog();
    }
  }, [isVisible, mode, runId, status, messages.length, fetchMcpLog]);

  const toggleMessage = (index: number) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    const count = mode === "stream" ? messages.length : mcpLog.length;
    setExpandedMessages(new Set(Array.from({ length: count }, (_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedMessages(new Set());
  };

  const handleModeChange = (newMode: ConsoleMode) => {
    setMode(newMode);
    setExpandedMessages(new Set());
  };

  return (
    <>
      {/* Fixed toggle button - always visible */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed right-4 bottom-4 p-2 bg-[#1a1a1a] border border-[#333] rounded-lg hover:bg-[#222] transition-colors z-50"
        title={isVisible ? "Hide Dev Console" : "Show Dev Console"}
      >
        <Terminal
          size={20}
          className={isVisible ? "text-[#9ec1ff]" : "text-[#888]"}
        />
      </button>

      {/* Panel */}
      {isVisible && (
        <div className="w-[300px] h-full border-l border-[#222] bg-[#0d0d0d] flex flex-col shrink-0">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#222] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-[#666]" />
              <span className="text-xs font-medium text-[#888]">
                Dev Console
              </span>
            </div>
            {/* Mode toggle */}
            <div className="flex items-center bg-[#111] rounded border border-[#222]">
              <button
                onClick={() => handleModeChange("stream")}
                className={`text-[10px] px-2 py-0.5 rounded-l transition-colors ${
                  mode === "stream"
                    ? "bg-[#222] text-[#ccc]"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                Stream
              </button>
              <button
                onClick={() => handleModeChange("mcp")}
                className={`text-[10px] px-2 py-0.5 rounded-r transition-colors ${
                  mode === "mcp"
                    ? "bg-[#222] text-[#ccc]"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                MCP
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="px-3 py-2 border-b border-[#222] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#555]">
                Run ID
              </span>
              <span className="text-xs font-mono text-[#888]">
                {runId ? truncateId(runId) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#555]">
                Status
              </span>
              <StatusBadge status={status} />
            </div>
          </div>

          {mode === "stream" ? (
            <StreamView
              messages={messages}
              expandedMessages={expandedMessages}
              onToggle={toggleMessage}
              onExpandAll={expandAll}
              onCollapseAll={collapseAll}
            />
          ) : (
            <McpLogView
              entries={mcpLog}
              loading={mcpLogLoading}
              expandedMessages={expandedMessages}
              onToggle={toggleMessage}
              onExpandAll={expandAll}
              onCollapseAll={collapseAll}
              onRefresh={fetchMcpLog}
            />
          )}
        </div>
      )}
    </>
  );
}

function StreamView({
  messages,
  expandedMessages,
  onToggle,
  onExpandAll,
  onCollapseAll,
}: {
  messages: StreamMessage[];
  expandedMessages: Set<number>;
  onToggle: (index: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
    <>
      <div className="px-3 py-1.5 border-b border-[#222] flex items-center justify-between">
        <span className="text-[10px] text-[#555]">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={
            expandedMessages.size === messages.length
              ? onCollapseAll
              : onExpandAll
          }
          className="text-[10px] text-[#666] hover:text-[#888] transition-colors"
        >
          {expandedMessages.size === messages.length ? "Collapse" : "Expand"}{" "}
          all
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="p-3 text-xs text-[#555] text-center">
            No messages yet
          </div>
        ) : (
          <div>
            {messages.map((message, index) => (
              <MessageRow
                key={`${message.id}-${index}`}
                message={message}
                index={index}
                isExpanded={expandedMessages.has(index)}
                onToggle={() => onToggle(index)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function McpLogView({
  entries,
  loading,
  expandedMessages,
  onToggle,
  onExpandAll,
  onCollapseAll,
  onRefresh,
}: {
  entries: McpCallLogEntry[];
  loading: boolean;
  expandedMessages: Set<number>;
  onToggle: (index: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="px-3 py-1.5 border-b border-[#222] flex items-center justify-between">
        <span className="text-[10px] text-[#555]">
          {entries.length} call{entries.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="text-[10px] text-[#666] hover:text-[#888] transition-colors"
          >
            Refresh
          </button>
          {entries.length > 0 && (
            <button
              onClick={
                expandedMessages.size === entries.length
                  ? onCollapseAll
                  : onExpandAll
              }
              className="text-[10px] text-[#666] hover:text-[#888] transition-colors"
            >
              {expandedMessages.size === entries.length ? "Collapse" : "Expand"}{" "}
              all
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && entries.length === 0 ? (
          <div className="p-3 text-xs text-[#555] text-center">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-3 text-xs text-[#555] text-center">
            No MCP calls recorded
          </div>
        ) : (
          <div>
            {entries.map((entry, index) => (
              <McpCallRow
                key={index}
                entry={entry}
                index={index}
                isExpanded={expandedMessages.has(index)}
                onToggle={() => onToggle(index)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const config: Record<WorkflowStatus, { color: string; bg: string }> = {
    idle: { color: "text-[#666]", bg: "bg-[#222]" },
    connecting: { color: "text-yellow-400", bg: "bg-yellow-400/10" },
    streaming: { color: "text-green-400", bg: "bg-green-400/10" },
    complete: { color: "text-blue-400", bg: "bg-blue-400/10" },
    error: { color: "text-red-400", bg: "bg-red-400/10" },
  };

  const { color, bg } = config[status];

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${color} ${bg}`}>
      {status}
    </span>
  );
}

function MessageRow({
  message,
  index,
  isExpanded,
  onToggle,
}: {
  message: StreamMessage;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const typeColors: Record<string, string> = {
    output: "text-purple-400",
    input_request: "text-yellow-400",
    input_received: "text-yellow-300",
    confirm_request: "text-orange-400",
    confirm_received: "text-orange-300",
    loading: "text-gray-400",
    workflow_complete: "text-green-400",
  };

  return (
    <div className="border-t border-[#1a1a1a] first:border-t-0 hover:bg-[#111] transition-colors">
      <button
        onClick={onToggle}
        className="w-full px-3 py-1.5 flex items-center gap-2 text-left"
      >
        {isExpanded ? (
          <CaretDown size={10} className="text-[#555] shrink-0" />
        ) : (
          <CaretRight size={10} className="text-[#555] shrink-0" />
        )}
        <span className="text-[10px] text-[#444] font-mono w-4">{index}</span>
        <span
          className={`text-[11px] font-mono ${typeColors[message.type] || "text-[#888]"}`}
        >
          {message.type}
        </span>
      </button>
      {isExpanded && (
        <div className="px-3 pb-2">
          <pre className="text-[10px] font-mono text-[#777] bg-[#0a0a0a] rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(message, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function McpCallRow({
  entry,
  index,
  isExpanded,
  onToggle,
}: {
  entry: McpCallLogEntry;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const actionColor =
    entry.action === "start" ? "text-green-400" : "text-blue-400";

  return (
    <div className="border-t border-[#1a1a1a] first:border-t-0 hover:bg-[#111] transition-colors">
      <button
        onClick={onToggle}
        className="w-full px-3 py-1.5 flex items-center gap-2 text-left"
      >
        {isExpanded ? (
          <CaretDown size={10} className="text-[#555] shrink-0" />
        ) : (
          <CaretRight size={10} className="text-[#555] shrink-0" />
        )}
        <span className="text-[10px] text-[#444] font-mono w-4">{index}</span>
        <span className={`text-[11px] font-mono ${actionColor}`}>
          {entry.action}
        </span>
        <span className="text-[10px] text-[#444] ml-auto">
          {entry.charCount} chars
        </span>
      </button>
      {isExpanded && (
        <div className="px-3 pb-2">
          <div className="text-[9px] text-[#444] mb-1 font-mono">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </div>
          <pre className="text-[10px] font-mono text-[#777] bg-[#0a0a0a] rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
            {entry.text}
          </pre>
        </div>
      )}
    </div>
  );
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}
