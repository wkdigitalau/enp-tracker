import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info, Database, Server, Calendar, User } from "lucide-react";

const rows = [
  {
    icon: Info,
    label: "Application",
    value: "ENP Training Platform — v1.0.0",
  },
  {
    icon: Info,
    label: "Description",
    value:
      "A 50-week nurse orientation and competency tracking platform for Elite Nurse Partners. Managers and admins track nurses through a structured program of clinical sign-offs across aged care facilities.",
  },
  {
    icon: Server,
    label: "Hosting",
    value:
      "Hosted on Vultr — contact your administrator to update credentials or change server configuration.",
  },
  {
    icon: Database,
    label: "Data storage",
    value:
      "Data is stored in PostgreSQL. Do not modify records directly in the database without guidance from your administrator.",
  },
  {
    icon: Calendar,
    label: "Last updated",
    value: __BUILD_DATE__,
  },
  {
    icon: User,
    label: "System administrator",
    value: "support@wkdigital.com.au",
  },
];

export default function AdminAboutPage() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold">About this App</h1>
          <p className="text-sm text-muted-foreground mt-0.5">System information — read only</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {rows.map(({ icon: Icon, label, value }, i) => (
              <div key={label}>
                {i > 0 && <Separator />}
                <div className="flex items-start gap-4 p-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
