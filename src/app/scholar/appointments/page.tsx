"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CalendarDays, Clock3, Loader2, RefreshCcw, Search } from "lucide-react";

import ScholarLayout from "@/components/scholar/scholar-layout";
import { AppointmentPanel } from "@/components/appointments/appointment-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatManilaDateTime } from "@/lib/time";

const STATUS_ORDER = ["Pending", "Approved", "Moved", "Completed", "Cancelled"] as const;

type AppointmentStatus = (typeof STATUS_ORDER)[number];

type ScholarAppointment = {
    id: string;
    clinic: {
        id: string;
        name: string;
    };
    doctor: {
        id: string;
        name: string;
    };
    patient: {
        id: string;
        name: string;
        identifier: string;
        type: string;
    };
    start: string;
    end: string;
    serviceType: string | null;
    status: AppointmentStatus;
    remarks: string;
    createdAt: string;
    updatedAt: string;
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
    Pending: "Awaiting review",
    Approved: "Confirmed",
    Moved: "Rescheduled",
    Completed: "Completed",
    Cancelled: "Cancelled",
};

const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Moved: "border-sky-200 bg-sky-50 text-sky-700",
    Completed: "border-slate-200 bg-slate-100 text-slate-700",
    Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const ACTIVE_STATUSES: AppointmentStatus[] = ["Pending", "Approved", "Moved"];

function isToday(value: string) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const date = new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    return today === date;
}

function formatDateOnly(value: string) {
    return formatManilaDateTime(value, {
        hour: undefined,
        minute: undefined,
    });
}

function formatTimeOnly(value: string) {
    return formatManilaDateTime(value, {
        year: undefined,
        month: undefined,
        day: undefined,
    });
}

function formatTimeWindow(start: string, end: string) {
    const startText = formatTimeOnly(start);
    const endText = formatTimeOnly(end);
    return endText ? `${startText} – ${endText}` : startText;
}

export default function ScholarAppointmentsPage() {
    const [appointments, setAppointments] = useState<ScholarAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("active");

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/scholar/appointments?status=all", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to load appointments");
                return;
            }
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error("Unable to load appointments");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    const searchTerm = search.trim().toLowerCase();

    const filteredAppointments = useMemo(() => {
        return appointments.filter((appointment) => {
            if (statusFilter && statusFilter !== "all") {
                if (statusFilter === "active" && !ACTIVE_STATUSES.includes(appointment.status)) {
                    return false;
                }
                if (
                    statusFilter !== "active" &&
                    appointment.status.toLowerCase() !== statusFilter.toLowerCase()
                ) {
                    return false;
                }
            }

            if (!searchTerm) return true;

            const haystack = [
                appointment.patient.name,
                appointment.patient.identifier,
                appointment.patient.type,
                appointment.doctor.name,
                appointment.clinic.name,
                appointment.serviceType ?? "",
                appointment.status,
                appointment.remarks,
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(searchTerm);
        });
    }, [appointments, searchTerm, statusFilter]);

    const statusCounts = useMemo(() => {
        const counts: Record<AppointmentStatus, number> = {
            Pending: 0,
            Approved: 0,
            Moved: 0,
            Completed: 0,
            Cancelled: 0,
        };
        for (const appointment of appointments) {
            counts[appointment.status] += 1;
        }
        return counts;
    }, [appointments]);

    const activeAppointments = useMemo(
        () => appointments.filter((appointment) => ACTIVE_STATUSES.includes(appointment.status)),
        [appointments]
    );

    const todayAppointments = useMemo(
        () => appointments.filter((appointment) => isToday(appointment.start)),
        [appointments]
    );

    const nextAppointment = useMemo(() => {
        const upcoming = activeAppointments
            .filter((appointment) => new Date(appointment.start).getTime() >= Date.now())
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        return upcoming[0] ?? null;
    }, [activeAppointments]);

    return (
        <ScholarLayout
            title="Appointment coordination"
            description="Track campus clinic bookings, monitor status changes, and keep students informed about their schedules."
            actions={
                <Button variant="outline" onClick={loadAppointments} className="rounded-xl">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            }
        >
            <div className="flex flex-col gap-6">
                <section className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">
                                    Active queue
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Pending, approved, and moved appointments
                                </p>
                            </div>
                            <Clock3 className="h-9 w-9 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">
                                {activeAppointments.length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">
                                    Today&apos;s visits
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Appointments scheduled for today
                                </p>
                            </div>
                            <CalendarDays className="h-9 w-9 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">
                                {todayAppointments.length}
                            </p>
                            {nextAppointment ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Next: {nextAppointment.patient.name} at {formatTimeOnly(nextAppointment.start)}
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">
                                    Pending approvals
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Requests awaiting confirmation
                                </p>
                            </div>
                            <AlertCircle className="h-9 w-9 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">
                                {statusCounts.Pending}
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <AppointmentPanel
                    icon={CalendarDays}
                    title="Appointment board"
                    description="Filter bookings, verify walk-ins, and notify the medical team when schedules shift."
                    actions={
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
                            </div>
                        </div>
                    }
                    contentClassName="pt-4"
                >
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Search queue</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, ID, clinic, or note"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="rounded-xl border-green-200 pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Status filter</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="active">Active queue</SelectItem>
                                        {STATUS_ORDER.map((status) => (
                                            <SelectItem key={status} value={status.toLowerCase()}>
                                                {STATUS_LABELS[status]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                                        <TableHead className="min-w-[160px]">Patient</TableHead>
                                        <TableHead className="min-w-[160px]">Clinic</TableHead>
                                        <TableHead className="min-w-[140px]">Doctor</TableHead>
                                        <TableHead className="min-w-[110px]">Date</TableHead>
                                        <TableHead className="min-w-[140px]">Time</TableHead>
                                        <TableHead className="min-w-[120px]">Status</TableHead>
                                        <TableHead className="min-w-[120px]">Service</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                <div className="flex items-center justify-center gap-2 text-sm">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading appointments...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredAppointments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                No appointments match your filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAppointments.map((appointment) => (
                                            <TableRow key={appointment.id} className="text-sm">
                                                <TableCell className="font-medium text-green-700">
                                                    <div className="flex flex-col">
                                                        <span>{appointment.patient.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {appointment.patient.type}
                                                            {appointment.patient.identifier
                                                                ? ` • ${appointment.patient.identifier}`
                                                                : ""}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{appointment.clinic.name || "—"}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Created {formatManilaDateTime(appointment.createdAt)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{appointment.doctor.name || "—"}</TableCell>
                                                <TableCell>{formatDateOnly(appointment.start)}</TableCell>
                                                <TableCell>{formatTimeWindow(appointment.start, appointment.end)}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn("rounded-full px-2 py-1 text-xs", STATUS_BADGE_CLASSES[appointment.status])}>
                                                        {STATUS_LABELS[appointment.status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{appointment.serviceType ?? "—"}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </AppointmentPanel>
            </div>

        </ScholarLayout>
    );
}
