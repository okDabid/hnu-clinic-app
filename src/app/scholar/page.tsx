"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarDays, ClipboardList, NotebookPen, Users2, BarChart3 } from "lucide-react";

import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import ScholarLayout from "@/components/scholar/scholar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const workflowHighlights = [
    {
        title: "Coordinate appointments",
        description:
            "Review upcoming visits, arrange queues, and update the board when there are walk-ins or cancellations.",
        href: "/scholar/appointments",
        icon: CalendarDays,
        cta: "Open appointment hub",
    },
    {
        title: "Assist patient intake",
        description:
            "Search student profiles, confirm eligibility, and share the latest notes with the nursing team.",
        href: "/scholar/patients",
        icon: Users2,
        cta: "View patient list",
    },
    {
        title: "Maintain scholar records",
        description:
            "Keep your contact and emergency details updated so the clinic can reach you during campus operations.",
        href: "/scholar/account",
        icon: ClipboardList,
        cta: "Manage account",
    },
] as const;

const overviewStats = [
    { label: "Today’s bookings", value: "31", trend: "6 pending confirmation" },
    { label: "Patient check-ins", value: "24", trend: "3 walk-ins" },
    { label: "Pending endorsements", value: "9", trend: "2 urgent handoffs" },
    { label: "Desk response time", value: "4m", trend: "Avg this shift" },
];

const activityFeed: ActivityItem[] = [
    { label: "Walk-in logged", detail: "Nursing team alerted", type: "info" },
    { label: "Patient profile updated", detail: "Contact number corrected", type: "success" },
    { label: "Queue delay warning", detail: "Clinic B at 85% load", type: "warning" },
    { label: "Missing chart note", detail: "Follow-up required", type: "error" },
];

export default function ScholarDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Working Scholar";
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

    return (
        <ScholarLayout
            title="Clinic coordination hub"
            description="Monitor appointments, support patient intake, and keep campus care moving smoothly."
            actions={
                <Button
                    asChild
                    className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                    <Link href="/scholar/appointments">Review appointments</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Scholar ${firstName}`}
                description="Keep the clinic desk synchronized with quick visibility of queue health, patient intake, and endorsements."
            />

            <OverviewMetrics metrics={overviewStats} />

            <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
                <Card className="rounded-2xl border-border/70 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-primary">
                            <BarChart3 className="h-4 w-4" /> Intake & queue trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Intake completion</span>
                                <span className="font-medium text-primary">79%</span>
                            </div>
                            <Progress value={79} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">On-time endorsements</span>
                                <span className="font-medium text-primary">84%</span>
                            </div>
                            <Progress value={84} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                <ActivityFeed items={activityFeed} title="Coordination activity" />
            </section>

            <QuickActionsGrid
                actions={workflowHighlights}
                highlight={{
                    title: "Coordination insights",
                    icon: NotebookPen,
                    description: [
                        "Share queue changes early so nurses and doctors can adapt rounds quickly.",
                        "Complete intake details before handoff to reduce repeated patient questions.",
                    ],
                }}
            />
        </ScholarLayout>
    );
}
