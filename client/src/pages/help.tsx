import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HelpCircle, Mail, Phone, BookOpen, MessageSquare } from "lucide-react";

const quickStart = [
  {
    step: 1,
    text: "Log in with your credentials provided by your administrator.",
  },
  {
    step: 2,
    text: "View your dashboard — nurses see their 50-week program, managers see enrolled nurses across their facilities.",
  },
  {
    step: 3,
    text: "Nurses: click any competency to open it, then click 'Mark as Ready' once you have completed that week's task.",
  },
  {
    step: 4,
    text: "Managers: check the Sign-off Queue (sidebar) for items awaiting review, open each one and click 'Sign Off'.",
  },
  {
    step: 5,
    text: "Use the bell icon (top right) to see notifications whenever a status changes that involves you.",
  },
];

const faqs = [
  {
    q: "How do I mark a competency as complete?",
    a: "Nurses click into a competency from their dashboard and click 'Mark as Ready'. A manager or admin then reviews and signs it off. Nurses cannot sign off their own work.",
  },
  {
    q: "What do the status colours mean?",
    a: "Grey = Not Started (no action yet). Amber = Ready for Sign-off (nurse has finished, waiting on manager). Green = Signed Off (complete). Red = Overdue (past due date and not yet signed off).",
  },
  {
    q: "Why can't I see the sign-off button?",
    a: "Only managers and admins can sign off competencies. If you are a nurse, your action is to mark items as 'Ready' — the sign-off step belongs to your manager.",
  },
  {
    q: "How do I add a new nurse to the system?",
    a: "Admins go to Users in the sidebar and create the user with the Nurse role. Then go to Enrollments and create an enrollment linking that nurse to a program, facility, and start date.",
  },
  {
    q: "What happens when a competency is overdue?",
    a: "It shows a red Overdue badge. Due dates are calculated automatically from the nurse's program start date. Contact your manager if you need to discuss timeline adjustments.",
  },
  {
    q: "How do I know when something needs my attention?",
    a: "The bell icon in the top right shows unread notifications. Managers are notified when nurses mark items ready. Nurses are notified when their competencies are signed off.",
  },
  {
    q: "How do I reset my password?",
    a: "Contact your administrator. Admins can reset any user's password from the Users page using the key icon next to each user.",
  },
];

export default function HelpPage() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold">Help</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quick start guide and frequently asked questions</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold">Quick Start</h2>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {quickStart.map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {step}
                  </span>
                  <p className="text-sm text-muted-foreground pt-0.5">{text}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold">Frequently Asked Questions</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <div key={q} className="space-y-1">
                  <p className="text-sm font-medium">{q}</p>
                  <p className="text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold">Need help?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Emailing support@wkdigital.com.au is the fastest way to get your issue reviewed.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <a href="mailto:support@wkdigital.com.au" className="hover:underline">
                  support@wkdigital.com.au
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <a href="tel:1300796771" className="hover:underline">
                  1300 796 771
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
