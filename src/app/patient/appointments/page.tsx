"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Ban,
    CalendarDays,
    ClipboardList,
    Clock3,
    Loader2,
    MoreHorizontal,
    Search,
    Undo2,
} from "lucide-react";

import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppointmentPanel } from "@/components/appointments/appointment-panel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatManilaDateTime, formatTimeRange, manilaNow } from "@/lib/time";
import { getServiceOptionsForSpecialization, resolveServiceType } from "@/lib/service-options";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import PatientAppointmentsLoading from "./loading";

type Clinic = { clinic_id: string; clinic_name: string };
type Doctor = { user_id: string; name: string; specialization: "Physician" | "Dentist" | null };
type Slot = { start: string; end: string };
type Appointment = {
    id: string;
    clinic: string;
    clinicId: string;
    doctor: string;
    doctorId: string;
    date: string;
    time: string;
    startISO: string;
    endISO: string;
    serviceType: string | null;
    status: string;
};

const MIN_BOOKING_LEAD_DAYS = 3;

function toInputDate(date: Date): string {
    const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
    return adjusted.toISOString().split("T")[0];
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function computeMinBookingDate(): string {
    const base = manilaNow();
    const future = new Date(base.getTime() + MIN_BOOKING_LEAD_DAYS * DAY_IN_MS);
    return toInputDate(future);
}

function isoToInputDate(iso: string | null | undefined): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return toInputDate(date);
}

const STATUS_ORDER = ["Pending", "Approved", "Moved", "Completed", "Cancelled"] as const;

type AppointmentStatus = (typeof STATUS_ORDER)[number];

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

function formatAppointmentDate(appointment: Appointment) {
    if (appointment.startISO) {
        return (
            formatManilaDateTime(appointment.startISO, {
                hour: undefined,
                minute: undefined,
            }) ?? formatDateOnly(appointment.date)
        );
    }
    return formatDateOnly(appointment.date);
}

function formatAppointmentTime(appointment: Appointment) {
    const range = formatTimeRange(appointment.startISO, appointment.endISO);
    if (range) return range;
    return appointment.time || "—";
}

