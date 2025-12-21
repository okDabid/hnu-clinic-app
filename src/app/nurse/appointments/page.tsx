"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, Filter, RefreshCcw } from "lucide-react";

import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatAppointmentWindow, humanizeEnumValue } from "@/lib/patient-format";
import { TablePagination } from "@/components/table-pagination";

const STAFF_ROLES = [
    { label: "All staff", value: "all" },
    { label: "Doctors", value: "doctor" },
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
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const filteredAppointments = useMemo(() => {
        const selectedRole = staffRole.toLowerCase();
        return appointments.filter((appointment) => {
            const matchesRole =
                selectedRole === "all" || appointment.staffRole.toLowerCase() === selectedRole;
            if (fromDate && appointment.date < fromDate) return false;
            if (toDate && appointment.date > toDate) return false;

            return matchesRole;
        });
    }, [appointments, fromDate, staffRole, toDate]);

    const paginatedAppointments = useMemo(
        () => filteredAppointments.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [currentPage, filteredAppointments, pageSize]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [staffRole, fromDate, toDate]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, filteredAppointments.length, pageSize]);

    async function fetchAppointments() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (staffRole && staffRole !== "all") params.set("staffRole", staffRole);
            if (fromDate) params.set("fromDate", fromDate);
            if (toDate) params.set("toDate", toDate);
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
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-xl text-primary">Appointment filters</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Quickly narrow down bookings by staff assignment and date.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-primary">Staff role</Label>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Select value={staffRole} onValueChange={setStaffRole}>
                                        <SelectTrigger className="w-full rounded-xl border-primary/30 pl-9">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STAFF_ROLES.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-primary">From date</Label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        max={toDate || undefined}
                                        onChange={(event) => setFromDate(event.target.value)}
                                        className="rounded-xl border-primary/30 pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-primary">To date</Label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        value={toDate}
                                        min={fromDate || undefined}
                                        onChange={(event) => setToDate(event.target.value)}
                                        className="rounded-xl border-primary/30 pl-9"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button className="w-full" onClick={fetchAppointments} disabled={loading}>
                                    <CalendarClock className="mr-2 h-4 w-4" /> Apply filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
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
                            <><div className="overflow-x-auto">
                                <Table className="min-w-full text-sm">
                                    <TableHeader>
                                        <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                                            <TableHead className="min-w-40">Patient</TableHead>
                                            <TableHead className="min-w-35">Type</TableHead>
                                            <TableHead className="min-w-50">Schedule</TableHead>
                                            <TableHead className="min-w-40">Clinic</TableHead>
                                            <TableHead className="min-w-30">Staff role</TableHead>
                                            <TableHead className="min-w-40">Assigned staff</TableHead>
                                            <TableHead className="min-w-35">Status</TableHead>
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
                                            paginatedAppointments.map((appointment) => (
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
                            </div><TablePagination
                                    currentPage={currentPage}
                                    totalItems={filteredAppointments.length}
                                    pageSize={pageSize}
                                    loading={loading}
                                    onPageChange={setCurrentPage} /></>
                        )}
                    </CardContent>
                </Card>
            </div>
        </NurseLayout>
    );
}
