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
    RefreshCw,
    XCircle,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatTimeRange } from "@/lib/time";
import Image from "next/image";

type Clinic = { clinic_id: string; clinic_name: string };
type Doctor = { user_id: string; name: string; specialization: "Physician" | "Dentist" | null };
type Slot = { start: string; end: string };
type Appointment = {
    id: string;
    clinicId: string;
    clinic: string;
    doctorId: string;
    doctor: string;
    doctorSpecialization: "Physician" | "Dentist" | null;
    dateISO: string;
    date: string;
    time: string;
    timeStart: string;
    timeEnd: string;
    status: string;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getManilaDateAfterDays(days: number): string {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const parts = formatter
        .formatToParts(new Date())
        .reduce<Record<string, string>>((acc, part) => {
            if (part.type !== "literal") acc[part.type] = part.value;
            return acc;
        }, {});

    const base = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+08:00`);
    base.setUTCDate(base.getUTCDate() + days);
    return base.toISOString().slice(0, 10);
}

function addDaysToISO(date: string, days: number): string {
    const base = new Date(`${date}T00:00:00+08:00`);
    base.setUTCDate(base.getUTCDate() + days);
    return base.toISOString().slice(0, 10);
}

function getManilaWeekdayIndex(date: string): number {
    const weekday = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "Asia/Manila",
    }).format(new Date(`${date}T00:00:00+08:00`));

    return WEEKDAY_LABELS.indexOf(weekday);
}

function isAllowedClinicDay(date: string, specialization: Doctor["specialization"] | null): boolean {
    const idx = getManilaWeekdayIndex(date);
    if (idx === -1) return false;
    const allowed = specialization === "Dentist" ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
    return allowed.includes(idx);
}

function nextAllowedDate(date: string, specialization: Doctor["specialization"] | null): string {
    let candidate = date;
    for (let i = 0; i < 7; i += 1) {
        if (isAllowedClinicDay(candidate, specialization)) return candidate;
        candidate = addDaysToISO(candidate, 1);
    }
    return date;
}

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
    const [minBookingDate] = useState<string>(getManilaDateAfterDays(3));

    // My appointments
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

    // Reschedule dialog state
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState<string>("");
    const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
    const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
    const [rescheduleTimeStart, setRescheduleTimeStart] = useState<string>("");
    const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

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

    // Load doctors when clinic changes
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

    const selectedDoctor = useMemo(
        () => doctors.find((d) => d.user_id === doctorId) || null,
        [doctorId, doctors]
    );

    useEffect(() => {
        setServiceType("");
        setDate("");
        setTimeStart("");
        setSlots([]);
    }, [doctorId]);

    // Load slots for booking
    useEffect(() => {
        if (!clinicId || !doctorId || !date) {
            setSlots([]);
            setTimeStart("");
            return;
        }

        if (!isAllowedClinicDay(date, selectedDoctor?.specialization ?? null)) {
            toast.error(
                selectedDoctor?.specialization === "Dentist"
                    ? "Dentists accept appointments Monday to Saturday."
                    : "Physicians accept appointments Monday to Friday."
            );
            setSlots([]);
            setTimeStart("");
            return;
        }

        (async () => {
            try {
                setLoadingSlots(true);
                const params = new URLSearchParams({
                    clinic_id: clinicId,
                    doctor_user_id: doctorId,
                    date,
                });
                const res = await fetch(`/api/meta/doctor-availability?${params}`);
                const data = await res.json();
                setSlots(data?.slots || []);
                setTimeStart("");
            } catch {
                toast.error("Failed to load available slots");
            } finally {
                setLoadingSlots(false);
            }
        })();
    }, [clinicId, doctorId, date, selectedDoctor?.specialization]);

    const selectedSlot = useMemo(
        () => slots.find((s) => s.start === timeStart) || null,
        [slots, timeStart]
    );

    // Dynamic service options
    const availableServices = useMemo(() => {
        if (!selectedDoctor?.specialization) return [];

        if (selectedDoctor.specialization === "Physician") {
            return [
                { label: "Physical examinations", value: "Assessment-physical" },
                { label: "Consultations", value: "Consultation-general" },
                { label: "Medical certificate issuance", value: "Consultation-cert" },
            ];
        }

        return [
            { label: "Consultations and examinations", value: "Dental-consult" },
            { label: "Oral prophylaxis", value: "Dental-cleaning" },
            { label: "Tooth extractions", value: "Dental-extraction" },
            { label: "Dental certificate issuance", value: "Dental-cert" },
        ];
    }, [selectedDoctor]);

    function getEnumValue(v: string): string {
        if (v.startsWith("Consultation")) return "Consultation";
        if (v.startsWith("Dental")) return "Dental";
        if (v.startsWith("Assessment")) return "Assessment";
        return "Other";
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!clinicId || !doctorId || !serviceType || !date || !selectedSlot) {
            toast.error("Please complete all fields");
            return;
        }

        if (date < minBookingDate) {
            toast.error("Appointments must be at least 3 days in advance");
            return;
        }

        if (!isAllowedClinicDay(date, selectedDoctor?.specialization ?? null)) {
            toast.error("Selected date is outside the doctor's duty days");
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

    async function loadAppointments() {
        try {
            setLoadingAppointments(true);
            const res = await fetch("/api/patient/appointments");
            if (!res.ok) throw new Error("Failed to load appointments");
            const data = await res.json();
            setAppointments(data);
        } catch {
            toast.error("Could not load your appointments");
        } finally {
            setLoadingAppointments(false);
        }
    }

    useEffect(() => {
        loadAppointments();
    }, []);

    // Reschedule slot loader
    const rescheduleSpecialization = rescheduleAppointment?.doctorSpecialization ?? null;

    useEffect(() => {
        if (!rescheduleAppointment || !rescheduleDate) {
            setRescheduleSlots([]);
            setRescheduleTimeStart("");
            return;
        }

        if (!isAllowedClinicDay(rescheduleDate, rescheduleSpecialization)) {
            setRescheduleSlots([]);
            setRescheduleTimeStart("");
            return;
        }

        (async () => {
            try {
                setLoadingRescheduleSlots(true);
                const params = new URLSearchParams({
                    clinic_id: rescheduleAppointment.clinicId,
                    doctor_user_id: rescheduleAppointment.doctorId,
                    date: rescheduleDate,
                });
                const res = await fetch(`/api/meta/doctor-availability?${params}`);
                const data = await res.json();
                setRescheduleSlots(data?.slots || []);
                if (!data?.slots?.some((slot: Slot) => slot.start === rescheduleTimeStart)) {
                    setRescheduleTimeStart("");
                }
            } catch {
                toast.error("Failed to load reschedule slots");
            } finally {
                setLoadingRescheduleSlots(false);
            }
        })();
    }, [rescheduleAppointment, rescheduleDate, rescheduleTimeStart, rescheduleSpecialization]);

    useEffect(() => {
        if (!rescheduleOpen) {
            setRescheduleAppointment(null);
            setRescheduleDate("");
            setRescheduleSlots([]);
            setRescheduleTimeStart("");
        }
    }, [rescheduleOpen]);

function openRescheduleDialog(appointment: Appointment) {
    const initialDate = appointment.dateISO >= minBookingDate ? appointment.dateISO : minBookingDate;
    const resolved = nextAllowedDate(initialDate, appointment.doctorSpecialization ?? null);
    setRescheduleDate(resolved);

    setRescheduleAppointment(appointment);
    setRescheduleTimeStart("");
    setRescheduleOpen(true);
}

    async function submitReschedule(e: React.FormEvent) {
        e.preventDefault();
        if (!rescheduleAppointment || !rescheduleDate || !rescheduleTimeStart) {
            toast.error("Please choose a date and time");
            return;
        }

        if (rescheduleDate < minBookingDate) {
            toast.error("Appointments must be at least 3 days in advance");
            return;
        }

        if (!isAllowedClinicDay(rescheduleDate, rescheduleSpecialization)) {
            toast.error("Selected date is outside the doctor's duty days");
            return;
        }

        const slot = rescheduleSlots.find((s) => s.start === rescheduleTimeStart);
        if (!slot) {
            toast.error("Selected time is no longer available");
            return;
        }

        try {
            setRescheduleSubmitting(true);
            const res = await fetch("/api/patient/appointments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointment_id: rescheduleAppointment.id,
                    date: rescheduleDate,
                    time_start: slot.start,
                    time_end: slot.end,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? "Unable to reschedule appointment");
                return;
            }

            toast.success("Appointment rescheduled");
            setRescheduleOpen(false);
            setRescheduleAppointment(null);
            loadAppointments();
        } catch {
            toast.error("Unable to reschedule appointment");
        } finally {
            setRescheduleSubmitting(false);
        }
    }

    async function cancelAppointment(appointment: Appointment) {
        if (!window.confirm("Cancel this appointment?")) return;

        try {
            setCancellingId(appointment.id);
            const res = await fetch("/api/patient/appointments", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointment_id: appointment.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.message ?? "Unable to cancel appointment");
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

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-xl border-r p-6">
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
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Book an Appointment</h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen((prev) => !prev)}>
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
                                <div className="grid gap-2">
                                    <Label>Clinic</Label>
                                    <Select value={clinicId} onValueChange={setClinicId} disabled={loadingClinics}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingClinics ? "Loading clinics..." : "Select clinic"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clinics.map((c) => (
                                                <SelectItem key={c.clinic_id} value={c.clinic_id}>
                                                    {c.clinic_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Doctor</Label>
                                    <Select value={doctorId} onValueChange={setDoctorId} disabled={!clinicId || loadingDoctors}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={!clinicId ? "Select clinic first" : loadingDoctors ? "Loading doctors..." : "Select doctor"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map((d) => (
                                                <SelectItem key={d.user_id} value={d.user_id}>
                                                    {d.name} ({d.specialization ?? "N/A"})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Service Type</Label>
                                    <Select value={serviceType} onValueChange={setServiceType} disabled={!selectedDoctor}>
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

                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value && value < minBookingDate) {
                                                toast.error("Appointments must be at least 3 days in advance");
                                            }
                                            setDate(value);
                                        }}
                                        min={minBookingDate}
                                        disabled={!selectedDoctor}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Time</Label>
                                    <Select
                                        value={timeStart}
                                        onValueChange={setTimeStart}
                                        disabled={loadingSlots || !doctorId || !date || slots.length === 0}
                                    >
                                        <SelectTrigger>
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
                                            {slots.map((s) => (
                                                <SelectItem key={`${s.start}-${s.end}`} value={s.start}>
                                                    {formatTimeRange(s.start, s.end)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>
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

                {/* Appointments */}
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
                                                    <td className="px-4 py-2">{a.time}</td>
                                                    <td className="px-4 py-2 capitalize">{a.status}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-1"
                                                                onClick={() => openRescheduleDialog(a)}
                                                                disabled={a.status !== "Pending" && a.status !== "Approved"}
                                                            >
                                                                <RefreshCw className="w-4 h-4" /> Reschedule
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="gap-1"
                                                                onClick={() => cancelAppointment(a)}
                                                                disabled={
                                                                    cancellingId === a.id ||
                                                                    (a.status !== "Pending" && a.status !== "Approved")
                                                                }
                                                            >
                                                                {cancellingId === a.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <XCircle className="w-4 h-4" />
                                                                )}
                                                                Cancel
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

            <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                <DialogContent className="rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                        <DialogDescription>Select a new date and time for your visit.</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={submitReschedule}>
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={rescheduleDate}
                                min={minBookingDate}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value < minBookingDate) {
                                        toast.error("Appointments must be at least 3 days in advance");
                                        setRescheduleDate(minBookingDate);
                                    } else {
                                        setRescheduleDate(value);
                                    }
                                }}
                                required
                            />
                        </div>

                        <div>
                            <Label>Time</Label>
                            <Select
                                value={rescheduleTimeStart}
                                onValueChange={setRescheduleTimeStart}
                                disabled={loadingRescheduleSlots || rescheduleSlots.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            loadingRescheduleSlots
                                                ? "Loading slots..."
                                                : rescheduleSlots.length
                                                    ? "Select a time"
                                                    : "No available slots"
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
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={rescheduleSubmitting}
                            >
                                {rescheduleSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Saving...
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
