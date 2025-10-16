"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    BarChart3,
    ClipboardCheck,
    ClipboardList,
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
import { Separator } from "@/components/ui/separator";

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

const shiftReminders = [
    "Verify tomorrow's appointment queue and prepare intake forms by 3:00 PM.",
    "Coordinate with physicians on urgent follow-ups and note special care instructions.",
    "Audit essential medicines before closing to keep the dispensary fully stocked.",
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
                <Button asChild className="hidden rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700 md:flex">
                    <Link href="/nurse/records">View Records</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-green-100/70 bg-gradient-to-r from-green-100/70 via-white to-green-50/80 p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-500">Welcome back</p>
                        <h3 className="text-3xl font-semibold text-green-700 md:text-4xl">Hello, {firstName}</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Keep the clinic running smoothly with instant visibility into schedules, stock levels, and patient coordination. Use the quick tools below to support the care team.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 rounded-2xl border border-green-100 bg-white/80 p-4 text-sm text-muted-foreground shadow-sm md:w-80">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600/10 text-green-700">
                                <ClipboardList className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-green-500">Today&apos;s focus</p>
                                <p className="font-semibold text-green-700">Verify supply counts before closeout.</p>
                            </div>
                        </div>
                        <Separator className="border-green-100" />
                        <Button asChild variant="outline" className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70">
                            <Link href="/nurse/inventory">Review inventory log</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {quickActions.map(({ title, description, href, icon: Icon, cta }) => (
                    <Card
                        key={title}
                        className="h-full rounded-3xl border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
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
                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-green-700">How to keep clinic flow steady</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Review pending appointments each morning and pre-stage the necessary charts and equipment so care teams can begin on time.
                        </p>
                        <p>
                            Document every dispensing and inventory update as it happens. Accurate logs keep compliance effortless during audits.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button asChild variant="outline" className="w-full rounded-xl border-green-200 text-green-700 hover:bg-green-100/70">
                                <Link href="/nurse/dispense">Open dispensing log</Link>
                            </Button>
                            <Button asChild variant="ghost" className="w-full rounded-xl bg-green-600/10 text-green-700 hover:bg-green-600/20">
                                <Link href="/nurse/clinic">View clinic schedule</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-green-700">Shift reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <ul className="space-y-2">
                            {shiftReminders.map((tip) => (
                                <li key={tip} className="flex items-start gap-2 rounded-2xl bg-green-600/5 p-3">
                                    <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
