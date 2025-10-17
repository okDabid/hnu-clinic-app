"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, BadgeCheck, HeartPulse, Loader2, RefreshCcw, Search, Users2 } from "lucide-react";

import ScholarLayout from "@/components/scholar/scholar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatManilaDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";

const DEPARTMENT_LABELS: Record<string, string> = {
    EDUCATION: "College of Education",
    ARTS_AND_SCIENCES: "College of Arts and Sciences",
    BUSINESS_AND_ACCOUNTANCY: "College of Business and Accountancy",
    ENGINEERING_AND_COMPUTER_STUDIES: "College of Engineering and Computer Studies",
    HEALTH_SCIENCES: "College of Health Sciences",
    LAW: "College of Law",
    BASIC_EDUCATION: "Basic Education Department",
};

const YEAR_LEVEL_LABELS: Record<string, string> = {
    FIRST_YEAR: "1st Year",
    SECOND_YEAR: "2nd Year",
    THIRD_YEAR: "3rd Year",
    FOURTH_YEAR: "4th Year",
    FIFTH_YEAR: "5th Year",
    KINDERGARTEN: "Kindergarten",
    ELEMENTARY: "Elementary",
    JUNIOR_HIGH: "Junior High School",
    SENIOR_HIGH: "Senior High School",
};

const BLOOD_TYPE_LABELS: Record<string, string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
};

type StaffSummary = {
    id: string;
    username: string;
    fullName: string | null;
};

type ConsultationSummary = {
    id: string;
    reason_of_visit: string | null;
    findings: string | null;
    diagnosis: string | null;
    updatedAt: string | null;
    doctor: StaffSummary | null;
    nurse: StaffSummary | null;
};

type PatientRecord = {
    id: string;
    userId: string;
    patientId: string;
    fullName: string;
    patientType: "Student" | "Employee";
    gender: string | null;
    date_of_birth: string | null;
    status: string;
    department?: string | null;
    program?: string | null;
    year_level?: string | null;
    contactno?: string | null;
    address?: string | null;
    bloodtype?: string | null;
    allergies?: string | null;
    medical_cond?: string | null;
    emergency?: {
        name?: string | null;
        num?: string | null;
        relation?: string | null;
    };
    appointment_id: string | null;
    latestAppointment: {
        id: string;
        timestart: string | null;
        timeend: string | null;
        doctor: StaffSummary | null;
        consultation: ConsultationSummary | null;
    } | null;
};

const PATIENT_STATUS_CLASSES: Record<string, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    inactive: "border-slate-200 bg-slate-100 text-slate-700",
};

