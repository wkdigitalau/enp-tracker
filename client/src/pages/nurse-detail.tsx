import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

type NurseDetailData = {
  enrollment: {
    id: number;
    startDate: string;
    endDate: string;
    facilityName: string;
    programName: string;
    nurseName: string;
    nurseEmail: string;
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

export default function NurseDetailPage() {
  const [, params] = useRoute("/nurse/:enrollmentId");
  const [, setLocation] = useLocation();
  const enrollmentId = params?.enrollmentId;

  const { data, isLoading } = useQuery<NurseDetailData>({
    queryKey: ["/api/enrollment", enrollmentId],
    enabled: !!enrollmentId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Enrollment not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { enrollment, progress, stats } = data;
  const percentComplete = Math.round((stats.signedOff / stats.total) * 100);
  const initials = enrollment.nurseName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold" data-testid="text-nurse-name">
                {enrollment.nurseName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {enrollment.programName} &middot; {enrollment.facilityName}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-nurse-timeline">
                Week {enrollment.currentWeek} of {enrollment.totalWeeks} &middot;
                Started {format(new Date(enrollment.startDate), "MMM d, yyyy")} &middot;
                Ends {format(new Date(enrollment.endDate), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-xl font-bold">{percentComplete}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.signedOff}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Ready</p>
              <p className="text-xl font-bold text-amber-500">{stats.ready}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-xl font-bold text-destructive">{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
        </div>

        <Progress value={percentComplete} className="h-2" />

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
                    item.status !== "signed_off" && today > dueDate;

                  return (
                    <Link
                      key={item.competencyId}
                      href={`/week/${enrollment.id}/${item.competencyId}`}
                      data-testid={`link-week-${item.weekNumber}`}
                    >
                      <Card className={`hover-elevate transition-colors cursor-pointer ${
                        isOverdue ? "border-destructive/30" : item.status === "ready" ? "border-amber-400/30" : ""
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
