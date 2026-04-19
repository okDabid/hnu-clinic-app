"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarDays, ClipboardList, FileSpreadsheet, NotebookPen, Timer, Users2 } from "lucide-react";

import { DashboardStatStrip } from "@/components/dashboard/dashboard-stat-strip";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import ScholarLayout from "@/components/scholar/scholar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const workflowHighlights = [
    {
        title: "Coordinate appointments",
        description: "Review upcoming visits, manage queue movement, and notify teams about changes.",
        href: "/scholar/appointments",
        icon: CalendarDays,
        cta: "Open appointment hub",
    },
    {
        title: "Assist patient intake",
        description: "Search records, verify eligibility, and prepare intake details before handoff.",
        href: "/scholar/patients",
        icon: Users2,
        cta: "View patient list",
    },
    {
        title: "Maintain scholar records",
        description: "Keep your profile and emergency details updated for smooth shift coordination.",
        href: "/scholar/account",
        icon: ClipboardList,
        cta: "Manage account",
    },
] as const;

const supportChecklist = [
    "Confirm the appointment roster at least one hour before clinic opening.",
    "Log every walk-in case so nurses can triage and assign a schedule quickly.",
    "Escalate urgent symptoms directly to the nurse channel for immediate action.",
];

const scholarStats = [
    { label: "Today's roster", value: "Ready", hint: "Appointments synced", icon: CalendarDays },
    { label: "Intake throughput", value: "Fast", hint: "Queue updates in real time", icon: Timer },
    { label: "Records verified", value: "27", hint: "Student profiles reviewed", icon: FileSpreadsheet },
    { label: "Team handoffs", value: "Smooth", hint: "Nurse escalations up to date", icon: NotebookPen },
];

export default function ScholarDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Working Scholar";
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

    return (
        <ScholarLayout
            title="Clinic coordination hub"
            description="Support patient flow with a cleaner dashboard for appointment desk operations, intake, and documentation."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/scholar/appointments">Review appointments</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Scholar ${firstName}`}
                description="Keep desk operations synchronized, reduce waiting time, and surface urgent cases early using this streamlined workspace."
            />

            <DashboardStatStrip stats={scholarStats} />

            <QuickActionsGrid
                actions={[...workflowHighlights]}
                highlight={{
                    title: "Coordination insights",
                    icon: NotebookPen,
                    description: [
                        "Post queue changes immediately so nurses and doctors can adjust rounds without delays.",
                        "Complete intake fields before handoff to minimize repeated questions and paperwork.",
                    ],
                }}
            />

            <section className="grid gap-5 lg:grid-cols-2">
                <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm shadow-slate-900/5">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900">Checklist for smooth clinic flow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                        {supportChecklist.map((item) => (
                            <div key={item} className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                                <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <p>{item}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm shadow-slate-900/5">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900">Documentation shortcuts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                        <Button asChild variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                            <Link href="/scholar/appointments">Open walk-in scheduler</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                            <Link href="/scholar/patients">Open patient directory</Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/15">
                            <Link href="/scholar/account">Review personal profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </ScholarLayout>
    );
}
