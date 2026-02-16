import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Link } from "wouter";
import type { User, Facility, ProgramTemplate } from "@shared/schema";

type EnrollmentListItem = {
  id: number;
  nurseName: string;
  facilityName: string;
  programName: string;
  startDate: string;
  active: boolean;
  signedOff: number;
  total: number;
};

export default function AdminEnrollmentsPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [nurseId, setNurseId] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [programId, setProgramId] = useState("");
  const [startDate, setStartDate] = useState("");

  const { data: enrollments, isLoading } = useQuery<EnrollmentListItem[]>({
    queryKey: ["/api/admin/enrollments"],
  });

  const { data: nurses } = useQuery<User[]>({
    queryKey: ["/api/admin/nurses"],
  });

  const { data: facilitiesList } = useQuery<Facility[]>({
    queryKey: ["/api/admin/facilities-list"],
  });

  const { data: programs } = useQuery<ProgramTemplate[]>({
    queryKey: ["/api/admin/programs"],
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/enrollments", {
        nurseUserId: parseInt(nurseId),
        facilityId: parseInt(facilityId),
        programTemplateId: parseInt(programId),
        startDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      setOpen(false);
      setNurseId("");
      setFacilityId("");
      setProgramId("");
      setStartDate("");
      toast({ title: "Nurse enrolled successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to enroll", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-enrollments-title">Enrollments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage nurse program enrollments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-enrollment">
                <Plus className="w-4 h-4 mr-2" /> Enroll Nurse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enroll Nurse in Program</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Nurse</Label>
                  <Select value={nurseId} onValueChange={setNurseId}>
                    <SelectTrigger data-testid="select-enroll-nurse">
                      <SelectValue placeholder="Select nurse" />
                    </SelectTrigger>
                    <SelectContent>
                      {(nurses || []).map((n) => (
                        <SelectItem key={n.id} value={n.id.toString()}>
                          {n.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Facility</Label>
                  <Select value={facilityId} onValueChange={setFacilityId}>
                    <SelectTrigger data-testid="select-enroll-facility">
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>
                    <SelectContent>
                      {(facilitiesList || []).map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger data-testid="select-enroll-program">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {(programs || []).map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createEnrollmentMutation.mutate()}
                  disabled={!nurseId || !facilityId || !programId || !startDate || createEnrollmentMutation.isPending}
                  data-testid="button-create-enrollment"
                >
                  {createEnrollmentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enroll Nurse"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {(enrollments || []).map((e) => {
            const percent = e.total > 0 ? Math.round((e.signedOff / e.total) * 100) : 0;
            const initials = e.nurseName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Link key={e.id} href={`/nurse/${e.id}`} data-testid={`link-enrollment-${e.id}`}>
                <Card className="hover-elevate cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{e.nurseName}</span>
                        <Badge variant="outline" className="text-[10px] py-0 no-default-hover-elevate">
                          {e.facilityName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {e.programName} &middot; Started {format(new Date(e.startDate), "MMM d, yyyy")}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Progress value={percent} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
