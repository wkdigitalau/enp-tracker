import cron from "node-cron";
import { sendAllMonthlyEmails } from "./email";
import { log } from "./index";

// 1st of each month at 00:10 UTC = 10:10 AM AEST / 11:10 AM AEDT
const MONTHLY_SCHEDULE = "10 0 1 * *";

export function startScheduler() {
  cron.schedule(MONTHLY_SCHEDULE, async () => {
    log("Running monthly email job", "scheduler");
    try {
      const result = await sendAllMonthlyEmails();
      log(`Monthly emails sent — nurses: ${result.nurses}, managers: ${result.managers}`, "scheduler");
    } catch (err) {
      log(`Monthly email job failed: ${err instanceof Error ? err.message : String(err)}`, "scheduler");
    }
  });
  log("Scheduler started — monthly emails on 1st of each month at 00:10 UTC", "scheduler");
}
