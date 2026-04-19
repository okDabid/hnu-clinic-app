"use client";

import Link from "next/link";
import { Bell, CalendarDays, FileText, HeartPulse, ShieldCheck, Stethoscope, User } from "lucide-react";

import { DashboardStatStrip } from "@/components/dashboard/dashboard-stat-strip";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const quickActions = [
    {
        title: "Manage your profile",
        description: "Update contact details, academic info, and emergency contacts in one secure space.",
        href: "/patient/account",
        icon: User,
        cta: "Review account",
    },
    {
        title: "Book a consultation",
        description: "Browse clinic schedules and submit appointment requests in a few clicks.",
        href: "/patient/appointments",
        icon: CalendarDays,
        cta: "Plan visit",
    },
    {
        title: "Track medical certificate",
        description: "View your latest certificate status and expiry updates from the clinic team.",
        href: "/patient/medical-certificate",
        icon: FileText,
        cta: "View certificate",
    },
    {
        title: "Follow clinic updates",
        description: "Stay informed with reminders, scheduling movements, and clinic announcements.",
        href: "/patient/notification",
        icon: Bell,
        cta: "View notifications",
    },
];

const wellnessHighlights = [
    "Arrive 10 minutes early for vitals and registration checks.",
    "Keep emergency contact details current for faster coordination.",
    "Bring your school or employee ID for scheduled appointments.",
];

const patientStats = [
    { label: "Profile status", value: "Up to date", hint: "Account details verified", icon: ShieldCheck },
    { label: "Upcoming visits", value: "2", hint: "Next schedule this week", icon: CalendarDays },
    { label: "Care documents", value: "Available", hint: "Medical certificate on file", icon: FileText },
    { label: "Wellness focus", value: "Active", hint: "Follow-up reminders enabled", icon: HeartPulse },
];

export default function PatientDashboardPage() {
    const { firstName } = useDashboardUser("Patient");

    return (
        <PatientLayout
            title="Patient command dashboard"
            description="Get a modern overview of your appointments, records, and clinic messages in one place."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/patient/appointments">Schedule visit</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Hello, ${firstName}`}
                description="Track your care journey with a cleaner dashboard that keeps account updates, clinic bookings, and notifications easy to manage."
            />

            <DashboardStatStrip stats={patientStats} />

            <QuickActionsGrid
                actions={quickActions}
                highlight={{
                    title: "Clinic insights",
                    icon: Stethoscope,
                    description: [
                        "Booking ahead improves your chance of getting your preferred schedule.",
                        "Enable notifications to receive fast updates on appointment confirmations and reminders.",
                    ],
                }}
            />

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm shadow-slate-900/5">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900">How to prepare for your next appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                        <p>Complete your profile details before visiting so the clinic team can process your check-in faster.</p>
                        <p>
                            Need to reschedule? Submit changes from the Appointments tab and wait for clinic confirmation sent through email and your portal notifications.
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-white/70 bg-white/85 shadow-sm shadow-slate-900/5">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900">Wellness reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-600">
                        <ul className="space-y-2">
                            {wellnessHighlights.map((tip) => (
                                <li key={tip} className="flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                                    <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </section>
        </PatientLayout>
    );
}
