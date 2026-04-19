"use client";

import Link from "next/link";
import { BarChart3, ClipboardCheck, Package, Users } from "lucide-react";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { Progress } from "@/components/ui/progress";
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

const overviewStats = [
    { label: "Total patients", value: "1,248", trend: "+6% this week" },
    { label: "Today’s appointments", value: "42", trend: "8 waiting check-in" },
    { label: "Available doctors", value: "7", trend: "2 in consultation" },
    { label: "Low-stock medicines", value: "11", trend: "Needs replenishment" },
];

const activityFeed: ActivityItem[] = [
    { label: "Appointment checked in", detail: "Ana Reyes • 09:30 AM", type: "success" },
    { label: "Consultation submitted", detail: "Dr. Dela Cruz • Dental", type: "info" },
    { label: "Low stock alert", detail: "Amoxicillin 500mg • 12 units left", type: "warning" },
    { label: "Account disabled", detail: "Staff profile archived by admin", type: "error" },
];

export default function NurseDashboardPage() {
    const { firstName } = useDashboardUser("Nurse");

    return (
        <NurseLayout
            title="Dashboard Overview"
            description="Manage clinic operations with an at-a-glance view of appointments, inventory, consultations, and accounts."
            actions={
                <Button asChild className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                    <Link href="/nurse/records">View Records</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Nurse ${firstName}`}
                description="Coordinate staff workflows quickly with clear operational insights, recent activities, and priority alerts."
            />

            <OverviewMetrics metrics={overviewStats} />

            <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
                <Card className="rounded-2xl border-border/70 bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-primary">
                            <BarChart3 className="h-4 w-4" /> Patient visits & inventory trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Patient visits utilization</span>
                                <span className="font-medium text-primary">74%</span>
                            </div>
                            <Progress value={74} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Inventory availability</span>
                                <span className="font-medium text-primary">86%</span>
                            </div>
                            <Progress value={86} className="h-2" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Trend indicators refresh from the clinic queue and stock modules to support fast staffing and replenishment decisions.
                        </p>
                    </CardContent>
                </Card>

                <ActivityFeed items={activityFeed} />
            </section>

            <div className="grid gap-6 xl:gap-8 lg:grid-cols-[3fr_1fr]">
                <QuickActionsGrid
                    actions={quickActions}
                    className="xl:grid-cols-4"
                    highlight={{
                        title: "Operations insights",
                        icon: BarChart3,
                        description: [
                            "Align clinic traffic peaks early to balance resources and reduce patient waiting time.",
                            "Share updates in real-time so doctors and scholars can adapt quickly.",
                        ],
                    }}
                />
            </div>
        </NurseLayout>
    );
}
