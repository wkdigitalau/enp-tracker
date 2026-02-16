import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Building2,
  ClipboardCheck,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

type ManagerDashboardData = {
  facilities: Array<{ id: number; name: string }>;
  nurses: Array<{
    enrollmentId: number;
    nurseId: number;
    nurseName: string;
    facilityId: number;
    facilityName: string;
    total: number;
    signedOff: number;
    ready: number;
    overdue: number;
  }>;
  stats: {
    totalNurses: number;
    totalReady: number;
    totalOverdue: number;
    totalFacilities: number;
  };
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [facilityFilter, setFacilityFilter] = useState<string>("all");

  const { data, isLoading } = useQuery<ManagerDashboardData>({
    queryKey: ["/api/manager/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
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

  if (!data) return null;

  const filteredNurses =
    facilityFilter === "all"
      ? data.nurses
      : data.nurses.filter((n) => n.facilityId === parseInt(facilityFilter));

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-manager-title">
              Manager Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage nurse competency progress across facilities
            </p>
          </div>
          {data.facilities.length > 1 && (
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-52" data-testid="select-facility-filter">
                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {data.facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Nurses</p>
              </div>
              <p className="text-2xl font-bold" data-testid="text-total-nurses">
                {data.stats.totalNurses}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Facilities</p>
              </div>
              <p className="text-2xl font-bold" data-testid="text-total-facilities">
                {data.stats.totalFacilities}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardCheck className="w-4 h-4 text-amber-500" />
                <p className="text-xs text-muted-foreground">Awaiting Sign-off</p>
              </div>
              <p className="text-2xl font-bold text-amber-500" data-testid="text-total-ready">
                {data.stats.totalReady}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
              <p className="text-2xl font-bold text-destructive" data-testid="text-total-overdue">
                {data.stats.totalOverdue}
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Enrolled Nurses</h2>
          <div className="space-y-2">
            {filteredNurses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No nurses found for the selected facility.
                </CardContent>
              </Card>
            ) : (
              filteredNurses.map((nurse) => {
                const percent = Math.round((nurse.signedOff / nurse.total) * 100);
                const initials = nurse.nurseName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Link key={nurse.enrollmentId} href={`/nurse/${nurse.enrollmentId}`} data-testid={`link-nurse-${nurse.nurseId}`}>
                    <Card className="hover-elevate cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{nurse.nurseName}</span>
                            <Badge variant="outline" className="text-[10px] py-0 no-default-hover-elevate">
                              {nurse.facilityName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Progress value={percent} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {percent}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span>{nurse.signedOff}/{nurse.total} completed</span>
                            {nurse.ready > 0 && (
                              <span className="text-amber-500">{nurse.ready} ready</span>
                            )}
                            {nurse.overdue > 0 && (
                              <span className="text-destructive">{nurse.overdue} overdue</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
