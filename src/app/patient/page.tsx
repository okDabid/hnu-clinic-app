"use client";

import Link from "next/link";
import { Bell, CalendarDays, Heart, MapPin, NotebookPen, Stethoscope, User } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const reminders = [
    {
        label: "Dental follow-up",
        details: "Friday · 10:00 AM",
        status: "Confirmed",
    },
    {
        label: "General check-up",
        details: "Pending schedule",
        status: "Action needed",
    },
];

const wellness = [
    { label: "Sleep", value: 72 },
    { label: "Hydration", value: 64 },
    { label: "Movement", value: 58 },
];

const quickLinks = [
    { label: "Manage profile", href: "/patient/account" },
    { label: "Book appointment", href: "/patient/appointments" },
    { label: "Clinic notifications", href: "/patient/notification" },
];

export default function PatientDashboardPage() {
    const { firstName } = useDashboardUser("Patient");

    return (
        <PatientLayout
            title="Dashboard overview"
            description="Plan visits, review notifications, and track your health tasks with a refreshed green theme."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/patient/appointments">Schedule visit</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-white to-emerald-50 p-8 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Hello there</p>
                        <h3 className="text-3xl font-semibold text-primary md:text-4xl">{firstName}, keep your care on track</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Review upcoming visits, confirm reminders, and keep your contact details updated so the clinic can reach you with ease.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Badge className="rounded-full bg-primary/15 px-3 py-1 text-primary">Notifications on</Badge>
                            <Badge variant="secondary" className="rounded-full bg-white text-primary shadow-sm">
                                <MapPin className="mr-1.5 h-4 w-4" />
                                Campus clinic · Open
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-white/80 px-5 py-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                            <Stethoscope className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Next step</p>
                            <p className="text-lg font-semibold text-primary">Confirm Friday follow-up</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Booked visits"
                    value="2"
                    helper="Upcoming this week"
                    icon={CalendarDays}
                    trendLabel="+1"
                    trendValue="new"
                />
                <StatCard
                    title="Notifications"
                    value="5"
                    helper="Unread updates"
                    icon={Bell}
                    trendLabel="1 urgent"
                    trendValue="action"
                />
                <StatCard
                    title="Profile completeness"
                    value="92%"
                    helper="Emergency contacts saved"
                    icon={User}
                    trendLabel="Updated"
                    trendValue="recently"
                />
                <StatCard
                    title="Wellness streak"
                    value="8 days"
                    helper="Habits logged"
                    icon={Heart}
                    trendLabel="Keep it up"
                    trendValue=""
                />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg text-primary">Your appointments</CardTitle>
                            <p className="text-sm text-muted-foreground">Confirm schedules or request adjustments ahead of time.</p>
                        </div>
                        <Button asChild variant="ghost" className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                            <Link href="/patient/appointments">Manage visits</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {reminders.map((item) => (
                            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-primary">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">{item.details}</p>
                                </div>
                                <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                                    {item.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Quick actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>Keep your profile and reminders current.</p>
                        <div className="space-y-2">
                            {quickLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
                                >
                                    {link.label}
                                    <NotebookPen className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Wellness overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {wellness.map((item) => (
                            <div key={item.label} className="space-y-2 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <p>{item.label}</p>
                                    <span className="font-semibold text-primary">{item.value}%</span>
                                </div>
                                <Progress value={item.value} className="h-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-linear-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Visit reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                        <p>Arrive 10 minutes early for screening and paperwork.</p>
                        <p>Keep your contact details up to date so the clinic can confirm changes quickly.</p>
                        <p>Enable notifications to receive reminders and preparation tips right away.</p>
                    </CardContent>
                </Card>
            </section>
        </PatientLayout>
    );
}
