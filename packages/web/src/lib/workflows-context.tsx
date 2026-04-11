import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { WorkflowMeta } from "@relay-tools/sdk/client";
import { apiFetch } from "./api";

interface WorkflowsState {
  workflows: WorkflowMeta[];
  loading: boolean;
  error: string | null;
}

const WorkflowsContext = createContext<WorkflowsState>({
  workflows: [],
  loading: true,
  error: null,
});

export function WorkflowsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkflowsState>({
    workflows: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    apiFetch("workflows")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          let message = `HTTP ${res.status}`;
          try {
            const json = JSON.parse(body);
            if (json.error) message = json.error;
          } catch {
            if (body) message = body;
          }
          throw new Error(message);
        }
        return res.json() as Promise<{ workflows: WorkflowMeta[] }>;
      })
      .then((data) =>
        setState({ workflows: data.workflows, loading: false, error: null }),
      )
      .catch((err) =>
        setState({
          workflows: [],
          loading: false,
          error:
            err instanceof Error ? err.message : "Failed to load workflows",
        }),
      );
  }, []);

  return (
    <WorkflowsContext.Provider value={state}>
      {children}
    </WorkflowsContext.Provider>
  );
}

export function useWorkflows(): WorkflowsState {
  return useContext(WorkflowsContext);
}
