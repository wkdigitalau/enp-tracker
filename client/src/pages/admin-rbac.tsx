import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  const isView = perm === "view" || perm === "view-scoped";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Badge
        variant="secondary"
        className={`text-[10px] no-default-hover-elevate ${
          isView
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        }`}
      >
        {isView ? "VIEW" : "EDIT"}
      </Badge>
      {note && (
        <span className="text-[10px] text-muted-foreground leading-tight text-center">
          {note}
        </span>
      )}
    </div>
  );
}

export default function AdminRBACPage() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-rbac-title">
            Role-Based Access Control
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Permissions matrix for Nurse, Manager, and Admin roles
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm" data-testid="table-rbac">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-[22%]">Feature</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-[30%]">Action</th>
                <th className="text-center px-4 py-3 font-semibold w-[16%]">
                  <span className="text-pink-500 dark:text-pink-400">Nurse</span>
                </th>
                <th className="text-center px-4 py-3 font-semibold w-[16%]">
                  <span className="text-amber-500 dark:text-amber-400">Manager</span>
                </th>
                <th className="text-center px-4 py-3 font-semibold w-[16%]">
                  <span className="text-violet-500 dark:text-violet-400">Admin</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, si) => (
                <>
                  <tr key={`section-${si}`}>
                    <td colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-t">
                      {section.title}
                    </td>
                  </tr>
                  {section.rows.map((row, ri) => (
                    <tr
                      key={`row-${si}-${ri}`}
                      className="border-t border-border/50"
                    >
                      <td className="px-4 py-2.5 text-xs font-medium">{row.feature}</td>
                      <td className="px-4 py-2.5 text-xs text-foreground">{row.action}</td>
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

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 no-default-hover-elevate">VIEW</Badge>
            <span>Can see / read data</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 no-default-hover-elevate">EDIT</Badge>
            <span>Can create / modify data</span>
          </div>
          <div className="flex items-center gap-2">
            <span>&mdash;</span>
            <span>No access</span>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
