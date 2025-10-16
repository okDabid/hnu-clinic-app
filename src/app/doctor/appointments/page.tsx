"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    CalendarDays,
    ClipboardCheck,
    Loader2,
    Check,
    XCircle,
    Move,
    MoreHorizontal,
    Trash2,
} from "lucide-react";
import DoctorLayout from "@/components/patient/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Appointment {
    id: string;
    patientName: string;
    date: string;
    time: string;
    status: string;
    clinic?: string;
    hasConsultation: boolean;
}

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionType, setActionType] = useState<"cancel" | "move" | null>(null);
    const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
    const [reason, setReason] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newTimeStart, setNewTimeStart] = useState("");
    const [newTimeEnd, setNewTimeEnd] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    async function loadAppointments() {
        try {
            setLoading(true);
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

    // Fetch appointments
    useEffect(() => {
        loadAppointments();
    }, []);

    const handleClearAppointments = () => {
        setAppointments([]);
        toast.info("Appointments cleared from view");
    };

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
        <DoctorLayout
            title="Appointment management"
            description="Oversee consultation requests, confirm schedules, and coordinate adjustments with patients."
            actions={
                <Button
                    variant="outline"
                    className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-100/70"
                    onClick={loadAppointments}
                >
                    Refresh list
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Appointments Section */}
                <section className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="rounded-3xl border border-emerald-100/70 bg-gradient-to-r from-emerald-100/70 via-white to-emerald-50/80 shadow-sm">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-base font-semibold text-emerald-700">
                                    Schedule snapshot
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {loading
                                        ? "Fetching the latest appointments..."
                                        : `You have ${appointments.length} appointment${appointments.length === 1 ? "" : "s"} in your queue.`}
                                </p>
                            </CardHeader>
                        </Card>
                        <Card className="rounded-3xl border border-emerald-100/70 bg-white/85 shadow-sm">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-base font-semibold text-emerald-700">
                                    Action reminder
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Approve or move requests within the day to keep students and employees informed ahead of their visit.
                                </p>
                            </CardHeader>
                        </Card>
                    </div>
                    <Card className="flex flex-col rounded-3xl border border-emerald-100/70 bg-white/85 shadow-sm">
                        <CardHeader className="flex flex-col gap-3 border-b border-emerald-100/70 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-emerald-700 sm:text-xl">
                                <CalendarDays className="h-6 w-6" /> Appointment queue
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 self-start rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-100/70"
                                onClick={handleClearAppointments}
                                disabled={appointments.length === 0}
                            >
                                <Trash2 className="h-4 w-4" /> Clear appointments
                            </Button>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col pt-4 text-sm text-muted-foreground">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" /> Loading appointments...
                                </div>
                            ) : appointments.length === 0 ? (
                                <p className="py-6 text-center">
                                    No appointments found.
                                </p>
                            ) : (
                                <div className="overflow-x-auto w-full">
                                    <table className="min-w-full border border-emerald-100 rounded-2xl overflow-hidden">
                                        <thead className="bg-emerald-100/80 text-emerald-700">
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
                                                    <tr key={appt.id} className="border-t border-emerald-50 hover:bg-emerald-50/70 transition">
                                                        <td className="px-4 py-2">{appt.patientName}</td>
                                                        <td className="px-4 py-2">{appt.date}</td>
                                                        <td className="px-4 py-2">{appt.time}</td>
                                                        <td className="px-4 py-2 capitalize">{appt.status}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            {["cancelled", "completed"].includes(statusLower) ? (
                                                                <span className="text-xs text-muted-foreground">No actions available</span>
                                                            ) : (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                                                                            <MoreHorizontal className="w-4 h-4" /> Manage
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-40 space-y-1">
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleApprove(appt.id)}
                                                                            disabled={["approved", "completed", "cancelled"].includes(statusLower)}
                                                                        >
                                                                            <Check className="mr-2 h-4 w-4 text-emerald-600" /> Approve
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleComplete(appt.id)}
                                                                            disabled={statusLower !== "approved" || !appt.hasConsultation}
                                                                        >
                                                                            <ClipboardCheck className="mr-2 h-4 w-4 text-emerald-600" /> Complete
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                setSelectedAppt(appt);
                                                                                setActionType("move");
                                                                                setDialogOpen(true);
                                                                            }}
                                                                            disabled={statusLower === "completed" || statusLower === "cancelled"}
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
                                                            )}
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
                                className="rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                onClick={handleActionSubmit}
                            >
                                Submit
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </DoctorLayout>
    );
}
