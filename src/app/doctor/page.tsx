"use client";

import Link from "next/link";
import {
    CalendarDays,
    ClipboardList,
    Pill,
    Stethoscope,
    UserCog,
    Clock4,
} from "lucide-react";

import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardUser } from "@/hooks/use-dashboard-user";

const managementAreas = [
    {
        title: "Account management",
        description:
            "Update your profile, change credentials, and review administrative access details to stay compliant.",
        href: "/doctor/account",
        icon: UserCog,
        cta: "Review account",
    },
    {
        title: "Consultation hours",
        description:
            "Configure clinics, adjust availability, and publish upcoming consultation windows for students and staff.",
        href: "/doctor/consultation",
        icon: Clock4,
        cta: "Manage schedule",
    },
    {
        title: "Appointment oversight",
        description:
            "Approve requests, document visit outcomes, and coordinate reschedules with the clinic care team.",
        href: "/doctor/appointments",
        icon: CalendarDays,
        cta: "View appointments",
    },
    {
        title: "Medicine dispensing",
        description:
            "Record dispensed medicines, verify inventory balances, and ensure prescriptions are properly documented.",
        href: "/doctor/dispense",
        icon: Pill,
        cta: "Log dispense",
    },
    {
        title: "Patient insights",
        description:
            "Review patient records, access latest consultations, and prepare for follow-up care.",
        href: "/doctor/patients",
        icon: ClipboardList,
        cta: "Open registry",
    },
];

const operationalHighlights = [
    "Coordinate with the nursing team before updating consultation slots to prevent scheduling conflicts.",
    "All appointment adjustments notify the patient automatically—include clear notes for reschedules or cancellations.",
    "Document dispensed medicines within the same day to keep the inventory ledger accurate.",
];

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

            <section className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Operational checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <ul className="space-y-2">
                            {operationalHighlights.map((item) => (
                                <li key={item} className="flex items-start gap-2 rounded-2xl bg-primary/10 p-3">
                                    <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
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
                            <Link href="/doctor/patients">Browse patient registry</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </DoctorLayout>
    );
}
