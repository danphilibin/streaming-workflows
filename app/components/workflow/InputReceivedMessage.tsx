interface InputReceivedMessageProps {
  value: Record<string, unknown>;
}

export function InputReceivedMessage({ value }: InputReceivedMessageProps) {
  const displayValue = Object.entries(value)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return (
    <div className="py-3 text-base leading-relaxed text-[#888]">
      <span className="text-[#666]">&gt;</span> {displayValue}
    </div>
  );
}
