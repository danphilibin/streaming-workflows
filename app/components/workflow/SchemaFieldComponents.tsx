import { Input } from "@cloudflare/kumo/components/input";
import { Checkbox } from "@cloudflare/kumo/components/checkbox";
import { Select } from "@cloudflare/kumo/components/select";
import type { InputFieldDefinition } from "@/isomorphic/input";

export type FieldProps = {
  fieldName: string;
  fieldDef: InputFieldDefinition;
  disabled: boolean;
  defaultValue?: unknown;
  autoFocus?: boolean;
  onChange: (fieldName: string, value: unknown) => void;
};

export type FieldRegistryEntry = {
  autoFocusable: boolean;
  component: React.ComponentType<FieldProps>;
};

function TextField({
  fieldName,
  fieldDef,
  disabled,
  defaultValue,
  autoFocus,
  onChange,
}: FieldProps) {
  return (
    <Input
      type="text"
      name={fieldName}
      label={fieldDef.label}
      data-1p-ignore
      disabled={disabled}
      defaultValue={defaultValue as string | undefined}
      placeholder={
        (fieldDef as Extract<InputFieldDefinition, { type: "text" }>)
          .placeholder || ""
      }
      autoFocus={autoFocus}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(fieldName, e.target.value);
      }}
    />
  );
}

function NumberField({
  fieldName,
  fieldDef,
  disabled,
  defaultValue,
  onChange,
}: FieldProps) {
  return (
    <Input
      type="number"
      name={fieldName}
      label={fieldDef.label}
      data-1p-ignore
      disabled={disabled}
      defaultValue={defaultValue as number | undefined}
      placeholder={
        (fieldDef as Extract<InputFieldDefinition, { type: "number" }>)
          .placeholder || ""
      }
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(fieldName, e.target.value ? Number(e.target.value) : 0);
      }}
    />
  );
}

function CheckboxField({
  fieldName,
  fieldDef,
  disabled,
  defaultValue,
  onChange,
}: FieldProps) {
  return (
    <Checkbox
      label={fieldDef.label}
      name={fieldName}
      disabled={disabled}
      checked={defaultValue === true ? true : undefined}
      onCheckedChange={(checked) => {
        onChange(fieldName, checked);
      }}
    />
  );
}

function SelectField({
  fieldName,
  fieldDef,
  disabled,
  defaultValue,
  onChange,
}: FieldProps) {
  const def = fieldDef as Extract<InputFieldDefinition, { type: "select" }>;
  const defaultVal = defaultValue as string | undefined;

  return (
    <Select
      label={def.label}
      hideLabel={false}
      disabled={disabled}
      defaultValue={defaultVal ?? def.options?.[0]?.value}
      renderValue={(value: unknown) => {
        const opt = def.options?.find((o) => o.value === value);
        return opt?.label ?? String(value ?? "");
      }}
      onValueChange={(v) => {
        onChange(fieldName, v);
      }}
    >
      {def.options?.map((opt) => (
        <Select.Option key={opt.value} value={opt.value}>
          {opt.label}
        </Select.Option>
      ))}
    </Select>
  );
}

export const FIELD_REGISTRY: Record<
  InputFieldDefinition["type"],
  FieldRegistryEntry
> = {
  text: { autoFocusable: true, component: TextField },
  number: { autoFocusable: true, component: NumberField },
  checkbox: { autoFocusable: false, component: CheckboxField },
  select: { autoFocusable: false, component: SelectField },
};
