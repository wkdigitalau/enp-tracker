import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Shield,
  Users,
  ClipboardCheck,
  Bell,
  Building2,
  Calendar,
  Eye,
  Lock,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

type CheckItem = {
  id: string;
  label: string;
  detail: string;
};

type Section = {
  title: string;
  icon: any;
  description: string;
  loginAs?: string;
  items: CheckItem[];
};

const sections: Section[] = [
  {
    title: "1. Nurse Experience",
    icon: Users,
    description: "Log in as a nurse to verify their dashboard and workflow.",
    loginAs: "sarah@enp.com / nurse123",
    items: [
      {
        id: "nurse-login",
        label: "Nurse can log in",
        detail: "Log in with nurse credentials. Confirm the nurse dashboard loads with a welcome message.",
      },
      {
        id: "nurse-timeline",
        label: "Program timeline is visible",
        detail: "Confirm the 'Program Timeline' card shows start date, end date, current week (e.g. 'Week X of 50'), and weeks remaining.",
      },
      {
        id: "nurse-stats",
        label: "Progress stats are accurate",
        detail: "Check the four stat cards: Completed, Ready for Sign-off, Overdue, and Progress percentage.",
      },
      {
        id: "nurse-phases",
        label: "Competencies grouped by phase",
        detail: "Scroll down and confirm competencies are organised into 7 phases (Orientation, Clinical Care, etc.) with week numbers.",
      },
      {
        id: "nurse-mark-ready",
        label: "Nurse can mark a competency as 'Ready'",
        detail: "Click into a 'Not Started' competency. Click 'Mark as Ready'. Confirm the status changes to 'Ready' with a timestamp.",
      },
      {
        id: "nurse-cannot-signoff",
        label: "Nurse CANNOT sign off their own work",
        detail: "On a 'Ready' competency, confirm there is no 'Sign Off' button visible. Only managers/admins can sign off.",
      },
      {
        id: "nurse-comments",
        label: "Nurse can add comments/notes",
        detail: "On any competency detail page, add a comment in the Notes section. Confirm it appears with your name and timestamp.",
      },
      {
        id: "nurse-overdue",
        label: "Overdue items show red badges",
        detail: "Check that any competencies past their due date show a red 'Overdue' badge and red border highlighting.",
      },
      {
        id: "nurse-notification",
        label: "Nurse receives sign-off notifications",
        detail: "After a manager signs off a competency (tested later), check the bell icon shows an unread notification.",
      },
      {
        id: "nurse-no-admin",
        label: "Nurse CANNOT access admin pages",
        detail: "Confirm the sidebar does NOT show Users, Facilities, Enrollments, or Access Control links.",
      },
    ],
  },
  {
    title: "2. Manager Experience",
    icon: ClipboardCheck,
    description: "Log in as a manager to verify oversight and sign-off capabilities.",
    loginAs: "candace@enp.com / manager123",
    items: [
      {
        id: "mgr-login",
        label: "Manager can log in",
        detail: "Log out of the nurse account and log in with manager credentials. Confirm the manager dashboard loads.",
      },
      {
        id: "mgr-nurse-list",
        label: "Can see enrolled nurses with progress",
        detail: "Confirm you can see a list of nurses with their completion percentage, week progress, and end date.",
      },
      {
        id: "mgr-facility-filter",
        label: "Facility filter works",
        detail: "If multiple facilities exist, use the facility dropdown to filter. Confirm only nurses from the selected facility appear.",
      },
      {
        id: "mgr-drill-down",
        label: "Can drill down into a nurse's detail",
        detail: "Click on a nurse card. Confirm you see their full competency roadmap with timeline, start date, and end date.",
      },
      {
        id: "mgr-signoff-queue",
        label: "Sign-off queue shows pending items",
        detail: "Navigate to 'Sign-off Queue' in the sidebar. Confirm any competencies marked 'Ready' by nurses appear here.",
      },
      {
        id: "mgr-can-signoff",
        label: "Manager can sign off competencies",
        detail: "Click into a 'Ready' competency and click 'Sign Off'. Confirm it changes to 'Signed Off' with your name and timestamp.",
      },
      {
        id: "mgr-notification",
        label: "Manager receives 'ready' notifications",
        detail: "When a nurse marks something as ready, the bell icon should show an unread notification for the manager.",
      },
      {
        id: "mgr-only-own-facilities",
        label: "Manager can ONLY see their assigned facilities",
        detail: "Confirm the dashboard only shows nurses from facilities assigned to this manager, not all facilities in the system.",
      },
      {
        id: "mgr-no-admin",
        label: "Manager CANNOT access admin pages",
        detail: "Confirm the sidebar does NOT show Users, Facilities, Enrollments, or Access Control links.",
      },
    ],
  },
  {
    title: "3. Admin Experience",
    icon: Shield,
    description: "Log in as admin to verify full system control.",
    loginAs: "amy@enp.com / admin123",
    items: [
      {
        id: "admin-login",
        label: "Admin can log in",
        detail: "Log out and log in with admin credentials. Confirm the dashboard loads showing ALL facilities and ALL nurses.",
      },
      {
        id: "admin-global-view",
        label: "Admin sees all facilities and nurses",
        detail: "Confirm the dashboard shows nurses across every facility, not just one. Use the facility filter to verify.",
      },
      {
        id: "admin-signoff",
        label: "Admin can sign off any competency",
        detail: "Navigate to Sign-off Queue or a nurse's detail page. Confirm you can sign off competencies for any nurse.",
      },
      {
        id: "admin-users",
        label: "Admin can manage users",
        detail: "Go to Users page. Confirm you can see all users and create new users with any role (nurse, manager, admin).",
      },
      {
        id: "admin-facilities",
        label: "Admin can manage facilities",
        detail: "Go to Facilities page. Confirm you can see all facilities and create new ones. Verify manager-facility assignments.",
      },
      {
        id: "admin-enrollments",
        label: "Admin can manage enrollments",
        detail: "Go to Enrollments page. Confirm you can create new enrollments linking a nurse to a program and facility.",
      },
      {
        id: "admin-rbac",
        label: "Access Control matrix is accurate",
        detail: "Go to Access Control page. Review every row in the permissions table. Confirm VIEW/EDIT permissions match what you experienced in steps 1-3.",
      },
    ],
  },
  {
    title: "4. Notifications & Workflow",
    icon: Bell,
    description: "Verify the end-to-end notification flow works correctly.",
    items: [
      {
        id: "flow-ready-notif",
        label: "Nurse 'Mark Ready' notifies manager",
        detail: "As nurse: mark a competency as ready. Then log in as manager: check the bell icon for a new notification about it.",
      },
      {
        id: "flow-signoff-notif",
        label: "Manager 'Sign Off' notifies nurse",
        detail: "As manager: sign off that competency. Then log in as nurse: check the bell icon for a notification confirming sign-off.",
      },
      {
        id: "flow-click-notif",
        label: "Clicking a notification navigates to the right page",
        detail: "Click on a notification in the bell dropdown. Confirm it takes you directly to the relevant competency detail page.",
      },
      {
        id: "flow-mark-read",
        label: "Notifications can be marked as read",
        detail: "Confirm the 'Mark all read' button clears the unread count on the bell icon.",
      },
    ],
  },
  {
    title: "5. Program Timeline & Dates",
    icon: Calendar,
    description: "Verify end dates and weekly progress tracking across all views.",
    items: [
      {
        id: "timeline-nurse",
        label: "Nurse dashboard shows program end date",
        detail: "As nurse: confirm the Program Timeline card shows when the 50-week program ends.",
      },
      {
        id: "timeline-manager",
        label: "Manager sees end dates per nurse",
        detail: "As manager: confirm each nurse card shows their current week and program end date.",
      },
      {
        id: "timeline-detail",
        label: "Nurse detail page shows full timeline",
        detail: "Click into a nurse. Confirm the header shows: Week X of 50, start date, and end date.",
      },
      {
        id: "timeline-due-dates",
        label: "Individual competency due dates are correct",
        detail: "Check that each weekly competency shows a due date that makes sense (approximately 1 week apart from the previous).",
      },
    ],
  },
  {
    title: "6. Confirm or Flag",
    icon: AlertTriangle,
    description: "Final confirmation items to discuss.",
    items: [
      {
        id: "confirm-rbac",
        label: "RBAC permissions are correct as shown in Access Control page",
        detail: "Are there any permissions that should be different? Any features a role should or shouldn't have?",
      },
      {
        id: "confirm-notifications",
        label: "Notification triggers are appropriate",
        detail: "Currently: nurse marks ready -> manager notified. Manager signs off -> nurse notified. Are these the right triggers? Too many? Too few?",
      },
      {
        id: "confirm-phases",
        label: "Competency phases and titles are correct",
        detail: "Review the 7 phase names and 50 competency titles. Flag any that need renaming or reorganising.",
      },
      {
        id: "confirm-look-feel",
        label: "Visual design and dark theme work well",
        detail: "Does the black background with white text feel right? Any colour or layout changes needed?",
      },
      {
        id: "confirm-mobile",
        label: "iPad/tablet experience is acceptable",
        detail: "Open the app on an iPad or tablet. Does the layout work? Are there any touch issues?",
      },
    ],
  },
];

export default function AdminDemoChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-demo-title">
            Mid-Build Demo Checklist
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Day 7 milestone review &mdash; test each feature and confirm or flag for discussion
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="secondary" className="no-default-hover-elevate" data-testid="badge-progress">
              {checkedCount} / {totalItems} checked
            </Badge>
            {checkedCount === totalItems && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 no-default-hover-elevate">
                All items reviewed
              </Badge>
            )}
          </div>
        </div>

        {sections.map((section) => {
          const sectionChecked = section.items.filter((i) => checked[i.id]).length;
          return (
            <Card key={section.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  <Badge variant="outline" className="ml-auto text-[10px] no-default-hover-elevate">
                    {sectionChecked}/{section.items.length}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{section.description}</p>
                {section.loginAs && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Login: <span className="font-mono">{section.loginAs}</span>
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      checked[item.id]
                        ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30"
                        : "border-border/50 hover:bg-muted/30"
                    }`}
                    onClick={() => toggle(item.id)}
                    data-testid={`check-${item.id}`}
                  >
                    <Checkbox
                      checked={!!checked[item.id]}
                      onCheckedChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${checked[item.id] ? "line-through text-muted-foreground" : ""}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                    </div>
                    {checked[item.id] && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
