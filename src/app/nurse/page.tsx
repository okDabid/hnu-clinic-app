"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    BarChart3,
    ClipboardCheck,
    Package,
    Users,
} from "lucide-react";

import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const quickActions = [
    {
        title: "Supervise inventory",
        description: "Monitor critical stock levels, log replenishments, and flag expiring supplies.",
        href: "/nurse/inventory",
        icon: Package,
        cta: "Review inventory",
    },
    {
        title: "Support patient records",
        description: "Update consultation notes, upload vitals, and prepare charts for the medical team.",
        href: "/nurse/records",
        icon: ClipboardCheck,
        cta: "View records",
    },
    {
        title: "Administer accounts",
        description: "Create new profiles, reset credentials, and keep access permissions current.",
        href: "/nurse/accounts",
        icon: Users,
        cta: "Manage accounts",
    },
];

const flowChecklist = [
    "Confirm today's appointment roster and pre-stage vitals equipment.",
    "Coordinate with physicians on critical follow-ups before opening hours.",
    "Document dispensing and inventory updates in real time to avoid reconciliation gaps.",
];

export default function NurseDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Nurse";
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

    return (
        <NurseLayout
            title="Dashboard Overview"
            description="Manage accounts, clinic schedules, inventory, and records with a clear operational snapshot."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/nurse/records">View Records</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-white to-primary/5 p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Welcome back</p>
                        <h3 className="text-3xl font-semibold text-primary md:text-4xl">Good day, Nurse {firstName}</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Keep the clinic running smoothly with instant visibility into schedules, stock levels, and patient coordination. Use the quick tools below to support the care team.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center text-sm">
                        {["Records ready", "Pending restocks", "Queued walk-ins", "Follow-ups"].map((label) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-primary/20 bg-white/70 px-4 py-3 shadow-sm"
                            >
                                <p className="text-xs uppercase tracking-wide text-primary/70">{label}</p>
                                <p className="text-2xl font-semibold text-primary">—</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {quickActions.map(({ title, description, href, icon: Icon, cta }) => (
                    <Card
                        key={title}
                        className="h-full rounded-3xl border-primary/20 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-3 text-lg text-primary">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    {title}
                                </CardTitle>
                                <p className="text-sm font-normal text-muted-foreground">{description}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="ghost" className="rounded-xl bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/20">
                                <Link href={href}>{cta}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                <Card className="h-full rounded-3xl border-primary/20 bg-gradient-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                                <BarChart3 className="h-5 w-5" />
                            </span>
                            Operations insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                        <p>
                            Align on clinic traffic peaks early to balance resources and shorten wait times for students and staff.
                        </p>
                        <p>
                            Keep communication logs updated so physicians can review triage actions and respond to follow-up needs quickly.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">How to keep clinic flow steady</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        {flowChecklist.map((item) => (
                            <div key={item} className="flex gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-3">
                                <BarChart3 className="mt-1 h-4 w-4 text-primary" />
                                <p>{item}</p>
                            </div>
                        ))}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Button asChild variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                                <Link href="/nurse/dispense">Open dispensing log</Link>
                            </Button>
                            <Button asChild variant="ghost" className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                                <Link href="/nurse/clinic">View clinic schedule</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Team signals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>Share a quick update when intake queues change or when a physician becomes available.</p>
                        <ul className="space-y-2">
                            <li className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
                                <span>Send intake summary</span>
                                <Button asChild variant="link" className="h-auto p-0 text-primary">
                                    <Link href="/nurse/records">Open records</Link>
                                </Button>
                            </li>
                            <li className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
                                <span>Flag supply concern</span>
                                <Button asChild variant="link" className="h-auto p-0 text-primary">
                                    <Link href="/nurse/inventory">Review inventory</Link>
                                </Button>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
