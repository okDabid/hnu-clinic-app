"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Button } from "@/components/ui/button";
import { useDashboardUser } from "@/hooks/use-dashboard-user";
import { nurseDashboardContent } from "@/lib/dashboard-content";

const { quickActions } = nurseDashboardContent;

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
            <div className="grid gap-6 xl:gap-8 lg:grid-cols-[3fr_1fr]">
                <QuickActionsGrid
                    actions={quickActions}
                    className="xl:grid-cols-4"
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
