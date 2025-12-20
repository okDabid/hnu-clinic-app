"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Filter, RefreshCcw } from "lucide-react";

import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatAppointmentWindow, humanizeEnumValue } from "@/lib/patient-format";

const STAFF_ROLES = [
    { label: "All staff", value: "all" },
    { label: "Doctors", value: "doctor" },
    { label: "Nurses", value: "nurse" },
    { label: "Scholars", value: "scholar" },
] as const;

type NurseAppointment = {
    id: string;
    date: string;
    timestart: string;
    timeend: string;
    status: string;
    clinic: string;
    staffRole: string;
    doctorName: string;
    nurseName: string | null;
    patientName: string;
    patientType: string;
    createdBy: { role: string; name: string } | null;
};

export default function NurseAppointmentsPage() {
    const [appointments, setAppointments] = useState<NurseAppointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [staffRole, setStaffRole] = useState<string>("all");
    const [date, setDate] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const filteredAppointments = useMemo(() => {
        const selectedRole = staffRole.toLowerCase();
        return appointments.filter((appointment) => {
            const matchesRole =
                selectedRole === "all" || appointment.staffRole.toLowerCase() === selectedRole;
            const matchesDate = !date || appointment.date === date;
            return matchesRole && matchesDate;
        });
    }, [appointments, date, staffRole]);

    async function fetchAppointments() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (staffRole && staffRole !== "all") params.set("staffRole", staffRole);
            if (date) params.set("date", date);
            const res = await fetch(`/api/nurse/appointments?${params.toString()}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to load appointments");
            const data: NurseAppointment[] = await res.json();
            setAppointments(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load appointments. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void fetchAppointments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <NurseLayout
            title="Appointments"
            description="View scheduled visits separately from the patient registry. Filter bookings by staff role or date."
            actions={
                <Button
                    variant="outline"
                    className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                    onClick={fetchAppointments}
                    disabled={loading}
                >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {loading ? "Refreshing..." : "Refresh list"}
                </Button>
            }
        >
            <div className="space-y-6">
                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl text-primary">Appointment filters</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Quickly narrow down bookings by staff assignment and date.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row md:items-end">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-primary">Staff role</Label>
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <select
                                        className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none"
                                        value={staffRole}
                                        onChange={(event) => setStaffRole(event.target.value)}
                                    >
                                        {STAFF_ROLES.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-primary">Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <Button className="md:self-end" onClick={fetchAppointments} disabled={loading}>
                                <CalendarClock className="mr-2 h-4 w-4" /> Apply filters
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                    <CardHeader className="flex items-start justify-between gap-3 md:items-center">
                        <div className="space-y-1">
                            <CardTitle className="text-xl text-primary">Scheduled bookings</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Manage appointments independently from patient records.
                            </p>
                        </div>
                        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                            {filteredAppointments.length} result{filteredAppointments.length === 1 ? "" : "s"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <p className="text-sm text-red-600">{error}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-full text-sm">
                                    <TableHeader>
                                        <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                                            <TableHead className="min-w-[160px]">Patient</TableHead>
                                            <TableHead className="min-w-[140px]">Type</TableHead>
                                            <TableHead className="min-w-[200px]">Schedule</TableHead>
                                            <TableHead className="min-w-[160px]">Clinic</TableHead>
                                            <TableHead className="min-w-[120px]">Staff role</TableHead>
                                            <TableHead className="min-w-[160px]">Assigned staff</TableHead>
                                            <TableHead className="min-w-[140px]">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                    Loading appointments...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredAppointments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                    No appointments found for the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAppointments.map((appointment) => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>{appointment.patientName}</TableCell>
                                                    <TableCell>{appointment.patientType}</TableCell>
                                                    <TableCell>
                                                        {formatAppointmentWindow({
                                                            timestart: appointment.timestart,
                                                            timeend: appointment.timeend,
                                                        })}
                                                    </TableCell>
                                                    <TableCell>{appointment.clinic}</TableCell>
                                                    <TableCell>{appointment.staffRole}</TableCell>
                                                    <TableCell>
                                                        {appointment.staffRole === "Nurse"
                                                            ? appointment.nurseName || "—"
                                                            : appointment.doctorName}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="rounded-full border-primary/30 bg-primary/10 text-primary">
                                                            {humanizeEnumValue(appointment.status)}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </NurseLayout>
    );
}
