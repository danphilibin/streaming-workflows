/// <reference types="vite/client" />
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  createRootRoute,
  Link,
  Outlet,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { WorkflowMeta } from "relay-sdk/client";
import { apiPath } from "../lib/api";
import "../app.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
      },
    ],
  }),
  component: RootComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <div className="flex h-screen bg-kumo-base text-kumo-default font-sans">
        <Sidebar />
        <Outlet />
      </div>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-mode="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Sidebar() {
  const [workflows, setWorkflows] = useState<WorkflowMeta[]>([]);

  useEffect(() => {
    fetch(apiPath("workflows"))
      .then((res) => res.json() as Promise<{ workflows: WorkflowMeta[] }>)
      .then((data) => setWorkflows(data.workflows))
      .catch((err) => console.error("Failed to load workflows:", err));
  }, []);

  const baseClasses =
    "block w-full text-left px-3.5 py-3 rounded-md mb-1 transition-colors";

  return (
    <div className="w-[240px] bg-[#0a0a0a] border-r border-[#222] flex flex-col">
      <div className="p-5 h-16 border-b border-[#222] flex items-center justify-between">
        <Link
          to="/"
          className="text-base font-semibold tracking-tight flex items-center gap-2"
        >
          Workflows
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {workflows.map((workflow) => (
          <Link
            key={workflow.slug}
            to="/$workflowName"
            params={{ workflowName: workflow.slug }}
            activeProps={{
              className: `${baseClasses} bg-[#1a1a1a] text-white`,
            }}
            inactiveProps={{
              className: `${baseClasses} text-[#888] hover:bg-[#1a1a1a] hover:text-white`,
            }}
          >
            <div className="font-medium text-sm">{workflow.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: unknown }) {
  const isDev = import.meta.env.DEV;
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <main className="flex-1 flex items-center justify-center text-[#666]">
      <div className="text-center">
        <h1 className="text-lg font-semibold mb-2">Error</h1>
        <p>{errorMessage}</p>
        {isDev && errorStack && (
          <pre className="mt-4 p-4 bg-[#111] rounded-lg text-left text-sm overflow-x-auto max-w-xl">
            <code>{errorStack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
