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
import { cn } from "@/lib/utils";
import {
    formatManilaDateTime,
    formatManilaISODate,
    formatTimeRange,
    manilaNow,
    toManilaDateString,
} from "@/lib/time";
import { getServiceOptionsForSpecialization, resolveServiceType } from "@/lib/service-options";
import { useDoctorAvailabilityBulk, useMetaClinics, useMetaDoctors } from "@/hooks/useMeta";
import type { TimeSlot } from "@/lib/doctor-availability";
import { fetchJsonWithRetry, HttpError } from "@/lib/http";

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

export default function ScholarAppointmentsPage() {
    const [appointments, setAppointments] = useState<ScholarAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("active");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);

    const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
    const [patientsLoaded, setPatientsLoaded] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [patientSearch, setPatientSearch] = useState("");
    const [selectedPatientId, setSelectedPatientId] = useState("");

    const [createClinicId, setCreateClinicId] = useState("");

    const [createDoctorId, setCreateDoctorId] = useState("");

    const [createTimeStart, setCreateTimeStart] = useState("");

    const [createService, setCreateService] = useState("");
    const [createDate, setCreateDate] = useState(() => formatManilaISODate(manilaNow()));
    const [createRemarks, setCreateRemarks] = useState("");

    const { clinics, isLoading: loadingClinics, error: clinicsError } = useMetaClinics();
    const {
        doctors,
        isLoading: loadingDoctors,
        isValidating: validatingDoctors,
        error: doctorsError,
    } = useMetaDoctors(createDialogOpen ? (createClinicId || null) : null);
    const {
        availabilityByDoctor: slotAvailability,
        isLoading: loadingSlotAvailability,
        isValidating: validatingSlotAvailability,
        error: slotError,
    } = useDoctorAvailabilityBulk({
        clinicId: createDialogOpen ? (createClinicId || null) : null,
        date: createDialogOpen ? (createDate || null) : null,
        doctorIds: createDoctorId ? [createDoctorId] : [],
    });

    const slots = useMemo<TimeSlot[]>(() => {
        if (!createDoctorId) {
            return [];
        }
        return slotAvailability[createDoctorId] ?? [];
    }, [slotAvailability, createDoctorId]);
    const loadingSlots = Boolean(
        createDialogOpen &&
            createClinicId &&
            createDoctorId &&
            createDate &&
            (loadingSlotAvailability || validatingSlotAvailability) &&
            slots.length === 0
    );
    const doctorsPending = loadingDoctors || validatingDoctors;
    const slotErrorMessage = slotError ? "Failed to load available slots" : null;

    const resetCreateForm = useCallback(() => {
        const today = formatManilaISODate(manilaNow());
        setSelectedPatientId("");
        setPatientSearch("");
        setCreateClinicId("");
        setCreateDoctorId("");
        setCreateDate(today);
        setCreateTimeStart("");
        setCreateService("");
        setCreateRemarks("");
    }, []);

    const loadPatientOptions = useCallback(async () => {
        try {
            setLoadingPatients(true);
            const query = new URLSearchParams();
            query.set("status", "active");
            const data = await fetchJsonWithRetry<PatientRecordResponse[]>(
                `/api/scholar/patients?${query.toString()}`,
                { method: "GET" }
            );

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
            if (err instanceof HttpError) {
                const body = err.body as { message?: string } | null | undefined;
                toast.error(body?.message ?? "Failed to fetch patient list");
            } else {
                toast.error("Unable to load patients");
            }
        } finally {
            setLoadingPatients(false);
        }
    }, []);

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchJsonWithRetry<ScholarAppointment[]>(
                "/api/scholar/appointments?status=all",
                { method: "GET" }
            );
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

    useEffect(() => {
        if (!createDialogOpen) {
            resetCreateForm();
            setCreateSubmitting(false);
            return;
        }

        if (!patientsLoaded && !loadingPatients) {
            loadPatientOptions();
        }

    }, [
        createDialogOpen,
        resetCreateForm,
        loadPatientOptions,
        patientsLoaded,
        loadingPatients,
    ]);

    useEffect(() => {
        if (!createDialogOpen || !createClinicId) {
            if (!createClinicId) {
                setCreateDoctorId("");
            }
            return;
        }
    }, [createDialogOpen, createClinicId]);

    useEffect(() => {
        if (clinicsError) {
            toast.error("Failed to load clinics");
        }
    }, [clinicsError]);

    useEffect(() => {
        if (doctorsError) {
            toast.error("Failed to load doctors");
        }
    }, [doctorsError]);

    useEffect(() => {
        if (slotError) {
            toast.error("Failed to load available slots");
        }
    }, [slotError]);

    useEffect(() => {
        if (!createDialogOpen) return;
        setCreateService("");
    }, [createDoctorId, createDialogOpen]);

    useEffect(() => {
        if (!createDialogOpen) return;
        setCreateTimeStart("");
    }, [createDoctorId, createDate, createDialogOpen]);

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

    return (
        <ScholarLayout
            title="Appointment coordination"
            description="Track campus clinic bookings, monitor status changes, and keep students informed about their schedules."
            actions={
                <Button variant="outline" onClick={loadAppointments} className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70">
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
                                className="rounded-xl bg-green-600 text-white hover:bg-green-700"
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
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="rounded-3xl sm:max-w-3xl max-h-[80vh] overflow-y-auto sm:overflow-visible sm:max-h-none">
                    <form onSubmit={handleCreateSubmit} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl text-green-700">
                                Schedule walk-in appointment
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Assign a doctor and time slot for a walk-in patient to keep the care team in sync.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Find patient</Label>
                                <Input
                                    placeholder="Search by name, ID, or type"
                                    value={patientSearch}
                                    onChange={(event) => setPatientSearch(event.target.value)}
                                    className="rounded-xl border-green-200"
                                />
                                <Select
                                    value={selectedPatientId || undefined}
                                    onValueChange={setSelectedPatientId}
                                    disabled={loadingPatients}
                                >
                                    <SelectTrigger className="rounded-xl border-green-200">
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
                                        Scheduling for <span className="font-medium text-green-700">{selectedPatient.name}</span>
                                        {selectedPatient.identifier
                                            ? ` • ${selectedPatient.identifier}`
                                            : ""} ({selectedPatient.type})
                                    </p>
                                ) : null}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Clinic</Label>
                                    <Select
                                        value={createClinicId || undefined}
                                        onValueChange={(value) => {
                                            setCreateClinicId(value);
                                            setCreateDoctorId("");
                                            setCreateService("");
                                            setCreateTimeStart("");
                                        }}
                                        disabled={loadingClinics}
                                    >
                                        <SelectTrigger className="rounded-xl border-green-200">
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
                                    <Label className="text-sm font-medium text-green-700">Doctor</Label>
                                    <Select
                                        value={createDoctorId || undefined}
                                        onValueChange={(value) => {
                                            setCreateDoctorId(value);
                                            setCreateService("");
                                            setCreateTimeStart("");
                                        }}
                                        disabled={doctorsPending || !createClinicId}
                                    >
                                        <SelectTrigger className="rounded-xl border-green-200">
                                            <SelectValue
                                                placeholder={
                                                    !createClinicId
                                                        ? "Select a clinic first"
                                                        : doctorsPending
                                                            ? "Loading doctors..."
                                                            : "Select a doctor"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {doctorsPending ? (
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

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Date</Label>
                                    <Input
                                        type="date"
                                        value={createDate}
                                        onChange={(event) => setCreateDate(event.target.value)}
                                        min={formatManilaISODate(manilaNow())}
                                        className="rounded-xl border-green-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Time</Label>
                                    <Select
                                        value={createTimeStart || undefined}
                                        onValueChange={setCreateTimeStart}
                                        disabled={loadingSlots || !createDoctorId || !createDate}
                                    >
                                        <SelectTrigger className="rounded-xl border-green-200">
                                            <SelectValue
                                                placeholder={
                                                    !createDoctorId
                                                        ? "Select a doctor first"
                                                        : slotErrorMessage
                                                            ? "Unable to load slots"
                                                            : loadingSlots
                                                            ? "Checking availability..."
                                                            : "Select time slot"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {slotErrorMessage ? (
                                                <SelectItem value="error" disabled>
                                                    {slotErrorMessage}
                                                </SelectItem>
                                            ) : loadingSlots ? (
                                                <SelectItem value="loading" disabled>
                                                    Checking availability...
                                                </SelectItem>
                                            ) : slots.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    No open slots for the selected date
                                                </SelectItem>
                                            ) : (
                                                slots.map((slot) => (
                                                    <SelectItem key={`${slot.start}-${slot.end}`} value={slot.start}>
                                                        {formatTimeRange(slot.start, slot.end)}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-sm font-medium text-green-700">Service</Label>
                                    <Select
                                        value={createService || undefined}
                                        onValueChange={setCreateService}
                                        disabled={!createDoctorId || availableServices.length === 0}
                                    >
                                        <SelectTrigger className="rounded-xl border-green-200">
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
                                    <Label className="text-sm font-medium text-green-700">Notes</Label>
                                    <Textarea
                                        value={createRemarks}
                                        onChange={(event) => setCreateRemarks(event.target.value)}
                                        placeholder="Optional details for the care team"
                                        className="min-h-[90px] rounded-xl border-green-200"
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
                                className="rounded-xl bg-green-600 text-white hover:bg-green-700"
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
