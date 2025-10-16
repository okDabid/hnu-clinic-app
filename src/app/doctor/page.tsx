"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    CalendarDays,
    ClipboardList,
    ClipboardCheck,
    Pill,
    Stethoscope,
    UserCog,
    Clock4,
} from "lucide-react";

import DoctorLayout from "@/components/patient/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Doctor";
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

    return (
        <DoctorLayout
            title="Clinical operations overview"
            description="Monitor your upcoming schedule, manage patient interactions, and streamline coordination with the HNU Clinic team."
            actions={
                <Button asChild className="hidden rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 md:flex">
                    <Link href="/doctor/consultation">Update availability</Link>
                </Button>
            }
        >
            <section className="rounded-3xl border border-emerald-100/70 bg-gradient-to-r from-emerald-100/70 via-white to-emerald-50/80 p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
                            Welcome back
                        </p>
                        <h3 className="text-3xl font-semibold text-emerald-700 md:text-4xl">
                            Good day, Dr. {firstName}
                        </h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Review key updates for the day, respond to appointment movements, and keep your consultation schedule aligned with campus demand.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm text-muted-foreground shadow-sm md:w-80">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700">
                                <ClipboardCheck className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-emerald-500">Today&apos;s reminders</p>
                                <p className="font-semibold text-emerald-700">
                                    Confirm pending appointments before 4:00 PM.
                                </p>
                            </div>
                        </div>
                        <Separator className="border-emerald-100" />
                        <Button asChild variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-100/70">
                            <Link href="/doctor/appointments">Open appointment hub</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {managementAreas.map(({ title, description, href, icon: Icon, cta }) => (
                    <Card
                        key={title}
                        className="h-full rounded-3xl border-emerald-100/70 bg-white/85 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <CardHeader className="flex flex-row items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-3 text-lg text-emerald-700">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    {title}
                                </CardTitle>
                                <p className="text-sm font-normal text-muted-foreground">{description}</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="ghost" className="rounded-xl bg-emerald-600/10 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-600/20">
                                <Link href={href}>{cta}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                <Card className="h-full rounded-3xl border-emerald-100/70 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-md">
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
                <Card className="rounded-3xl border-emerald-100/70 bg-white/85 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-emerald-700">Operational checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <ul className="space-y-2">
                            {operationalHighlights.map((item) => (
                                <li key={item} className="flex items-start gap-2 rounded-2xl bg-emerald-600/5 p-3">
                                    <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-emerald-100/70 bg-white/85 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-emerald-700">Resources</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Access updated clinic forms, incident templates, and medication guides to keep documentation consistent across the team.
                        </p>
                        <Button asChild variant="outline" className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-100/70">
                            <Link href="/doctor/dispense">Go to dispensing log</Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full rounded-xl bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20">
                            <Link href="/doctor/patients">Browse patient registry</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </DoctorLayout>
    );
}
