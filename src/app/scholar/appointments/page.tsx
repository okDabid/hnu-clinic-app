"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CalendarDays, Clock3, Loader2, RefreshCcw, Search } from "lucide-react";

import ScholarLayout from "@/components/scholar/scholar-layout";
import { AppointmentPanel } from "@/components/appointments/appointment-panel";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
    formatManilaDateTime,
    formatManilaISODate,
    formatTimeRange,
    manilaNow,
    toManilaDateString,
} from "@/lib/time";
import { getServiceOptionsForSpecialization, resolveServiceType } from "@/lib/service-options";
import { handleRateLimitError } from "@/lib/rate-limit-toast";

import ScholarAppointmentsLoading from "./loading";

const STATUS_ORDER = ["Pending", "Approved", "Moved", "Completed", "Cancelled"] as const;

const MIN_BOOKING_LEAD_DAYS = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

type ClinicOption = {
    clinic_id: string;
    clinic_name: string;
    clinic_location?: string | null;
};

type DoctorOption = {
    user_id: string;
    name: string;
    specialization: string | null;
};

type SlotOption = {
    start: string;
    end: string;
};

type PatientOption = {
    userId: string;
    name: string;
    identifier: string;
    type: string;
};

type PatientRecordResponse = {
    userId?: string;
    fullName?: string;
    patientId?: string;
    patientType?: string;
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
    const today = formatManilaISODate(manilaNow());
    const date = toManilaDateString(value);
    return Boolean(date) && date === today;
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

function computeMinBookingDate(): string {
    const base = manilaNow();
    const future = new Date(base.getTime() + MIN_BOOKING_LEAD_DAYS * DAY_IN_MS);
    return formatManilaISODate(future);
}

export default function ScholarAppointmentsPage() {
    const [appointments, setAppointments] = useState<ScholarAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("active");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [minBookingDate, setMinBookingDate] = useState(() => computeMinBookingDate());

    const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
    const [patientsLoaded, setPatientsLoaded] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [patientSearch, setPatientSearch] = useState("");
    const [selectedPatientId, setSelectedPatientId] = useState("");

    const [clinics, setClinics] = useState<ClinicOption[]>([]);
    const [loadingClinics, setLoadingClinics] = useState(false);
    const [createClinicId, setCreateClinicId] = useState("");

    const [doctors, setDoctors] = useState<DoctorOption[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [createDoctorId, setCreateDoctorId] = useState("");

    const [slots, setSlots] = useState<SlotOption[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [createTimeStart, setCreateTimeStart] = useState("");
    const [availabilityMonth, setAvailabilityMonth] = useState<Date>(() => manilaNow());
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [leaveDates, setLeaveDates] = useState<string[]>([]);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [onLeaveDay, setOnLeaveDay] = useState(false);

    const [createService, setCreateService] = useState("");
    const [createDate, setCreateDate] = useState(() => computeMinBookingDate());
    const [createRemarks, setCreateRemarks] = useState("");

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

    useEffect(() => {
        const minDate = new Date(`${minBookingDate}T00:00:00+08:00`);
        setAvailabilityMonth(minDate);
        setCreateDate((current) => {
            if (!current) return minBookingDate;
            const currentDate = new Date(`${current}T00:00:00+08:00`);
            if (currentDate < minDate) {
                return minBookingDate;
            }
            return current;
        });
    }, [minBookingDate]);

    const resetCreateForm = useCallback(() => {
        const minDate = new Date(`${minBookingDate}T00:00:00+08:00`);
        setSelectedPatientId("");
        setPatientSearch("");
        setCreateClinicId("");
        setCreateDoctorId("");
        setDoctors([]);
        setSlots([]);
        setAvailableDates([]);
        setLeaveDates([]);
        setAvailabilityMonth(minDate);
        setAvailabilityError(null);
        setOnLeaveDay(false);
        setCreateDate(minBookingDate);
        setCreateTimeStart("");
        setCreateService("");
        setCreateRemarks("");
    }, [minBookingDate]);

    const loadPatientOptions = useCallback(async () => {
        try {
            setLoadingPatients(true);
            const query = new URLSearchParams();
            query.set("status", "active");
            const res = await fetch(`/api/scholar/patients?${query.toString()}`, {
                cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to fetch patient list");
                return;
            }

            const options: PatientOption[] = Array.isArray(data)
                ? (data as PatientRecordResponse[])
                    .filter((record) => typeof record.userId === "string" && record.userId.length > 0)
                    .map((record) => ({
                        userId: record.userId as string,
                        name: record.fullName ?? "Unnamed patient",
                        identifier: record.patientId ?? "",
                        type: record.patientType ?? "Patient",
                    }))
                : [];

            setPatientOptions(options);
            setPatientsLoaded(true);
        } catch (err) {
            console.error(err);
            toast.error("Unable to load patients");
        } finally {
            setLoadingPatients(false);
        }
    }, []);

    const loadClinicOptions = useCallback(async () => {
        try {
            setLoadingClinics(true);
            const res = await fetch("/api/meta/clinics", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to fetch clinics");
                return;
            }
            setClinics(Array.isArray(data) ? (data as ClinicOption[]) : []);
        } catch (err) {
            console.error(err);
            toast.error("Unable to load clinics");
        } finally {
            setLoadingClinics(false);
        }
    }, []);

    useEffect(() => {
        if (!createDialogOpen || !createClinicId || !createDoctorId) {
            setAvailableDates([]);
            setLeaveDates([]);
            setAvailabilityError(null);
            return;
        }

        const monthKey = formatManilaISODate(availabilityMonth).slice(0, 7);
        let cancelled = false;

        (async () => {
            try {
                setAvailabilityLoading(true);
                setAvailabilityError(null);
                const params = new URLSearchParams({
                    clinic_id: createClinicId,
                    doctor_user_id: createDoctorId,
                    month: monthKey,
                });
                const res = await fetch(`/api/meta/doctor-availability/calendar?${params.toString()}`);
                const data = await res.json();

                if (cancelled) return;

                if (!res.ok) {
                    setAvailableDates([]);
                    setLeaveDates([]);
                    setAvailabilityError(data?.message ?? "Unable to load availability overview");
                    return;
                }

                setAvailableDates(Array.isArray(data?.availableDates) ? data.availableDates : []);
                setLeaveDates(Array.isArray(data?.leaveDates) ? data.leaveDates : []);
            } catch (err) {
                if (cancelled) return;
                console.error(err);
                setAvailableDates([]);
                setLeaveDates([]);
                setAvailabilityError("Unable to load availability overview");
            } finally {
                if (!cancelled) {
                    setAvailabilityLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [availabilityMonth, createClinicId, createDialogOpen, createDoctorId]);

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/scholar/appointments?status=all", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) {
                if (handleRateLimitError(res, data, "Too many appointment lookups. Please try again later.")) {
                    return;
                }
                toast.error(data?.error ?? "Failed to load appointments");
                return;
            }
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error("Unable to load appointments");
        } finally {
            setLoading(false);
            setInitializing(false);
        }
    }, []);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    useEffect(() => {
        if (!createDialogOpen) {
            resetCreateForm();
            setCreateSubmitting(false);
            return;
        }

        if (!patientsLoaded && !loadingPatients) {
            loadPatientOptions();
        }

        if (clinics.length === 0 && !loadingClinics) {
            loadClinicOptions();
        }
    }, [
        createDialogOpen,
        resetCreateForm,
        loadPatientOptions,
        patientsLoaded,
        loadingPatients,
        loadClinicOptions,
        clinics.length,
        loadingClinics,
    ]);

    useEffect(() => {
        if (!createDialogOpen || !createClinicId) {
            if (!createClinicId) {
                setDoctors([]);
                setCreateDoctorId("");
            }
            return;
        }

        (async () => {
            try {
                setLoadingDoctors(true);
                const params = new URLSearchParams({ clinic_id: createClinicId });
                const res = await fetch(`/api/meta/doctors?${params.toString()}`, { cache: "no-store" });
                const data = await res.json();
                if (!res.ok) {
                    if (handleRateLimitError(res, data, "Too many doctor lookups. Please wait before trying again.")) {
                        setDoctors([]);
                        return;
                    }
                    toast.error(data?.message ?? "Failed to load doctors");
                    return;
                }
                setDoctors(Array.isArray(data) ? (data as DoctorOption[]) : []);
            } catch (err) {
                console.error(err);
                toast.error("Unable to load doctors");
            } finally {
                setLoadingDoctors(false);
            }
        })();
    }, [createDialogOpen, createClinicId]);

    useEffect(() => {
        if (!createDialogOpen || !createClinicId || !createDoctorId || !createDate) {
            if (!createDoctorId) {
                setSlots([]);
                setCreateTimeStart("");
            }
            setOnLeaveDay(false);
            return;
        }

        (async () => {
            try {
                setLoadingSlots(true);
                const params = new URLSearchParams({
                    clinic_id: createClinicId,
                    doctor_user_id: createDoctorId,
                    date: createDate,
                });
                const res = await fetch(`/api/meta/doctor-availability?${params.toString()}`, {
                    cache: "no-store",
                });
                const data = await res.json();
                if (!res.ok) {
                    if (
                        handleRateLimitError(
                            res,
                            data,
                            "Too many availability checks. Please wait before trying again."
                        )
                    ) {
                        setSlots([]);
                        return;
                    }
                    toast.error(data?.message ?? "Failed to load available slots");
                    return;
                }
                setSlots(Array.isArray(data?.slots) ? (data.slots as SlotOption[]) : []);
                setOnLeaveDay(Boolean(data?.onLeave));
            } catch (err) {
                console.error(err);
                toast.error("Unable to load available slots");
            } finally {
                setLoadingSlots(false);
            }
        })();
    }, [createDialogOpen, createClinicId, createDoctorId, createDate]);

    useEffect(() => {
        if (!createDialogOpen) return;
        setCreateService("");
    }, [createDoctorId, createDialogOpen]);

    useEffect(() => {
        if (!createDialogOpen) return;
        setCreateTimeStart("");
    }, [createDoctorId, createDate, createDialogOpen]);

    const searchTerm = search.trim().toLowerCase();
    const selectedDate = useMemo(() => (createDate ? new Date(`${createDate}T00:00:00+08:00`) : undefined), [createDate]);
    const availableDateObjects = useMemo(
        () => availableDates.map((value) => new Date(`${value}T00:00:00+08:00`)),
        [availableDates]
    );
    const leaveDateObjects = useMemo(
        () => leaveDates.map((value) => new Date(`${value}T00:00:00+08:00`)),
        [leaveDates]
    );

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

    const filteredPatients = useMemo(() => {
        const term = patientSearch.trim().toLowerCase();
        if (!term) {
            return patientOptions.slice(0, 50);
        }

        return patientOptions
            .filter((patient) => {
                const haystack = [patient.name, patient.identifier, patient.type]
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(term);
            })
            .slice(0, 50);
    }, [patientOptions, patientSearch]);

    const selectedPatient = useMemo(
        () => patientOptions.find((patient) => patient.userId === selectedPatientId) ?? null,
        [patientOptions, selectedPatientId]
    );

    const selectedDoctor = useMemo(
        () => doctors.find((doctor) => doctor.user_id === createDoctorId) ?? null,
        [doctors, createDoctorId]
    );

    const selectedSlot = useMemo(
        () => slots.find((slot) => slot.start === createTimeStart) ?? null,
        [slots, createTimeStart]
    );

    const availableServices = useMemo(
        () => getServiceOptionsForSpecialization(selectedDoctor?.specialization ?? null),
        [selectedDoctor]
    );

    const selectedServiceOption = useMemo(
        () => availableServices.find((service) => service.value === createService) ?? null,
        [availableServices, createService]
    );

    function openCreateDialog() {
        resetCreateForm();
        setCreateDialogOpen(true);
    }

    async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedPatient) {
            toast.error("Select a patient");
            return;
        }

        if (!createClinicId) {
            toast.error("Choose a clinic");
            return;
        }

        if (!createDoctorId) {
            toast.error("Choose a doctor");
            return;
        }

        if (!createDate) {
            toast.error("Select an appointment date");
            return;
        }

        if (!selectedSlot) {
            toast.error("Select an available time");
            return;
        }

        const serviceTypeValue = selectedServiceOption?.serviceType ?? resolveServiceType(createService);
        if (!serviceTypeValue) {
            toast.error("Select a service type");
            return;
        }

        try {
            setCreateSubmitting(true);
            const res = await fetch("/api/scholar/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_user_id: selectedPatient.userId,
                    clinic_id: createClinicId,
                    doctor_user_id: createDoctorId,
                    service_type: serviceTypeValue,
                    date: createDate,
                    time_start: selectedSlot.start,
                    time_end: selectedSlot.end,
                    remarks: createRemarks.trim() ? createRemarks.trim() : undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                if (handleRateLimitError(res, data, "Too many appointment submissions. Please wait before trying again.")) {
                    return;
                }
                toast.error(data?.error ?? data?.message ?? "Failed to schedule walk-in appointment");
                return;
            }

            toast.success("Walk-in appointment scheduled");
            setCreateDialogOpen(false);
            await loadAppointments();
        } catch (err) {
            console.error(err);
            toast.error("Unable to schedule walk-in appointment");
        } finally {
            setCreateSubmitting(false);
        }
    }

    if (initializing) {
        return <ScholarAppointmentsLoading />;
    }

    return (
        <ScholarLayout
            title="Appointment coordination"
            description="Track campus clinic bookings, monitor status changes, and keep students informed about their schedules."
            actions={
                <Button
                    variant="outline"
                    onClick={loadAppointments}
                    className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh list
                </Button>
            }
        >
            <div className="flex flex-col gap-6">
                <section className="grid gap-4 md:grid-cols-3 min-w-0">
                    <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-primary">
                                    Active queue
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Pending, approved, and moved appointments
                                </p>
                            </div>
                            <Clock3 className="h-9 w-9 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-primary">
                                {activeAppointments.length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-primary">
                                    Today&apos;s visits
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Appointments scheduled for today
                                </p>
                            </div>
                            <CalendarDays className="h-9 w-9 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-primary">
                                {todayAppointments.length}
                            </p>
                            {nextAppointment ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Next: {nextAppointment.patient.name} at {formatTimeOnly(nextAppointment.start)}
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-primary">
                                    Pending approvals
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Requests awaiting confirmation
                                </p>
                            </div>
                            <AlertCircle className="h-9 w-9 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-primary">
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
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                className="rounded-xl bg-primary text-white hover:bg-primary/90"
                                onClick={openCreateDialog}
                            >
                                Schedule walk-in
                            </Button>
                        </div>
                    }
                    contentClassName="pt-4"
                >
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-primary">Search queue</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, ID, clinic, or note"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="rounded-xl border-primary/30 pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-primary">Status filter</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="rounded-xl border-primary/30">
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
                                        <TableHead className="min-w-30">Patient</TableHead>
                                        <TableHead className="min-w-30">Clinic</TableHead>
                                        <TableHead className="min-w-30">Doctor</TableHead>
                                        <TableHead className="min-w-30">Date</TableHead>
                                        <TableHead className="min-w-30">Time</TableHead>
                                        <TableHead className="min-w-30">Status</TableHead>
                                        <TableHead className="min-w-30">Service</TableHead>
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
                                                <TableCell className="font-medium text-primary">
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
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
                    <form onSubmit={handleCreateSubmit} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl text-primary">
                                Schedule walk-in appointment
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Assign a doctor and time slot for a walk-in patient to keep the care team in sync.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-primary">Find patient</Label>
                                <Input
                                    placeholder="Search by name, ID, or type"
                                    value={patientSearch}
                                    onChange={(event) => setPatientSearch(event.target.value)}
                                    className="rounded-xl border-primary/30"
                                />
                                <Select
                                    value={selectedPatientId || undefined}
                                    onValueChange={setSelectedPatientId}
                                    disabled={loadingPatients}
                                >
                                    <SelectTrigger className="rounded-xl border-primary/30">
                                        <SelectValue
                                            placeholder={
                                                loadingPatients
                                                    ? "Loading patients..."
                                                    : "Select a patient"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                        {loadingPatients ? (
                                            <SelectItem value="loading" disabled>
                                                Loading patients...
                                            </SelectItem>
                                        ) : filteredPatients.length === 0 ? (
                                            <SelectItem value="empty" disabled>
                                                {patientSearch
                                                    ? "No matches found"
                                                    : "No active patients available"}
                                            </SelectItem>
                                        ) : (
                                            filteredPatients.map((patient) => (
                                                <SelectItem key={patient.userId} value={patient.userId}>
                                                    <div className="flex flex-col">
                                                        <span>{patient.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {patient.type}
                                                            {patient.identifier
                                                                ? ` • ${patient.identifier}`
                                                                : ""}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {selectedPatient ? (
                                    <p className="text-xs text-muted-foreground">
                                        Scheduling for <span className="font-medium text-primary">{selectedPatient.name}</span>
                                        {selectedPatient.identifier
                                            ? ` • ${selectedPatient.identifier}`
                                            : ""} ({selectedPatient.type})
                                    </p>
                                ) : null}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-primary">Clinic</Label>
                                    <Select
                                        value={createClinicId || undefined}
                                        onValueChange={(value) => {
                                            setCreateClinicId(value);
                                            setCreateDoctorId("");
                                            setCreateService("");
                                            setSlots([]);
                                            setCreateTimeStart("");
                                            setAvailableDates([]);
                                            setLeaveDates([]);
                                            setAvailabilityError(null);
                                        }}
                                        disabled={loadingClinics}
                                    >
                                        <SelectTrigger className="rounded-xl border-primary/30">
                                            <SelectValue
                                                placeholder={
                                                    loadingClinics
                                                        ? "Loading clinics..."
                                                        : "Select a clinic"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {loadingClinics ? (
                                                <SelectItem value="loading" disabled>
                                                    Loading clinics...
                                                </SelectItem>
                                            ) : clinics.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    No clinics available
                                                </SelectItem>
                                            ) : (
                                                clinics.map((clinic) => (
                                                    <SelectItem key={clinic.clinic_id} value={clinic.clinic_id}>
                                                        {clinic.clinic_name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-primary">Doctor</Label>
                                    <Select
                                        value={createDoctorId || undefined}
                                        onValueChange={(value) => {
                                            setCreateDoctorId(value);
                                            setCreateService("");
                                            setSlots([]);
                                            setCreateTimeStart("");
                                            setAvailableDates([]);
                                            setLeaveDates([]);
                                            setAvailabilityError(null);
                                        }}
                                        disabled={loadingDoctors || !createClinicId}
                                    >
                                        <SelectTrigger className="rounded-xl border-primary/30">
                                            <SelectValue
                                                placeholder={
                                                    !createClinicId
                                                        ? "Select a clinic first"
                                                        : loadingDoctors
                                                            ? "Loading doctors..."
                                                            : "Select a doctor"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {loadingDoctors ? (
                                                <SelectItem value="loading" disabled>
                                                    Loading doctors...
                                                </SelectItem>
                                            ) : doctors.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    No doctors available
                                                </SelectItem>
                                            ) : (
                                                doctors.map((doctor) => (
                                                    <SelectItem key={doctor.user_id} value={doctor.user_id}>
                                                        <div className="flex flex-col">
                                                            <span>{doctor.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {doctor.specialization ?? "Doctor"}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:col-span-2">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-primary">Schedule</p>
                                        <p className="text-sm text-muted-foreground">
                                            Explore available dates and select an open time for this patient.
                                        </p>
                                    </div>
                                    {!createDoctorId || !createClinicId ? (
                                        <div className="rounded-2xl border border-dashed border-primary/30 bg-white/70 p-4 text-sm text-muted-foreground">
                                            Choose a clinic and doctor to view availability.
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
                                            <div className="rounded-2xl border border-primary/20 bg-white/70 shadow-inner">
                                                <div className="px-4 py-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Month overview</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {selectedDoctor?.name ? `Availability for ${selectedDoctor.name}` : "Pick a doctor"}
                                                    </p>
                                                </div>
                                                <div className="relative px-3 pb-4 pt-2 sm:px-4">
                                                    {availabilityLoading ? (
                                                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                        </div>
                                                    ) : null}
                                                    <Calendar
                                                        mode="single"
                                                        month={availabilityMonth}
                                                        onMonthChange={setAvailabilityMonth}
                                                        selected={selectedDate}
                                                        onSelect={(value) => {
                                                            if (value) {
                                                                setCreateDate(formatManilaISODate(value));
                                                                setCreateTimeStart("");
                                                                setAvailabilityMonth(value);
                                                            }
                                                        }}
                                                        disabled={(day) =>
                                                            day < new Date(`${minBookingDate}T00:00:00+08:00`)
                                                        }
                                                        modifiers={{ available: availableDateObjects, leave: leaveDateObjects }}
                                                        modifiersClassNames={{
                                                            available:
                                                                "[&>button]:border [&>button]:border-emerald-200 [&>button]:bg-emerald-50 [&>button]:text-emerald-700 [&>button[data-selected-single=true]]:!border-transparent [&>button[data-selected-single=true]]:!bg-emerald-500 [&>button[data-selected-single=true]]:!text-white",
                                                            leave:
                                                                "[&>button]:border [&>button]:border-amber-200 [&>button]:bg-amber-50 [&>button]:text-amber-700 [&>button[data-selected-single=true]]:!border-transparent [&>button[data-selected-single=true]]:!bg-amber-500 [&>button[data-selected-single=true]]:!text-white",
                                                        }}
                                                        className="mx-auto w-full max-w-sm [--cell-size:2.3rem] sm:[--cell-size:2.6rem]"
                                                    />
                                                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available date
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-amber-500" /> Leave day
                                                        </div>
                                                    </div>
                                                    {availabilityError ? (
                                                        <p className="mt-3 text-xs text-rose-600">{availabilityError}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Selected day</p>
                                                    <h4 className="text-lg font-semibold text-slate-900">
                                                        {selectedDate ? toManilaDateString(formatManilaISODate(selectedDate)) : "Choose a date"}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {!selectedDate
                                                            ? "Pick a date to load available times."
                                                            : onLeaveDay || leaveDates.includes(createDate)
                                                                ? `${selectedDoctor?.name ?? "Doctor"} is on leave.`
                                                                : slots.length > 0
                                                                    ? "Select a time slot for this patient."
                                                                    : "No open slots for this day."}
                                                    </p>
                                                </div>

                                                {!selectedDate ? (
                                                    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/10/50 p-6 text-sm text-muted-foreground">
                                                        Choose a date on the calendar to view available times.
                                                    </div>
                                                ) : loadingSlots ? (
                                                    <div className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-white p-3 text-sm text-muted-foreground">
                                                        <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
                                                    </div>
                                                ) : availabilityError ? (
                                                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 text-sm text-rose-700">
                                                        Unable to load the schedule. Try again later.
                                                    </div>
                                                ) : onLeaveDay || leaveDates.includes(createDate) ? (
                                                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-800">
                                                        This doctor is marked as on leave for this day.
                                                    </div>
                                                ) : slots.length > 0 ? (
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {slots.map((slot) => {
                                                            const isSelected = createTimeStart === slot.start;
                                                            return (
                                                                <button
                                                                    key={`${createDoctorId}-${slot.start}-${slot.end}`}
                                                                    type="button"
                                                                    onClick={() => selectedDoctor && setCreateTimeStart(slot.start)}
                                                                    className={cn(
                                                                        "flex w-full flex-col items-start gap-1 rounded-2xl border px-3 py-2 text-left text-sm font-medium transition",
                                                                        "border-primary/25 bg-white text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                                                                        isSelected && "border-primary bg-primary text-white hover:bg-primary/90 focus-visible:outline-primary"
                                                                    )}
                                                                    aria-pressed={isSelected}
                                                                >
                                                                    <span className="leading-tight">{formatTimeRange(slot.start, slot.end)}</span>
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
                                                        No available slots for this date.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-sm font-medium text-primary">Service</Label>
                                    <Select
                                        value={createService || undefined}
                                        onValueChange={setCreateService}
                                        disabled={!createDoctorId || availableServices.length === 0}
                                    >
                                        <SelectTrigger className="rounded-xl border-primary/30">
                                            <SelectValue
                                                placeholder={
                                                    !createDoctorId
                                                        ? "Select a doctor to view services"
                                                        : availableServices.length === 0
                                                            ? "No services available"
                                                            : "Select a service"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {availableServices.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    No services available
                                                </SelectItem>
                                            ) : (
                                                availableServices.map((service) => (
                                                    <SelectItem key={service.value} value={service.value}>
                                                        {service.label}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-sm font-medium text-primary">Notes</Label>
                                    <Textarea
                                        value={createRemarks}
                                        onChange={(event) => setCreateRemarks(event.target.value)}
                                        placeholder="Optional details for the care team"
                                        className="min-h-22.5 rounded-xl border-primary/30"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Add context such as symptoms reported during the walk-in or follow-up instructions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                className="rounded-xl"
                                disabled={createSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-xl bg-primary text-white hover:bg-primary/90"
                                disabled={createSubmitting}
                            >
                                {createSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Schedule appointment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ScholarLayout>
    );
}
