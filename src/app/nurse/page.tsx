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
            <div className="grid gap-5 lg:grid-cols-[2fr_1.2fr]">
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
            </div>
        </NurseLayout>
    );
}
