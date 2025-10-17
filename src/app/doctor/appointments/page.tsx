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
import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentPanel } from "@/components/appointments/appointment-panel";
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
                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
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
                        <Card className="rounded-3xl border border-green-100/70 bg-gradient-to-r from-green-100/70 via-white to-green-50/80 shadow-sm">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-base font-semibold text-green-700">
                                    Schedule snapshot
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {loading
                                        ? "Fetching the latest appointments..."
                                        : `You have ${appointments.length} appointment${appointments.length === 1 ? "" : "s"} in your queue.`}
                                </p>
                            </CardHeader>
                        </Card>
                        <Card className="rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-base font-semibold text-green-700">
                                    Action reminder
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Approve or move requests within the day to keep students and employees informed ahead of their visit.
                                </p>
                            </CardHeader>
                        </Card>
                    </div>
                    <AppointmentPanel
                        icon={ClipboardCheck}
                        title="Appointment queue"
                        description="Review upcoming visits, confirm slots, or make quick adjustments for your patients."
                        actions={
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 self-start rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                                onClick={handleClearAppointments}
                                disabled={appointments.length === 0}
                            >
                                <Trash2 className="h-4 w-4" /> Clear appointments
                            </Button>
                        }
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" /> Loading appointments...
                            </div>
                        ) : appointments.length === 0 ? (
                            <p className="py-6 text-center">No appointments found.</p>
                        ) : (
                            <div className="space-y-3 text-sm text-muted-foreground">
                                {appointments.map((appointment) => (
                                    <Card
                                        key={appointment.id}
                                        className="rounded-2xl border border-green-100/70 bg-white/90 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                                    >
                                        <CardContent className="flex flex-col gap-4 py-4">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <h3 className="text-base font-semibold text-green-700">
                                                        {appointment.patientName}
                                                    </h3>
                                                    <p className="text-xs uppercase tracking-wide text-green-500">
                                                        {appointment.clinic ?? "Clinic assignment"}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={appointment.status === "Pending" ? "outline" : "default"}
                                                    className="rounded-full border-green-200 bg-green-50/70 px-3 py-1 text-xs font-semibold text-green-700"
                                                >
                                                    {appointment.status}
                                                </Badge>
                                            </div>

                                            <div className="grid gap-2 text-sm sm:grid-cols-2">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <CalendarDays className="h-4 w-4 text-green-600" />
                                                    <span>{appointment.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <ClipboardCheck className="h-4 w-4 text-green-600" />
                                                    <span>{appointment.time}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="rounded-full border-green-200 bg-green-50/70 text-green-700">
                                                    {appointment.hasConsultation ? "With consultation" : "Awaiting consultation"}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                                                    onClick={() => handleApprove(appointment.id)}
                                                >
                                                    <Check className="mr-2 h-4 w-4" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                                                    onClick={() => handleComplete(appointment.id)}
                                                >
                                                    <ClipboardCheck className="mr-2 h-4 w-4" /> Complete
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost" className="rounded-xl text-green-700 hover:bg-green-100/70">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-green-100">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setActionType("move");
                                                                setSelectedAppt(appointment);
                                                                setDialogOpen(true);
                                                                setReason("");
                                                                setNewDate("");
                                                                setNewTimeStart("");
                                                                setNewTimeEnd("");
                                                            }}
                                                        >
                                                            <Move className="mr-2 h-4 w-4" /> Move appointment
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setActionType("cancel");
                                                                setSelectedAppt(appointment);
                                                                setDialogOpen(true);
                                                                setReason("");
                                                            }}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" /> Cancel appointment
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </AppointmentPanel>
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
                                className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
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
