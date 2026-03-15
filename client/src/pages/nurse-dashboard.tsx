import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays, addDays } from "date-fns";

type EnrollmentWithProgress = {
  enrollment: {
    id: number;
    startDate: string;
    endDate: string;
    facilityName: string;
    programName: string;
    totalWeeks: number;
    currentWeek: number;
  };
  progress: Array<{
    id: number;
    competencyId: number;
    weekNumber: number;
    title: string;
    phase: string;
    status: string;
    dueDate: string;
    nurseReadyAt: string | null;
    signedOffAt: string | null;
    signedOffByName: string | null;
  }>;
  stats: {
    total: number;
    signedOff: number;
    ready: number;
    notStarted: number;
    overdue: number;
  };
};

const phases = [
  { name: "Orientation and Foundations", weeks: "1-4" },
  { name: "Clinical Care and Documentation", weeks: "5-12" },
  { name: "Dementia, Palliative, and Behavioural Care", weeks: "13-20" },
  { name: "Compliance and Risk", weeks: "21-28" },
  { name: "Leadership and Team Coordination", weeks: "29-36" },
  { name: "Quality, Projects and Broader Understanding", weeks: "37-44" },
  { name: "Independence and Reflection", weeks: "45-50" },
];

function StatusIcon({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  if (status === "signed_off") return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  if (status === "ready") return <Clock className="w-4 h-4 text-amber-500" />;
  if (isOverdue) return <AlertTriangle className="w-4 h-4 text-destructive" />;
  return <Circle className="w-4 h-4 text-muted-foreground/40" />;
}

function StatusBadge({ status, isOverdue }: { status: string; isOverdue: boolean }) {
  if (status === "signed_off")
    return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 no-default-hover-elevate">Signed Off</Badge>;
  if (status === "ready")
    return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate">Ready</Badge>;
  if (isOverdue)
    return <Badge variant="destructive" className="no-default-hover-elevate">Overdue</Badge>;
  return <Badge variant="outline" className="no-default-hover-elevate">Not Started</Badge>;
}

export default function NurseDashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<EnrollmentWithProgress>({
    queryKey: ["/api/nurse/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You are not enrolled in any program yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact your manager to get enrolled.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { enrollment, progress, stats } = data;
  const percentComplete = Math.round((stats.signedOff / stats.total) * 100);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-dashboard-title">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {enrollment.programName} &middot; {enrollment.facilityName}
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Program Timeline</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Started: {format(new Date(enrollment.startDate), "MMM d, yyyy")}</span>
              <span data-testid="text-end-date">Ends: {format(new Date(enrollment.endDate), "MMM d, yyyy")}</span>
            </div>
            <Progress value={(enrollment.currentWeek / enrollment.totalWeeks) * 100} className="h-2 mb-1.5" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground" data-testid="text-current-week">
                Week {enrollment.currentWeek} of {enrollment.totalWeeks}
              </span>
              <span className="text-muted-foreground">
                {enrollment.totalWeeks - enrollment.currentWeek} weeks remaining
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-stat-completed">
                {stats.signedOff}
              </p>
              <p className="text-xs text-muted-foreground">of {stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Ready for Sign-off</p>
              <p className="text-2xl font-bold text-amber-500" data-testid="text-stat-ready">
                {stats.ready}
              </p>
              <p className="text-xs text-muted-foreground">awaiting</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Overdue</p>
              <p className="text-2xl font-bold text-destructive" data-testid="text-stat-overdue">
                {stats.overdue}
              </p>
              <p className="text-xs text-muted-foreground">action needed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Progress</p>
              <p className="text-2xl font-bold" data-testid="text-stat-progress">
                {percentComplete}%
              </p>
              <Progress value={percentComplete} className="mt-1 h-2" />
            </CardContent>
          </Card>
        </div>

        {phases.map((phase) => {
          const [startWeek, endWeek] = phase.weeks.split("-").map(Number);
          const phaseItems = progress.filter(
            (p) => p.weekNumber >= startWeek && p.weekNumber <= endWeek
          );
          if (phaseItems.length === 0) return null;

          return (
            <div key={phase.name}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Weeks {phase.weeks}: {phase.name}
              </h2>
              <div className="space-y-1.5">
                {phaseItems.map((item) => {
                  const dueDate = new Date(item.dueDate);
                  const today = new Date();
                  const isOverdue =
                    item.status !== "signed_off" &&
                    differenceInDays(today, dueDate) > 0;
                  const isDueSoon =
                    item.status !== "signed_off" &&
                    !isOverdue &&
                    differenceInDays(dueDate, today) <= 3;

                  return (
                    <Link
                      key={item.competencyId}
                      href={`/week/${enrollment.id}/${item.competencyId}`}
                      data-testid={`link-week-${item.weekNumber}`}
                    >
                      <Card className={`hover-elevate transition-colors cursor-pointer ${
                        isOverdue ? "border-destructive/30" : isDueSoon ? "border-amber-400/30" : ""
                      }`}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <StatusIcon status={item.status} isOverdue={isOverdue} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-muted-foreground">
                                Week {item.weekNumber}
                              </span>
                              <span className="text-sm truncate">{item.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Due: {format(dueDate, "MMM d, yyyy")}
                              {item.signedOffAt && item.signedOffByName && (
                                <span className="ml-2">
                                  Signed off by {item.signedOffByName} on{" "}
                                  {format(new Date(item.signedOffAt), "MMM d")}
                                </span>
                              )}
                            </p>
                          </div>
                          <StatusBadge status={item.status} isOverdue={isOverdue} />
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
