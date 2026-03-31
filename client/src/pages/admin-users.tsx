import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Plus, Loader2, KeyRound, Mail, Archive, ArchiveRestore } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("nurse");
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/users", { name, email, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setOpen(false);
      setName("");
      setEmail("");
      setRole("nurse");
      toast({ title: "User created — invitation email sent" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create user", description: err.message, variant: "destructive" });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/users/${id}/resend-invite`);
    },
    onSuccess: () => {
      toast({ title: "Invitation email resent" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to resend invite", description: err.message, variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User archived" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to archive user", description: err.message, variant: "destructive" });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/unarchive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User reactivated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to reactivate user", description: err.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/password`, { password });
    },
    onSuccess: () => {
      setResetUser(null);
      setNewPassword("");
      toast({ title: "Password updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update password", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  const roleBadgeClass = (r: string) => {
    if (r === "admin") return "bg-primary/10 text-primary no-default-hover-elevate";
    if (r === "manager") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate";
    return "no-default-hover-elevate";
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-users-title">Users</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage platform users and roles</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-user">
                <Plus className="w-4 h-4 mr-2" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" data-testid="input-user-name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@enp.com" data-testid="input-user-email" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger data-testid="select-user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">An invitation email will be sent so the user can set their own password.</p>
                <Button
                  className="w-full"
                  onClick={() => createUserMutation.mutate()}
                  disabled={!name || !email || createUserMutation.isPending}
                  data-testid="button-create-user"
                >
                  {createUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {showArchived ? "Showing archived users" : `${(users || []).filter(u => !u.archivedAt).length} active users`}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowArchived(!showArchived)} className="text-muted-foreground">
            {showArchived ? <><ArchiveRestore className="w-4 h-4 mr-1.5" />Show Active</> : <><Archive className="w-4 h-4 mr-1.5" />View Archived</>}
          </Button>
        </div>

        <div className="space-y-2">
          {(users || []).filter(u => showArchived ? !!u.archivedAt : !u.archivedAt).map((u) => {
            const initials = u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <Card key={u.id} data-testid={`card-user-${u.id}`} className={u.archivedAt ? "opacity-60" : ""}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="secondary" className={roleBadgeClass(u.role)}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </Badge>
                  {u.archivedAt ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => unarchiveMutation.mutate(u.id)}
                      title="Reactivate user"
                      disabled={unarchiveMutation.isPending}
                    >
                      <ArchiveRestore className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resendInviteMutation.mutate(u.id)}
                        title="Resend invitation email"
                        disabled={resendInviteMutation.isPending}
                      >
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setResetUser(u); setNewPassword(""); }}
                        title="Reset password"
                      >
                        <KeyRound className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => archiveMutation.mutate(u.id)}
                        title="Archive user"
                        disabled={archiveMutation.isPending}
                      >
                        <Archive className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {(users || []).filter(u => showArchived ? !!u.archivedAt : !u.archivedAt).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {showArchived ? "No archived users." : "No active users."}
            </p>
          )}
        </div>
      </div>

      <Dialog open={!!resetUser} onOpenChange={(o) => { if (!o) { setResetUser(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password — {resetUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => resetUser && resetPasswordMutation.mutate({ id: resetUser.id, password: newPassword })}
              disabled={newPassword.length < 8 || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
