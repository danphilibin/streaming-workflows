import type { WorkflowMessage, InputSchema } from "../../types/workflow";
import { LogMessage } from "./LogMessage";
import { InputRequestMessage } from "./InputRequestMessage";
import { InputReceivedMessage } from "./InputReceivedMessage";
import { LoadingMessage } from "./LoadingMessage";

interface MessageListProps {
  messages: WorkflowMessage[];
  workflowId: string | null;
  onSubmitInput: (eventName: string, schema?: InputSchema) => Promise<void>;
}

export function MessageList({
  messages,
  workflowId,
  onSubmitInput,
}: MessageListProps) {
  return (
    <>
      {messages.map((message, index) => {
        const key =
          message.type === "loading" ? `loading-${message.id}` : index;

        switch (message.type) {
          case "log":
            return <LogMessage key={key} text={message.text} />;

          case "input_request":
            return (
              <InputRequestMessage
                key={key}
                eventName={message.eventName}
                prompt={message.prompt}
                schema={message.schema}
                workflowId={workflowId}
                onSubmit={onSubmitInput}
              />
            );

          case "input_received":
            return <InputReceivedMessage key={key} value={message.value} />;

          case "loading":
            return (
              <LoadingMessage
                key={key}
                text={message.text}
                complete={message.complete}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}
