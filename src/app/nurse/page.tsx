"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    BarChart3,
    ClipboardList,
    Package,
    Pill,
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

const HIGHLIGHTS = [
    {
        label: "Active Accounts",
        value: "128",
        detail: "4 new this week",
    },
    {
        label: "Low-stock Alerts",
        value: "12",
        detail: "2 require replenishment",
    },
    {
        label: "Today’s Appointments",
        value: "24",
        detail: "First check-in at 8:00 AM",
    },
];

const CAPABILITIES = [
    {
        title: "Accounts Management",
        icon: Users,
        items: [
            "Create and onboard scholars, doctors, and admins",
            "Update and verify credentials",
            "Activate or suspend access instantly",
        ],
    },
    {
        title: "Patient Records",
        icon: ClipboardList,
        items: [
            "Search complete patient histories",
            "Maintain consultation notes",
            "Monitor vitals and treatment plans",
        ],
    },
    {
        title: "Medicine Dispensing",
        icon: Pill,
        items: [
            "Log dispensed medicines accurately",
            "Track dosage and frequency",
            "Preserve a clear audit trail",
        ],
    },
    {
        title: "Inventory Oversight",
        icon: Package,
        items: [
            "Record replenishments and adjustments",
            "Prioritize FIFO expiries",
            "Maintain optimal stock levels",
        ],
    },
    {
        title: "Performance Insights",
        icon: BarChart3,
        items: [
            "Generate clinic utilization reports",
            "Monitor medicine turnover",
            "Share metrics with administrators",
        ],
    },
];

const QUICK_LINKS = [
    {
        title: "Review Inventory",
        description: "Check stock levels and manage replenishment queues.",
        href: "/nurse/inventory",
    },
    {
        title: "Manage Appointments",
        description: "Coordinate daily schedules and clinic availability.",
        href: "/nurse/clinic",
    },
    {
        title: "Update Accounts",
        description: "Onboard new staff and keep records current.",
        href: "/nurse/accounts",
    },
];

export default function NurseDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Nurse";

    return (
        <NurseLayout
            title="Dashboard Overview"
            description="Manage accounts, clinic schedules, inventory, and records with a clear operational snapshot."
            actions={
                <Button asChild className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700">
                    <Link href="/nurse/records">View Records</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-green-100/70 bg-white/80 p-6 shadow-sm backdrop-blur md:p-8">
                <div className="grid gap-6 md:grid-cols-[1.4fr,1fr] md:items-start">
                    <div className="space-y-4">
                        <p className="text-sm font-semibold uppercase tracking-wider text-green-500">
                            Welcome back
                        </p>
                        <h3 className="text-3xl font-semibold text-green-700 sm:text-4xl">
                            {fullName}
                        </h3>
                        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                            Keep the clinic running smoothly with quick visibility into patient appointments, supply levels,
                            and team coordination. Use the quick actions below to jump straight into critical workflows.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {HIGHLIGHTS.map((highlight) => (
                                <div
                                    key={highlight.label}
                                    className="rounded-2xl border border-green-100 bg-green-50/70 p-4 text-center shadow-sm"
                                >
                                    <p className="text-2xl font-semibold text-green-700">
                                        {highlight.value}
                                    </p>
                                    <p className="text-xs font-medium uppercase tracking-wide text-green-500">
                                        {highlight.label}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">{highlight.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4 rounded-3xl border border-green-100 bg-green-50/60 p-6 shadow-sm">
                        <h4 className="text-lg font-semibold text-green-700">Quick actions</h4>
                        <div className="space-y-4">
                            {QUICK_LINKS.map((quickLink) => (
                                <Link
                                    key={quickLink.title}
                                    href={quickLink.href}
                                    className="flex flex-col gap-1 rounded-2xl border border-green-100 bg-white/80 px-4 py-3 text-sm font-medium text-green-700 shadow-sm transition hover:-translate-y-[1px] hover:bg-green-100/70"
                                >
                                    <span>{quickLink.title}</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {quickLink.description}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {CAPABILITIES.map((capability) => {
                    const Icon = capability.icon;
                    return (
                        <Card
                            key={capability.title}
                            className="h-full rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
                        >
                            <CardHeader className="space-y-2">
                                <div className="flex items-center gap-3 text-green-600">
                                    <span className="rounded-2xl bg-green-100/80 p-2">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <CardTitle className="text-lg font-semibold text-green-700">
                                        {capability.title}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {capability.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>
        </NurseLayout>
    );
}
