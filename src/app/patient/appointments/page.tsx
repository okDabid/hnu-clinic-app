"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    Menu,
    X,
    Home,
    User,
    CalendarDays,
    ClipboardList,
    Bell,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatTimeRange } from "@/lib/time";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

type Clinic = { clinic_id: string; clinic_name: string };
type Doctor = { user_id: string; name: string; specialization: "Physician" | "Dentist" | null };
type Slot = { start: string; end: string };
type Appointment = {
    id: string;
    clinic: string;
    clinic_id: string;
    doctor: string;
    doctor_user_id: string;
    date: string;
    time: string;
    timeStart: string;
    timeEnd: string;
    status: string;
};

export default function PatientAppointmentsPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
    const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
    const [rescheduleTimeStart, setRescheduleTimeStart] = useState("");
    const [rescheduling, setRescheduling] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const minBookingDate = useMemo(() => {
        const now = new Date();
        now.setDate(now.getDate() + 3);
        return now.toISOString().slice(0, 10);
    }, []);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
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

    useEffect(() => {
        if (!rescheduleDialogOpen || !selectedAppointment) {
            return;
        }

        if (!rescheduleDate) {
            setRescheduleSlots([]);
            setRescheduleTimeStart("");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setLoadingRescheduleSlots(true);
                const params = new URLSearchParams({
                    clinic_id: selectedAppointment.clinic_id,
                    doctor_user_id: selectedAppointment.doctor_user_id,
                    date: rescheduleDate,
                });
                const res = await fetch(`/api/meta/doctor-availability?${params.toString()}`);
                const data = await res.json();
                if (!cancelled) {
                    setRescheduleSlots(data?.slots || []);
                }
            } catch {
                if (!cancelled) toast.error("Failed to load available slots");
            } finally {
                if (!cancelled) setLoadingRescheduleSlots(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [rescheduleDialogOpen, selectedAppointment, rescheduleDate]);

    const selectedSlot = useMemo(() => slots.find((s) => s.start === timeStart), [slots, timeStart]);
    const selectedRescheduleSlot = useMemo(
        () => rescheduleSlots.find((s) => s.start === rescheduleTimeStart),
        [rescheduleSlots, rescheduleTimeStart],
    );
    const selectedDoctor = useMemo(() => doctors.find(d => d.user_id === doctorId) || null, [doctorId, doctors]);

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

    // ✅ Convert unique UI value to enum-safe backend value
    function getEnumValue(v: string): string {
        if (v.startsWith("Consultation")) return "Consultation";
        if (v.startsWith("Dental")) return "Dental";
        if (v.startsWith("Assessment")) return "Assessment";
        return "Other";
    }

    function openRescheduleDialog(appointment: Appointment) {
        setSelectedAppointment(appointment);
        setRescheduleDate("");
        setRescheduleTimeStart("");
        setRescheduleSlots([]);
        setRescheduleDialogOpen(true);
    }

    function closeRescheduleDialog() {
        setRescheduleDialogOpen(false);
        setSelectedAppointment(null);
        setRescheduleDate("");
        setRescheduleSlots([]);
        setRescheduleTimeStart("");
        setLoadingRescheduleSlots(false);
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

            const data = await res.json().catch(() => ({} as Record<string, unknown>));

            if (!res.ok) {
                toast.error(data?.message || "Unable to create appointment");
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

    async function handleRescheduleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAppointment || !rescheduleDate || !selectedRescheduleSlot) {
            toast.error("Please choose a new date and time");
            return;
        }

        try {
            setRescheduling(true);
            const res = await fetch("/api/patient/appointments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointment_id: selectedAppointment.id,
                    date: rescheduleDate,
                    time_start: selectedRescheduleSlot.start,
                    time_end: selectedRescheduleSlot.end,
                }),
            });

            const data = await res.json().catch(() => ({} as Record<string, unknown>));

            if (!res.ok) {
                toast.error(data?.message || "Unable to reschedule appointment");
                return;
            }

            toast.success("Appointment rescheduled!");
            closeRescheduleDialog();
            loadAppointments();
        } catch {
            toast.error("Unable to reschedule appointment");
        } finally {
            setRescheduling(false);
        }
    }

    async function handleCancelAppointment(appointment: Appointment) {
        if (!["Pending", "Approved", "Moved"].includes(appointment.status)) {
            toast.error("Only pending or approved appointments can be cancelled");
            return;
        }
        const confirmed = window.confirm("Cancel this appointment?");
        if (!confirmed) return;

        try {
            setCancellingId(appointment.id);
            const res = await fetch("/api/patient/appointments", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointment_id: appointment.id }),
            });

            const data = await res.json().catch(() => ({} as Record<string, unknown>));

            if (!res.ok) {
                toast.error(data?.message || "Unable to cancel appointment");
                return;
            }

            toast.success("Appointment cancelled");
            loadAppointments();
        } catch {
            toast.error("Unable to cancel appointment");
        } finally {
            setCancellingId(null);
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

    useEffect(() => {
        loadAppointments();
    }, []);

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-xl border-r p-6">
                {/* Logo Section */}
                <div className="flex items-center mb-12">
                    <Image
                        src="/clinic-illustration.svg"
                        alt="clinic-logo"
                        width={40}
                        height={40}
                        className="object-contain drop-shadow-sm"
                    />
                    <h1 className="text-2xl font-extrabold text-green-600 tracking-tight leading-none">
                        HNU Clinic
                    </h1>
                </div>
                <nav className="flex flex-col gap-2 text-gray-700">
                    <Link href="/patient" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link href="/patient/account" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                        <User className="h-5 w-5" />
                        Account
                    </Link>
                    <Link href="/patient/appointments" className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200">
                        <CalendarDays className="h-5 w-5" />
                        Appointments
                    </Link>
                    <Link href="/patient/notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </Link>
                </nav>

                <Separator className="my-8" />

                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 py-2"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Logging out...
                        </>
                    ) : (
                        "Logout"
                    )}
                </Button>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Book an Appointment</h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen(prev => !prev)}>
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href="/patient">Dashboard</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/patient/account">Account</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/patient/appointments">Appointments</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/patient/notifications">Notifications</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Booking Form */}
                <section className="px-6 py-10 max-w-5xl mx-auto w-full">
                    <Card className="shadow-lg rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CalendarDays className="w-6 h-6" /> Appointment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* Clinic */}
                                <div className="grid gap-2">
                                    <Label>Clinic</Label>
                                    <Select value={clinicId} onValueChange={setClinicId} disabled={loadingClinics}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingClinics ? "Loading clinics..." : "Select clinic"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clinics.map(c => (
                                                <SelectItem key={c.clinic_id} value={c.clinic_id}>
                                                    {c.clinic_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Doctor */}
                                <div className="grid gap-2">
                                    <Label>Doctor</Label>
                                    <Select value={doctorId} onValueChange={setDoctorId} disabled={!clinicId || loadingDoctors}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!clinicId ? "Select clinic first" : (loadingDoctors ? "Loading doctors..." : "Select doctor")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map(d => (
                                                <SelectItem key={d.user_id} value={d.user_id}>
                                                    {d.name} ({d.specialization ?? "N/A"})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Service Type */}
                                <div className="grid gap-2">
                                    <Label>Service Type</Label>
                                    <Select
                                        value={serviceType}
                                        onValueChange={setServiceType}
                                        disabled={!selectedDoctor}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={!selectedDoctor ? "Select doctor first" : "Select service"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableServices.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date */}
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => {
                                            setDate(e.target.value);
                                            setTimeStart("");
                                        }}
                                        min={minBookingDate}
                                    />
                                </div>

                                {/* Time Slot */}
                                <div className="grid gap-2">
                                    <Label>Time</Label>
                                    <Select value={timeStart} onValueChange={setTimeStart} disabled={loadingSlots || !doctorId || !date}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!doctorId || !date ? "Select doctor and date" : (loadingSlots ? "Loading slots..." : (slots.length ? "Select a time" : "No slots available"))} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {slots.map((s) => (
                                                <SelectItem key={`${s.start}-${s.end}`} value={s.start}>
                                                    {formatTimeRange(s.start, s.end)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Book Appointment"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </section>

                {/* My Appointments */}
                <section className="px-6 py-10 max-w-5xl mx-auto w-full">
                    <Card className="shadow-lg rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <ClipboardList className="w-6 h-6" /> My Appointments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingAppointments ? (
                                <div className="flex justify-center py-6 text-gray-500">
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading appointments...
                                </div>
                            ) : appointments.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No appointments yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm border border-gray-200 rounded-md">
                                        <thead className="bg-green-100 text-green-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Clinic</th>
                                                <th className="px-4 py-2 text-left">Doctor</th>
                                                <th className="px-4 py-2 text-left">Date</th>
                                                <th className="px-4 py-2 text-left">Time</th>
                                                <th className="px-4 py-2 text-left">Status</th>
                                                <th className="px-4 py-2 text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointments.map((a) => (
                                                <tr key={a.id} className="border-t hover:bg-green-50 transition">
                                                    <td className="px-4 py-2">{a.clinic}</td>
                                                    <td className="px-4 py-2">{a.doctor}</td>
                                                    <td className="px-4 py-2">{a.date}</td>
                                                    <td className="px-4 py-2">{formatTimeRange(a.timeStart, a.timeEnd)}</td>
                                                    <td className="px-4 py-2 capitalize">{a.status}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openRescheduleDialog(a)}
                                                                disabled={
                                                                    ![
                                                                        "Pending",
                                                                        "Approved",
                                                                        "Moved",
                                                                    ].includes(a.status)
                                                                }
                                                            >
                                                                Reschedule
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleCancelAppointment(a)}
                                                                disabled={
                                                                    cancellingId === a.id ||
                                                                    ![
                                                                        "Pending",
                                                                        "Approved",
                                                                        "Moved",
                                                                    ].includes(a.status)
                                                                }
                                                            >
                                                                {cancellingId === a.id ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                                        Cancelling
                                                                    </>
                                                                ) : (
                                                                    "Cancel"
                                                                )}
                                                            </Button>
                                                        </div>
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

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Patient Panel
                </footer>
            </main>

            <Dialog
                open={rescheduleDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeRescheduleDialog();
                    }
                }}
            >
                <DialogContent className="rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                        <DialogDescription>
                            {selectedAppointment
                                ? `Clinic: ${selectedAppointment.clinic} · Doctor: ${selectedAppointment.doctor}`
                                : "Choose a new date and time for your appointment."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label>New Date</Label>
                            <Input
                                type="date"
                                value={rescheduleDate}
                                onChange={(e) => {
                                    setRescheduleDate(e.target.value);
                                    setRescheduleTimeStart("");
                                }}
                                min={minBookingDate}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>New Time</Label>
                            <Select
                                value={rescheduleTimeStart}
                                onValueChange={setRescheduleTimeStart}
                                disabled={
                                    !rescheduleDate || loadingRescheduleSlots || rescheduleSlots.length === 0
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            !rescheduleDate
                                                ? "Select date first"
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
                        <p className="text-sm text-muted-foreground">
                            Appointments can be moved to dates at least three days ahead.
                        </p>
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={rescheduling || !selectedRescheduleSlot}
                            >
                                {rescheduling ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
