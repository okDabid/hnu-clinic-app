"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, CheckCircle2, Filter, RefreshCcw, XCircle } from "lucide-react";

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
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
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

    const groupedByDate = useMemo(() => {
        return filteredAppointments.reduce<Record<string, NurseAppointment[]>>((acc, appointment) => {
            if (!acc[appointment.date]) {
                acc[appointment.date] = [];
            }
            acc[appointment.date].push(appointment);
            return acc;
        }, {});
    }, [filteredAppointments]);

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
            description="Manage bookings with fast filters, status-aware badges, and calendar or list views."
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
                            Narrow down bookings by staff assignment and date range.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-primary">View mode</Label>
                                <div className="flex gap-2">
                                    <Button type="button" variant={viewMode === "list" ? "default" : "outline"} className="flex-1" onClick={() => setViewMode("list")}>List</Button>
                                    <Button type="button" variant={viewMode === "calendar" ? "default" : "outline"} className="flex-1" onClick={() => setViewMode("calendar")}>Calendar</Button>
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
                            <p className="text-sm text-muted-foreground">Use quick actions to keep front-desk flow moving.</p>
                        </div>
                        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                            {filteredAppointments.length} result{filteredAppointments.length === 1 ? "" : "s"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <p className="text-sm text-red-600">{error}</p>
                        ) : viewMode === "calendar" ? (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {Object.keys(groupedByDate).length === 0 ? (
                                    <p className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                        No appointments found for the selected filters.
                                    </p>
                                ) : (
                                    Object.entries(groupedByDate)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([date, dayAppointments]) => (
                                            <div key={date} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                                <p className="text-sm font-semibold text-primary">{date}</p>
                                                <p className="mb-3 text-xs text-muted-foreground">{dayAppointments.length} appointments</p>
                                                <div className="space-y-2">
                                                    {dayAppointments.slice(0, 4).map((appointment) => (
                                                        <div key={appointment.id} className="rounded-xl border border-border/70 bg-white p-2.5 text-xs">
                                                            <p className="font-medium text-foreground">{appointment.patientName}</p>
                                                            <p className="text-muted-foreground">{formatAppointmentWindow({ timestart: appointment.timestart, timeend: appointment.timeend })}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
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
                                                <TableHead className="min-w-45">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                        Loading appointments...
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredAppointments.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                        No appointments found for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedAppointments.map((appointment) => {
                                                    const st = (appointment.status || "").toLowerCase();
                                                    const isCancelled = st === "cancelled" || st === "canceled" || st.includes("cancel");
                                                    const isComplete = st.includes("complete");
                                                    const statusClass = isCancelled
                                                        ? "rounded-full border-red-300 bg-red-50 text-red-600"
                                                        : isComplete
                                                            ? "rounded-full border-emerald-300 bg-emerald-50 text-emerald-700"
                                                            : "rounded-full border-amber-300 bg-amber-50 text-amber-700";

                                                    return (
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
                                                                <Badge className={statusClass}>{humanizeEnumValue(appointment.status)}</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button size="sm" variant="outline" className="h-8">Reschedule</Button>
                                                                    <Button size="sm" variant="outline" className="h-8 text-emerald-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Check-in</Button>
                                                                    <Button size="sm" variant="ghost" className="h-8 text-red-600"><XCircle className="mr-1 h-3.5 w-3.5" />Cancel</Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <TablePagination
                                    currentPage={currentPage}
                                    totalItems={filteredAppointments.length}
                                    pageSize={pageSize}
                                    loading={loading}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </NurseLayout>
    );
}
