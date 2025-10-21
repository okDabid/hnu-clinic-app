"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, BadgeCheck, Loader2, RefreshCcw, Search, Stethoscope, Users2 } from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatManilaDateTime } from "@/lib/time";
import { BLOOD_TYPES } from "@/lib/patient-records-update";

import DoctorPatientsLoading from "./loading";

type PatientRecord = {
    id: string;
    userId: string;
    patientId: string;
    fullName: string;
    patientType: "Student" | "Employee";
    gender: string | null;
    date_of_birth: string | null;
    status: string;
    appointment_id: string | null;
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
    latestAppointment: {
        id: string;
        timestart: string | null;
        timeend: string | null;
        doctor: {
            id: string;
            username: string;
            fullName: string | null;
        } | null;
        consultation: {
            id: string;
            reason_of_visit: string | null;
            findings: string | null;
            diagnosis: string | null;
            updatedAt: string | null;
            doctor: {
                id: string;
                username: string;
                fullName: string | null;
            } | null;
            nurse: {
                id: string;
                username: string;
                fullName: string | null;
            } | null;
        } | null;
    } | null;
};

function formatDateOnly(value: string | null | undefined) {
    if (!value) return "—";
    const formatted = formatManilaDateTime(value, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: undefined,
        minute: undefined,
    });
    return formatted || "—";
}

function formatAppointmentWindow(appointment: PatientRecord["latestAppointment"]): string {
    if (!appointment?.timestart) return "";
    const start = formatManilaDateTime(appointment.timestart);
    const end = appointment.timeend
        ? formatManilaDateTime(appointment.timeend, {
            year: undefined,
            month: undefined,
            day: undefined,
        })
        : null;

    if (start && end) {
        return `${start} – ${end}`;
    }

    return start || "";
}

const bloodTypeLabels: Record<(typeof BLOOD_TYPES)[number], string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
};

const departmentTypeLabels: Record<string, string> = {
    EDUCATION: "College of Education",
    ARTS_AND_SCIENCES: "College of Arts and Sciences",
    BUSINESS_AND_ACCOUNTANCY: "College of Business and Accountancy",
    ENGINEERING_AND_COMPUTER_STUDIES: "College of Engineering and Computer Studies",
    HEALTH_SCIENCES: "College of Health Sciences",
    LAW: "College of Law",
    BASIC_EDUCATION: "Basic Education Department",
};

