"use client";

import Link from "next/link";
import { Activity, CalendarDays, ClipboardList, Clock4, Pill, Stethoscope, UserCog } from "lucide-react";

import { DashboardStatStrip } from "@/components/dashboard/dashboard-stat-strip";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const managementAreas = [
    {
        title: "Account management",
        description: "Update your profile, credentials, and access details to keep your physician account secure.",
        href: "/doctor/account",
        icon: UserCog,
        cta: "Review account",
    },
    {
        title: "Consultation hours",
        description: "Configure clinic slots and publish availability to improve booking turnaround.",
        href: "/doctor/consultation",
        icon: Clock4,
        cta: "Manage schedule",
    },
    {
        title: "Appointment oversight",
        description: "Approve requests, record outcomes, and handle schedule changes in one workspace.",
        href: "/doctor/appointments",
        icon: CalendarDays,
        cta: "View appointments",
    },
    {
        title: "Medicine dispensing",
        description: "Log dispensed medicines and coordinate replenishment with clinic inventory.",
        href: "/doctor/dispense",
        icon: Pill,
        cta: "Log dispense",
    },
    {
        title: "Patient insights",
        description: "Review recent consultations and prepare for follow-up care with full context.",
        href: "/doctor/patients",
        icon: ClipboardList,
        cta: "Open registry",
    },
];

const operationalHighlights = [
    "Coordinate consultation slot changes with nursing to avoid overlap.",
    "Add concise notes whenever appointments are rescheduled or declined.",
    "Finalize same-day dispensing records for accurate medication auditing.",
];

const doctorStats = [
    { label: "Queue health", value: "On track", hint: "No critical delays reported", icon: Activity },
    { label: "Consultation blocks", value: "6 Today", hint: "Across all active clinics", icon: Clock4 },
    { label: "Pending requests", value: "12", hint: "Appointments awaiting review", icon: CalendarDays },
    { label: "Care continuity", value: "High", hint: "Patient follow-up rate this week", icon: Stethoscope },
];

export default function DoctorDashboardPage() {
    const { firstName } = useDashboardUser("Doctor");

    return (
        <DoctorLayout
            title="Clinical operations overview"
            description="Monitor your care queue, keep schedules balanced, and collaborate with the clinic team from a modern command center."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/doctor/consultation">Update availability</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Dr. ${firstName}`}
                description="Start with a quick operational pulse, then jump into scheduling, appointments, and medication logs without leaving this dashboard."
            />

            <DashboardStatStrip stats={doctorStats} />

            <QuickActionsGrid
                actions={managementAreas}
                highlight={{
                    title: "Clinic insights",
                    icon: Stethoscope,
                    description: [
                        "Align consultation blocks with peak clinic hours to improve patient throughput.",
                        "Track dispense logs daily so inventory teams can replenish high-demand medicines proactively.",
                    ],
                }}
            />

            <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm shadow-slate-900/5">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900">Operational checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                        <ul className="space-y-2">
                            {operationalHighlights.map((item) => (
                                <li key={item} className="flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                                    <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm shadow-slate-900/5">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900">Fast actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                        <p>Need to jump directly into clinical updates? Use these shortcut links.</p>
                        <Button asChild variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                            <Link href="/doctor/dispense">Open dispensing log</Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/15">
                            <Link href="/doctor/patients">Browse patient records</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </DoctorLayout>
    );
}
