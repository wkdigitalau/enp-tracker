import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, Users, ClipboardCheck } from "lucide-react";

const STORAGE_KEY = "enp_welcome_seen";

export function WelcomeOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-lg">Welcome to ENP Training Platform</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Nurses track their 50-week competency program and mark items ready for sign-off.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ClipboardCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Managers review nurse progress and sign off completed competencies across their facilities.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Admins manage users, facilities, enrollments, and programs across the entire platform.
            </p>
          </div>
        </div>
        <Button className="w-full mt-2" onClick={dismiss}>
          Got it, let's go
        </Button>
      </DialogContent>
    </Dialog>
  );
}
