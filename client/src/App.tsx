import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

import LoginPage from "@/pages/login";
import AcceptInvitePage from "@/pages/accept-invite";
import NurseDashboard from "@/pages/nurse-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import WeekDetailPage from "@/pages/week-detail";
import NurseDetailPage from "@/pages/nurse-detail";
import SignoffQueuePage from "@/pages/signoff-queue";
import AdminUsersPage from "@/pages/admin-users";
import AdminFacilitiesPage from "@/pages/admin-facilities";
import AdminEnrollmentsPage from "@/pages/admin-enrollments";
import AdminRBACPage from "@/pages/admin-rbac";
import AdminDemoChecklist from "@/pages/admin-demo-checklist";
import AdminAboutPage from "@/pages/admin-about";
import HelpPage from "@/pages/help";
import NotFound from "@/pages/not-found";
import { WelcomeOverlay } from "@/components/welcome-overlay";

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "nurse") return <NurseDashboard />;
  if (user.role === "manager") return <ManagerDashboard />;
  return <ManagerDashboard />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={DashboardRouter} />
      <Route path="/week/:enrollmentId/:competencyId" component={WeekDetailPage} />
      <Route path="/nurse/:enrollmentId" component={NurseDetailPage} />
      <Route path="/signoff-queue" component={SignoffQueuePage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/facilities" component={AdminFacilitiesPage} />
      <Route path="/admin/enrollments" component={AdminEnrollmentsPage} />
      <Route path="/admin/rbac" component={AdminRBACPage} />
      <Route path="/admin/demo" component={AdminDemoChecklist} />
      <Route path="/admin/about" component={AdminAboutPage} />
      <Route path="/help" component={HelpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <AppRouter />
          </main>
          <WelcomeOverlay />
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (window.location.pathname.startsWith("/accept-invite")) return <AcceptInvitePage />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-14 w-14 mx-auto rounded-md" />
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-3 w-28 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <AuthenticatedLayout />;
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
