"use client";

import Link from "next/link";
import {
    Activity,
    Bell,
    CalendarDays,
    ClipboardList,
    HeartPulse,
    Pill,
    Stethoscope,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const schedule = [
    {
        label: "Dental consultation",
        patient: "Lauren Laboy",
        time: "09:00 AM",
        status: "Confirmed",
    },
    {
        label: "General check-up",
        patient: "Albert Green",
        time: "10:30 AM",
        status: "On site",
    },
    {
        label: "Follow-up",
        patient: "Quentin Cruz",
        time: "01:00 PM",
        status: "Pending",
    },
];

const quickLinks = [
    { label: "Account settings", href: "/doctor/account" },
    { label: "Consultation hours", href: "/doctor/consultation" },
    { label: "Appointment queue", href: "/doctor/appointments" },
    { label: "Dispensing log", href: "/doctor/dispense" },
    { label: "Patient registry", href: "/doctor/patients" },
];

const patientOverview = [
    { label: "New patients", value: 34, accent: "bg-emerald-500" },
    { label: "Returning", value: 112, accent: "bg-primary" },
    { label: "Follow-ups", value: 48, accent: "bg-emerald-300" },
    { label: "Meds dispensed", value: 76, accent: "bg-primary/70" },
];

export default function DoctorDashboardPage() {
    const { firstName } = useDashboardUser("Doctor");

    return (
        <DoctorLayout
            title="Clinical operations overview"
            description="Monitor upcoming visits, streamline coordination, and keep your clinic view organized."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/doctor/consultation">Update availability</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-white to-emerald-50 p-8 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Good morning</p>
                        <h3 className="text-3xl font-semibold text-primary md:text-4xl">Dr. {firstName}, here&apos;s today&apos;s plan</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Check your schedule, review follow-up tasks, and keep dispensing logs up to date. Everything you need for today&apos;s campus visits is summarized below.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Badge className="rounded-full bg-primary/15 px-3 py-1 text-primary">Clinic synced</Badge>
                            <Badge variant="secondary" className="rounded-full bg-white text-primary shadow-sm">
                                <Stethoscope className="mr-1.5 h-4 w-4" />
                                3 active clinics
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-white/80 px-5 py-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                            <HeartPulse className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Next consultation</p>
                            <p className="text-lg font-semibold text-primary">09:00 AM · Dental</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Today&apos;s visits"
                    value="23"
                    helper="Arrivals across all clinics"
                    icon={CalendarDays}
                    trendLabel="+4"
                    trendValue="vs yesterday"
                />
                <StatCard
                    title="Medications dispensed"
                    value="148"
                    helper="Across 18 prescriptions"
                    icon={Pill}
                    trendLabel="+12"
                    trendValue="new"
                />
                <StatCard
                    title="Follow-ups"
                    value="12"
                    helper="Requires confirmation"
                    icon={ClipboardList}
                    trendLabel="3 urgent"
                    trendValue="today"
                />
                <StatCard
                    title="Messages"
                    value="7"
                    helper="Unseen updates"
                    icon={Bell}
                    trendLabel="1 high"
                    trendValue="priority"
                />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg text-primary">Today&apos;s consultations</CardTitle>
                            <p className="text-sm text-muted-foreground">Keep patients moving by marking arrivals and outcomes.</p>
                        </div>
                        <Button asChild variant="ghost" className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                            <Link href="/doctor/appointments">View full queue</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {schedule.map((item) => (
                            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-primary">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">{item.patient}</p>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                                        {item.status}
                                    </Badge>
                                    <span className="font-semibold text-primary">{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Quick navigation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>Select a workspace to jump into the latest activity.</p>
                        <div className="space-y-2">
                            {quickLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
                                >
                                    {link.label}
                                    <Activity className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Patient overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        {patientOverview.map((item) => (
                            <div key={item.label} className="space-y-2 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <p>{item.label}</p>
                                    <span className={`h-2.5 w-2.5 rounded-full ${item.accent}`} />
                                </div>
                                <p className="text-2xl font-semibold text-primary">{item.value}</p>
                                <Progress value={Math.min(item.value, 120)} className="h-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-linear-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Clinical reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                        <p>Ensure dispensing notes are recorded within the shift so inventory updates stay accurate.</p>
                        <p>Notify the nursing desk when rescheduling to keep patient communications consistent.</p>
                        <p>Use the patient registry to review previous consults before today&apos;s appointments.</p>
                    </CardContent>
                </Card>
            </section>
        </DoctorLayout>
    );
}
