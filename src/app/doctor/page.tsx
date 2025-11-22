"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    CalendarDays,
    ClipboardList,
    Pill,
    Stethoscope,
    UserCog,
    Clock4,
} from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const coordinationSignals = [
    {
        title: "Confirm today's rounds",
        description: "Review the queue and let the desk know if you need to shorten or extend a block.",
        href: "/doctor/appointments",
    },
    {
        title: "Share follow-up plans",
        description: "Add quick notes to the latest consultation so nurses can brief the patient.",
        href: "/doctor/patients",
    },
    {
        title: "Sync dispensing",
        description: "Log new prescriptions to keep the pharmacy ledger aligned with clinic notes.",
        href: "/doctor/dispense",
    },
];

export default function DoctorDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Doctor";
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

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
            <section className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-white to-primary/5 p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
                            Welcome back
                        </p>
                        <h3 className="text-3xl font-semibold text-primary md:text-4xl">
                            Good day, Dr. {firstName}
                        </h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Review key updates for the day, respond to appointment movements, and keep your consultation schedule aligned with campus demand.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center text-sm">
                        {["Upcoming consults", "Pending approvals", "Follow-ups", "Dispensing"]
                            .map((label) => (
                                <div
                                    key={label}
                                    className="rounded-2xl border border-primary/20 bg-white/70 px-4 py-3 shadow-sm"
                                >
                                    <p className="text-xs uppercase tracking-wide text-primary/70">{label}</p>
                                    <p className="text-2xl font-semibold text-primary">—</p>
                                </div>
                            ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {managementAreas.map(({ title, description, href, icon: Icon, cta }) => (
                    <Card
                        key={title}
                        className="h-full rounded-3xl border-primary/20 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-3 text-lg text-primary">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    {title}
                                </CardTitle>
                                <p className="text-sm font-normal text-muted-foreground">{description}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="ghost" className="rounded-xl bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/20">
                                <Link href={href}>{cta}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                <Card className="h-full rounded-3xl border-primary/20 bg-linear-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                                <Stethoscope className="h-5 w-5" />
                            </span>
                            Clinic insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                        <p>
                            Align your consultation blocks with high-demand clinics to reduce wait times and improve patient satisfaction.
                        </p>
                        <p>
                            Use the dispensing log to monitor supply usage so the pharmacy team can replenish critical medicines on schedule.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
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
                        <CardTitle className="text-lg text-primary">Coordination signals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        {coordinationSignals.map(({ title, description, href }) => (
                            <div key={title} className="space-y-2 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-primary">{title}</p>
                                    <Button asChild variant="link" className="h-auto p-0 text-primary">
                                        <Link href={href}>Open</Link>
                                    </Button>
                                </div>
                                <p>{description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
        </DoctorLayout>
    );
}
