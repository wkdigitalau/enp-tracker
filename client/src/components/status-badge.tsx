import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, Clock, AlertTriangle, Circle } from "lucide-react";

type StatusBadgeProps = {
  status: string;
  isOverdue?: boolean;
};

const statusInfo: Record<string, { label: string; what: string; action: string }> = {
  signed_off: {
    label: "Signed Off",
    what: "This competency has been reviewed and approved.",
    action: "No further action needed.",
  },
  ready: {
    label: "Ready for Sign-off",
    what: "The nurse has marked this as complete and is waiting for a manager or admin to sign off.",
    action: "Managers: go to the Sign-off Queue to review and approve.",
  },
  overdue: {
    label: "Overdue",
    what: "This competency has passed its due date without being signed off.",
    action: "Follow up with the nurse or their manager.",
  },
  not_started: {
    label: "Not Started",
    what: "The nurse has not yet begun this competency.",
    action: "No action required until it approaches its due date.",
  },
};

export function StatusBadge({ status, isOverdue = false }: StatusBadgeProps) {
  const key = status === "signed_off" ? "signed_off"
    : status === "ready" ? "ready"
    : isOverdue ? "overdue"
    : "not_started";

  const info = statusInfo[key];

  const badge =
    key === "signed_off" ? (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 no-default-hover-elevate cursor-pointer">
        <CheckCircle2 className="w-3 h-3 mr-1" />{info.label}
      </Badge>
    ) : key === "ready" ? (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate cursor-pointer">
        <Clock className="w-3 h-3 mr-1" />{info.label}
      </Badge>
    ) : key === "overdue" ? (
      <Badge variant="destructive" className="no-default-hover-elevate cursor-pointer">
        <AlertTriangle className="w-3 h-3 mr-1" />{info.label}
      </Badge>
    ) : (
      <Badge variant="outline" className="no-default-hover-elevate cursor-pointer">
        <Circle className="w-3 h-3 mr-1" />{info.label}
      </Badge>
    );

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {badge}
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm" side="top">
        <p className="font-medium mb-1">{info.label}</p>
        <p className="text-muted-foreground">{info.what}</p>
        <p className="text-muted-foreground mt-1">{info.action}</p>
      </PopoverContent>
    </Popover>
  );
}

export function StatusIcon({ status, isOverdue = false }: StatusBadgeProps) {
  if (status === "signed_off") return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  if (status === "ready") return <Clock className="w-4 h-4 text-amber-500" />;
  if (isOverdue) return <AlertTriangle className="w-4 h-4 text-destructive" />;
  return <Circle className="w-4 h-4 text-muted-foreground/40" />;
}
