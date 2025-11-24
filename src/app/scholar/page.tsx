"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    Activity,
    CalendarDays,
    FileSpreadsheet,
    NotebookPen,
    Users2,
    Workflow,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import ScholarLayout from "@/components/scholar/scholar-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const tasks = [
    { label: "Confirm morning queue", detail: "Coordinate with nurses", status: "Due 8:30 AM" },
    { label: "Update walk-ins", detail: "Log new arrivals", status: "Ongoing" },
    { label: "Share patient notes", detail: "Send to doctor channel", status: "Before 3 PM" },
];

const quickLinks = [
    { label: "Appointment board", href: "/scholar/appointments" },
    { label: "Patient list", href: "/scholar/patients" },
    { label: "Manage account", href: "/scholar/account" },
];

const metrics = [
    { label: "Appointments", value: 26 },
    { label: "Walk-ins", value: 9 },
    { label: "Pending updates", value: 4 },
];

export default function ScholarDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Working Scholar";
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

    return (
        <ScholarLayout
            title="Clinic coordination hub"
            description="Monitor appointments, keep the board aligned, and support patient intake with a fresh dashboard layout."
            actions={
                <Button
                    asChild
                    className="hidden rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex"
                >
                    <Link href="/scholar/appointments">Review appointments</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-white to-emerald-50 p-8 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Welcome back</p>
                        <h3 className="text-3xl font-semibold text-primary md:text-4xl">Good day, Scholar {firstName}</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Keep the queue visible, log walk-ins quickly, and share updates with the clinic team so today&apos;s flow stays smooth.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Badge className="rounded-full bg-primary/15 px-3 py-1 text-primary">Desk open</Badge>
                            <Badge variant="secondary" className="rounded-full bg-white text-primary shadow-sm">
                                <Workflow className="mr-1.5 h-4 w-4" />
                                Sync in progress
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-white/80 px-5 py-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Priority</p>
                            <p className="text-lg font-semibold text-primary">Finalize morning roster</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Appointments today"
                    value="26"
                    helper="Including walk-ins"
                    icon={CalendarDays}
                    trendLabel="+5"
                    trendValue="vs yesterday"
                />
                <StatCard
                    title="Patients assisted"
                    value="41"
                    helper="Checked-in students"
                    icon={Users2}
                    trendLabel="+7"
                    trendValue="handled"
                />
                <StatCard
                    title="Board updates"
                    value="12"
                    helper="Status changes"
                    icon={Activity}
                    trendLabel="Live"
                    trendValue="now"
                />
                <StatCard
                    title="Notes shared"
                    value="18"
                    helper="Sent to clinic"
                    icon={NotebookPen}
                    trendLabel="Clear"
                    trendValue="handoffs"
                />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg text-primary">Shift checklist</CardTitle>
                            <p className="text-sm text-muted-foreground">Keep the clinic team informed as you move through tasks.</p>
                        </div>
                        <Button asChild variant="ghost" className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                            <Link href="/scholar/appointments">Open board</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tasks.map((item) => (
                            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-primary">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">{item.detail}</p>
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
                        <CardTitle className="text-lg text-primary">Quick navigation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>Jump into the tools you use most often.</p>
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
                        <CardTitle className="text-lg text-primary">Coordination stats</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        {metrics.map((item) => (
                            <div key={item.label} className="space-y-2 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                                <p className="text-2xl font-semibold text-primary">{item.value}</p>
                                <Progress value={Math.min(item.value, 100)} className="h-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-linear-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Handoff reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                        <p>Log every walk-in on the appointment board so nurses and doctors see changes immediately.</p>
                        <p>Share quick notes with the care team when symptoms warrant faster triage.</p>
                        <p>Confirm student details during intake to avoid delays during the consultation.</p>
                    </CardContent>
                </Card>
            </section>
        </ScholarLayout>
    );
}
