export function RBACMatrix() {
  type Permission = "view" | "edit" | "none" | "view-scoped" | "edit-scoped";

  type Row = {
    feature: string;
    action: string;
    nurse: Permission;
    nurseNote?: string;
    manager: Permission;
    managerNote?: string;
    admin: Permission;
    adminNote?: string;
  };

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: "Dashboards",
      rows: [
        { feature: "Nurse Dashboard", action: "View own dashboard", nurse: "view", manager: "none", admin: "none" },
        { feature: "Nurse Dashboard", action: "View program end date & week progress", nurse: "view", manager: "none", admin: "none" },
        { feature: "Manager Dashboard", action: "View nurse list & stats", nurse: "none", manager: "view-scoped", managerNote: "Own facilities", admin: "view", adminNote: "All facilities" },
        { feature: "Manager Dashboard", action: "Filter by facility", nurse: "none", manager: "view", admin: "view" },
      ],
    },
    {
      title: "Competency Progress",
      rows: [
        { feature: "Competencies", action: "View own competencies", nurse: "view", manager: "none", admin: "none" },
        { feature: "Competencies", action: "View a nurse's competencies", nurse: "none", manager: "view-scoped", managerNote: "Own facilities", admin: "view", adminNote: "All" },
        { feature: "Competencies", action: "Mark as Ready", nurse: "edit", nurseNote: "Own only", manager: "none", admin: "edit", adminNote: "Any" },
        { feature: "Competencies", action: "Sign Off", nurse: "none", manager: "edit-scoped", managerNote: "Own facilities", admin: "edit", adminNote: "Any" },
      ],
    },
    {
      title: "Sign-off Queue",
      rows: [
        { feature: "Sign-off Queue", action: "View queue", nurse: "none", manager: "view-scoped", managerNote: "Own facilities", admin: "view", adminNote: "All" },
        { feature: "Sign-off Queue", action: "Process sign-offs", nurse: "none", manager: "edit-scoped", managerNote: "Own facilities", admin: "edit", adminNote: "All" },
      ],
    },
    {
      title: "Comments & Notifications",
      rows: [
        { feature: "Comments", action: "View comments", nurse: "view", nurseNote: "Own", manager: "view", admin: "view" },
        { feature: "Comments", action: "Add comments", nurse: "edit", nurseNote: "Own", manager: "edit", admin: "edit" },
        { feature: "Notifications", action: "Receive notifications", nurse: "view", manager: "view", admin: "view" },
        { feature: "Notifications", action: "Mark as read", nurse: "edit", manager: "edit", admin: "edit" },
      ],
    },
    {
      title: "Administration",
      rows: [
        { feature: "User Mgmt", action: "View all users", nurse: "none", manager: "none", admin: "view" },
        { feature: "User Mgmt", action: "Create users", nurse: "none", manager: "none", admin: "edit" },
        { feature: "Facility Mgmt", action: "View facilities", nurse: "none", manager: "none", admin: "view" },
        { feature: "Facility Mgmt", action: "Create facilities", nurse: "none", manager: "none", admin: "edit" },
        { feature: "Facility Mgmt", action: "Assign managers to facilities", nurse: "none", manager: "none", admin: "edit" },
        { feature: "Enrollment Mgmt", action: "View enrollments", nurse: "none", manager: "none", admin: "view" },
        { feature: "Enrollment Mgmt", action: "Create enrollments", nurse: "none", manager: "none", admin: "edit" },
      ],
    },
  ];

  function PermissionCell({ perm, note }: { perm: Permission; note?: string }) {
    if (perm === "none") {
      return <span className="text-gray-400">&mdash;</span>;
    }
    const isView = perm === "view" || perm === "view-scoped";
    const isScoped = perm === "view-scoped" || perm === "edit-scoped";
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          isView
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        }`}>
          {isView ? "VIEW" : "EDIT"}
        </span>
        {(note || isScoped) && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight text-center">
            {note}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-['Inter',sans-serif]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">RBAC Matrix</h1>
          <p className="text-sm text-gray-400 mt-1">
            Elite Nurse Partners Training Platform &mdash; Role-Based Access Control
          </p>
        </div>

        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="text-left px-4 py-3 font-semibold text-gray-300 w-[22%]">Feature</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-300 w-[30%]">Action</th>
                <th className="text-center px-4 py-3 font-semibold w-[16%]">
                  <span className="text-pink-400">Nurse</span>
                </th>
                <th className="text-center px-4 py-3 font-semibold w-[16%]">
                  <span className="text-amber-400">Manager</span>
                </th>
                <th className="text-center px-4 py-3 font-semibold w-[16%]">
                  <span className="text-violet-400">Admin</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, si) => (
                <>
                  <tr key={`section-${si}`} className="bg-gray-900/50">
                    <td colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 border-t border-gray-800">
                      {section.title}
                    </td>
                  </tr>
                  {section.rows.map((row, ri) => (
                    <tr
                      key={`row-${si}-${ri}`}
                      className={`border-t border-gray-800/50 ${ri % 2 === 0 ? "bg-gray-950" : "bg-gray-900/20"}`}
                    >
                      <td className="px-4 py-2.5 text-gray-300 text-xs font-medium">{row.feature}</td>
                      <td className="px-4 py-2.5 text-gray-200 text-xs">{row.action}</td>
                      <td className="px-4 py-2.5 text-center">
                        <PermissionCell perm={row.nurse} note={row.nurseNote} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <PermissionCell perm={row.manager} note={row.managerNote} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <PermissionCell perm={row.admin} note={row.adminNote} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">VIEW</span>
            <span>Can see / read data</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold">EDIT</span>
            <span>Can create / modify data</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">&mdash;</span>
            <span>No access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
