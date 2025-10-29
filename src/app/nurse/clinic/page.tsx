"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { NurseLayout } from "@/components/nurse/nurse-layout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatManilaISODate, formatTimeRange, PH_TIME_ZONE } from "@/lib/time";
import { toast } from "sonner";

import NurseClinicLoading from "./loading";

type Clinic = {
    clinic_id: string;
    clinic_name: string;
    clinic_location: string;
    clinic_contactno: string;
};

type ClinicCalendarAppointment = {
    id: string;
    startISO: string;
    endISO: string;
    status: string;
    doctorName: string;
    patientName: string;
    patientType: "Student" | "Employee" | "Unknown";
};

type ClinicAppointmentsResponse = {
    clinicId: string;
    month: string;
    range: { start: string; endExclusive: string };
    appointments: {
        id: string;
        date: string;
        startISO: string;
        endISO: string;
        status: string;
        doctor: { id: string; name: string };
        patient: { id: string; name: string; type: "Student" | "Employee" | "Unknown" };
    }[];
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Moved: "border-sky-200 bg-sky-50 text-sky-700",
    Completed: "border-slate-200 bg-slate-100 text-slate-700",
    Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const ACTIVE_STATUSES = new Set(["Pending", "Approved", "Moved"]);

export default function NurseClinicPage() {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [scheduleClinicId, setScheduleClinicId] = useState<string | null>(null);
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date());
    const [appointmentsByDate, setAppointmentsByDate] = useState<Record<string, ClinicCalendarAppointment[]>>({});
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [calendarError, setCalendarError] = useState<string | null>(null);

    async function loadClinics() {
        try {
            const res = await fetch("/api/nurse/clinic");
            if (!res.ok) {
                throw new Error("Failed to load clinics");
            }
            const data = await res.json();
            setClinics(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load clinics");
        } finally {
            setInitializing(false);
        }
    }

    useEffect(() => {
        loadClinics();
    }, []);

    useEffect(() => {
        if (clinics.length > 0 && !scheduleClinicId) {
            setScheduleClinicId(clinics[0].clinic_id);
        }
    }, [clinics, scheduleClinicId]);

    const calendarMonthKey = useMemo(
        () =>
            `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`,
        [calendarMonth]
    );

    useEffect(() => {
        if (!scheduleClinicId) {
            setAppointmentsByDate({});
            return;
        }

        let cancelled = false;

        async function loadClinicAppointments() {
            setCalendarLoading(true);
            setCalendarError(null);

            try {
                const res = await fetch(
                    `/api/nurse/clinic/${scheduleClinicId}/appointments?month=${calendarMonthKey}`,
                    { cache: "no-store" }
                );

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    const message =
                        typeof errorData?.error === "string"
                            ? errorData.error
                            : "Failed to load clinic appointments";
                    throw new Error(message);
                }

                const data = (await res.json()) as ClinicAppointmentsResponse;

                if (cancelled) return;

                const grouped: Record<string, ClinicCalendarAppointment[]> = {};
                for (const appointment of data.appointments) {
                    const dateKey = appointment.date;
                    if (!grouped[dateKey]) {
                        grouped[dateKey] = [];
                    }

                    grouped[dateKey].push({
                        id: appointment.id,
                        startISO: appointment.startISO,
                        endISO: appointment.endISO,
                        status: appointment.status,
                        doctorName: appointment.doctor.name,
                        patientName: appointment.patient.name,
                        patientType: appointment.patient.type,
                    });
                }

                Object.values(grouped).forEach((list) =>
                    list.sort((a, b) => a.startISO.localeCompare(b.startISO))
                );

                setAppointmentsByDate(grouped);
                setSelectedDate((prev) => {
                    if (prev) {
                        const prevKey = formatManilaISODate(prev);
                        if (grouped[prevKey]) {
                            return prev;
                        }
                    }

                    const firstDateKey = Object.keys(grouped).sort()[0];
                    if (firstDateKey) {
                        return new Date(`${firstDateKey}T00:00:00`);
                    }

                    if (prev) {
                        return prev;
                    }

                    return new Date(`${calendarMonthKey}-01T00:00:00`);
                });
            } catch (error) {
                if (cancelled) return;
                console.error(error);
                setCalendarError(
                    error instanceof Error ? error.message : "Failed to load clinic appointments"
                );
                setAppointmentsByDate({});
            } finally {
                if (!cancelled) {
                    setCalendarLoading(false);
                }
            }
        }

        void loadClinicAppointments();

        return () => {
            cancelled = true;
        };
    }, [scheduleClinicId, calendarMonthKey]);

    const selectedDateKey = selectedDate ? formatManilaISODate(selectedDate) : null;
    const selectedAppointments = selectedDateKey
        ? appointmentsByDate[selectedDateKey] ?? []
        : [];

    const highlightedDates = useMemo(
        () =>
            Object.keys(appointmentsByDate).map(
                (dateKey) => new Date(`${dateKey}T00:00:00`)
            ),
        [appointmentsByDate]
    );

    const { totalAppointments, activeAppointments } = useMemo(() => {
        let total = 0;
        let active = 0;

        for (const list of Object.values(appointmentsByDate)) {
            total += list.length;
            active += list.filter((appt) => ACTIVE_STATUSES.has(appt.status)).length;
        }

        return { totalAppointments: total, activeAppointments: active };
    }, [appointmentsByDate]);

    const selectedDateLabel = selectedDate
        ? new Intl.DateTimeFormat("en-PH", {
            dateStyle: "full",
            timeZone: PH_TIME_ZONE,
        }).format(selectedDate)
        : "Select a date";

    async function handleAddClinic(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const payload = {
            clinic_name: formData.get("clinic_name"),
            clinic_location: formData.get("clinic_location"),
            clinic_contactno: formData.get("clinic_contactno"),
        };

        const res = await fetch("/api/nurse/clinic", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
        });

        setLoading(false);
        if (res.ok) {
            toast.success("Clinic added!");
            loadClinics();
        } else if (res.status === 409) {
            toast.error("Clinic with this name already exists");
        } else {
            toast.error("Failed to add clinic");
        }
    }

    async function handleUpdateClinic(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedClinic) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const payload = {
            clinic_name: selectedClinic.clinic_name,
            clinic_location: formData.get("clinic_location"),
            clinic_contactno: formData.get("clinic_contactno"),
        };

        const res = await fetch(`/api/nurse/clinic/${selectedClinic.clinic_id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
        });

        setLoading(false);
        if (res.ok) {
            toast.success("Clinic updated!");
            loadClinics();
        } else if (res.status === 409) {
            toast.error("Another clinic with this name already exists");
        } else {
            toast.error("Failed to update clinic");
        }
    }

    if (initializing) {
        return <NurseClinicLoading />;
    }

    return (
        <NurseLayout
            title="Clinic Management"
            description="Maintain clinic locations, contact information, and update details for campus services."
        >
            <section className="px-4 sm:px-6 py-6 sm:py-10 space-y-6 max-w-6xl mx-auto w-full flex-1">
                <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-px hover:shadow-md">
                    <CardHeader className="border-b">
                        <div className="flex justify-between items-center flex-wrap gap-3">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                Clinics
                            </CardTitle>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                                        + Add Clinic
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Clinic</DialogTitle>
                                        <DialogDescription>Fill in the clinic details.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddClinic} className="space-y-4">
                                        <div>
                                            <Label className="block mb-1">Clinic Name</Label>
                                            <Input name="clinic_name" required />
                                        </div>
                                        <div>
                                            <Label className="block mb-1">Location</Label>
                                            <Input name="clinic_location" required />
                                        </div>
                                        <div>
                                            <Label className="block mb-1">Contact No</Label>
                                            <Input name="clinic_contactno" required />
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    "Save"
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>


                    <CardContent className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 text-sm sm:text-base">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="border p-2">Name</th>
                                    <th className="border p-2">Location</th>
                                    <th className="border p-2">Contact</th>
                                    <th className="border p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clinics.map((clinic) => (
                                    <tr key={clinic.clinic_id} className="hover:bg-green-50 transition">
                                        <td className="border p-2">{clinic.clinic_name}</td>
                                        <td className="border p-2">{clinic.clinic_location}</td>
                                        <td className="border p-2">{clinic.clinic_contactno}</td>
                                        <td className="border p-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSelectedClinic(clinic)}
                                                    >
                                                        Update
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Update Clinic</DialogTitle>
                                                        <DialogDescription>
                                                            Update location or contact number.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleUpdateClinic} className="space-y-4">
                                                        <div>
                                                            <Label className="block mb-1">Location</Label>
                                                            <Input
                                                                name="clinic_location"
                                                                defaultValue={clinic.clinic_location}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="block mb-1">Contact No</Label>
                                                            <Input
                                                                name="clinic_contactno"
                                                                defaultValue={clinic.clinic_contactno}
                                                                required
                                                            />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button
                                                                type="submit"
                                                                disabled={loading}
                                                                className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                                            >
                                                                {loading ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        Saving changes...
                                                                    </>
                                                                ) : (
                                                                    "Save Changes"
                                                                )}
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
                <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-pxver:shadow-md">
                    <CardHeader className="border-b">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                    Doctor appointment calendar
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Track scheduled consultations and prepare each clinic ahead of time.
                                </p>
                            </div>
                            <Select
                                value={scheduleClinicId ?? undefined}
                                onValueChange={(value) => setScheduleClinicId(value)}
                                disabled={clinics.length === 0}
                            >
                                <SelectTrigger className="w-full rounded-xl sm:w-64">
                                    <SelectValue placeholder="Select clinic" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clinics.map((clinic) => (
                                        <SelectItem key={clinic.clinic_id} value={clinic.clinic_id}>
                                            {clinic.clinic_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {calendarError ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
                                {calendarError}
                            </div>
                        ) : null}
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] xl:grid-cols-[minmax(0,400px)_1fr]">
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-green-100/80 bg-white/70 shadow-inner">
                                    <div className="px-4 py-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                                            Month overview
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {totalAppointments} total appointment{totalAppointments === 1 ? "" : "s"} · {activeAppointments} active
                                        </p>
                                    </div>
                                    <div className="relative px-3 pb-4 pt-2 sm:px-4">
                                        {calendarLoading ? (
                                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                                                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                                            </div>
                                        ) : null}
                                        <Calendar
                                            mode="single"
                                            month={calendarMonth}
                                            onMonthChange={setCalendarMonth}
                                            selected={selectedDate}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setSelectedDate(date);
                                                }
                                            }}
                                            modifiers={{ hasAppointments: highlightedDates }}
                                            modifiersClassNames={{
                                                hasAppointments:
                                                    "[&>button]:border [&>button]:border-emerald-200 [&>button]:bg-emerald-50 [&>button]:text-emerald-700 [&>button[data-selected-single=true]]:!border-transparent [&>button[data-selected-single=true]]:!bg-emerald-500 [&>button[data-selected-single=true]]:!text-white [&>button[data-selected-single=true]]:!shadow-[0_10px_30px_-12px_rgba(16,185,129,0.55)] [&>button[data-selected-single=true]]:!ring-2 [&>button[data-selected-single=true]]:!ring-emerald-200/70 [&>button[data-selected-single=true]]:!ring-offset-0",
                                            }}
                                            className="mx-auto w-full max-w-sm [--cell-size:2.4rem] sm:[--cell-size:2.7rem] [&_button[data-selected-single=true]]:border-transparent! [&_button[data-selected-single=true]]:bg-emerald-500! [&_button[data-selected-single=true]]:text-white! [&_button[data-selected-single=true]]:shadow-[0_10px_30px_-12px_rgba(16,185,129,0.55)]! [&_button[data-selected-single=true]]:ring-2! [&_button[data-selected-single=true]]:ring-emerald-200/70! [&_button[data-selected-single=true]]:ring-offset-0! [&_button[data-selected-single=true]]:outline-none! [&_button[data-selected-single=true]]:transition [&_button[data-selected-single=true]]:duration-150 [&_button[data-selected-single=true]]:ease-out [&_button[data-selected-single=true]]:scale-[1.02]"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                                        Selected day
                                    </p>
                                    <h3 className="text-lg font-semibold text-slate-900">{selectedDateLabel}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedAppointments.length > 0
                                            ? `${selectedAppointments.length} appointment${selectedAppointments.length === 1 ? "" : "s"
                                            } scheduled`
                                            : "No appointments scheduled for this day."}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {selectedAppointments.map((appointment) => {
                                        const badgeClass =
                                            STATUS_BADGE_CLASSES[appointment.status] ??
                                            "border-slate-200 bg-slate-100 text-slate-700";

                                        return (
                                            <div
                                                key={appointment.id}
                                                className="rounded-2xl border border-green-50 bg-white/90 p-4 shadow-sm"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {appointment.doctorName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {appointment.patientName} · {appointment.patientType}
                                                        </p>
                                                        <p className="text-sm text-slate-600">
                                                            {formatTimeRange(appointment.startISO, appointment.endISO)}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                                                    >
                                                        {appointment.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {selectedAppointments.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/50 p-6 text-sm text-muted-foreground">
                                            No appointments scheduled for this date.
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
