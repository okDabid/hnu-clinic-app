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

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">How to keep clinic flow steady</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Review pending appointments each morning and pre-stage the necessary charts and equipment so care teams can begin on time.
                        </p>
                        <p>
                            Document every dispensing and inventory update as it happens. Accurate logs keep compliance effortless during audits.
                        </p>
                        <Button asChild variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                            <Link href="/nurse/dispense">Open dispensing log</Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                            <Link href="/nurse/clinic">View clinic schedule</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
