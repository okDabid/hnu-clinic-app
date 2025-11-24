"use client";

import Link from "next/link";
import {
    Activity,
    BarChart3,
    CalendarClock,
    ClipboardCheck,
    Package,
    ShieldCheck,
    Users,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const stockAlerts = [
    { item: "Surgical masks", level: 28, status: "Restock soon" },
    { item: "Alcohol pads", level: 12, status: "Critical" },
    { item: "Paracetamol", level: 44, status: "Healthy" },
];

const quickLinks = [
    { label: "Inventory", href: "/nurse/inventory" },
    { label: "Patient records", href: "/nurse/records" },
    { label: "Clinic schedule", href: "/nurse/clinic" },
    { label: "Dispensing log", href: "/nurse/dispense" },
    { label: "Accounts", href: "/nurse/accounts" },
];

const roster = [
    { label: "Morning clinics", value: "08:00 - 12:00", tag: "Campus A" },
    { label: "Afternoon clinics", value: "01:00 - 04:00", tag: "Dental" },
    { label: "Evening support", value: "Telehealth", tag: "On call" },
];

export default function NurseDashboardPage() {
    const { firstName } = useDashboardUser("Nurse");

    return (
        <NurseLayout
            title="Dashboard overview"
            description="Coordinate appointments, supplies, and records with a refreshed, data-forward view."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/nurse/records">View records</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-white to-emerald-50 p-8 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Welcome back</p>
                        <h3 className="text-3xl font-semibold text-primary md:text-4xl">Nurse {firstName}, here&apos;s your snapshot</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Track stock, patient records, and clinic coverage from one screen. Use the navigation cards to jump into the workspace you need.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Badge className="rounded-full bg-primary/15 px-3 py-1 text-primary">Shift ready</Badge>
                            <Badge variant="secondary" className="rounded-full bg-white text-primary shadow-sm">
                                <ShieldCheck className="mr-1.5 h-4 w-4" />
                                Compliance updated
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-white/80 px-5 py-4 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Today&apos;s coverage</p>
                            <p className="text-lg font-semibold text-primary">3 clinics · 2 nurses</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Appointments"
                    value="18"
                    helper="Arrivals + walk-ins"
                    icon={CalendarClock}
                    trendLabel="+2"
                    trendValue="vs yesterday"
                />
                <StatCard
                    title="Dispensing"
                    value="94"
                    helper="Logged today"
                    icon={ClipboardCheck}
                    trendLabel="+8"
                    trendValue="items"
                />
                <StatCard
                    title="Inventory alerts"
                    value="3"
                    helper="Needs attention"
                    icon={Package}
                    trendLabel="1 critical"
                    trendValue="item"
                />
                <StatCard
                    title="Account actions"
                    value="5"
                    helper="Pending approvals"
                    icon={Users}
                    trendLabel="New"
                    trendValue="requests"
                />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg text-primary">Stock health</CardTitle>
                            <p className="text-sm text-muted-foreground">Keep the shelves balanced by watching low-supply items.</p>
                        </div>
                        <Button asChild variant="ghost" className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                            <Link href="/nurse/inventory">Open inventory</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stockAlerts.map((item) => (
                            <div key={item.item} className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-primary">{item.item}</p>
                                    <p className="text-sm text-muted-foreground">{item.status}</p>
                                </div>
                                <div className="flex w-1/3 flex-col gap-2 text-sm text-muted-foreground">
                                    <Progress value={item.level} className="h-2" />
                                    <span className="self-end font-semibold text-primary">{item.level}%</span>
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
                        <p>Jump directly into the workspace you need during today&apos;s shift.</p>
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
                        <CardTitle className="text-lg text-primary">Clinic coverage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {roster.map((slot) => (
                            <div key={slot.label} className="flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-primary">{slot.label}</p>
                                    <p className="text-sm text-muted-foreground">{slot.value}</p>
                                </div>
                                <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                                    {slot.tag}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-linear-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Coordination reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                        <p>Log dispensing as you go to keep the doctor and inventory teams aligned.</p>
                        <p>Confirm vitals in patient records before handoff to reduce repeat intake questions.</p>
                        <p>Keep queue updates visible so students receive timely arrival instructions.</p>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
