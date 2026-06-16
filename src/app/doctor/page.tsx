"use client";

import Link from "next/link";
import { Stethoscope } from "lucide-react";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { BulletListCard } from "@/components/dashboard/bullet-list-card";
import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardUser } from "@/hooks/use-dashboard-user";
import { doctorDashboardContent } from "@/lib/dashboard-content";

const { managementAreas, operationalHighlights } = doctorDashboardContent;

export default function DoctorDashboardPage() {
    const { firstName } = useDashboardUser("Doctor");

    return (
        <DoctorLayout
            title="Clinical operations overview"
            description="Monitor your upcoming schedule, manage patient interactions, and streamline coordination with the HNU Clinic team."
            actions={
                <Button asChild className="hidden rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 md:flex">
                    <Link href="/doctor/consultation">Update availability</Link>
                </Button>
            }
        >
            <DashboardWelcome
                heading={`Good day, Dr. ${firstName}`}
                description="Review key updates for the day, respond to appointment movements, and keep your consultation schedule aligned with campus demand."
                className="bg-linear-to-r"
            />

            <QuickActionsGrid
                actions={managementAreas}
                highlight={{
                    title: "Clinic insights",
                    icon: Stethoscope,
                    description: [
                        "Align your consultation blocks with high-demand clinics to reduce wait times and improve patient satisfaction.",
                        "Use the dispensing log to monitor supply usage so the pharmacy team can replenish critical medicines on schedule.",
                    ],
                    className: "bg-linear-to-br",
                }}
            />

            <section className="flex flex-row items-start justify-between gap-3">
                <BulletListCard title="Operational checklist" items={operationalHighlights} />
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Access updated clinic forms, incident templates, and medication guides to keep documentation consistent across the team.
                        </p>
                        <Button asChild variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                            <Link href="/doctor/dispense">Go to dispensing log</Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                            <Link href="/doctor/patients">Browse patient records</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </DoctorLayout>
    );
}
