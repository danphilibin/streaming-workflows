interface InputReceivedMessageProps {
  value: unknown;
}

export function InputReceivedMessage({ value }: InputReceivedMessageProps) {
  const displayValue =
    typeof value === "object" && value !== null
      ? Object.entries(value as Record<string, unknown>)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : String(value);

  return (
    <div className="py-3 text-base leading-relaxed text-[#888]">
      <span className="text-[#666]">&gt;</span> {displayValue}
    </div>
  );
}
