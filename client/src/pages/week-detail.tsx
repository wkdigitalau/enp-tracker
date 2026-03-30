import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  ClipboardCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type WeekDetailData = {
  progress: {
    id: number;
    status: string;
    nurseReadyAt: string | null;
    signedOffAt: string | null;
    signedOffByName: string | null;
  };
  competency: {
    id: number;
    weekNumber: number;
    title: string;
    phase: string;
  };
  enrollment: {
    id: number;
    nurseName: string;
    facilityName: string;
  };
  dueDate: string;
  comments: Array<{
    id: number;
    text: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  }>;
};

export default function WeekDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/week/:enrollmentId/:competencyId");
  const [, setLocation] = useLocation();
  const [comment, setComment] = useState("");

  const enrollmentId = params?.enrollmentId;
  const competencyId = params?.competencyId;

  const { data, isLoading } = useQuery<WeekDetailData>({
    queryKey: ["/api/week", enrollmentId, competencyId],
    enabled: !!enrollmentId && !!competencyId,
  });

  const markReadyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/progress/${data!.progress.id}/ready`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/week", enrollmentId, competencyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/nurse/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Marked as ready for sign-off" });
    },
  });

  const signOffMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/progress/${data!.progress.id}/signoff`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/week", enrollmentId, competencyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manager/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Competency signed off successfully" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/progress/${data!.progress.id}/comments`, {
        text: comment,
      });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/week", enrollmentId, competencyId] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Competency not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { progress, competency, enrollment, dueDate, comments: commentsList } = data;
  const dueDateObj = new Date(dueDate);
  const today = new Date();
  const isOverdue = progress.status !== "signed_off" && today > dueDateObj;
  const canMarkReady = user?.role === "nurse" && progress.status === "not_started";
  const canSignOff =
    (user?.role === "manager" || user?.role === "admin") && progress.status === "ready";

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation(user?.role === "nurse" ? "/" : `/nurse/${enrollment.id}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold" data-testid="text-week-title">
              Week {competency.weekNumber}
            </h1>
            <p className="text-xs text-muted-foreground">{competency.phase}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-medium mb-2" data-testid="text-competency-title">
                  {competency.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span>Due: {format(dueDateObj, "MMMM d, yyyy")}</span>
                  {user?.role !== "nurse" && (
                    <span>Nurse: {enrollment.nurseName}</span>
                  )}
                  <span>{enrollment.facilityName}</span>
                </div>
              </div>
              <div>
                <StatusBadge status={progress.status} isOverdue={isOverdue} />
              </div>
            </div>

            {progress.signedOffAt && progress.signedOffByName && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-md border border-emerald-200/50 dark:border-emerald-800/30">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Signed off by <span className="font-medium">{progress.signedOffByName}</span> on{" "}
                    {format(new Date(progress.signedOffAt), "MMMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
            )}

            {(canMarkReady || canSignOff) && (
              <div className="mt-4 pt-4 border-t">
                {canMarkReady && (
                  <Button
                    onClick={() => markReadyMutation.mutate()}
                    disabled={markReadyMutation.isPending}
                    data-testid="button-mark-ready"
                  >
                    {markReadyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                    )}
                    Mark as Ready for Sign-off
                  </Button>
                )}
                {canSignOff && (
                  <Button
                    onClick={() => signOffMutation.mutate()}
                    disabled={signOffMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 no-default-hover-elevate"
                    data-testid="button-sign-off"
                  >
                    {signOffMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Sign Off Competency
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <h3 className="text-sm font-semibold">Notes &amp; Comments</h3>
            <span className="text-xs text-muted-foreground">{commentsList.length} comments</span>
          </CardHeader>
          <CardContent>
            {commentsList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No comments yet. Add a note or evidence below.
              </p>
            )}
            <div className="space-y-4">
              {commentsList.map((c) => {
                const initials = c.authorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{c.authorName}</span>
                        <Badge variant="outline" className="text-[10px] py-0 no-default-hover-elevate">
                          {c.authorRole}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{c.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a note or evidence..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                data-testid="input-comment"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                disabled={!comment.trim() || addCommentMutation.isPending}
                onClick={() => addCommentMutation.mutate()}
                data-testid="button-add-comment"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
