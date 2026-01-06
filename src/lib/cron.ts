import cron from "node-cron";
import autoDeactivateOldStudents from "./auto-deactivate-students";

// Schedule a daily run at 02:00 AM server time to run the deactivation job.
// Use an hourly fallback if NODE_ENV is development to make testing easier.
const schedule = process.env.NODE_ENV === "development" ? "0 * * * *" : "0 2 * * *";

let started = false;
export function startScheduledJobs() {
    if (started) return;
    started = true;

    try {
        cron.schedule(schedule, async () => {
            // eslint-disable-next-line no-console
            console.log("[cron] Running scheduled auto-deactivate job...");
            await autoDeactivateOldStudents();
        });
        // eslint-disable-next-line no-console
        console.log(`[cron] Scheduled auto-deactivate job (${schedule})`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[cron] Failed to start scheduled jobs", err);
    }
}

// start automatically when this module is required in the server build
startScheduledJobs();
