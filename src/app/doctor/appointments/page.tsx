"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    MoreHorizontal,
    Move,
    RefreshCcw,
    Search,
    Stethoscope,
    XCircle,
} from "lucide-react";

import { AppointmentPanel } from "@/components/appointments/appointment-panel";
import DoctorLayout from "@/components/doctor/doctor-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatManilaDateTime, formatManilaISODate, manilaNow } from "@/lib/time";

const STATUS_ORDER = ["Pending", "Approved", "Moved", "Completed", "Cancelled"] as const;

type AppointmentStatus = (typeof STATUS_ORDER)[number];

type Appointment = {
    id: string;
    patientName: string;
    date: string;
    time: string;
    status: string;
    clinic?: string;
    hasConsultation: boolean;
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

const STATUS_VALUE_MAP: Record<string, AppointmentStatus> = {
    pending: "Pending",
    approved: "Approved",
    moved: "Moved",
    completed: "Completed",
    cancelled: "Cancelled",
};

function normalizeStatus(value: string): AppointmentStatus | null {
    return STATUS_VALUE_MAP[value.toLowerCase()] ?? null;
}

function isToday(date: string) {
    return date === formatManilaISODate(manilaNow());
}

function formatDateOnly(value: string) {
    if (!value) return "—";
    const iso = `${value}T00:00:00+08:00`;
    return (
        formatManilaDateTime(iso, {
            hour: undefined,
            minute: undefined,
        }) ?? "—"
    );
}

function parseStartDate(appointment: Appointment) {
    const base = appointment.date;
    if (!base) return new Date();

    const [timePart, meridiemRaw] = appointment.time.split(" ");
    let hour = 0;
    let minute = 0;

    if (timePart) {
        const [hourPart, minutePart] = timePart.split(":");
        const parsedHour = Number.parseInt(hourPart ?? "0", 10);
        const parsedMinute = Number.parseInt(minutePart ?? "0", 10);
        hour = Number.isNaN(parsedHour) ? 0 : parsedHour;
        minute = Number.isNaN(parsedMinute) ? 0 : parsedMinute;
    }

    const meridiem = meridiemRaw?.toLowerCase() ?? "";
    if (meridiem === "pm" && hour < 12) {
        hour += 12;
    } else if (meridiem === "am" && hour === 12) {
        hour = 0;
    }

    const iso = `${base}T${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}:00+08:00`;
    return new Date(iso);
}

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionType, setActionType] = useState<"cancel" | "move" | null>(null);
    const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
    const [reason, setReason] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newTimeStart, setNewTimeStart] = useState("");
    const [newTimeEnd, setNewTimeEnd] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("active");

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/doctor/appointments", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch appointments");
            const data = (await res.json()) as Appointment[];
            setAppointments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load appointments");
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
            const status = normalizeStatus(appointment.status);
            if (statusFilter && statusFilter !== "all") {
                if (statusFilter === "active" && (!status || !ACTIVE_STATUSES.includes(status))) {
                    return false;
                }
                if (statusFilter !== "active") {
                    const matchStatus = STATUS_VALUE_MAP[statusFilter];
                    if (!matchStatus || status !== matchStatus) {
                        return false;
                    }
                }
            }

            if (!searchTerm) return true;

            const haystack = [
                appointment.patientName,
                appointment.clinic ?? "",
                appointment.date,
                appointment.time,
                appointment.status,
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
            const status = normalizeStatus(appointment.status);
            if (status) {
                counts[status] += 1;
            }
        }
        return counts;
    }, [appointments]);

    const activeAppointments = useMemo(
        () => appointments.filter((appointment) => {
            const status = normalizeStatus(appointment.status);
            return status ? ACTIVE_STATUSES.includes(status) : false;
        }),
        [appointments]
    );

    const todayAppointments = useMemo(
        () => appointments.filter((appointment) => isToday(appointment.date)),
        [appointments]
    );

    const nextAppointment = useMemo(() => {
        const upcoming = activeAppointments
            .map((appointment) => ({ appointment, start: parseStartDate(appointment) }))
            .filter(({ start }) => start.getTime() >= Date.now())
            .sort((a, b) => a.start.getTime() - b.start.getTime());
        return upcoming[0]?.appointment ?? null;
    }, [activeAppointments]);

    async function handleApprove(id: string) {
        try {
            const res = await fetch(`/api/doctor/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve" }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to approve");
                return;
            }
            toast.success("Appointment approved");
            setAppointments((prev) => prev.map((appt) => (appt.id === id ? data : appt)));
        } catch (error) {
            console.error(error);
            toast.error("Failed to approve appointment");
        }
    }

    async function handleComplete(id: string) {
        try {
            const res = await fetch(`/api/doctor/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "complete" }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to complete appointment");
                return;
            }
            toast.success("Appointment marked as completed");
            setAppointments((prev) => prev.map((appt) => (appt.id === id ? data : appt)));
        } catch (error) {
            console.error(error);
            toast.error("Failed to complete appointment");
        }
    }

    const resetDialogState = () => {
        setDialogOpen(false);
        setActionType(null);
        setSelectedAppt(null);
        setReason("");
        setNewDate("");
        setNewTimeStart("");
        setNewTimeEnd("");
    };

    async function handleActionSubmit() {
        if (!selectedAppt || !actionType) return;
        if (actionType === "cancel" && !reason.trim()) {
            toast.error("Please provide a reason");
            return;
        }
        if (
            actionType === "move" &&
            (!reason.trim() || !newDate || !newTimeStart || !newTimeEnd)
        ) {
            toast.error("Please complete all move fields");
            return;
        }

        try {
            const res = await fetch(`/api/doctor/appointments/${selectedAppt.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: actionType,
                    reason,
                    newDate,
                    newTimeStart,
                    newTimeEnd,
                }),
            });
            if (!res.ok) throw new Error("Action failed");

            if (actionType === "cancel") {
                setAppointments((prev) => prev.filter((appt) => appt.id !== selectedAppt.id));
                toast.success("Appointment cancelled");
            } else if (actionType === "move") {
                const updated = await res.json();
                setAppointments((prev) => prev.map((appt) => (appt.id === selectedAppt.id ? updated : appt)));
                toast.success("Appointment moved");
            }
            resetDialogState();
        } catch (error) {
            console.error(error);
            toast.error("Action failed");
        }
    }

    const handleDialogOpenChange = (open: boolean) => {
        if (!open) {
            resetDialogState();
        }
    };

    return (
        <DoctorLayout
            title="Appointment management"
            description="Oversee consultation requests, confirm schedules, and coordinate adjustments with patients."
            actions={
                <Button
                    variant="outline"
                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                    onClick={loadAppointments}
                >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh list
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
                            <p className="text-3xl font-semibold text-green-700">{activeAppointments.length}</p>
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
                            <p className="text-3xl font-semibold text-green-700">{todayAppointments.length}</p>
                            {nextAppointment ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Next: {nextAppointment.patientName} at {nextAppointment.time}
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
                            <p className="text-3xl font-semibold text-green-700">{statusCounts.Pending}</p>
                        </CardContent>
                    </Card>
                </section>

                <AppointmentPanel
                    icon={CalendarDays}
                    title="Appointment board"
                    description="Filter bookings, verify walk-ins, and notify the care team when schedules shift."
                    actions={
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Consultation synced
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-slate-300" /> Awaiting notes
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
                                        placeholder="Search by name, clinic, or status"
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
                                        <TableHead className="min-w-[120px]">Date</TableHead>
                                        <TableHead className="min-w-[120px]">Time</TableHead>
                                        <TableHead className="min-w-[120px]">Status</TableHead>
                                        <TableHead className="min-w-[160px]">Consultation</TableHead>
                                        <TableHead className="w-[110px] text-right">Actions</TableHead>
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
                                        filteredAppointments.map((appointment) => {
                                            const status = normalizeStatus(appointment.status);
                                            const statusLabel = status ? STATUS_LABELS[status] : appointment.status;
                                            const statusClasses = status
                                                ? STATUS_BADGE_CLASSES[status]
                                                : "border-slate-200 bg-slate-100 text-slate-700";

                                            const canApprove = status === "Pending";
                                            const canComplete = status === "Approved" || status === "Moved";
                                            const canManage = status ? status !== "Completed" && status !== "Cancelled" : true;

                                            return (
                                                <TableRow key={appointment.id} className="text-sm">
                                                    <TableCell className="font-medium text-green-700">
                                                        <div className="flex flex-col">
                                                            <span>{appointment.patientName}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {appointment.clinic ?? "Clinic assignment"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{appointment.clinic ?? "—"}</TableCell>
                                                    <TableCell>{formatDateOnly(appointment.date)}</TableCell>
                                                    <TableCell>{appointment.time || "—"}</TableCell>
                                                    <TableCell>
                                                        <Badge className={"rounded-full px-2 py-1 text-xs " + statusClasses}>
                                                            {statusLabel}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`rounded-full px-2 py-1 text-xs ${
                                                                appointment.hasConsultation
                                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                                    : "border-slate-200 bg-slate-100 text-slate-600"
                                                            }`}
                                                        >
                                                            {appointment.hasConsultation ? "Consultation ready" : "Awaiting notes"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="rounded-xl text-green-700 hover:bg-green-100"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-xl border-green-100">
                                                                <DropdownMenuItem
                                                                    onClick={() => handleApprove(appointment.id)}
                                                                    disabled={!canApprove}
                                                                >
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleComplete(appointment.id)}
                                                                    disabled={!canComplete}
                                                                >
                                                                    <Stethoscope className="mr-2 h-4 w-4" /> Complete
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        if (!canManage) return;
                                                                        setActionType("move");
                                                                        setSelectedAppt(appointment);
                                                                        setDialogOpen(true);
                                                                        setReason("");
                                                                        setNewDate(appointment.date);
                                                                        setNewTimeStart("");
                                                                        setNewTimeEnd("");
                                                                    }}
                                                                    disabled={!canManage}
                                                                >
                                                                    <Move className="mr-2 h-4 w-4" /> Move appointment
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        if (!canManage) return;
                                                                        setActionType("cancel");
                                                                        setSelectedAppt(appointment);
                                                                        setDialogOpen(true);
                                                                        setReason("");
                                                                    }}
                                                                    disabled={!canManage}
                                                                >
                                                                    <XCircle className="mr-2 h-4 w-4" /> Cancel appointment
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </AppointmentPanel>
            </div>

            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent className="rounded-3xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-green-700">
                            {actionType === "move" ? "Move appointment" : "Cancel appointment"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            {actionType === "move"
                                ? "Select a new schedule and provide context for the care team."
                                : "Let the patient know why the visit will not push through."}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAppt ? (
                        <div className="rounded-2xl bg-green-50/70 p-4 text-sm text-green-700">
                            <p className="font-semibold">{selectedAppt.patientName}</p>
                            <p className="text-xs text-muted-foreground">
                                {selectedAppt.clinic ?? "Clinic assignment"} • {formatDateOnly(selectedAppt.date)} • {" "}
                                {selectedAppt.time || "—"}
                            </p>
                        </div>
                    ) : null}
                    {actionType === "move" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label className="text-sm font-medium text-green-700">New date</Label>
                                <Input
                                    type="date"
                                    value={newDate}
                                    onChange={(event) => setNewDate(event.target.value)}
                                    className="rounded-xl border-green-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Start time</Label>
                                <Input
                                    type="time"
                                    value={newTimeStart}
                                    onChange={(event) => setNewTimeStart(event.target.value)}
                                    className="rounded-xl border-green-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">End time</Label>
                                <Input
                                    type="time"
                                    value={newTimeEnd}
                                    onChange={(event) => setNewTimeEnd(event.target.value)}
                                    className="rounded-xl border-green-200"
                                />
                            </div>
                        </div>
                    ) : null}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-700">Reason</Label>
                        <Input
                            placeholder={actionType === "move" ? "Share context for the new schedule" : "Explain the cancellation"}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            className="rounded-xl border-green-200"
                        />
                    </div>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={resetDialogState}>
                            Close
                        </Button>
                        <Button
                            className="rounded-xl bg-green-600 text-white hover:bg-green-700"
                            onClick={handleActionSubmit}
                        >
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DoctorLayout>
    );
}
