"use client";

import Link from "next/link";
import { CalendarDays, ClipboardList, FileSpreadsheet, NotebookPen, Users2 } from "lucide-react";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import ScholarLayout from "@/components/scholar/scholar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

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
];

const supportChecklist = [
    "Confirm the day’s appointment roster at least one hour before clinic opening.",
    "Log every walk-in case in the shared tracker so nurses can assign the next available slot.",
    "Escalate urgent symptoms directly to the nurse channel to alert the medical team immediately.",
];

const documentationTips = [
    {
        label: "Schedule walk-ins",
        description: "Document walk-ins for visibility across the clinic team.",
        href: "/scholar/appointments",
    },
    {
        label: "Sync patient information",
        description: "Verify program, year level, and contact details during intake.",
        href: "/scholar/patients",
    },
    {
        label: "Refresh personal records",
        description: "Review your profile and confirm that emergency contacts are current.",
        href: "/scholar/account",
    },
];

const coordinationHighlights = [
    "Share status updates in the clinic chat when appointment queues change so the medical team can adapt their rounds.",
    "Keep intake forms organized before handoff—complete profiles help nurses and doctors focus on care instead of paperwork.",
];

export default function ScholarDashboardPage() {
    const { firstName } = useDashboardUser("Working Scholar");

    return (
        <ScholarLayout
            title="Clinic coordination hub"
            description="Monitor appointments, support patient intake, and keep campus care moving smoothly."
            actions={
                <Button
                    asChild
                    className="hidden rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex"
                >
                    <Link href="/scholar/appointments">Review appointments</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Scholar ${firstName}`}
                description="Keep the clinic desk synchronized—double-check booking requests, guide students through intake, and flag priority concerns early so the team can respond quickly."
            />

            <QuickActionsGrid
                actions={workflowHighlights}
                highlight={{
                    title: "Coordination insights",
                    icon: NotebookPen,
                    description: coordinationHighlights,
                }}
            />

            <section className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Checklist for smooth clinic flow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        {supportChecklist.map((item) => (
                            <div key={item} className="flex gap-3 rounded-2xl bg-primary/5 p-3">
                                <FileSpreadsheet className="mt-1 h-4 w-4 text-primary" />
                                <p>{item}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Documentation shortcuts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        {documentationTips.map(({ label, description, href }) => (
                            <div key={label} className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-primary">{label}</p>
                                    <Button asChild variant="link" className="h-auto p-0 text-sm font-semibold text-primary">
                                        <Link href={href}>Open</Link>
                                    </Button>
                                </div>
                                <p>{description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
        </ScholarLayout>
    );
}
