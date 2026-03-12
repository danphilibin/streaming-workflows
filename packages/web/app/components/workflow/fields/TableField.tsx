import { useCallback, useEffect, useRef, useState } from "react";
import { Table } from "@cloudflare/kumo/components/table";
import { Input } from "@cloudflare/kumo/components/input";
import { Loader } from "@cloudflare/kumo/components/loader";
import type { LoaderTableData, TableFieldDefinition } from "relay-sdk/client";
import { apiPath } from "../../../lib/api";
import type { FieldProps } from "../SchemaFieldComponents";

export function TableField({
  fieldName,
  fieldDef,
  disabled,
  defaultValue,
  onChange,
}: FieldProps) {
  const def = fieldDef as TableFieldDefinition;
  const { loader, selection } = def;
  const pageSize = loader.pageSize ?? 20;

  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [data, setData] = useState<LoaderTableData | null>(null);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set((defaultValue as string[] | undefined) ?? []),
  );

  const fetchData = useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      setError(null);
      const url = apiPath(loader.path);

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: p,
            pageSize,
            query: q || undefined,
          }),
        });
        if (!res.ok) {
          throw new Error(`Loader returned ${res.status}`);
        }
        const result: LoaderTableData = await res.json();
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    },
    [loader.path, pageSize],
  );

  useEffect(() => {
    onChange(fieldName, Array.from(selectedKeys));
  }, [fieldName, onChange, selectedKeys]);

  useEffect(() => {
    if (!disabled) {
      fetchData(page, debouncedQuery);
    }
  }, [page, debouncedQuery, fetchData, disabled]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setDebouncedQuery(value);
    }, 300);
  };

  const toggleRow = (key: string) => {
    if (disabled) return;

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (selection === "single") {
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.clear();
          next.add(key);
        }
      } else if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const totalCount = data?.totalCount;
  const totalPages =
    totalCount !== undefined ? Math.ceil(totalCount / pageSize) : undefined;
  const hasNext =
    totalPages !== undefined
      ? page < totalPages - 1
      : (data?.rows.length ?? 0) === pageSize;
  const hasPrev = page > 0;

  if (disabled) {
    const keys = Array.from(selectedKeys);
    return (
      <div className="space-y-2">
        <div className="text-base text-[#fafafa]">{def.label}</div>
        {def.description && (
          <div className="text-sm text-kumo-subtle">{def.description}</div>
        )}
        <div className="text-sm text-kumo-subtle">
          Selected {keys.length} row{keys.length !== 1 ? "s" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-base text-[#fafafa]">{def.label}</div>
        {def.description && (
          <div className="text-sm text-kumo-subtle">{def.description}</div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-64">
          <Input
            type="text"
            label="Search"
            placeholder="Search..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleQueryChange(e.target.value)
            }
          />
        </div>
        {loading && <Loader size="sm" />}
      </div>

      {error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : data && data.rows.length === 0 ? (
        <div className="text-sm leading-relaxed text-kumo-subtle">
          (no rows)
        </div>
      ) : data ? (
        <div className="overflow-x-auto">
          <Table className="text-sm border border-[#222] rounded-md">
            <Table.Header>
              <Table.Row>
                <Table.CheckHead />
                {data.columns.map((col) => (
                  <Table.Head key={col.key}>{col.label}</Table.Head>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.rows.map((row, rowIndex) => {
                const key = row.rowKey ?? `${rowIndex}`;
                const checked = selectedKeys.has(key);

                return (
                  <Table.Row
                    key={key}
                    variant={checked ? "selected" : "default"}
                    onClick={() => toggleRow(key)}
                    className="cursor-pointer"
                  >
                    <Table.CheckCell
                      checked={checked}
                      onValueChange={() => toggleRow(key)}
                    />
                    {data.columns.map((col) => (
                      <Table.Cell key={col.key}>
                        {row.cells[col.key] ?? ""}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      ) : null}

      <div className="flex items-center gap-3 text-sm text-kumo-subtle">
        <button
          type="button"
          className="text-inherit disabled:opacity-50"
          disabled={!hasPrev}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>
          Page {page + 1}
          {totalPages !== undefined ? ` of ${totalPages}` : ""}
          {totalCount !== undefined ? ` (${totalCount} total)` : ""}
        </span>
        <button
          type="button"
          className="text-inherit disabled:opacity-50"
          disabled={!hasNext}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {selectedKeys.size > 0 && (
        <div className="text-sm text-kumo-subtle">
          {selectedKeys.size} row{selectedKeys.size !== 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
}
