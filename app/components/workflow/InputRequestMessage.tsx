import { useState } from "react";
import type { InputSchema } from "../../types/workflow";

interface InputRequestMessageProps {
  eventName: string;
  prompt: string;
  schema?: InputSchema;
  workflowId: string | null;
  onSubmit: (
    eventName: string,
    value: string | Record<string, unknown>,
  ) => Promise<void>;
}

export function InputRequestMessage({
  eventName,
  prompt,
  schema,
  onSubmit,
}: InputRequestMessageProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitted) return;

    const formData = new FormData(e.currentTarget);
    let value: string | Record<string, unknown>;

    if (schema) {
      const result: Record<string, unknown> = {};
      for (const [fieldName, fieldDef] of Object.entries(schema)) {
        if (fieldDef.type === "checkbox") {
          result[fieldName] = formData.get(fieldName) === "on";
        } else if (fieldDef.type === "number") {
          const raw = formData.get(fieldName);
          result[fieldName] = raw ? Number(raw) : 0;
        } else {
          result[fieldName] = formData.get(fieldName) ?? "";
        }
      }
      value = result;
    } else {
      value = (formData.get("input") as string) ?? "";
      if (!value) return;
    }

    setIsSubmitted(true);
    await onSubmit(eventName, value);
  };

  return (
    <form
      className="my-4 p-5 rounded-xl border bg-[#111] border-[#222]"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-4">
        <span className="text-base font-medium text-[#fafafa]">{prompt}</span>

        {schema ? (
          <SchemaFields schema={schema} disabled={isSubmitted} />
        ) : (
          <input
            type="text"
            name="input"
            data-1p-ignore
            placeholder="Type here..."
            autoFocus
            disabled={isSubmitted}
            className="w-full px-3 py-2.5 text-base bg-black border border-[#333] rounded-md text-[#fafafa] placeholder:text-[#666] focus:outline-none focus:border-[#888] focus:ring-[3px] focus:ring-white/5 disabled:bg-[#0a0a0a] disabled:border-[#222] disabled:text-[#888] transition-all"
          />
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitted}
            className="px-3.5 py-2 text-[15px] font-medium bg-white text-black rounded-md hover:opacity-90 active:scale-[0.98] disabled:bg-[#333] disabled:text-[#666] disabled:cursor-default transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </form>
  );
}

interface SchemaFieldsProps {
  schema: InputSchema;
  disabled: boolean;
}

function SchemaFields({ schema, disabled }: SchemaFieldsProps) {
  // Find the first text input field name for autofocus
  const firstTextFieldName = Object.entries(schema).find(
    ([, fieldDef]) =>
      !fieldDef.type ||
      fieldDef.type === "text" ||
      (fieldDef.type !== "checkbox" &&
        fieldDef.type !== "number" &&
        fieldDef.type !== "select"),
  )?.[0];

  return (
    <>
      {Object.entries(schema).map(([fieldName, fieldDef]) => {
        const isFirstTextInput =
          fieldName === firstTextFieldName &&
          (!fieldDef.type ||
            fieldDef.type === "text" ||
            (fieldDef.type !== "checkbox" &&
              fieldDef.type !== "number" &&
              fieldDef.type !== "select"));

        if (fieldDef.type === "checkbox") {
          return (
            <label
              key={fieldName}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                name={fieldName}
                disabled={disabled}
                className="w-4 h-4 rounded border-[#333] bg-black text-white focus:ring-white/20 focus:ring-offset-0"
              />
              <span className="text-sm text-[#ccc]">{fieldDef.label}</span>
            </label>
          );
        }

        if (fieldDef.type === "number") {
          return (
            <label key={fieldName} className="flex flex-col gap-2">
              <span className="text-sm text-[#888]">{fieldDef.label}</span>
              <input
                type="number"
                name={fieldName}
                data-1p-ignore
                disabled={disabled}
                placeholder={fieldDef.placeholder || ""}
                className="w-full px-3 py-2.5 text-base bg-black border border-[#333] rounded-md text-[#fafafa] placeholder:text-[#666] focus:outline-none focus:border-[#888] focus:ring-[3px] focus:ring-white/5 disabled:bg-[#0a0a0a] disabled:border-[#222] disabled:text-[#888] transition-all"
              />
            </label>
          );
        }

        if (fieldDef.type === "select") {
          return (
            <label key={fieldName} className="flex flex-col gap-2">
              <span className="text-sm text-[#888]">{fieldDef.label}</span>
              <select
                name={fieldName}
                disabled={disabled}
                className="w-full px-3 py-2.5 text-base bg-black border border-[#333] rounded-md text-[#fafafa] focus:outline-none focus:border-[#888] focus:ring-[3px] focus:ring-white/5 disabled:bg-[#0a0a0a] disabled:border-[#222] disabled:text-[#888] transition-all"
              >
                {fieldDef.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        // Default: text input
        return (
          <label key={fieldName} className="flex flex-col gap-2">
            <span className="text-sm text-[#888]">{fieldDef.label}</span>
            <input
              type="text"
              name={fieldName}
              data-1p-ignore
              disabled={disabled}
              placeholder={fieldDef.placeholder || ""}
              autoFocus={isFirstTextInput}
              className="w-full px-3 py-2.5 text-base bg-black border border-[#333] rounded-md text-[#fafafa] placeholder:text-[#666] focus:outline-none focus:border-[#888] focus:ring-[3px] focus:ring-white/5 disabled:bg-[#0a0a0a] disabled:border-[#222] disabled:text-[#888] transition-all"
            />
          </label>
        );
      })}
    </>
  );
}
