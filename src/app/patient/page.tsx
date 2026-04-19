"use client";

import Link from "next/link";
import { Bell, CalendarDays, FileText, Stethoscope, User, BarChart3 } from "lucide-react";

import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

const overviewStats = [
    { label: "Upcoming appointments", value: "2", trend: "Next: Apr 21" },
    { label: "Unread notifications", value: "4", trend: "2 schedule updates" },
    { label: "Profile completion", value: "88%", trend: "Add emergency contact" },
    { label: "Certificate status", value: "Active", trend: "Valid for 23 days" },
];

const activityFeed: ActivityItem[] = [
    { label: "Appointment confirmed", detail: "April 21, 2026 • 10:30 AM", type: "success" },
    { label: "Reminder issued", detail: "Bring school/work ID", type: "info" },
    { label: "Reschedule pending", detail: "Awaiting clinic approval", type: "warning" },
    { label: "Incomplete profile", detail: "Emergency number missing", type: "error" },
];

export default function PatientDashboardPage() {
    const { firstName } = useDashboardUser("Patient");

    return (
        <PatientLayout
            title="Dashboard overview"
            description="A clear snapshot of your clinic activity, appointments, and profile updates in one place."
            actions={
                <Button asChild className="rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                    <Link href="/patient/appointments">Schedule visit</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Hello, ${firstName}`}
                description="Manage bookings faster, monitor updates instantly, and keep your clinic profile complete for smoother visits."
            />

            <OverviewMetrics metrics={overviewStats} />

            <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
                <Card className="rounded-2xl border-border/70 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-primary">
                            <BarChart3 className="h-4 w-4" /> Personal care progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Appointment readiness</span>
                                <span className="font-medium text-primary">72%</span>
                            </div>
                            <Progress value={72} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Profile completeness</span>
                                <span className="font-medium text-primary">88%</span>
                            </div>
                            <Progress value={88} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                <ActivityFeed items={activityFeed} />
            </section>

            <QuickActionsGrid
                actions={quickActions}
                highlight={{
                    title: "Clinic insights",
                    icon: Stethoscope,
                    description: [
                        "Booking ahead ensures your preferred clinic and schedule are available.",
                        "Enable notifications to avoid missed reminders and schedule changes.",
                    ],
                    className: "bg-linear-to-br",
                }}
            />
        </PatientLayout>
    );
}