const yearTypeLabels: Record<string, string> = {
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

function humanizeEnumValue(value: string) {
    const normalized = value.replace(/_/g, " ").trim();
    return normalized
        .split(" ")
        .map((word) => {
            if (word.length <= 3 && word === word.toUpperCase()) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}

function formatDeptTypes(value: string | null | undefined) {
    if (!value) return "—";
    if (departmentTypeLabels[value]) return departmentTypeLabels[value];
    if (/^[A-Z0-9_]+$/.test(value)) {
        return humanizeEnumValue(value);
    }
    return value;
}

function formatYearTypes(value: string | null | undefined) {
    if (!value) return "—";
    if (yearTypeLabels[value]) return yearTypeLabels[value];
    if (/^[A-Z0-9_]+$/.test(value)) {
        return humanizeEnumValue(value);
    }
    return value;
}

function formatBloodType(value: string | null | undefined) {
    if (!value) return "—";
    return bloodTypeLabels[value as (typeof BLOOD_TYPES)[number]] ?? value;
}

function formatStaffName(staff?: { fullName: string | null; username: string } | null) {
    if (!staff) return "—";
    return staff.fullName || staff.username || "—";
}

const PATIENT_STATUS_CLASSES: Record<string, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    inactive: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function DoctorPatientsPage() {
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [appointmentFilter, setAppointmentFilter] = useState("All");
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [updatingPatientId, setUpdatingPatientId] = useState<string | null>(null);
    const [savingNotesPatientId, setSavingNotesPatientId] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
    const [activeTab, setActiveTab] = useState<"details" | "update" | "notes">("details");

    const loadRecords = useCallback(async () => {
        try {
            setLoadingRecords(true);
            const res = await fetch("/api/doctor/patients", { cache: "no-store" });
            if (!res.ok) {
                const error = await res.json().catch(() => null);
                throw new Error(error?.error || "Failed to load records");
            }

            const data = (await res.json()) as PatientRecord[];
            setRecords(data);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to load patient records");
        } finally {
            setLoadingRecords(false);
            setInitializing(false);
        }
    }, []);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    useEffect(() => {
        if (!selectedRecord) return;
        const latest = records.find((record) => record.id === selectedRecord.id);
        if (latest && latest !== selectedRecord) {
            setSelectedRecord(latest);
        }
    }, [records, selectedRecord]);

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const query = search.toLowerCase();
            const matchesSearch = [
                record.fullName,
                record.patientId,
                record.patientType,
                record.contactno ?? "",
                record.address ?? "",
                record.department ?? "",
                record.program ?? "",
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query));

            const matchesStatus = statusFilter === "All" || record.status === statusFilter;
            const matchesType = typeFilter === "All" || record.patientType === typeFilter;
            const matchesAppointment =
                appointmentFilter === "All" ||
                (appointmentFilter === "With" && record.latestAppointment) ||
                (appointmentFilter === "Without" && !record.latestAppointment);

            return matchesSearch && matchesStatus && matchesType && matchesAppointment;
        });
    }, [appointmentFilter, records, search, statusFilter, typeFilter]);

    const totalPatients = records.length;
    const withAppointments = useMemo(
        () => records.filter((record) => Boolean(record.latestAppointment)).length,
        [records]
    );
    const withoutAppointments = totalPatients - withAppointments;

    function openDetails(record: PatientRecord, tab: "details" | "update" | "notes" = "details") {
        setSelectedRecord(record);
        setActiveTab(tab);
        setDetailOpen(true);
    }

    function closeDetails() {
        setDetailOpen(false);
        setSelectedRecord(null);
        setActiveTab("details");
    }

    async function handleUpdateInfo(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedRecord) return;

        setUpdatingPatientId(selectedRecord.id);
        const form = event.currentTarget;
        const payload = {
            type: selectedRecord.patientType,
            medical_cond: (form.elements.namedItem("medical_cond") as HTMLInputElement)?.value,
            allergies: (form.elements.namedItem("allergies") as HTMLInputElement)?.value,
        };

        try {
            const res = await fetch(`/api/doctor/patients/${selectedRecord.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Patient information updated");
                await loadRecords();
            } else {
                const error = await res.json().catch(() => null);
                toast.error(error?.error ?? "Failed to update patient info");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update patient info");
        } finally {
            setUpdatingPatientId(null);
        }
    }

    async function handleSaveNotes(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedRecord?.latestAppointment?.id) {
            toast.error("No appointment available for notes");
            return;
        }

        setSavingNotesPatientId(selectedRecord.id);
        const form = event.currentTarget;
        const body = {
            appointment_id: selectedRecord.latestAppointment.id,
            reason_of_visit: (form.elements.namedItem("reason_of_visit") as HTMLInputElement)?.value,
            findings: (form.elements.namedItem("findings") as HTMLInputElement)?.value,
            diagnosis: (form.elements.namedItem("diagnosis") as HTMLInputElement)?.value,
        };

        try {
            const res = await fetch(`/api/doctor/patient-consultations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success("Consultation notes saved");
                form.reset();
                await loadRecords();
            } else {
                const error = await res.json().catch(() => null);
                toast.error(error?.error ?? "Failed to save consultation notes");
            }
        } finally {
            setSavingNotesPatientId(null);
        }
    }

    if (initializing) {
        return <DoctorPatientsLoading />;
    }

    return (
        <DoctorLayout
            title="Patient registry"
            description="Review medical records, follow up on clinic visits, and capture key notes for coordinated care."
            actions={
                <Button
                    variant="outline"
                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                    onClick={loadRecords}
                >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh records
                </Button>
            }
        >
            <div className="space-y-6">
                <section className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6">
                    <div className="grid gap-4 md:grid-cols-3">
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
                                    <p className="text-sm text-muted-foreground">Profiles ready for intake coordination</p>
                                </div>
                                <AlertCircle className="h-9 w-9 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold text-green-700">{withoutAppointments}</p>
                            </CardContent>
                        </Card>
                    </div>

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
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="Student">Students</SelectItem>
                                            <SelectItem value="Employee">Employees</SelectItem>
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
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Appointment link</Label>
                                    <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                                        <SelectTrigger className="rounded-xl border-green-200">
                                            <SelectValue placeholder="Appointments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="With">With appointment</SelectItem>
                                            <SelectItem value="Without">No appointment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Search records</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or ID"
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            className="rounded-xl border-green-200 pl-9"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">

                            {loadingRecords ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" /> Loading patient records...
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <p className="py-10 text-center text-muted-foreground">No patient records found.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table className="min-w-[900px] text-sm">
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
                                            {filteredRecords.map((record) => {
                                                const statusKey = record.status.toLowerCase();
                                                return (
                                                    <TableRow
                                                        key={record.id}
                                                        className="cursor-pointer text-sm transition hover:bg-green-50/60 focus-visible:bg-green-50/60"
                                                        onClick={() => openDetails(record)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter" || event.key === " ") {
                                                                event.preventDefault();
                                                                openDetails(record);
                                                            }
                                                        }}
                                                        tabIndex={0}
                                                        role="button"
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
                                                        <TableCell className="whitespace-pre-wrap text-muted-foreground">
                                                            {record.patientType === "Student" ? (
                                                                <>
                                                                    <span className="block font-medium text-foreground">
                                                                        {formatDeptTypes(record.department)}
                                                                    </span>
                                                                    <span className="block">{formatDeptTypes(record.program)}</span>
                                                                </>
                                                            ) : (
                                                                formatDeptTypes(record.department) || "—"
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={`rounded-full px-2 py-1 text-xs ${PATIENT_STATUS_CLASSES[statusKey] ??
                                                                    "border-slate-200 bg-slate-100 text-slate-700"
                                                                    }`}
                                                            >
                                                                {record.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="whitespace-pre-wrap">
                                                            {record.latestAppointment?.timestart ? (
                                                                <div className="flex flex-col">
                                                                    <span>{formatAppointmentWindow(record.latestAppointment)}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Doctor: {formatStaffName(record.latestAppointment.doctor)}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Nurse: {formatStaffName(record.latestAppointment.consultation?.nurse)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Dialog
                    open={detailOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeDetails();
                        }
                    }}
                >
                    <DialogContent className="rounded-3xl sm:max-w-3xl max-h-[80vh] overflow-y-auto sm:overflow-visible sm:max-h-none">
                        {selectedRecord ? (
                            <div className="space-y-6">
                                <DialogHeader>
                                    <DialogTitle className="text-xl text-green-700">Patient snapshot</DialogTitle>
                                    <DialogDescription className="text-sm text-muted-foreground">
                                        Contact details and clinical notes shared with the care team.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="rounded-2xl bg-green-50/70 p-4 text-green-700">
                                    <p className="text-lg font-semibold">{selectedRecord.fullName}</p>
                                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-green-500">Patient ID</p>
                                            <p className="font-medium text-green-700">{selectedRecord.patientId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-green-500">Type</p>
                                            <p className="font-medium text-green-700">{selectedRecord.patientType}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-green-500">Date of birth</p>
                                            <p className="font-medium text-green-700">{formatDateOnly(selectedRecord.date_of_birth)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-green-500">Gender</p>
                                            <p className="font-medium text-green-700">{selectedRecord.gender ?? "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                <Tabs
                                    value={activeTab}
                                    onValueChange={(value) => setActiveTab(value as "details" | "update" | "notes")}
                                    className="space-y-4"
                                >
                                    <div className="flex justify-center">
                                        <TabsList className="flex flex-wrap gap-2">
                                            <TabsTrigger value="details">Details</TabsTrigger>
                                            <TabsTrigger value="update">Update Info</TabsTrigger>
                                            <TabsTrigger value="notes">Consultation Notes</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="details" className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                            <p>
                                                <strong>Contact:</strong> {selectedRecord.contactno || "—"}
                                            </p>
                                            <p>
                                                <strong>Address:</strong> {selectedRecord.address || "—"}
                                            </p>
                                            <p>
                                                <strong>Blood Type:</strong> {formatBloodType(selectedRecord.bloodtype)}
                                            </p>
                                            <p>
                                                <strong>Allergies:</strong> {selectedRecord.allergies || "—"}
                                            </p>
                                            <p>
                                                <strong>Medical Conditions:</strong> {selectedRecord.medical_cond || "—"}
                                            </p>
                                            <p>
                                                <strong>Emergency:</strong> {selectedRecord.emergency?.name || "—"} (
                                                {selectedRecord.emergency?.relation || "—"}) – {selectedRecord.emergency?.num || "—"}
                                            </p>
                                            {selectedRecord.patientType === "Student" ? (
                                                <>
                                                    <p>
                                                        <strong>Department:</strong> {formatDeptTypes(selectedRecord.department)}
                                                    </p>
                                                    <p>
                                                        <strong>Program:</strong> {formatDeptTypes(selectedRecord.program)}
                                                    </p>
                                                    <p>
                                                        <strong>Year Level:</strong> {formatYearTypes(selectedRecord.year_level)}
                                                    </p>
                                                </>
                                            ) : null}
                                        </div>

                                        <Separator />

                                        <div className="space-y-3 text-sm">
                                            <h4 className="flex items-center gap-2 font-semibold text-green-600">
                                                <Stethoscope className="h-4 w-4" /> Latest appointment
                                            </h4>
                                            {selectedRecord.latestAppointment?.timestart ? (
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <p>
                                                        <strong>Schedule:</strong> {formatAppointmentWindow(selectedRecord.latestAppointment)}
                                                    </p>
                                                    <p>
                                                        <strong>Doctor:</strong> {formatStaffName(selectedRecord.latestAppointment.doctor)}
                                                    </p>
                                                    <p>
                                                        <strong>Nurse:</strong> {formatStaffName(selectedRecord.latestAppointment.consultation?.nurse)}
                                                    </p>
                                                    <p>
                                                        <strong>Appointment ID:</strong> {selectedRecord.latestAppointment.id}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground">No recent appointment on file.</p>
                                            )}

                                            {selectedRecord.latestAppointment?.consultation ? (
                                                <div className="space-y-1 rounded-md border bg-muted/40 p-3">
                                                    <p className="text-sm font-semibold text-green-600">Consultation Notes</p>
                                                    <p>
                                                        <strong>Reason:</strong> {selectedRecord.latestAppointment.consultation.reason_of_visit || "—"}
                                                    </p>
                                                    <p>
                                                        <strong>Findings:</strong> {selectedRecord.latestAppointment.consultation.findings || "—"}
                                                    </p>
                                                    <p>
                                                        <strong>Diagnosis:</strong> {selectedRecord.latestAppointment.consultation.diagnosis || "—"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Updated by {formatStaffName(selectedRecord.latestAppointment.consultation.doctor)} on
                                                        {" "}
                                                        {formatManilaDateTime(selectedRecord.latestAppointment.consultation.updatedAt) || "—"}
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="update" className="space-y-4">
                                        <form onSubmit={handleUpdateInfo} className="space-y-3">
                                            <div>
                                                <Label className="mb-1 block font-medium" htmlFor="medical_cond">
                                                    Medical Conditions
                                                </Label>
                                                <Input
                                                    id="medical_cond"
                                                    name="medical_cond"
                                                    defaultValue={selectedRecord.medical_cond || ""}
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-1 block font-medium" htmlFor="allergies">
                                                    Allergies
                                                </Label>
                                                <Input
                                                    id="allergies"
                                                    name="allergies"
                                                    defaultValue={selectedRecord.allergies || ""}
                                                    placeholder="e.g. Penicillin, Peanuts"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={updatingPatientId === selectedRecord.id}
                                                className="bg-green-600 text-white hover:bg-green-700"
                                            >
                                                {updatingPatientId === selectedRecord.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                                    </>
                                                ) : (
                                                    "Save info"
                                                )}
                                            </Button>
                                        </form>
                                    </TabsContent>

                                    <TabsContent value="notes" className="space-y-4">
                                        <form onSubmit={handleSaveNotes} className="space-y-3">
                                            {!selectedRecord.latestAppointment?.id ? (
                                                <p className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                                                    This patient has no active appointment. Approve or schedule one to record consultation notes.
                                                </p>
                                            ) : null}
                                            <div>
                                                <Label className="mb-1 block font-medium" htmlFor="reason_of_visit">
                                                    Reason of Visit
                                                </Label>
                                                <Input
                                                    id="reason_of_visit"
                                                    name="reason_of_visit"
                                                    defaultValue={selectedRecord.latestAppointment?.consultation?.reason_of_visit || ""}
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-1 block font-medium" htmlFor="findings">
                                                    Findings
                                                </Label>
                                                <Input
                                                    id="findings"
                                                    name="findings"
                                                    defaultValue={selectedRecord.latestAppointment?.consultation?.findings || ""}
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-1 block font-medium" htmlFor="diagnosis">
                                                    Diagnosis
                                                </Label>
                                                <Input
                                                    id="diagnosis"
                                                    name="diagnosis"
                                                    defaultValue={selectedRecord.latestAppointment?.consultation?.diagnosis || ""}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    savingNotesPatientId === selectedRecord.id ||
                                                    !selectedRecord.latestAppointment?.id
                                                }
                                                className="bg-green-600 text-white hover:bg-green-700"
                                            >
                                                {savingNotesPatientId === selectedRecord.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                                                    </>
                                                ) : !selectedRecord.latestAppointment?.id ? (
                                                    "No appointment"
                                                ) : (
                                                    "Save notes"
                                                )}
                                            </Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </div>
        </DoctorLayout>
    );
}
