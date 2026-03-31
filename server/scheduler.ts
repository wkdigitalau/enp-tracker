import cron from "node-cron";
import { sendAllMonthlyEmails } from "./email";

// 1st of each month at 00:10 UTC = 10:10 AM AEST / 11:10 AM AEDT
const MONTHLY_SCHEDULE = "10 0 1 * *";

function log(msg: string) {
  const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${t} [scheduler] ${msg}`);
}

export function startScheduler() {
  cron.schedule(MONTHLY_SCHEDULE, async () => {
    log("Running monthly email job");
    try {
      const result = await sendAllMonthlyEmails();
      log(`Monthly emails sent — nurses: ${result.nurses}, managers: ${result.managers}`);
    } catch (err) {
      log(`Monthly email job failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
  log("Scheduler started — monthly emails on 1st of each month at 00:10 UTC");
}
