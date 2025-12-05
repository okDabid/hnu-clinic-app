"use client";

import Link from "next/link";
import { Bell, CalendarDays, FileText, Stethoscope, User } from "lucide-react";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const quickActions = [
    {
        title: "Manage your profile",
        description: "Review and update your contact details, academic information, and emergency contacts in one place.",
        href: "/patient/account",
        icon: User,
        cta: "Review account",
    },
    {
        title: "Book a consultation",
        description: "Check available clinics, select a physician or dentist, and send your appointment request instantly.",
        href: "/patient/appointments",
        icon: CalendarDays,
        cta: "Plan visit",
    },
    {
        title: "View medical certificate status",
        description: "See your latest certificate status and expiry date as recorded by the clinic team.",
        href: "/patient/medical-certificate",
        icon: FileText,
        cta: "View certificate",
    },
    {
        title: "Follow clinic updates",
        description: "Track appointment changes, reminders, and announcements so you are always ready for your next visit.",
        href: "/patient/notification",
        icon: Bell,
        cta: "View notifications",
    },
];

const wellnessHighlights = [
    "Arrive 10 minutes early to allow time for screening and paperwork.",
    "Keep your emergency contact details up to date for faster coordination.",
    "Bring your student/employee ID whenever you have a scheduled visit.",
];

export default function PatientDashboardPage() {
    const { firstName } = useDashboardUser("Patient");

    return (
        <PatientLayout
            title="Dashboard overview"
            description="A personalized snapshot of your activity with HNU Clinic. Access appointments, account information, and announcements at a glance."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/patient/appointments">Schedule visit</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Hello, ${firstName}`}
                description="Stay on top of your health journey. From this dashboard you can update your profile, manage bookings, and monitor clinic communications tailored for you."
                className="bg-linear-to-r"
            />

            <QuickActionsGrid
                actions={quickActions}
                highlight={{
                    title: "Clinic insights",
                    icon: Stethoscope,
                    description: [
                        "Walk-ins are accommodated based on availability. Booking ahead ensures your preferred doctor and service are ready when you arrive.",
                        "Keep notifications enabled to receive movement updates, instructions, and reminders directly from the clinic team.",
                    ],
                    className: "bg-linear-to-br",
                }}
            />

            <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[1.4fr_1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">How to prepare for your next appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Updating your personal details before the visit helps our staff deliver faster care.
                        </p>
                        <p>
                            If you need to adjust the schedule, request a reschedule from the Appointments page. The clinic will confirm availability and notify you through email and the portal.
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Wellness reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <ul className="space-y-2">
                            {wellnessHighlights.map((tip) => (
                                <li key={tip} className="flex items-start gap-2 rounded-2xl bg-primary/10 p-3">
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
