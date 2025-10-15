"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
    Menu,
    X,
    User,
    CalendarDays,
    ClipboardList,
    ClipboardCheck,
    FileText,
    Home,
    Loader2,
    Clock4,
    Check,
    XCircle,
    Move,
    MoreHorizontal,
    Pill,
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface Appointment {
    id: string;
    patientName: string;
    date: string;
    time: string;
    status: string;
    clinic?: string;
}

export default function DoctorAppointmentsPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionType, setActionType] = useState<"cancel" | "move" | null>(null);
    const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
    const [reason, setReason] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newTimeStart, setNewTimeStart] = useState("");
    const [newTimeEnd, setNewTimeEnd] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    // Fetch appointments
    useEffect(() => {
        async function fetchAppointments() {
            try {
                const res = await fetch("/api/doctor/appointments");
                if (!res.ok) throw new Error("Failed to fetch appointments");
                const data = await res.json();
                setAppointments(data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load appointments");
            } finally {
                setLoading(false);
            }
        }
        fetchAppointments();
    }, []);

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
            setAppointments((prev) =>
                prev.map((appt) => (appt.id === id ? data : appt))
            );
        } catch {
            toast.error("Failed to approve");
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
            setAppointments((prev) =>
                prev.map((appt) => (appt.id === id ? data : appt))
            );
        } catch {
            toast.error("Failed to complete appointment");
        }
    }

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
                setAppointments((prev) =>
                    prev.filter((appt) => appt.id !== selectedAppt.id)
                );
                toast.success("Appointment cancelled");
            } else if (actionType === "move") {
                const updated = await res.json();
                setAppointments((prev) =>
                    prev.map((appt) => (appt.id === selectedAppt.id ? updated : appt))
                );
                toast.success("Appointment moved");
            }
            setDialogOpen(false);
            setReason("");
            setNewDate("");
            setNewTimeStart("");
            setNewTimeEnd("");
        } catch (err) {
            console.error(err);
            toast.error("Action failed");
        }
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-green-50">
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
                    <Link
                        href="/doctor"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link
                        href="/doctor/account"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <User className="h-5 w-5" /> Account
                    </Link>
                    <Link
                        href="/doctor/consultation"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Clock4 className="h-5 w-5" /> Consultation
                    </Link>
                    <Link
                        href="/doctor/appointments"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200"
                    >
                        <CalendarDays className="h-5 w-5" /> Appointments
                    </Link>
                    <Link
                        href="/doctor/dispense"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Pill className="h-5 w-5" /> Dispense
                    </Link>
                    <Link
                        href="/doctor/patients"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <ClipboardList className="h-5 w-5" /> Patients
                    </Link>
                    <Link
                        href="/doctor/certificates"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                        <FileText className="h-5 w-5" /> MedCerts
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
                <header className="w-full bg-white shadow px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-lg sm:text-xl font-bold text-green-600">
                        Manage Appointments
                    </h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href="/doctor">Dashboard</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/account">Account</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/consultation">Consultation</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/appointments">Appointments</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/dispense">Dispense</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/patients">Patients</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/certificates">MedCerts</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Appointments Section */}
                <section className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-8">
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition flex flex-col">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2 text-green-600 text-lg sm:text-xl">
                                <CalendarDays className="w-6 h-6" /> All Scheduled Appointments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col pt-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-10 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading appointments...
                                </div>
                            ) : appointments.length === 0 ? (
                                <p className="text-gray-500 text-center py-6">
                                    No appointments found.
                                </p>
                            ) : (
                                <div className="overflow-x-auto w-full">
                                    <table className="min-w-full text-sm border border-gray-200 rounded-md">
                                        <thead className="bg-green-100 text-green-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Patient</th>
                                                <th className="px-4 py-2 text-left">Date</th>
                                                <th className="px-4 py-2 text-left">Time</th>
                                                <th className="px-4 py-2 text-left">Status</th>
                                                <th className="px-4 py-2 text-center">Manage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointments.map((appt) => {
                                                const statusLower = appt.status.toLowerCase();
                                                return (
                                                    <tr key={appt.id} className="border-t hover:bg-green-50 transition">
                                                        <td className="px-4 py-2">{appt.patientName}</td>
                                                        <td className="px-4 py-2">{appt.date}</td>
                                                        <td className="px-4 py-2">{appt.time}</td>
                                                        <td className="px-4 py-2 capitalize">{appt.status}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                                                                        <MoreHorizontal className="w-4 h-4" /> Manage
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40 space-y-1">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleApprove(appt.id)}
                                                                        disabled={["approved", "completed"].includes(statusLower)}
                                                                    >
                                                                        <Check className="w-4 h-4 mr-2 text-green-600" /> Approve
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleComplete(appt.id)}
                                                                        disabled={statusLower !== "approved"}
                                                                    >
                                                                        <ClipboardCheck className="w-4 h-4 mr-2 text-emerald-600" /> Complete
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedAppt(appt);
                                                                            setActionType("move");
                                                                            setDialogOpen(true);
                                                                        }}
                                                                        disabled={statusLower === "completed"}
                                                                    >
                                                                        <Move className="w-4 h-4 mr-2 text-blue-600" /> Move
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedAppt(appt);
                                                                            setActionType("cancel");
                                                                            setDialogOpen(true);
                                                                        }}
                                                                        className="text-red-600 focus:text-red-700"
                                                                        disabled={statusLower === "completed" || statusLower === "cancelled"}
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-2 text-red-600" /> Cancel
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="rounded-xl">
                        <DialogHeader>
                            <DialogTitle className="capitalize">{actionType} Appointment</DialogTitle>
                            <DialogDescription>
                                {actionType === "cancel"
                                    ? "Please provide a reason for cancellation."
                                    : "Provide new date, time, and reason for moving appointment."}
                            </DialogDescription>
                        </DialogHeader>

                        {actionType && (
                            <div className="space-y-4 mt-3">
                                {actionType === "move" && (
                                    <>
                                        <div>
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={newDate}
                                                onChange={(e) => setNewDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={newTimeStart}
                                                    onChange={(e) => setNewTimeStart(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label>End Time</Label>
                                                <Input
                                                    type="time"
                                                    value={newTimeEnd}
                                                    onChange={(e) => setNewTimeEnd(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <Label>Reason</Label>
                                    <Input
                                        placeholder="Enter reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="mt-4">
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleActionSubmit}
                            >
                                Submit
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto text-sm sm:text-base">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}