function humanizeService(value: string | null | undefined) {
    if (!value) return "—";
    return value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export default function PatientAppointmentsPage() {
    const [minBookingDate, setMinBookingDate] = useState(() => computeMinBookingDate());
    const earliestScheduledMessage = useMemo(() => {
        const label = formatDateOnly(minBookingDate);
        return label
            ? `Appointments must be scheduled on ${label} at earliest.`
            : "Appointments must be scheduled at least 3 days in advance.";
    }, [minBookingDate]);

    const earliestBookedMessage = useMemo(() => {
        const label = formatDateOnly(minBookingDate);
        return label
            ? `Appointments must be booked on ${label} at earliest.`
            : `Appointments must be booked at least ${MIN_BOOKING_LEAD_DAYS} days in advance.`;
    }, [minBookingDate]);

    useEffect(() => {
        const updateMinDate = () =>
            setMinBookingDate((current) => {
                const next = computeMinBookingDate();
                return current === next ? current : next;
            });

        updateMinDate();
        const interval = setInterval(updateMinDate, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Form state
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [doctorAvailability, setDoctorAvailability] = useState<
        Record<string, { slots: Slot[]; loading: boolean; error: string | null }>
    >({});
    const [loadingClinics, setLoadingClinics] = useState(true);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [clinicId, setClinicId] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [serviceType, setServiceType] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [timeStart, setTimeStart] = useState<string>("");

    // My appointments
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [clinicsLoaded, setClinicsLoaded] = useState(false);
    const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);
    const [searchAppointments, setSearchAppointments] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("active");

    // Reschedule & cancel
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTimeStart, setRescheduleTimeStart] = useState("");
    const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
    const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);

    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
    const [cancelSubmitting, setCancelSubmitting] = useState(false);

    const initializing = !(clinicsLoaded && appointmentsLoaded);

    const handleClinicChange = (nextClinicId: string) => {
        setClinicId(nextClinicId);
        setDoctorId("");
        setServiceType("");
        setTimeStart("");
    };

    const handleDoctorChange = (nextDoctorId: string) => {
        setDoctorId(nextDoctorId);
        setServiceType("");
        setTimeStart("");
    };

    const handleSlotSelection = (doctor: Doctor, slot: Slot) => {
        if (doctor.user_id !== doctorId) {
            setDoctorId(doctor.user_id);
            setServiceType("");
        }
        setTimeStart(slot.start);
    };

    const canModifyAppointment = (appointment: Appointment) => {
        const allowedStatuses = ["Pending", "Approved", "Moved"];
        if (!allowedStatuses.includes(appointment.status)) return false;
        const start = new Date(appointment.startISO);
        return start.getTime() > Date.now();
    };

    function openRescheduleDialog(appointment: Appointment) {
        const existingDate = isoToInputDate(appointment.startISO);
        const effectiveDate = existingDate && existingDate > minBookingDate ? existingDate : minBookingDate;

        setRescheduleTarget(appointment);
        setRescheduleDate(effectiveDate || minBookingDate);
        setRescheduleTimeStart("");
        setRescheduleSlots([]);
        setRescheduleOpen(true);
    }

    function closeRescheduleDialog() {
        setRescheduleOpen(false);
        setRescheduleTarget(null);
        setRescheduleDate("");
        setRescheduleTimeStart("");
        setRescheduleSlots([]);
    }

    async function handleRescheduleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!rescheduleTarget || !rescheduleDate || !selectedRescheduleSlot) {
            toast.error("Please choose a new time slot");
            return;
        }

        if (rescheduleDate && rescheduleDate < minBookingDate) {
            toast.error(earliestBookedMessage);
            return;
        }

        try {
            setRescheduling(true);
            const res = await fetch("/api/patient/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointment_id: rescheduleTarget.id,
                    date: rescheduleDate,
                    time_start: selectedRescheduleSlot.start,
                    time_end: selectedRescheduleSlot.end,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? "Failed to reschedule appointment");
                return;
            }
            toast.success("Appointment rescheduled");
            closeRescheduleDialog();
            loadAppointments();
        } catch {
            toast.error("Unable to reschedule appointment");
        } finally {
            setRescheduling(false);
        }
    }

    function openCancelDialog(appointment: Appointment) {
        setCancelTarget(appointment);
        setCancelDialogOpen(true);
    }

    function closeCancelDialog() {
        setCancelDialogOpen(false);
        setCancelTarget(null);
        setCancelSubmitting(false);
    }

    async function handleCancelConfirm() {
        if (!cancelTarget) return;
        try {
            setCancelSubmitting(true);
            const res = await fetch("/api/patient/appointments", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointment_id: cancelTarget.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? "Failed to cancel appointment");
                return;
            }
            toast.success("Appointment cancelled");
            closeCancelDialog();
            loadAppointments();
        } catch {
            toast.error("Unable to cancel appointment");
        } finally {
            setCancelSubmitting(false);
        }
    }

    // Load clinics
    useEffect(() => {
        (async () => {
            try {
                setLoadingClinics(true);
                const res = await fetch("/api/meta/clinics");
                const data = await res.json();
                setClinics(data);
            } catch {
                toast.error("Failed to load clinics");
            } finally {
                setLoadingClinics(false);
                setClinicsLoaded(true);
            }
        })();
    }, []);

    // Load doctors
    useEffect(() => {
        if (!clinicId) {
            setDoctors([]);
            setDoctorId("");
            return;
        }
        (async () => {
            try {
                setLoadingDoctors(true);
                const params = new URLSearchParams({ clinic_id: clinicId });
                const res = await fetch(`/api/meta/doctors?${params}`);
                const data = await res.json();
                setDoctors(data);
            } catch {
                toast.error("Failed to load doctors");
            } finally {
                setLoadingDoctors(false);
            }
        })();
    }, [clinicId]);

    // Load availability for doctors when clinic/date change
    useEffect(() => {
        if (!clinicId || doctors.length === 0) {
            setDoctorAvailability({});
            return;
        }

        if (!date) {
            const emptyAvailability: Record<string, { slots: Slot[]; loading: boolean; error: string | null }> = {};
            doctors.forEach((doctor) => {
                emptyAvailability[doctor.user_id] = {
                    slots: [],
                    loading: false,
                    error: null,
                };
            });
            setDoctorAvailability(emptyAvailability);
            return;
        }

        let cancelled = false;

        setDoctorAvailability((prev) => {
            const next: typeof prev = {};
            doctors.forEach((doctor) => {
                const existing = prev[doctor.user_id];
                next[doctor.user_id] = {
                    slots: existing?.slots ?? [],
                    loading: true,
                    error: null,
                };
            });
            return next;
        });

        const loadAvailability = async (doctor: Doctor) => {
            try {
                const params = new URLSearchParams({
                    clinic_id: clinicId,
                    doctor_user_id: doctor.user_id,
                    date,
                });
                const res = await fetch(`/api/meta/doctor-availability?${params}`);
                const data = await res.json();

                if (cancelled) return;

                setDoctorAvailability((prev) => ({
                    ...prev,
                    [doctor.user_id]: {
                        slots: data?.slots || [],
                        loading: false,
                        error: null,
                    },
                }));
            } catch {
                if (cancelled) return;

                setDoctorAvailability((prev) => ({
                    ...prev,
                    [doctor.user_id]: {
                        slots: [],
                        loading: false,
                        error: "Failed to load availability",
                    },
                }));
            }
        };

        doctors.forEach((doctor) => {
            void loadAvailability(doctor);
        });

        return () => {
            cancelled = true;
        };
    }, [clinicId, date, doctors]);

    const selectedDoctorAvailability = doctorId ? doctorAvailability[doctorId] : undefined;
    const slots = useMemo(() => selectedDoctorAvailability?.slots ?? [], [selectedDoctorAvailability]);
    const loadingSlots = selectedDoctorAvailability?.loading ?? false;
    const selectedDoctorAvailabilityError = selectedDoctorAvailability?.error ?? null;
    const selectedSlot = useMemo(() => slots.find((s) => s.start === timeStart), [slots, timeStart]);
    const selectedDoctor = useMemo(() => doctors.find((d) => d.user_id === doctorId) || null, [doctorId, doctors]);
    const selectedClinic = useMemo(
        () => clinics.find((clinic) => clinic.clinic_id === clinicId) ?? null,
        [clinics, clinicId]
    );
    const selectedRescheduleSlot = useMemo(
        () => rescheduleSlots.find((s) => s.start === rescheduleTimeStart) ?? null,
        [rescheduleSlots, rescheduleTimeStart]
    );

    useEffect(() => {
        setRescheduleTimeStart("");
    }, [rescheduleDate]);

    useEffect(() => {
        setTimeStart("");
    }, [date]);

    useEffect(() => {
        if (!doctorId) return;
        const exists = doctors.some((doctor) => doctor.user_id === doctorId);
        if (!exists) {
            setDoctorId("");
            setServiceType("");
            setTimeStart("");
        }
    }, [doctorId, doctors]);

    useEffect(() => {
        setDate((current) => {
            if (!current) return current;
            return current < minBookingDate ? minBookingDate : current;
        });
    }, [minBookingDate]);

    useEffect(() => {
        if (!rescheduleOpen) return;
        setRescheduleDate((current) => {
            if (!current) return minBookingDate;
            return current < minBookingDate ? minBookingDate : current;
        });
    }, [minBookingDate, rescheduleOpen]);

    useEffect(() => {
        if (!rescheduleTarget) {
            setRescheduleSlots([]);
            setLoadingRescheduleSlots(false);
            return;
        }
        if (!rescheduleDate) {
            setRescheduleSlots([]);
            setLoadingRescheduleSlots(false);
            return;
        }

        (async () => {
            try {
                setLoadingRescheduleSlots(true);
                const params = new URLSearchParams({
                    clinic_id: rescheduleTarget.clinicId,
                    doctor_user_id: rescheduleTarget.doctorId,
                    date: rescheduleDate,
                });
                const res = await fetch(`/api/meta/doctor-availability?${params}`);
                const data = await res.json();
                setRescheduleSlots(data?.slots || []);
            } catch {
                toast.error("Failed to load reschedule slots");
            } finally {
                setLoadingRescheduleSlots(false);
            }
        })();
    }, [rescheduleTarget, rescheduleDate]);

    // Dynamic service options: each label has a unique value
    const availableServices = useMemo(
        () => getServiceOptionsForSpecialization(selectedDoctor?.specialization ?? null),
        [selectedDoctor]
    );

    const selectedServiceLabel = useMemo(() => {
        const match = availableServices.find((service) => service.value === serviceType);
        return match?.label ?? null;
    }, [availableServices, serviceType]);

    // Submit appointment
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!clinicId || !doctorId || !serviceType || !date || !selectedSlot) {
            toast.error("Please complete all fields");
            return;
        }

        const matchedService = availableServices.find((service) => service.value === serviceType);
        const serviceEnumValue = matchedService?.serviceType ?? resolveServiceType(serviceType);

        if (!serviceEnumValue) {
            toast.error("Select a valid service type");
            return;
        }

        if (date < minBookingDate) {
            toast.error(earliestBookedMessage);
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch("/api/patient/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clinic_id: clinicId,
                    doctor_user_id: doctorId,
                    service_type: serviceEnumValue,
                    date,
                    time_start: selectedSlot.start,
                    time_end: selectedSlot.end,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? "Unable to create appointment");
                return;
            }

            toast.success("Appointment request submitted! Status: Pending");
            loadAppointments();

            setClinicId("");
            setDoctorId("");
            setServiceType("");
            setDate("");
            setTimeStart("");
        } catch {
            toast.error("Unable to create appointment");
        } finally {
            setSubmitting(false);
        }
    }

    // Fetch appointments
    async function loadAppointments() {
        try {
            setLoadingAppointments(true);
            const res = await fetch("/api/patient/appointments");
            if (!res.ok) throw new Error("Failed to load appointments");
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Could not load your appointments");
        } finally {
            setLoadingAppointments(false);
            setAppointmentsLoaded(true);
        }
    }

    useEffect(() => {
        loadAppointments();
    }, []);

    const appointmentSearch = searchAppointments.trim().toLowerCase();

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

            if (!appointmentSearch) return true;

            const haystack = [
                appointment.clinic,
                appointment.doctor,
                appointment.status,
                appointment.serviceType ?? "",
                appointment.date,
                appointment.time,
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(appointmentSearch);
        });
    }, [appointmentSearch, appointments, statusFilter]);

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
        () =>
            appointments.filter((appointment) => {
                const status = normalizeStatus(appointment.status);
                return status ? ACTIVE_STATUSES.includes(status) : false;
            }),
        [appointments]
    );

    const upcomingAppointments = useMemo(
        () =>
            activeAppointments.filter((appointment) => {
                const start = appointment.startISO ? new Date(appointment.startISO) : null;
                return start ? start.getTime() >= Date.now() : false;
            }),
        [activeAppointments]
    );

    const nextAppointment = useMemo(() => {
        const sorted = [...upcomingAppointments].sort((a, b) => {
            const startA = a.startISO ? new Date(a.startISO).getTime() : Number.POSITIVE_INFINITY;
            const startB = b.startISO ? new Date(b.startISO).getTime() : Number.POSITIVE_INFINITY;
            return startA - startB;
        });
        return sorted[0] ?? null;
    }, [upcomingAppointments]);

    if (initializing) {
        return <PatientAppointmentsLoading />;
    }

    return (
        <PatientLayout
            title="Appointments"
            description="Plan and manage your clinic visits — from booking a slot to tracking approvals and changes."
            actions={
                <div className="hidden items-center gap-3 rounded-2xl border border-green-100 bg-white/80 px-4 py-2 text-xs font-medium text-green-700 shadow-sm md:flex">
                    <CalendarDays className="h-4 w-4" />
                    Earliest booking: {formatDateOnly(minBookingDate) || minBookingDate}
                </div>
            }
        >
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] 2xl:gap-8">
                <div className="space-y-6">
                    <AppointmentPanel
                        icon={CalendarDays}
                        title="Request an appointment"
                        description={`Choose the clinic, provider, and time that works for you. ${earliestScheduledMessage}`}
                        contentClassName="pt-6"
                    >
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-green-700">Clinic</Label>
                                <Select value={clinicId} onValueChange={handleClinicChange} disabled={loadingClinics}>
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue placeholder={loadingClinics ? "Loading clinics..." : "Select clinic"} />
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

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-green-700">Doctor</Label>
                                <Select
                                    value={doctorId}
                                    onValueChange={handleDoctorChange}
                                    disabled={!clinicId || loadingDoctors}
                                >
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue
                                            placeholder={!clinicId ? "Select clinic first" : loadingDoctors ? "Loading doctors..." : "Select doctor"}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((doctor) => (
                                            <SelectItem key={doctor.user_id} value={doctor.user_id}>
                                                {doctor.name} ({doctor.specialization ?? "N/A"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-green-700">Service type</Label>
                                <Select value={serviceType} onValueChange={setServiceType} disabled={!selectedDoctor}>
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue placeholder={!selectedDoctor ? "Select doctor first" : "Select service"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableServices.map((service) => (
                                            <SelectItem key={service.value} value={service.value}>
                                                {service.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-green-700">Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    min={minBookingDate}
                                    className="rounded-xl border-green-200"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-sm font-medium text-green-700">Preferred time</Label>
                                <Select
                                    value={timeStart}
                                    onValueChange={setTimeStart}
                                    disabled={loadingSlots || !doctorId || !date || !!selectedDoctorAvailabilityError}
                                >
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue
                                            placeholder={
                                                !doctorId || !date
                                                    ? "Select doctor and date"
                                                    : loadingSlots
                                                        ? "Loading slots..."
                                                        : selectedDoctorAvailabilityError
                                                            ? "Unable to load slots"
                                                            : slots.length
                                                                ? "Select a time"
                                                                : "No slots available"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {slots.map((slot) => (
                                            <SelectItem key={`${slot.start}-${slot.end}`} value={slot.start}>
                                                {formatTimeRange(slot.start, slot.end)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-xl bg-green-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                    </>
                                ) : (
                                    "Request appointment"
                                )}
                            </Button>
                        </form>
                    </AppointmentPanel>

                    <Card className="rounded-3xl border-green-100/80 bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg">Important reminders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-white/90">
                            <p>Bring your Student/Employee ID and arrive 10 minutes early for screening and verification.</p>
                            <p>If you can no longer attend, submit a reschedule or cancellation so another patient can use the slot.</p>
                            <p>Watch your notifications for approvals, movement updates, and doctor instructions.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-3xl border-green-100/80 bg-white/95 shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-lg font-semibold text-green-700">Doctor availability</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Preview open slots before sending your request.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!clinicId ? (
                                <div className="rounded-2xl border border-dashed border-green-200 bg-white/70 p-4 text-sm text-muted-foreground">
                                    Select a clinic to browse available doctors.
                                </div>
                            ) : loadingDoctors ? (
                                <div className="flex items-center justify-center gap-2 rounded-2xl border border-green-100 bg-white/70 p-4 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading doctors...
                                </div>
                            ) : doctors.length === 0 ? (
                                <div className="rounded-2xl border border-green-100 bg-green-600/10 p-4 text-sm text-muted-foreground">
                                    No doctors are assigned to this clinic yet. Try another clinic.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedClinic ? (
                                        <div className="rounded-2xl border border-green-100 bg-white/70 p-3">
                                            <p className="text-xs uppercase tracking-wide text-green-500">{selectedClinic.clinic_name}</p>
                                            <p className="mt-1 text-sm font-medium text-green-800">
                                                {date ? `Showing availability for ${formatDateOnly(date)}` : "Choose a date to explore available slots."}
                                            </p>
                                        </div>
                                    ) : null}

                                    {!date ? (
                                        <div className="rounded-2xl border border-dashed border-green-200 bg-white/70 p-4 text-sm text-muted-foreground">
                                            Pick a preferred date to display the available times for every doctor.
                                        </div>
                                    ) : null}

                                    <div className="space-y-3">
                                        {doctors.map((doctor) => {
                                            const availability = doctorAvailability[doctor.user_id];
                                            const doctorSlots = availability?.slots ?? [];
                                            const doctorLoading = date ? availability?.loading ?? false : false;
                                            const doctorError = date ? availability?.error ?? null : null;
                                            const isActiveDoctor = doctor.user_id === doctorId;

                                            return (
                                                <div
                                                    key={doctor.user_id}
                                                    className={cn(
                                                        "rounded-2xl border p-4 transition",
                                                        "border-green-100 bg-white/80",
                                                        isActiveDoctor && "border-green-500 bg-green-50 shadow-sm"
                                                    )}
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-green-700">{doctor.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {doctor.specialization ?? "Doctor"}
                                                                {selectedClinic ? ` · ${selectedClinic.clinic_name}` : ""}
                                                            </p>
                                                        </div>
                                                        {isActiveDoctor && timeStart ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-green-500 bg-green-500/10 text-[11px] font-semibold uppercase tracking-wide text-green-700"
                                                            >
                                                                Selected
                                                            </Badge>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-3">
                                                        {!date ? (
                                                            <p className="text-xs text-muted-foreground">Select a date above to view availability.</p>
                                                        ) : doctorLoading ? (
                                                            <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-white p-3 text-sm text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
                                                            </div>
                                                        ) : doctorError ? (
                                                            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 text-sm text-rose-700">
                                                                Unable to load the schedule for this doctor. Try again later.
                                                            </div>
                                                        ) : doctorSlots.length > 0 ? (
                                                            <div className="grid gap-2 sm:grid-cols-2">
                                                                {doctorSlots.map((slot) => {
                                                                    const isSelected = isActiveDoctor && timeStart === slot.start;
                                                                    return (
                                                                        <button
                                                                            key={`${doctor.user_id}-${slot.start}-${slot.end}`}
                                                                            type="button"
                                                                            onClick={() => handleSlotSelection(doctor, slot)}
                                                                            className={cn(
                                                                                "flex w-full flex-col items-start gap-1 rounded-2xl border px-3 py-2 text-left text-sm font-medium transition",
                                                                                "border-green-100 bg-white text-green-700 hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500",
                                                                                isSelected && "border-green-600 bg-green-600 text-white hover:bg-green-600 focus-visible:outline-green-600"
                                                                            )}
                                                                            aria-pressed={isSelected}
                                                                        >
                                                                            <span className="leading-tight">
                                                                                {formatTimeRange(slot.start, slot.end)}
                                                                            </span>
                                                                            <span
                                                                                className={cn(
                                                                                    "text-xs font-medium leading-tight",
                                                                                    isSelected ? "text-white/80" : "text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                {isSelected ? "Selected" : "Available"}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 text-sm text-rose-700">
                                                                No available slots for this date. Try another day.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg text-green-700">Booking summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-3 text-sm text-muted-foreground">
                                <div className="rounded-2xl border border-green-100 bg-green-600/5 p-3">
                                    <dt className="text-xs uppercase tracking-wide text-green-500">Clinic</dt>
                                    <dd className="mt-1 text-sm font-medium text-green-800">
                                        {selectedClinic ? selectedClinic.clinic_name : "Select a clinic to continue"}
                                    </dd>
                                </div>
                                <div className="rounded-2xl border border-green-100 bg-green-600/5 p-3">
                                    <dt className="text-xs uppercase tracking-wide text-green-500">Doctor</dt>
                                    <dd className="mt-1 text-sm font-medium text-green-800">
                                        {selectedDoctor
                                            ? `${selectedDoctor.name} ${selectedDoctor.specialization ? `(${selectedDoctor.specialization})` : ""}`
                                            : "Choose a clinic and doctor"}
                                    </dd>
                                </div>
                                <div className="rounded-2xl border border-green-100 bg-green-600/5 p-3">
                                    <dt className="text-xs uppercase tracking-wide text-green-500">Service</dt>
                                    <dd className="mt-1 text-sm font-medium text-green-800">
                                        {selectedServiceLabel ?? "Select a service type"}
                                    </dd>
                                </div>
                                <div className="rounded-2xl border border-green-100 bg-green-600/5 p-3">
                                    <dt className="text-xs uppercase tracking-wide text-green-500">Schedule</dt>
                                    <dd className="mt-1 text-sm font-medium text-green-800">
                                        {date && selectedSlot ? (
                                            <span>
                                                {formatDateOnly(date)} · {formatTimeRange(selectedSlot.start, selectedSlot.end)}
                                            </span>
                                        ) : (
                                            "Choose a date and time"
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </section>
            <section className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">Active requests</CardTitle>
                                <p className="text-sm text-muted-foreground">Pending, approved, and moved appointments</p>
                            </div>
                            <Clock3 className="h-9 w-9 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">{activeAppointments.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">Next visit</CardTitle>
                                <p className="text-sm text-muted-foreground">Your soonest approved appointment</p>
                            </div>
                            <CalendarDays className="h-9 w-9 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">{upcomingAppointments.length}</p>
                            {nextAppointment ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {formatAppointmentDate(nextAppointment)} • {formatAppointmentTime(nextAppointment)}
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">Pending approvals</CardTitle>
                                <p className="text-sm text-muted-foreground">Requests awaiting confirmation</p>
                            </div>
                            <AlertCircle className="h-9 w-9 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">{statusCounts.Pending}</p>
                        </CardContent>
                    </Card>
                </div>

                <AppointmentPanel
                    icon={ClipboardList}
                    title="Appointment board"
                    description="Track approval status, reschedule upcoming visits, or cancel when plans change."
                    actions={
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                                <Label className="text-sm font-medium text-green-700">Search requests</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by clinic, doctor, or status"
                                        value={searchAppointments}
                                        onChange={(event) => setSearchAppointments(event.target.value)}
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
                                        <SelectItem value="active">Active requests</SelectItem>
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
                                        <TableHead className="min-w-[180px]">Clinic</TableHead>
                                        <TableHead className="min-w-[160px]">Doctor</TableHead>
                                        <TableHead className="min-w-[120px]">Date</TableHead>
                                        <TableHead className="min-w-[120px]">Time</TableHead>
                                        <TableHead className="min-w-[120px]">Status</TableHead>
                                        <TableHead className="w-[110px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingAppointments ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                                <div className="flex items-center justify-center gap-2 text-sm">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading appointments...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredAppointments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
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
                                            const canModify = canModifyAppointment(appointment);
                                            const isRescheduling = rescheduling && rescheduleTarget?.id === appointment.id;
                                            const isCancelling = cancelSubmitting && cancelTarget?.id === appointment.id;

                                            return (
                                                <TableRow key={appointment.id} className="text-sm">
                                                    <TableCell className="font-medium text-green-700">
                                                        <div className="flex flex-col">
                                                            <span>{appointment.clinic}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {humanizeService(appointment.serviceType)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{appointment.doctor}</TableCell>
                                                    <TableCell>{formatAppointmentDate(appointment)}</TableCell>
                                                    <TableCell>{formatAppointmentTime(appointment)}</TableCell>
                                                    <TableCell>
                                                        <Badge className={`rounded-full px-2 py-1 text-xs ${statusClasses}`}>
                                                            {statusLabel}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {canModify ? (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="rounded-xl text-green-700 hover:bg-green-100"
                                                                        disabled={isRescheduling || isCancelling}
                                                                    >
                                                                        {isRescheduling || isCancelling ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48 rounded-xl border-green-100">
                                                                    <DropdownMenuItem
                                                                        onClick={() => openRescheduleDialog(appointment)}
                                                                        disabled={isRescheduling || isCancelling}
                                                                    >
                                                                        {isRescheduling ? (
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Undo2 className="mr-2 h-4 w-4" />
                                                                        )}
                                                                        Reschedule
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => openCancelDialog(appointment)}
                                                                        disabled={isCancelling || isRescheduling}
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        {isCancelling ? (
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Ban className="mr-2 h-4 w-4" />
                                                                        )}
                                                                        Cancel
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No actions available</span>
                                                        )}
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
            </section>

            <Dialog
                open={rescheduleOpen}
                onOpenChange={(open) => {
                    if (!open) closeRescheduleDialog();
                }}
            >
                <DialogContent className="max-w-md rounded-3xl border border-green-100/80 bg-white/95">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-semibold text-green-700">Reschedule appointment</DialogTitle>
                        <DialogDescription>
                            {rescheduleTarget
                                ? `Select a new slot for your appointment with ${rescheduleTarget.doctor}. ${earliestBookedMessage}`
                                : "Choose a new schedule for your appointment."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-700">Date</Label>
                            <Input
                                type="date"
                                value={rescheduleDate}
                                onChange={(event) => setRescheduleDate(event.target.value)}
                                min={minBookingDate}
                                required
                                disabled={rescheduling}
                                className="rounded-xl border-green-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-700">Time</Label>
                            <Select
                                value={rescheduleTimeStart}
                                onValueChange={setRescheduleTimeStart}
                                disabled={
                                    !rescheduleTarget ||
                                    loadingRescheduleSlots ||
                                    rescheduling ||
                                    rescheduleSlots.length === 0
                                }
                            >
                                <SelectTrigger className="rounded-xl border-green-200">
                                    <SelectValue
                                        placeholder={
                                            !rescheduleTarget
                                                ? "Select appointment"
                                                : loadingRescheduleSlots
                                                    ? "Loading slots..."
                                                    : rescheduleSlots.length
                                                        ? "Select a time"
                                                        : "No slots available"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {rescheduleSlots.map((slot) => (
                                        <SelectItem key={`${slot.start}-${slot.end}`} value={slot.start}>
                                            {formatTimeRange(slot.start, slot.end)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="submit"
                                className="rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                                disabled={rescheduling || !rescheduleTarget || !selectedRescheduleSlot}
                            >
                                {rescheduling ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    "Confirm"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={cancelDialogOpen}
                onOpenChange={(open) => {
                    if (!open) closeCancelDialog();
                }}
            >
                <AlertDialogContent className="max-w-md rounded-3xl border border-green-100/80 bg-white/95">
                    <AlertDialogHeader className="space-y-1">
                        <AlertDialogTitle className="text-lg font-semibold text-green-700">Cancel appointment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {cancelTarget
                                ? `You are cancelling your appointment with ${cancelTarget.doctor} on ${cancelTarget.date} at ${cancelTarget.time}. This action cannot be undone.`
                                : "This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-green-200" disabled={cancelSubmitting}>
                            Keep appointment
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelConfirm}
                            disabled={cancelSubmitting}
                            className="rounded-xl bg-red-600 text-sm font-semibold hover:bg-red-700"
                        >
                            {cancelSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...
                                </>
                            ) : (
                                "Cancel appointment"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PatientLayout>
    );
}
