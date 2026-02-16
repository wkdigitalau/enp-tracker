import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, ChevronRight, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { format, differenceInDays } from "date-fns";

type QueueItem = {
  progressId: number;
  enrollmentId: number;
  competencyId: number;
  weekNumber: number;
  title: string;
  nurseName: string;
  facilityName: string;
  nurseReadyAt: string;
  dueDate: string;
};

export default function SignoffQueuePage() {
  const { data, isLoading } = useQuery<QueueItem[]>({
    queryKey: ["/api/manager/signoff-queue"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const items = data || [];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-queue-title">
            Sign-off Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Competencies awaiting your review and sign-off
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No competencies awaiting sign-off</p>
              <p className="text-sm text-muted-foreground mt-1">
                You'll see items here when nurses mark competencies as ready.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const dueDate = new Date(item.dueDate);
              const isOverdue = new Date() > dueDate;
              const initials = item.nurseName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Link
                  key={item.progressId}
                  href={`/week/${item.enrollmentId}/${item.competencyId}`}
                  data-testid={`link-queue-item-${item.progressId}`}
                >
                  <Card className={`hover-elevate cursor-pointer ${isOverdue ? "border-destructive/30" : "border-amber-400/30"}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{item.nurseName}</span>
                          <Badge variant="outline" className="text-[10px] py-0 no-default-hover-elevate">
                            {item.facilityName}
                          </Badge>
                        </div>
                        <p className="text-sm mt-0.5">
                          <span className="text-muted-foreground">Week {item.weekNumber}:</span>{" "}
                          {item.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>Due: {format(dueDate, "MMM d, yyyy")}</span>
                          <span>
                            Ready since{" "}
                            {format(new Date(item.nurseReadyAt), "MMM d")}
                          </span>
                        </div>
                      </div>
                      {isOverdue ? (
                        <Badge variant="destructive" className="no-default-hover-elevate">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate">
                          <Clock className="w-3 h-3 mr-1" /> Ready
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
