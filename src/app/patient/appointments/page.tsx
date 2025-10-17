"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Ban,
    CalendarDays,
    ClipboardList,
    Loader2,
    Trash2,
    Undo2,
} from "lucide-react";

import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppointmentPanel } from "@/components/appointments/appointment-panel";
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
import { toast } from "sonner";
import { formatTimeRange, manilaNow } from "@/lib/time";

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

export default function PatientAppointmentsPage() {
    const minBookingDate = useMemo(() => computeMinBookingDate(), []);

    // Form state
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loadingClinics, setLoadingClinics] = useState(true);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [clinicId, setClinicId] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [serviceType, setServiceType] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [timeStart, setTimeStart] = useState<string>("");

    // My appointments
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

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

    // Load slots
    useEffect(() => {
        setTimeStart("");
        if (!clinicId || !doctorId || !date) {
            setSlots([]);
            return;
        }
        (async () => {
            try {
                setLoadingSlots(true);
                const params = new URLSearchParams({ clinic_id: clinicId, doctor_user_id: doctorId, date });
                const res = await fetch(`/api/meta/doctor-availability?${params}`);
                const data = await res.json();
                setSlots(data?.slots || []);
            } catch {
                toast.error("Failed to load available slots");
            } finally {
                setLoadingSlots(false);
            }
        })();
    }, [clinicId, doctorId, date]);

    const selectedSlot = useMemo(() => slots.find(s => s.start === timeStart), [slots, timeStart]);
    const selectedDoctor = useMemo(() => doctors.find(d => d.user_id === doctorId) || null, [doctorId, doctors]);
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

    // ✅ Dynamic service options: each label has a unique value
    const availableServices = useMemo(() => {
        if (!selectedDoctor?.specialization) return [];

        if (selectedDoctor.specialization === "Physician") {
            return [
                { label: "Physical examinations", value: "Assessment-physical" },
                { label: "Consultations", value: "Consultation-general" },
                { label: "Medical certificate issuance", value: "Consultation-cert" },
            ];
        }

        if (selectedDoctor.specialization === "Dentist") {
            return [
                { label: "Consultations and examinations", value: "Dental-consult" },
                { label: "Oral prophylaxis", value: "Dental-cleaning" },
                { label: "Tooth extractions", value: "Dental-extraction" },
                { label: "Dental certificate issuance", value: "Dental-cert" },
            ];
        }

        return [];
    }, [selectedDoctor]);

    const selectedServiceLabel = useMemo(
        () => availableServices.find((service) => service.value === serviceType)?.label ?? null,
        [availableServices, serviceType]
    );

    // ✅ Convert unique UI value to enum-safe backend value
    function getEnumValue(v: string): string {
        if (v.startsWith("Consultation")) return "Consultation";
        if (v.startsWith("Dental")) return "Dental";
        if (v.startsWith("Assessment")) return "Assessment";
        return "Other";
    }

    // ✅ Submit appointment
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!clinicId || !doctorId || !serviceType || !date || !selectedSlot) {
            toast.error("Please complete all fields");
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
                    service_type: getEnumValue(serviceType),
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
            setSlots([]);
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
        }
    }

    const handleClearAppointments = () => {
        setAppointments([]);
        toast.info("Appointments cleared from view");
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    return (
        <PatientLayout
            title="Appointments"
            description="Plan and manage your clinic visits — from booking a slot to tracking approvals and changes."
            actions={
                <div className="hidden items-center gap-3 rounded-2xl border border-green-100 bg-white/80 px-4 py-2 text-xs font-medium text-green-700 shadow-sm md:flex">
                    <CalendarDays className="h-4 w-4" />
                    Earliest booking: {minBookingDate}
                </div>
            }
        >
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <AppointmentPanel
                    icon={CalendarDays}
                    title="Request an appointment"
                    description="Choose the clinic, provider, and time that works for you. Appointments must be scheduled at least 3 days in advance."
                >
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium text-green-700">Clinic</Label>
                            <Select value={clinicId} onValueChange={setClinicId} disabled={loadingClinics}>
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
                            <Select value={doctorId} onValueChange={setDoctorId} disabled={!clinicId || loadingDoctors}>
                                <SelectTrigger className="rounded-xl border-green-200">
                                    <SelectValue placeholder={!clinicId ? "Select clinic first" : loadingDoctors ? "Loading doctors..." : "Select doctor"} />
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
                            <Select value={timeStart} onValueChange={setTimeStart} disabled={loadingSlots || !doctorId || !date}>
                                <SelectTrigger className="rounded-xl border-green-200">
                                    <SelectValue
                                        placeholder={
                                            !doctorId || !date
                                                ? "Select doctor and date"
                                                : loadingSlots
                                                    ? "Loading slots..."
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


                <div className="space-y-6">
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
                                        {selectedDoctor ? `${selectedDoctor.name} ${selectedDoctor.specialization ? `(${selectedDoctor.specialization})` : ""}` : "Choose a clinic and doctor"}
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
                                                {new Date(date).toLocaleDateString()} · {formatTimeRange(selectedSlot.start, selectedSlot.end)}
                                            </span>
                                        ) : (
                                            "Choose a date and time"
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-green-100/80 bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg">Important reminders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-white/90">
                            <p>Bring your clinic ID and arrive 10 minutes early for screening and verification.</p>
                            <p>If you can no longer attend, submit a reschedule or cancellation so another patient can use the slot.</p>
                            <p>Watch your notifications for approvals, movement updates, and doctor instructions.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="space-y-4">
                <Card className="rounded-3xl border-green-100/80 bg-white/90 shadow-sm">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-xl text-green-700">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600/10 text-green-700">
                                    <ClipboardList className="h-5 w-5" />
                                </span>
                                Your appointment requests
                            </CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Track approval status, reschedule upcoming visits, or cancel when plans change.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 self-start rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                            onClick={handleClearAppointments}
                            disabled={appointments.length === 0}
                        >
                            <Trash2 className="h-4 w-4" /> Clear view
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loadingAppointments ? (
                            <div className="flex items-center justify-center rounded-3xl border border-dashed border-green-200 bg-green-50/60 py-10 text-sm text-green-700">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading appointments…
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-green-200 bg-green-50/60 p-8 text-center text-sm text-green-700">
                                No appointment requests yet. Submit a booking to see it here.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-3xl border border-green-100">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-green-600/10 text-xs font-semibold uppercase tracking-wide text-green-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Clinic</th>
                                            <th className="px-4 py-3 text-left">Doctor</th>
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-left">Time</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-green-100/80">
                                        {appointments.map((appointment) => (
                                            <tr key={appointment.id} className="bg-white/90">
                                                <td className="px-4 py-3 font-medium text-green-800">{appointment.clinic}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{appointment.doctor}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{appointment.date}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{appointment.time}</td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-full bg-green-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                                                        {appointment.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {canModifyAppointment(appointment) ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openRescheduleDialog(appointment)}
                                                                disabled={rescheduling && rescheduleTarget?.id === appointment.id}
                                                                className="gap-2 rounded-xl border-green-200 text-green-700 hover:bg-green-100/60"
                                                            >
                                                                {rescheduling && rescheduleTarget?.id === appointment.id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Undo2 className="h-3 w-3" />
                                                                )}
                                                                Reschedule
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => openCancelDialog(appointment)}
                                                                disabled={cancelSubmitting && cancelTarget?.id === appointment.id}
                                                                className="gap-2 rounded-xl"
                                                            >
                                                                {cancelSubmitting && cancelTarget?.id === appointment.id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Ban className="h-3 w-3" />
                                                                )}
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No actions available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
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
                                ? `Select a new slot for your appointment with ${rescheduleTarget.doctor}. Appointments must be booked at least ${MIN_BOOKING_LEAD_DAYS} days in advance.`
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
