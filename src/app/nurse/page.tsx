"use client";

import Link from "next/link";
import { BarChart3, ClipboardCheck, Package, ShieldCheck, Users } from "lucide-react";

import { DashboardStatStrip } from "@/components/dashboard/dashboard-stat-strip";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Button } from "@/components/ui/button";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const quickActions = [
    {
        title: "Supervise inventory",
        description: "Monitor critical stock levels, replenishments, and medicine expiry windows.",
        href: "/nurse/inventory",
        icon: Package,
        cta: "Review inventory",
    },
    {
        title: "Support patient records",
        description: "Update consultation notes, triage details, and handoff information for clinicians.",
        href: "/nurse/records",
        icon: ClipboardCheck,
        cta: "View records",
    },
    {
        title: "Administer accounts",
        description: "Create users, reset credentials, and keep role-based access clean and secure.",
        href: "/nurse/accounts",
        icon: Users,
        cta: "Manage accounts",
    },
];

const nurseStats = [
    { label: "Inventory health", value: "Stable", hint: "No stockout alerts", icon: Package },
    { label: "Active queues", value: "4", hint: "Clinic stations in progress", icon: BarChart3 },
    { label: "Records to review", value: "18", hint: "Awaiting verification", icon: ClipboardCheck },
    { label: "Access posture", value: "Secure", hint: "RBAC synced and updated", icon: ShieldCheck },
];

export default function NurseDashboardPage() {
    const { firstName } = useDashboardUser("Nurse");

    return (
        <NurseLayout
            title="Operations control center"
            description="Run day-to-day clinic workflows with better visibility across inventory, records, scheduling, and access management."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/nurse/records">Open records board</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Nurse ${firstName}`}
                description="Use this SaaS-style command dashboard to prioritize care operations and resolve bottlenecks before they affect patient flow."
            />

            <DashboardStatStrip stats={nurseStats} />

            <QuickActionsGrid
                actions={quickActions}
                className="xl:grid-cols-4"
                highlight={{
                    title: "Operations insights",
                    icon: BarChart3,
                    description: [
                        "Monitor peak clinic traffic windows and pre-position staff for faster intake.",
                        "Keep triage and handoff notes complete so doctors can start consultations immediately.",
                    ],
                }}
            />
        </NurseLayout>
    );
}