function humanize(value: string | null | undefined) {
    if (!value) return "—";
    if (DEPARTMENT_LABELS[value]) return DEPARTMENT_LABELS[value];
    if (YEAR_LEVEL_LABELS[value]) return YEAR_LEVEL_LABELS[value];
    if (BLOOD_TYPE_LABELS[value]) return BLOOD_TYPE_LABELS[value];
    if (/^[A-Z0-9_]+$/.test(value)) {
        return value
            .toLowerCase()
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    return value;
}

function formatAppointmentWindow(appointment: PatientRecord["latestAppointment"]) {
    if (!appointment?.timestart) return "—";
    const start = formatManilaDateTime(appointment.timestart);
    const end = appointment.timeend
        ? formatManilaDateTime(appointment.timeend, {
            year: undefined,
            month: undefined,
            day: undefined,
        })
        : null;
    return end ? `${start} – ${end}` : start;
}

function formatStaffName(staff?: StaffSummary | null) {
    if (!staff) return "—";
    return staff.fullName || staff.username || "—";
}

function formatDOB(value: string | null | undefined) {
    if (!value) return "—";
    return formatManilaDateTime(value, {
        hour: undefined,
        minute: undefined,
    });
}

export default function ScholarPatientsPage() {
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [appointmentFilter, setAppointmentFilter] = useState("all");
    const [selected, setSelected] = useState<PatientRecord | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const loadRecords = useCallback(async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            query.set("type", "all");
            query.set("status", "all");
            const res = await fetch(`/api/scholar/patients?${query.toString()}`, { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to fetch patient list");
                return;
            }
            setRecords(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error("Unable to load patients");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    useEffect(() => {
        if (!detailOpen) {
            setSelected(null);
        }
    }, [detailOpen]);

    const searchTerm = search.trim().toLowerCase();

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            if (typeFilter !== "all" && record.patientType.toLowerCase() !== typeFilter) {
                return false;
            }
            if (statusFilter !== "all") {
                if (statusFilter === "active" && record.status.toLowerCase() !== "active") return false;
                if (statusFilter === "inactive" && record.status.toLowerCase() !== "inactive") return false;
            }
            if (appointmentFilter === "with" && !record.latestAppointment) return false;
            if (appointmentFilter === "without" && record.latestAppointment) return false;

            if (!searchTerm) return true;

            const haystack = [
                record.fullName,
                record.patientId,
                record.patientType,
                record.department,
                record.program,
                record.year_level,
                record.contactno,
                record.address,
                record.emergency?.name,
                record.emergency?.num,
                record.emergency?.relation,
                record.status,
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(searchTerm);
        });
    }, [appointmentFilter, records, searchTerm, statusFilter, typeFilter]);

    const totalPatients = records.length;
    const withAppointments = useMemo(
        () => records.filter((record) => Boolean(record.latestAppointment)).length,
        [records]
    );
    const withoutAppointments = totalPatients - withAppointments;

    function openDetails(record: PatientRecord) {
        setSelected(record);
        setDetailOpen(true);
    }

    function closeDetails() {
        setDetailOpen(false);
        setSelected(null);
    }

    return (
        <ScholarLayout
            title="Patient intake overview"
            description="Review student and employee profiles, confirm eligibility, and keep contact details ready for the care team."
            actions={
                <Button variant="outline" onClick={loadRecords} className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh records
                </Button>
            }
        >
            <div className="flex flex-col gap-6">
                <section className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">Total profiles</CardTitle>
                                <p className="text-sm text-muted-foreground">Student and employee records synced</p>
                            </div>
                            <Users2 className="h-9 w-9 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">{totalPatients}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">With appointments</CardTitle>
                                <p className="text-sm text-muted-foreground">Latest visit attached to the chart</p>
                            </div>
                            <BadgeCheck className="h-9 w-9 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">{withAppointments}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">No appointment yet</CardTitle>
                                <p className="text-sm text-muted-foreground">Students ready for intake coordination</p>
                            </div>
                            <AlertCircle className="h-9 w-9 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">{withoutAppointments}</p>
                        </CardContent>
                    </Card>
                </section>

                <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                    <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl text-green-700">Patient directory</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Filter student and employee details before handing off to nurses or doctors.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Patient type</Label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="student">Students</SelectItem>
                                        <SelectItem value="employee">Employees</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Account status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Appointment link</Label>
                                <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue placeholder="Appointment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="with">With appointment</SelectItem>
                                        <SelectItem value="without">No appointment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Search records</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, ID, or program"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="rounded-xl border-green-200 pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                                    <TableHead className="min-w-[200px]">Patient</TableHead>
                                    <TableHead className="min-w-[140px]">ID</TableHead>
                                    <TableHead className="min-w-[120px]">Type</TableHead>
                                    <TableHead className="min-w-[160px]">Program / Department</TableHead>
                                    <TableHead className="min-w-[120px]">Status</TableHead>
                                    <TableHead className="min-w-[200px]">Latest appointment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            <div className="flex items-center justify-center gap-2 text-sm">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Loading patient records...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            No patient records match your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecords.map((record) => {
                                        const statusKey = record.status.toLowerCase();
                                        return (
                                            <TableRow
                                                key={`${record.patientType}-${record.id}`}
                                                className="cursor-pointer text-sm transition hover:bg-green-50/60 focus-visible:bg-green-50/60"
                                                tabIndex={0}
                                                role="button"
                                                onClick={() => openDetails(record)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        event.preventDefault();
                                                        openDetails(record);
                                                    }
                                                }}
                                            >
                                                <TableCell className="font-medium text-green-700">
                                                    <div className="flex flex-col">
                                                        <span>{record.fullName}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {record.contactno ? record.contactno : "No contact number"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{record.patientId}</TableCell>
                                                <TableCell>
                                                    <Badge className="rounded-full border-green-200 bg-green-50 text-green-700">
                                                        {record.patientType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {record.patientType === "Student"
                                                        ? humanize(record.program) || "—"
                                                        : humanize(record.department) || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={cn(
                                                            "rounded-full px-2 py-1 text-xs",
                                                            PATIENT_STATUS_CLASSES[statusKey] ?? "border-slate-200 bg-slate-100 text-slate-700"
                                                        )}
                                                    >
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {record.latestAppointment ? (
                                                        <div className="flex flex-col">
                                                            <span>{formatAppointmentWindow(record.latestAppointment)}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                with {formatStaffName(record.latestAppointment.doctor)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="rounded-3xl sm:max-w-3xl max-h-[90vh] overflow-y-auto sm:overflow-visible sm:max-h-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-green-700">Patient snapshot</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Contact details and medical notes shared with the clinic team.
                        </DialogDescription>
                    </DialogHeader>
                    {selected ? (
                        <div className="space-y-6 text-sm">
                            <div className="rounded-2xl bg-green-50/70 p-4 text-green-700">
                                <p className="text-lg font-semibold">{selected.fullName}</p>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-green-500">Patient ID</p>
                                        <p className="font-medium text-green-700">{selected.patientId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-green-500">Type</p>
                                        <p className="font-medium text-green-700">{selected.patientType}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-green-500">Date of birth</p>
                                        <p className="font-medium text-green-700">{formatDOB(selected.date_of_birth)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-green-500">Gender</p>
                                        <p className="font-medium text-green-700">{selected.gender ?? "—"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-green-700">
                                        <Users2 className="h-4 w-4" /> Academic / department info
                                    </h4>
                                    <dl className="grid gap-2 text-muted-foreground">
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Program</dt>
                                            <dd>{humanize(selected.program)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Department</dt>
                                            <dd>{humanize(selected.department)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Year level</dt>
                                            <dd>{humanize(selected.year_level)}</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-green-700">
                                        <HeartPulse className="h-4 w-4" /> Medical details
                                    </h4>
                                    <dl className="grid gap-2 text-muted-foreground">
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Blood type</dt>
                                            <dd>{humanize(selected.bloodtype)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Allergies</dt>
                                            <dd>{selected.allergies || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Medical conditions</dt>
                                            <dd>{selected.medical_cond || "—"}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                                    <h4 className="text-sm font-semibold text-green-700">Contact information</h4>
                                    <dl className="grid gap-2 text-muted-foreground">
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Phone</dt>
                                            <dd>{selected.contactno || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Address</dt>
                                            <dd>{selected.address || "—"}</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                                    <h4 className="text-sm font-semibold text-green-700">Emergency contact</h4>
                                    <dl className="grid gap-2 text-muted-foreground">
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Name</dt>
                                            <dd>{selected.emergency?.name || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Relation</dt>
                                            <dd>{selected.emergency?.relation || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs uppercase tracking-wide">Contact number</dt>
                                            <dd>{selected.emergency?.num || "—"}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                                <h4 className="text-sm font-semibold text-green-700">Latest appointment</h4>
                                {selected.latestAppointment ? (
                                    <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide">Schedule</p>
                                            <p>{formatAppointmentWindow(selected.latestAppointment)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide">Doctor</p>
                                            <p>{formatStaffName(selected.latestAppointment.doctor)}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-xs uppercase tracking-wide">Consultation notes</p>
                                            <p>
                                                {selected.latestAppointment.consultation?.diagnosis ||
                                                    selected.latestAppointment.consultation?.findings ||
                                                    selected.latestAppointment.consultation?.reason_of_visit ||
                                                    "No notes provided"}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No appointment history attached yet.</p>
                                )}
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter className="mt-4">
                        <Button variant="outline" className="rounded-xl" onClick={closeDetails}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ScholarLayout>
    );
}
