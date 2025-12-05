"use client";

import Link from "next/link";
import {
    BarChart3,
    ClipboardCheck,
    Package,
    Users,
} from "lucide-react";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

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

const coordinationSteps = [
    "Review pending appointments each morning and pre-stage charts and equipment for the care team.",
    "Document every dispensing and inventory update as it happens to keep audit logs accurate.",
    "Share schedule changes with doctors early so they can adjust consultations and follow-ups.",
];

const documentationLinks = [
    {
        label: "Open dispensing log",
        href: "/nurse/dispense",
        description: "Capture dispensing actions in real time to maintain an accurate ledger.",
    },
    {
        label: "View clinic schedule",
        href: "/nurse/clinic",
        description: "Prepare rooms and resources ahead of busy clinic blocks.",
    },
];

export default function NurseDashboardPage() {
    const { firstName } = useDashboardUser("Nurse");

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
            <DashboardWelcome
                heading={`Good day, Nurse ${firstName}`}
                description="Keep the clinic running smoothly with instant visibility into schedules, stock levels, and patient coordination. Use the quick tools below to support the care team."
            />

            <QuickActionsGrid
                actions={quickActions}
                highlight={{
                    title: "Operations insights",
                    icon: BarChart3,
                    description: [
                        "Align on clinic traffic peaks early to balance resources and shorten wait times for students and staff.",
                        "Keep communication logs updated so physicians can review triage actions and respond to follow-up needs quickly.",
                    ],
                }}
            />

            <section className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">How to keep clinic flow steady</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <ul className="space-y-3">
                            {coordinationSteps.map((step) => (
                                <li key={step} className="flex items-start gap-3 rounded-2xl bg-primary/5 p-3">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Documentation shortcuts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        {documentationLinks.map(({ label, href, description }) => (
                            <div key={label} className="space-y-2 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-semibold text-primary">{label}</p>
                                    <Button asChild variant="link" className="h-auto p-0 text-sm font-semibold text-primary">
                                        <Link href={href}>Open</Link>
                                    </Button>
                                </div>
                                <p>{description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
