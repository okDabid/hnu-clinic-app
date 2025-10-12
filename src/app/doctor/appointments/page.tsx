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
    FileText,
    Home,
    Loader2,
    Clock4,
    Check,
    XCircle,
    Move,
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format12Hour, formatTimeRange } from "@/lib/time";

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
            if (!res.ok) throw new Error("Approve failed");
            toast.success("Appointment approved");
            setAppointments((prev) =>
                prev.map((appt) =>
                    appt.id === id ? { ...appt, status: "Approved" } : appt
                )
            );
        } catch {
            toast.error("Failed to approve");
        }
    }

    async function handleActionSubmit() {
        if (!selectedAppt || !actionType) return;
        if (actionType === "cancel" && !reason.trim()) {
            toast.error("Please provide a reason");
            return;
        }
        if (actionType === "move" && (!reason.trim() || !newDate || !newTimeStart || !newTimeEnd)) {
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
                    prev.map((appt) =>
                        appt.id === selectedAppt.id ? updated : appt
                    )
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
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link href="/doctor" className="flex items-center gap-2 hover:text-green-600">
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link href="/doctor/account" className="flex items-center gap-2 hover:text-green-600">
                        <User className="h-5 w-5" /> Account
                    </Link>
                    <Link href="/doctor/consultation" className="flex items-center gap-2 hover:text-green-600">
                        <Clock4 className="h-5 w-5" /> Consultation
                    </Link>
                    <Link
                        href="/doctor/appointments"
                        className="flex items-center gap-2 text-green-600 font-semibold"
                    >
                        <CalendarDays className="h-5 w-5" /> Appointments
                    </Link>
                    <Link href="/doctor/patients" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Patients
                    </Link>
                    <Link href="/doctor/certificates" className="flex items-center gap-2 hover:text-green-600">
                        <FileText className="h-5 w-5" /> MedCerts
                    </Link>
                </nav>
                <Separator className="my-6" />
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
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
                    <h2 className="text-xl font-bold text-green-600">Manage Appointments</h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                        </DropdownMenu>
                    </div>
                </header>

                <section className="px-6 py-10 max-w-6xl mx-auto w-full">
                    <Card className="shadow-lg rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CalendarDays className="w-6 h-6" /> All Scheduled Appointments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-10 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading appointments...
                                </div>
                            ) : appointments.length === 0 ? (
                                <p className="text-gray-500 text-center py-6">
                                    No appointments found.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border border-gray-200 rounded-md">
                                        <thead className="bg-green-100 text-green-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Patient</th>
                                                <th className="px-4 py-2 text-left">Date</th>
                                                <th className="px-4 py-2 text-left">Time</th>
                                                <th className="px-4 py-2 text-left">Status</th>
                                                <th className="px-4 py-2 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointments.map((appt) => (
                                                <tr key={appt.id} className="border-t hover:bg-gray-50 transition">
                                                    <td className="px-4 py-2">{appt.patientName}</td>
                                                    <td className="px-4 py-2">{appt.date}</td>
                                                    <td className="px-4 py-2">{appt.time}</td>
                                                    <td className="px-4 py-2 capitalize">{appt.status}</td>
                                                    <td className="px-4 py-2 flex justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleApprove(appt.id)}
                                                            disabled={appt.status.toLowerCase() === "approved"}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedAppt(appt);
                                                                setActionType("move");
                                                                setDialogOpen(true);
                                                            }}
                                                        >
                                                            <Move className="w-4 h-4 mr-1" /> Move
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                setSelectedAppt(appt);
                                                                setActionType("cancel");
                                                                setDialogOpen(true);
                                                            }}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" /> Cancel
                                                        </Button>
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

                {/* Action Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="rounded-xl">
                        <DialogHeader>
                            <DialogTitle className="capitalize">
                                {actionType} Appointment
                            </DialogTitle>
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
                                        <div className="grid grid-cols-2 gap-4">
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

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}
