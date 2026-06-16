"use client";

import Link from "next/link";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { BulletListCard } from "@/components/dashboard/bullet-list-card";
import ScholarLayout from "@/components/scholar/scholar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardUser } from "@/hooks/use-dashboard-user";
import { scholarDashboardContent } from "@/lib/dashboard-content";

const {
    workflowHighlights,
    supportChecklist,
    documentationTips,
    coordinationInsights,
    coordinationIcon: NotebookPen,
    checklistIcon: FileSpreadsheet,
    highlightIcon: BarChart3,
} = scholarDashboardContent;

export default function ScholarDashboardPage() {
    const { firstName } = useDashboardUser("Working Scholar");

    return (
        <ScholarLayout
            title="Clinic coordination hub"
            description="Monitor appointments, support patient intake, and keep campus care moving smoothly."
            actions={
                <Button
                    asChild
                    className="hidden rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex"
                >
                    <Link href="/scholar/appointments">Review appointments</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Scholar ${firstName}`}
                description="Keep the clinic desk synchronized—double-check booking requests, guide students through intake, and flag any priority concerns early so the team can respond quickly."
                className="bg-linear-to-r"
            />

            <QuickActionsGrid
                actions={workflowHighlights}
                className="xl:grid-cols-4"
                highlight={{
                    title: "Coordination insights",
                    icon: BarChart3,
                    description: coordinationInsights,
                    className: "bg-linear-to-br",
                }}
            />

            <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr] xl:grid-cols-[1.5fr_1fr_1fr]">
                <Card className="rounded-3xl border-primary/20 bg-linear-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                                <NotebookPen className="h-5 w-5" />
                            </span>
                            Coordination insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                        {coordinationInsights.map((insight) => (
                            <p key={insight}>{insight}</p>
                        ))}
                    </CardContent>
                </Card>
                <BulletListCard title="Checklist for smooth clinic flow" items={supportChecklist} icon={FileSpreadsheet} />
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Documentation shortcuts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        {documentationTips.map(({ label, description, href }) => (
                            <div key={label} className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                <div className="flex items-center justify-between">
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
        </ScholarLayout>
    );
}
