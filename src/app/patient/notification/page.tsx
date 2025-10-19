"use client";

import { useSession } from "next-auth/react";
import {
    Bell,
    CheckCircle2,
    CalendarCheck,
    CalendarClock,
    ClipboardCheck,
    Info,
    Mail,
    XCircle,
} from "lucide-react";

import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const notificationHighlights = [
    {
        icon: Mail,
        title: "Email Alerts",
        description:
            "We will send an email every time a doctor moves your appointment so you have a written record of the new schedule.",
    },
    {
        icon: CalendarCheck,
        title: "Portal Reminders",
        description:
            "Review upcoming visits from the patient portal. Double-check the rescheduled date, time, and clinic in one glance.",
    },
    {
        icon: Info,
        title: "Doctor Notes",
        description:
            "Moved appointments include a short note from the doctor explaining the change, helping you prepare ahead of time.",
    },
];

const followUpTips = [
    "Confirm that the new schedule fits your availability and plan to arrive 10 minutes early.",
    "Update personal reminders on your phone or calendar with the revised appointment details.",
    "Check the Appointments tab whenever a status changes to Approved, Cancelled, or Completed to see what to do next.",
    "Contact the clinic if you need additional adjustments or medical assistance before your visit.",
];

const statusUpdates = [
    {
        icon: CheckCircle2,
        title: "Approved status",
        description:
            "Your visit is confirmed. The doctor is expecting you, so arrive a little early to complete any forms before your scheduled time.",
    },
    {
        icon: CalendarClock,
        title: "Moved status",
        description:
            "The clinic rescheduled your visit. Check the Appointments tab for the updated date and time and make sure the new slot still works for you.",
    },
    {
        icon: ClipboardCheck,
        title: "Completed status",
        description:
            "The appointment has finished. Review any consultation notes or prescriptions under your Appointments tab for next steps.",
    },
    {
        icon: XCircle,
        title: "Cancelled status",
        description:
            "Either you or the clinic cancelled the appointment. Read the cancellation note and book a new schedule if you still need care.",
    },
];

export default function PatientNotificationPage() {
    const { data: session } = useSession();

    const fullName = session?.user?.name ?? "Patient";

    const layoutTitle = "Notification center";
    const layoutDescription = `${fullName}, stay on top of appointment approvals, updates, and reminders for your clinic visits.`;

    return (
        <PatientLayout
            title={layoutTitle}
            description={layoutDescription}
            actions={
                <div className="hidden items-center gap-2 rounded-xl border border-green-100 bg-white/80 px-4 py-2 text-xs font-semibold text-green-700 shadow-sm md:flex">
                    <Bell className="h-4 w-4" />
                    Real-time alerts
                </div>
            }
        >
            <div className="space-y-8">
                <Card className="rounded-3xl border-green-100/80 bg-gradient-to-r from-green-100/80 via-white to-green-50/80 shadow-sm">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-3xl font-semibold text-green-700">Stay informed, stay prepared</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Hello <span className="font-semibold text-green-700">{fullName}</span>! Whenever your doctor approves, moves, or completes an appointment, we capture the update here so you never miss a step.
                        </p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-green-700">
                        <span className="rounded-full bg-white/70 px-3 py-1">Email reminders</span>
                        <span className="rounded-full bg-white/70 px-3 py-1">Portal notifications</span>
                        <span className="rounded-full bg-white/70 px-3 py-1">Status explanations</span>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-3">
                    {notificationHighlights.map(({ icon: Icon, title, description }) => (
                        <Card
                            key={title}
                            className="h-full rounded-3xl border-green-100/70 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                        >
                            <CardHeader className="flex flex-col items-start gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600/10 text-green-700">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <CardTitle className="text-lg text-green-700">{title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg text-green-700">How to follow up after an update</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <ul className="space-y-2">
                                {followUpTips.map((tip) => (
                                    <li key={tip} className="flex items-start gap-2 rounded-2xl bg-green-600/5 p-3">
                                        <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button asChild variant="outline" className="mt-2 w-full rounded-xl border-green-200 text-green-700 hover:bg-green-100/60">
                                <a href="/patient/appointments">Review appointments</a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg text-green-700">What each status means</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {statusUpdates.map(({ icon: Icon, title, description }) => (
                                <div key={title} className="flex gap-3 rounded-2xl border border-green-100/80 bg-green-600/5 p-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div className="space-y-1 text-sm">
                                        <p className="font-semibold text-green-700">{title}</p>
                                        <p className="text-muted-foreground">{description}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PatientLayout>
    );
}
