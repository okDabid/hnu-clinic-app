"use client";

import { useSession } from "next-auth/react";
import {
    CalendarDays,
    FileText,
    Pill,
    Stethoscope,
    User,
    Users,
} from "lucide-react";

import DoctorLayout from "@/components/patient/doctor-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoctorDashboardPage() {
    const { data: session } = useSession();
    const fullName = session?.user?.name ?? "School Doctor";

    return (
        <DoctorLayout
            title="Dashboard Overview"
            description="Monitor your clinic responsibilities, track upcoming consultations, and keep patient care organized in one professional workspace."
        >
            <section className="rounded-3xl border border-green-100/80 bg-white/80 px-6 py-10 text-center shadow-sm backdrop-blur">
                <h2 className="text-2xl font-semibold text-green-700 md:text-3xl">
                    Welcome back, {fullName}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground md:text-base">
                    Manage appointments, consultations, medication dispensing, and patient relationships with clarity and confidence.
                </p>
            </section>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <Card className="border border-green-100/80 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <User className="h-5 w-5" /> Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                        <p>Review your profile details and update credentials securely.</p>
                        <p>Manage password settings and professional information.</p>
                    </CardContent>
                </Card>

                <Card className="border border-green-100/80 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Stethoscope className="h-5 w-5" /> Consultation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                        <p>Set availability, adjust duty hours, and approve schedule changes.</p>
                        <p>Coordinate clinic coverage and ensure patient access.</p>
                    </CardContent>
                </Card>

                <Card className="border border-green-100/80 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CalendarDays className="h-5 w-5" /> Appointments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                        <p>Approve, reschedule, or cancel appointments with a single view.</p>
                        <p>Track daily schedules and stay informed of upcoming visits.</p>
                    </CardContent>
                </Card>

                <Card className="border border-green-100/80 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Pill className="h-5 w-5" /> Dispense
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                        <p>Document prescribed medicines tied to consultations.</p>
                        <p>Monitor stock usage in sync with the clinic inventory.</p>
                    </CardContent>
                </Card>

                <Card className="border border-green-100/80 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Users className="h-5 w-5" /> Patients
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                        <p>Review patient history, vital notes, and consultation records.</p>
                        <p>Coordinate care plans and follow-up treatments.</p>
                    </CardContent>
                </Card>

                <Card className="border border-green-100/80 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <FileText className="h-5 w-5" /> Medical Certificates
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                        <p>Generate medical certificates with verified patient details.</p>
                        <p>Track issued documents for compliance and reporting.</p>
                    </CardContent>
                </Card>
            </section>
        </DoctorLayout>
    );
}
