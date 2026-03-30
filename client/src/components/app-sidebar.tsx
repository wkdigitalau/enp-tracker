import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  LogOut,
  Shield,
  ShieldCheck,
  ListChecks,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel =
    user.role === "admin" ? "Administrator" : user.role === "manager" ? "Manager" : "Nurse";

  const nurseItems = [
    { title: "My Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Demo Checklist", url: "/admin/demo", icon: ListChecks },
    { title: "Help", url: "/help", icon: HelpCircle },
  ];

  const managerItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Sign-off Queue", url: "/signoff-queue", icon: ClipboardCheck },
    { title: "Demo Checklist", url: "/admin/demo", icon: ListChecks },
    { title: "Help", url: "/help", icon: HelpCircle },
  ];

  const adminItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Sign-off Queue", url: "/signoff-queue", icon: ClipboardCheck },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Facilities", url: "/admin/facilities", icon: Building2 },
    { title: "Enrollments", url: "/admin/enrollments", icon: ClipboardCheck },
    { title: "Access Control", url: "/admin/rbac", icon: ShieldCheck },
    { title: "Demo Checklist", url: "/admin/demo", icon: ListChecks },
    { title: "Help", url: "/help", icon: HelpCircle },
    { title: "About", url: "/admin/about", icon: Info },
  ];

  const items =
    user.role === "admin"
      ? adminItems
      : user.role === "manager"
        ? managerItems
        : nurseItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate" data-testid="text-app-title">
              Elite Nurse Partners
            </span>
            <span className="text-xs text-muted-foreground truncate">Training Platform</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/"
                        ? location === "/"
                        : location.startsWith(item.url)
                    }
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate" data-testid="text-user-name">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground truncate" data-testid="text-user-role">
              {roleLabel}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
