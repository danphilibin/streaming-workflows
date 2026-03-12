import { createWorkflow, loader, tableRenderer } from "relay-sdk";
import { db, type User, DEPARTMENTS } from "../lib/mock-db";

const userTableRenderer = tableRenderer<User>("user-table", {
  columns: [
    { label: "ID", accessorKey: "id" },
    {
      label: "Display",
      renderCell: (user) => `${user.name} <${user.email}>`,
    },
    { label: "Department", accessorKey: "department" },
    { label: "Role", accessorKey: "role" },
  ],
});

export const browseUsers = createWorkflow({
  name: "Users",
  loaders: {
    // Config-object form: rowKey + resolve enable input.table() to resolve
    // selected row identities back to full source rows on the server.
    users: loader({
      rowKey: "id",
      load: async ({ query, page, pageSize }) => {
        return db.users.findMany({ query, page, pageSize });
      },
      resolve: async ({ keys }) => {
        return db.users.findByIds(keys);
      },
    }),

    // Simple function form still works for output-only loaders
    deptUsers: loader(
      { department: "string" },
      async ({ department, query, page, pageSize }) => {
        return db.users.findByDepartment(department, { query, page, pageSize });
      },
    ),
  },

  handler: async ({ input, output, loaders }) => {
    // Let the user pick a user from the paginated table.
    // The client only sees display columns + rowKey. On submit it sends
    // the rowKey values; the server calls resolve() to get the full rows.
    const selectedUser = await input.table({
      prompt: "Pick a user to view",
      source: loaders.users,
      tableRenderer: userTableRenderer,
      pageSize: 5,
    });

    await output.markdown(
      `You selected **${selectedUser.name}** (${selectedUser.email})`,
    );

    // Now pick a department and show a department-scoped table
    const { department } = await input("Select a department", {
      department: {
        type: "select",
        label: "Department",
        options: ["All", ...DEPARTMENTS].map((department) => ({
          value: department,
          label: department,
        })),
      },
    });

    // Department-scoped view (output, not input)
    await output.table({
      title: department,
      source:
        department === "All"
          ? loaders.users
          : loaders.deptUsers({ department }),
      pageSize: 5,
      tableRenderer: userTableRenderer,
    });
  },
});
