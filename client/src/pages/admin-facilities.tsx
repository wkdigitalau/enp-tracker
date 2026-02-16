import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Plus, Building2, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Facility, User } from "@shared/schema";

type FacilityWithManagers = Facility & {
  managers: Array<{ id: number; name: string }>;
};

export default function AdminFacilitiesPage() {
  const { toast } = useToast();
  const [facilityOpen, setFacilityOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  const { data: facilities, isLoading } = useQuery<FacilityWithManagers[]>({
    queryKey: ["/api/admin/facilities"],
  });

  const { data: managers } = useQuery<User[]>({
    queryKey: ["/api/admin/managers"],
  });

  const createFacilityMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/facilities", { name: facilityName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      setFacilityOpen(false);
      setFacilityName("");
      toast({ title: "Facility created" });
    },
  });

  const assignManagerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/manager-facilities", {
        managerUserId: parseInt(selectedManagerId),
        facilityId: selectedFacilityId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      setAssignOpen(false);
      setSelectedManagerId("");
      toast({ title: "Manager assigned to facility" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to assign", description: err.message, variant: "destructive" });
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
            <h1 className="text-xl font-semibold" data-testid="text-facilities-title">Facilities</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage aged care facilities and manager assignments</p>
          </div>
          <Dialog open={facilityOpen} onOpenChange={setFacilityOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-facility">
                <Plus className="w-4 h-4 mr-2" /> Add Facility
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Facility</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Facility Name</Label>
                  <Input value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="e.g. Mayfield Aged Care" data-testid="input-facility-name" />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createFacilityMutation.mutate()}
                  disabled={!facilityName || createFacilityMutation.isPending}
                  data-testid="button-create-facility"
                >
                  {createFacilityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Facility"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {(facilities || []).map((f) => (
            <Card key={f.id} data-testid={`card-facility-${f.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {f.managers.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No managers assigned</span>
                        ) : (
                          f.managers.map((m) => (
                            <Badge key={m.id} variant="outline" className="text-[10px] py-0 no-default-hover-elevate">
                              {m.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedFacilityId(f.id);
                      setAssignOpen(true);
                    }}
                    data-testid={`button-assign-manager-${f.id}`}
                  >
                    <UserPlus className="w-4 h-4 mr-1" /> Assign Manager
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Manager</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Manager</Label>
                <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                  <SelectTrigger data-testid="select-assign-manager">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {(managers || []).map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => assignManagerMutation.mutate()}
                disabled={!selectedManagerId || assignManagerMutation.isPending}
                data-testid="button-confirm-assign"
              >
                {assignManagerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}
