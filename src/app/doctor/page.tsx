"use client";

import Link from "next/link";
import {
    CalendarDays,
    ClipboardList,
    Pill,
    Stethoscope,
    UserCog,
    Clock4,
    BarChart3,
} from "lucide-react";

import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const managementAreas = [
    {
        title: "Account management",
        description:
            "Update your profile, change credentials, and review administrative access details to stay compliant.",
        href: "/doctor/account",
        icon: UserCog,
        cta: "Review account",
    },
    {
        title: "Consultation hours",
        description:
            "Configure clinics, adjust availability, and publish upcoming consultation windows for students and staff.",
        href: "/doctor/consultation",
        icon: Clock4,
        cta: "Manage schedule",
    },
    {
        title: "Appointment oversight",
        description:
            "Approve requests, document visit outcomes, and coordinate reschedules with the clinic care team.",
        href: "/doctor/appointments",
        icon: CalendarDays,
        cta: "View appointments",
    },
    {
        title: "Medicine dispensing",
        description:
            "Record dispensed medicines, verify inventory balances, and ensure prescriptions are properly documented.",
        href: "/doctor/dispense",
        icon: Pill,
        cta: "Log dispense",
    },
    {
        title: "Patient insights",
        description:
            "Review patient records, access latest consultations, and prepare for follow-up care.",
        href: "/doctor/patients",
        icon: ClipboardList,
        cta: "Open registry",
    },
];

const overviewStats = [
    { label: "Today’s consultations", value: "18", trend: "5 in queue" },
    { label: "Pending follow-ups", value: "12", trend: "3 urgent" },
    { label: "Available duty slots", value: "9", trend: "Next: 2:00 PM" },
    { label: "Dispense requests", value: "7", trend: "2 awaiting review" },
];

const activityFeed: ActivityItem[] = [
    { label: "Consultation completed", detail: "John Paul • General Checkup", type: "success" },
    { label: "Appointment rescheduled", detail: "Moved to April 20, 2026", type: "warning" },
    { label: "Prescription submitted", detail: "3 medicines added to dispense", type: "info" },
    { label: "Critical case escalation", detail: "Nurse flagged urgent symptoms", type: "error" },
];

export default function DoctorDashboardPage() {
    const { firstName } = useDashboardUser("Doctor");

    return (
        <DoctorLayout
            title="Clinical operations overview"
            description="Monitor your schedule, manage consultations, and coordinate with nurses and scholars from one efficient dashboard."
            actions={
                <Button asChild className="rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                    <Link href="/doctor/consultation">Update availability</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Dr. ${firstName}`}
                description="Review high-priority updates quickly and keep consultation operations moving with less friction."
            />

            <OverviewMetrics metrics={overviewStats} />

            <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
                <Card className="rounded-2xl border-border/70 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-primary">
                            <BarChart3 className="h-4 w-4" /> Workload & treatment trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Consultation load</span>
                                <span className="font-medium text-primary">68%</span>
                            </div>
                            <Progress value={68} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Prescription completion</span>
                                <span className="font-medium text-primary">81%</span>
                            </div>
                            <Progress value={81} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                <ActivityFeed items={activityFeed} />
            </section>

            <QuickActionsGrid
                actions={managementAreas}
                highlight={{
                    title: "Clinic insights",
                    icon: Stethoscope,
                    description: [
                        "Align consultation blocks with high-demand clinics to reduce wait times.",
                        "Maintain same-day prescription logs to support inventory accuracy.",
                    ],
                    className: "bg-linear-to-br",
                }}
            />
        </DoctorLayout>
    );
}
