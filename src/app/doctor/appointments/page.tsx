"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    Menu,
    X,
    User,
    CalendarDays,
    ClipboardList,
    FileText,
    Stethoscope,
    Home,
    Loader2,
    Clock4,
    Check,
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
import { toast } from "sonner";

interface Appointment {
    id: string;
    patientName: string;
    date: string;
    time: string;
    status: string;
    clinic?: string;
}

export default function DoctorAppointmentsPage() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const fullName = session?.user?.name || "School Doctor";

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    // ✅ Fetch appointments for the doctor
    useEffect(() => {
        async function fetchAppointments() {
            try {
                const res = await fetch("/api/doctor/appointments");
                if (!res.ok) throw new Error("Failed to fetch appointments");
                const data = await res.json();
                setAppointments(data);
            } catch (error) {
                console.error("Error fetching appointments:", error);
                toast.error("Failed to load appointments");
            } finally {
                setLoading(false);
            }
        }
        fetchAppointments();
    }, []);

    // ✅ Approve or cancel appointment
    async function handleAction(id: string, action: "approve" | "cancel") {
        try {
            const res = await fetch(`/api/doctor/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (!res.ok) throw new Error("Action failed");

            const updated = await res.json();
            setAppointments((prev) =>
                prev.map((appt) => (appt.id === id ? updated : appt))
            );

            toast.success(`Appointment ${action}d successfully`);
        } catch (err) {
            console.error(err);
            toast.error("Could not update appointment");
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
                        <FileText className="h-5 w-5" /> Medical Certificates
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Doctor Panel Dashboard</h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                >
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/account">Account</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/consultation">Consultation</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/appointments">Appointments</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/patients">Patients</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: "/login?logout=success" })}
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Intro */}
                <section className="px-6 py-8 bg-white shadow-sm">
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-green-600">
                            Appointments Management
                        </h2>
                        <p className="text-gray-700 mt-2">
                            Approve, move, or cancel appointments and view all scheduled patients.
                        </p>
                    </div>
                </section>

                {/* Table Section */}
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
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Loading appointments...
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
                                                <tr
                                                    key={appt.id}
                                                    className="border-t hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-4 py-2">{appt.patientName}</td>
                                                    <td className="px-4 py-2">{appt.date}</td>
                                                    <td className="px-4 py-2">{appt.time}</td>
                                                    <td className="px-4 py-2 capitalize">{appt.status}</td>
                                                    <td className="px-4 py-2 flex justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAction(appt.id, "approve")}
                                                            disabled={appt.status.toLowerCase() === "approved"}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleAction(appt.id, "cancel")}
                                                            disabled={appt.status.toLowerCase() === "cancelled"}
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

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}
