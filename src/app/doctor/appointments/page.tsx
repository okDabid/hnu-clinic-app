"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
    id: string;
    patientName: string;
    date: string;
    time: string;
    status: "pending" | "approved" | "cancelled";
}

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAppointments() {
            try {
                const res = await fetch("/api/appointments");
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

    async function handleAction(id: string, action: "approve" | "cancel") {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
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
        } catch {
            toast.error("Could not update appointment");
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-green-50">
            {/* Header */}
            <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <h2 className="text-xl font-bold text-green-600">
                    Appointments Management
                </h2>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 py-10">
                <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2 mb-6">
                    <CalendarDays className="w-6 h-6" /> Appointments
                </h1>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-green-600">
                            All Scheduled Appointments
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
                                                <td className="px-4 py-2 capitalize">
                                                    {appt.status}
                                                </td>
                                                <td className="px-4 py-2 flex justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleAction(appt.id, "approve")
                                                        }
                                                        disabled={appt.status === "approved"}
                                                    >
                                                        <Check className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            handleAction(appt.id, "cancel")
                                                        }
                                                        disabled={appt.status === "cancelled"}
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
            </main>

            {/* Footer */}
            <footer className="bg-white py-6 text-center text-gray-600 mt-auto shadow-inner">
                © {new Date().getFullYear()} HNU Clinic – Doctor Panel
            </footer>
        </div>
    );
}
