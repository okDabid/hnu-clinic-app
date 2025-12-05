"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    CalendarDays,
    ClipboardList,
    FileSpreadsheet,
    NotebookPen,
    Users2,
} from "lucide-react";

import ScholarLayout from "@/components/scholar/scholar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const workflowHighlights = [
    {
        title: "Coordinate appointments",
        description:
            "Review upcoming visits, arrange queues, and update the board when there are walk-ins or cancellations.",
        href: "/scholar/appointments",
        icon: CalendarDays,
        cta: "Open appointment hub",
    },
    {
        title: "Assist patient intake",
        description:
            "Search student profiles, confirm eligibility, and share the latest notes with the nursing team.",
        href: "/scholar/patients",
        icon: Users2,
        cta: "View patient list",
    },
    {
        title: "Maintain scholar records",
        description:
            "Keep your contact and emergency details updated so the clinic can reach you during campus operations.",
        href: "/scholar/account",
        icon: ClipboardList,
        cta: "Manage account",
    },
] as const;

const supportChecklist = [
    "Confirm the day’s appointment roster at least one hour before clinic opening.",
    "Log every walk-in case in the shared tracker so nurses can assign the next available slot.",
    "Escalate urgent symptoms directly to the nurse channel to alert the medical team immediately.",
];

const documentationTips = [
    {
        label: "Schedule walk-ins",
        description: "Document walk-in for visibility across the clinic.",
        href: "/scholar/appointments",
    },
    {
        label: "Sync patient information",
        description: "Verify program, year level, and contact details during intake.",
        href: "/scholar/patients",
    },
    {
        label: "Refresh personal records",
        description: "Review your profile and confirm that emergency contacts are current.",
        href: "/scholar/account",
    },
] as const;

export default function ScholarDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "Working Scholar";
    const firstName = useMemo(() => fullName.split(" ")[0] || fullName, [fullName]);

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
            <section className="rounded-3xl border border-primary/20 bg-linear-to-r from-primary/10 via-white to-primary/5 p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Welcome back</p>
                        <h3 className="text-3xl font-semibold text-primary md:text-4xl">Good day, Scholar {firstName}</h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Keep the clinic desk synchronized—double-check booking requests, guide students through intake, and
                            flag any priority concerns early so the team can respond quickly.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {workflowHighlights.map(({ title, description, href, icon: Icon, cta }) => (
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
                            <Button
                                asChild
                                variant="ghost"
                                className="rounded-xl bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/20"
                            >
                                <Link href={href}>{cta}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                <Card className="h-full rounded-3xl border-primary/20 bg-linear-to-br from-primary via-emerald-500 to-emerald-400 text-primary-foreground shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                                <NotebookPen className="h-5 w-5" />
                            </span>
                            Coordination insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-white/90">
                        <p>
                            Share status updates in the clinic chat when appointment queues change so the medical team can adapt their rounds.
                        </p>
                        <p>
                            Keep intake forms organized before handoff—complete profiles help nurses and doctors focus on care instead of paperwork.
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Checklist for smooth clinic flow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        {supportChecklist.map((item) => (
                            <div key={item} className="flex gap-3">
                                <FileSpreadsheet className="mt-1 h-4 w-4 text-primary" />
                                <p>{item}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
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
