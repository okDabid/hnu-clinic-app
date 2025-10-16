"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, CalendarDays, Stethoscope, User } from "lucide-react";

import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    "Bring your clinic ID or student/employee ID whenever you have a scheduled visit.",
];

export default function PatientDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Patient";
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

    return (
        <PatientLayout
            title="Dashboard overview"
            description="A personalized snapshot of your activity with HNU Clinic. Access appointments, account information, and announcements at a glance."
            actions={
                <Button asChild className="hidden rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 md:flex">
                    <Link href="/patient/appointments">Schedule visit</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-green-100/70 bg-gradient-to-r from-green-100/70 via-white to-green-50/80 p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-500">Welcome back</p>
                        <h3 className="text-3xl font-semibold text-green-700 md:text-4xl">Hello, {firstName}</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Stay on top of your health journey. From this dashboard you can update your profile, manage bookings, and monitor clinic communications tailored for you.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 rounded-2xl border border-green-100 bg-white/80 p-4 text-sm text-muted-foreground shadow-sm md:w-80">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600/10 text-green-700">
                                <CalendarDays className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-green-500">Need to visit?</p>
                                <p className="font-semibold text-green-700">Reserve your slot at least 3 days ahead.</p>
                            </div>
                        </div>
                        <Separator className="border-green-100" />
                        <Button asChild variant="outline" className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70">
                            <Link href="/patient/appointments">Book an appointment</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {quickActions.map(({ title, description, href, icon: Icon, cta }) => (
                    <Card key={title} className="h-full rounded-3xl border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-3 text-lg text-green-700">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600/10 text-green-700">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    {title}
                                </CardTitle>
                                <p className="text-sm font-normal text-muted-foreground">{description}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="ghost" className="rounded-xl bg-green-600/10 px-3 text-sm font-semibold text-green-700 hover:bg-green-600/20">
                                <Link href={href}>{cta}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                <Card className="h-full rounded-3xl border-green-100/70 bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                                <Stethoscope className="h-5 w-5" />
                            </span>
                            Clinic insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed">
                        <p className="text-white/90">
                            Walk-ins are accommodated based on availability. Booking ahead ensures your preferred doctor and service are ready when you arrive.
                        </p>
                        <p className="text-white/90">
                            Keep notifications enabled to receive movement updates, instructions, and reminders directly from the clinic team.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-green-700">How to prepare for your next appointment</CardTitle>
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
                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-green-700">Wellness reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <ul className="space-y-2">
                            {wellnessHighlights.map((tip) => (
                                <li key={tip} className="flex items-start gap-2 rounded-2xl bg-green-600/5 p-3">
                                    <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
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
