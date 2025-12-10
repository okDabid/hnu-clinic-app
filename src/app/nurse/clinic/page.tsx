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
import {
    CLINIC_CONTACT_NUMBER_LENGTH,
    PH_MOBILE_PREFIX,
    isValidClinicContactNumber,
    sanitizeClinicContactInput,
} from "@/lib/clinic-contact";

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

type ClinicDoctor = {
    user_id: string;
    name: string;
    specialization: string | null;
};

type DoctorAvailability = {
    slots: { start: string; end: string }[];
    loading: boolean;
    error: string | null;
    onLeave: boolean;
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Moved: "border-sky-200 bg-sky-50 text-sky-700",
    Completed: "border-slate-200 bg-slate-100 text-slate-700",
    Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const ACTIVE_STATUSES = new Set(["Pending", "Approved", "Moved"]);

const CONTACT_NUMBER_ERROR_MESSAGE =
    `Clinic contact number must be a valid Philippine mobile number (${CLINIC_CONTACT_NUMBER_LENGTH} digits starting with ${PH_MOBILE_PREFIX}).`;
const CONTACT_INPUT_PATTERN = `${PH_MOBILE_PREFIX}[0-9]{${CLINIC_CONTACT_NUMBER_LENGTH - PH_MOBILE_PREFIX.length}}`;

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
    const [clinicDoctors, setClinicDoctors] = useState<Record<string, ClinicDoctor[]>>({});
    const [doctorAvailability, setDoctorAvailability] = useState<
        Record<string, Record<string, DoctorAvailability>>
    >({});
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [doctorsError, setDoctorsError] = useState<string | null>(null);

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

    useEffect(() => {
        if (clinics.length === 0) {
            setClinicDoctors({});
            return;
        }

        let cancelled = false;
        setDoctorsLoading(true);
        setDoctorsError(null);

        (async () => {
            const results: Record<string, ClinicDoctor[]> = {};
            let encounteredError = false;

            for (const clinic of clinics) {
                try {
                    const res = await fetch(`/api/meta/doctors?clinic_id=${clinic.clinic_id}`);
                    const data = await res.json();

                    if (!res.ok || !Array.isArray(data)) {
                        encounteredError = true;
                        results[clinic.clinic_id] = [];
                        continue;
                    }

                    results[clinic.clinic_id] = data as ClinicDoctor[];
                } catch (error) {
                    console.error(error);
                    encounteredError = true;
                    results[clinic.clinic_id] = [];
                }
            }

            if (cancelled) return;

            setClinicDoctors(results);
            setDoctorsError(
                encounteredError ? "Some clinic directories could not be loaded." : null
            );
        })()
            .catch((error) => {
                console.error(error);
                if (!cancelled) {
                    setDoctorsError("Unable to load doctor directories.");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setDoctorsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [clinics]);

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

    useEffect(() => {
        if (!selectedDateKey || clinics.length === 0) {
            setDoctorAvailability({});
            return;
        }

        if (Object.keys(clinicDoctors).length === 0) {
            setDoctorAvailability({});
            return;
        }

        let cancelled = false;

        setDoctorAvailability((prev) => {
            const next: typeof prev = {};
            clinics.forEach((clinic) => {
                const doctors = clinicDoctors[clinic.clinic_id] || [];
                next[clinic.clinic_id] = {};
                doctors.forEach((doctor) => {
                    const existing = prev[clinic.clinic_id]?.[doctor.user_id];
                    next[clinic.clinic_id][doctor.user_id] = {
                        slots: existing?.slots ?? [],
                        loading: true,
                        error: null,
                        onLeave: existing?.onLeave ?? false,
                    };
                });
            });
            return next;
        });

        clinics.forEach((clinic) => {
            const doctors = clinicDoctors[clinic.clinic_id] || [];
            doctors.forEach((doctor) => {
                const params = new URLSearchParams({
                    clinic_id: clinic.clinic_id,
                    doctor_user_id: doctor.user_id,
                    date: selectedDateKey,
                });

                void (async () => {
                    try {
                        const res = await fetch(`/api/meta/doctor-availability?${params.toString()}`);
                        const data = await res.json();

                        if (cancelled) return;

                        if (!res.ok) {
                            setDoctorAvailability((prev) => ({
                                ...prev,
                                [clinic.clinic_id]: {
                                    ...(prev[clinic.clinic_id] || {}),
                                    [doctor.user_id]: {
                                        slots: [],
                                        loading: false,
                                        error:
                                            typeof data?.message === "string"
                                                ? data.message
                                                : data?.error || "Failed to load availability",
                                        onLeave: false,
                                    },
                                },
                            }));
                            return;
                        }

                        setDoctorAvailability((prev) => ({
                            ...prev,
                            [clinic.clinic_id]: {
                                ...(prev[clinic.clinic_id] || {}),
                                [doctor.user_id]: {
                                    slots: Array.isArray(data?.slots) ? data.slots : [],
                                    loading: false,
                                    error: null,
                                    onLeave: Boolean(data?.onLeave),
                                },
                            },
                        }));
                    } catch (error) {
                        console.error(error);
                        if (cancelled) return;
                        setDoctorAvailability((prev) => ({
                            ...prev,
                            [clinic.clinic_id]: {
                                ...(prev[clinic.clinic_id] || {}),
                                [doctor.user_id]: {
                                    slots: [],
                                    loading: false,
                                    error: "Failed to load availability",
                                    onLeave: false,
                                },
                            },
                        }));
                    }
                })();
            });
        });

        return () => {
            cancelled = true;
        };
    }, [selectedDateKey, clinics, clinicDoctors]);

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
        const formData = new FormData(e.currentTarget);
        const clinic_name = String(formData.get("clinic_name") ?? "").trim();
        const clinic_location = String(formData.get("clinic_location") ?? "").trim();
        const clinic_contactno = sanitizeClinicContactInput(
            String(formData.get("clinic_contactno") ?? "")
        );

        if (!isValidClinicContactNumber(clinic_contactno)) {
            toast.error(CONTACT_NUMBER_ERROR_MESSAGE);
            return;
        }

        setLoading(true);
        const payload = {
            clinic_name,
            clinic_location,
            clinic_contactno,
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

        const formData = new FormData(e.currentTarget);
        const clinic_location = String(formData.get("clinic_location") ?? "").trim();
        const clinic_contactno = sanitizeClinicContactInput(
            String(formData.get("clinic_contactno") ?? "")
        );

        if (!isValidClinicContactNumber(clinic_contactno)) {
            toast.error(CONTACT_NUMBER_ERROR_MESSAGE);
            return;
        }

        setLoading(true);
        const payload = {
            clinic_name: selectedClinic.clinic_name,
            clinic_location,
            clinic_contactno,
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
            <section className="mx-auto w-full max-w-5xl space-y-8">
                <Card className="flex flex-col rounded-3xl border border-primary/20 bg-white/80 shadow-sm transition hover:-translate-y-px hover:shadow-md">
                    <CardHeader className="border-b">
                        <div className="flex justify-between items-center flex-wrap gap-3">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                                Clinics
                            </CardTitle>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-primary hover:bg-primary/90 text-white">
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
                                            <Input
                                                name="clinic_contactno"
                                                required
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={CLINIC_CONTACT_NUMBER_LENGTH}
                                                pattern={CONTACT_INPUT_PATTERN}
                                                onInput={(event) => {
                                                    event.currentTarget.value = sanitizeClinicContactInput(
                                                        event.currentTarget.value
                                                    );
                                                }}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
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
                            <thead className="bg-primary/10">
                                <tr>
                                    <th className="border p-2">Name</th>
                                    <th className="border p-2">Location</th>
                                    <th className="border p-2">Contact</th>
                                    <th className="border p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clinics.map((clinic) => (
                                    <tr key={clinic.clinic_id} className="hover:bg-primary/10 transition">
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
                                                                type="tel"
                                                                inputMode="numeric"
                                                                maxLength={CLINIC_CONTACT_NUMBER_LENGTH}
                                                                pattern={CONTACT_INPUT_PATTERN}
                                                                onInput={(event) => {
                                                                    event.currentTarget.value = sanitizeClinicContactInput(
                                                                        event.currentTarget.value
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button
                                                                type="submit"
                                                                disabled={loading}
                                                                className="bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2"
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
                <Card className="flex flex-col rounded-3xl border border-primary/20 bg-white/80 shadow-sm transition hover:-translate-y-pxver:shadow-md">
                    <CardHeader className="border-b">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
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
                                <div className="rounded-2xl border border-primary/20 bg-white/70 shadow-inner">
                                    <div className="px-4 py-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                            Month overview
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {totalAppointments} total appointment{totalAppointments === 1 ? "" : "s"} · {activeAppointments} active
                                        </p>
                                    </div>
                                    <div className="relative px-3 pb-4 pt-2 sm:px-4">
                                        {calendarLoading ? (
                                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
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
                                                className="rounded-2xl border border-primary/10 bg-white/90 p-4 shadow-sm"
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
                                        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/10/50 p-6 text-sm text-muted-foreground">
                                            No appointments scheduled for this date.
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="flex flex-col rounded-3xl border border-primary/20 bg-white/80 shadow-sm transition hover:-translate-y-px hover:shadow-md">
                    <CardHeader className="border-b">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                                    Doctor availability overview
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Availability for {selectedDateLabel} across all clinics.
                                </p>
                            </div>
                            {doctorsLoading ? (
                                <div className="flex items-center gap-2 text-sm text-primary">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Checking directories…
                                </div>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {doctorsError ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
                                {doctorsError}
                            </div>
                        ) : null}
                        {clinics.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Add clinics to view doctor availability.</p>
                        ) : (
                            <div className="space-y-4">
                                {clinics.map((clinic) => {
                                    const doctors = clinicDoctors[clinic.clinic_id] || [];
                                    const availabilityForClinic = doctorAvailability[clinic.clinic_id] || {};

                                    return (
                                        <div
                                            key={clinic.clinic_id}
                                            className="rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-sm"
                                        >
                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-base font-semibold text-slate-900">
                                                        {clinic.clinic_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{clinic.clinic_location}</p>
                                                </div>
                                                <p className="text-sm font-medium text-primary">
                                                    Contact: {clinic.clinic_contactno}
                                                </p>
                                            </div>

                                            {doctors.length === 0 ? (
                                                <p className="mt-3 text-sm text-muted-foreground">
                                                    No doctors listed for this clinic yet.
                                                </p>
                                            ) : (
                                                <div className="mt-3 space-y-3">
                                                    {doctors.map((doctor) => {
                                                        const status = availabilityForClinic[doctor.user_id];
                                                        const loading = status?.loading ?? false;
                                                        const error = status?.error;
                                                        const onLeave = status?.onLeave ?? false;
                                                        const slots = status?.slots ?? [];

                                                        let badgeLabel = "Checking";
                                                        if (!selectedDateKey) {
                                                            badgeLabel = "Select a date";
                                                        } else if (error) {
                                                            badgeLabel = "Error";
                                                        } else if (onLeave) {
                                                            badgeLabel = "On leave";
                                                        } else if (!loading && slots.length > 0) {
                                                            badgeLabel = "Available";
                                                        } else if (!loading && slots.length === 0) {
                                                            badgeLabel = "No slots";
                                                        }

                                                        const slotPreview =
                                                            !loading && !error && !onLeave && slots.length > 0
                                                                ? slots
                                                                      .slice(0, 3)
                                                                      .map((slot) => `${slot.start}–${slot.end}`)
                                                                      .join(", ")
                                                                : null;

                                                        return (
                                                            <div
                                                                key={doctor.user_id}
                                                                className="rounded-2xl border border-primary/10 bg-white/90 p-3 shadow-sm"
                                                            >
                                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-slate-900">
                                                                            {doctor.name}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {doctor.specialization || "Doctor"}
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold">
                                                                        {loading && selectedDateKey
                                                                            ? "Loading availability"
                                                                            : badgeLabel}
                                                                    </Badge>
                                                                </div>
                                                                <p className="mt-1 text-sm text-muted-foreground">
                                                                    {!selectedDateKey
                                                                        ? "Choose a date to check availability."
                                                                        : error
                                                                            ? error
                                                                            : onLeave
                                                                                ? "On leave for this date."
                                                                                : loading
                                                                                    ? "Checking availability…"
                                                                                    : slots.length > 0
                                                                                        ? `${slots.length} available slot${slots.length === 1 ? "" : "s"}.`
                                                                                        : "No available slots for this date."}
                                                                </p>
                                                                {slotPreview ? (
                                                                    <p className="mt-1 text-xs text-emerald-700">
                                                                        Earliest slots: {slotPreview}
                                                                        {slots.length > 3 ? "…" : ""}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
