"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
    Menu,
    X,
    Home,
    User,
    CalendarDays,
    ClipboardList,
    FileText,
    Clock4,
    Loader2,
    Pill,
    Search,
    Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatManilaDateTime } from "@/lib/time";
import { BLOOD_TYPES } from "@/lib/patient-records-update";
import Image from "next/image";

type PatientRecord = {
    id: string;
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

export default function DoctorPatientsPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [updatingPatientId, setUpdatingPatientId] = useState<string | null>(null);
    const [savingNotesPatientId, setSavingNotesPatientId] = useState<string | null>(null);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

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
        }
    }, []);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

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

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [records, search, statusFilter, typeFilter]);

    const studentCount = useMemo(
        () => records.filter((record) => record.patientType === "Student").length,
        [records]
    );
    const employeeCount = useMemo(
        () => records.filter((record) => record.patientType === "Employee").length,
        [records]
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-green-50">
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-xl border-r p-6">
                {/* Logo Section */}
                <div className="flex items-center mb-12">
                    <Image
                        src="/clinic-illustration.svg"
                        alt="clinic-logo"
                        width={40}
                        height={40}
                        className="object-contain drop-shadow-sm"
                    />
                    <h1 className="text-2xl font-extrabold text-green-600 tracking-tight leading-none">
                        HNU Clinic
                    </h1>
                </div>
                <nav className="flex flex-col gap-2 text-gray-700">
                    <Link
                        href="/doctor"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link
                        href="/doctor/account"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <User className="h-5 w-5" /> Account
                    </Link>
                    <Link
                        href="/doctor/consultation"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Clock4 className="h-5 w-5" /> Consultation
                    </Link>
                    <Link
                        href="/doctor/appointments"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <CalendarDays className="h-5 w-5" /> Appointments
                    </Link>
                    <Link
                        href="/doctor/dispense"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Pill className="h-5 w-5" /> Dispense
                    </Link>
                    <Link
                        href="/doctor/patients"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200"
                    >
                        <ClipboardList className="h-5 w-5" /> Patients
                    </Link>
                    <Link
                        href="/doctor/certificates"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                        <FileText className="h-5 w-5" /> MedCerts
                    </Link>
                </nav>
                <Separator className="my-8" />
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 py-2"
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

            <main className="flex-1 flex flex-col">
                <header className="w-full bg-white shadow px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-lg sm:text-xl font-bold text-green-600">Patient Records</h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen((prev) => !prev)}>
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
                                    <Link href="/doctor/dispense">Dispense</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/certificates">MedCerts</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/patients">Patients</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <section className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-8">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Patients
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold text-green-600">{records.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Students
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold text-green-600">{studentCount}</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Employees
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold text-green-600">{employeeCount}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition flex flex-col">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg sm:text-xl font-semibold text-green-600">
                                Patient Directory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative w-full lg:max-w-sm">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search patients..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <div className="space-y-1 w-full sm:w-40">
                                        <Label htmlFor="status-filter" className="text-sm font-medium text-gray-600">
                                            Status
                                        </Label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger id="status-filter">
                                                <SelectValue placeholder="Filter status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Status</SelectItem>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1 w-full sm:w-40">
                                        <Label htmlFor="type-filter" className="text-sm font-medium text-gray-600">
                                            Patient Type
                                        </Label>
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger id="type-filter">
                                                <SelectValue placeholder="Filter type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Patients</SelectItem>
                                                <SelectItem value="Student">Student</SelectItem>
                                                <SelectItem value="Employee">Employee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {loadingRecords ? (
                                <div className="flex items-center justify-center py-12 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading patient records...
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">No patient records found.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table className="min-w-[900px] text-sm">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Patient ID</TableHead>
                                                <TableHead>Full Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Gender</TableHead>
                                                <TableHead>DOB</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="min-w-[160px]">Department / Program</TableHead>
                                                <TableHead>Latest Appointment</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRecords.map((record) => (
                                                <TableRow key={record.id} className="hover:bg-green-50">
                                                    <TableCell>{record.patientId}</TableCell>
                                                    <TableCell>{record.fullName}</TableCell>
                                                    <TableCell>{record.patientType}</TableCell>
                                                    <TableCell>{record.gender || "—"}</TableCell>
                                                    <TableCell>{formatDateOnly(record.date_of_birth)}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={record.status === "Active" ? "default" : "secondary"}
                                                            className={
                                                                record.status === "Active"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-gray-200 text-gray-600"
                                                            }
                                                        >
                                                            {record.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-pre-wrap text-muted-foreground">
                                                        {record.patientType === "Student" ? (
                                                            <>
                                                                <span className="block font-medium text-foreground">
                                                                    {formatDeptTypes(record.department)}
                                                                </span>
                                                                <span className="block">
                                                                    {formatDeptTypes(record.program)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-pre-wrap">
                                                        {record.latestAppointment?.timestart ? (
                                                            <>
                                                                <span className="block">
                                                                    {formatAppointmentWindow(record.latestAppointment)}
                                                                </span>
                                                                <span className="block text-xs text-muted-foreground">
                                                                    Doctor: {formatStaffName(record.latestAppointment.doctor)}
                                                                </span>
                                                                <span className="block text-xs text-muted-foreground">
                                                                    Nurse: {formatStaffName(record.latestAppointment.consultation?.nurse)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center whitespace-nowrap min-w-[90px] sm:min-w-[110px]">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white px-3 text-xs sm:text-sm">
                                                                    Manage
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-2xl sm:max-w-2xl w-[95vw] sm:w-auto rounded-lg p-4 sm:p-6 max-h-[85vh] sm:max-h-none overflow-y-auto">
                                                                <DialogHeader>
                                                                    <DialogTitle>{record.fullName}</DialogTitle>
                                                                    <DialogDescription>
                                                                        {record.patientType} patient record overview
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <Tabs defaultValue="details" className="space-y-4">
                                                                    <TabsList className="flex flex-wrap gap-2">
                                                                        <TabsTrigger value="details">Details</TabsTrigger>
                                                                        <TabsTrigger value="update">Update Info</TabsTrigger>
                                                                        <TabsTrigger value="notes">Consultation Notes</TabsTrigger>
                                                                    </TabsList>

                                                                    <TabsContent value="details" className="space-y-4">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                            <p><strong>Patient ID:</strong> {record.patientId}</p>
                                                                            <p><strong>Status:</strong> {record.status}</p>
                                                                            <p><strong>Gender:</strong> {record.gender || "—"}</p>
                                                                            <p><strong>DOB:</strong> {formatDateOnly(record.date_of_birth)}</p>
                                                                            <p><strong>Contact:</strong> {record.contactno || "—"}</p>
                                                                            <p><strong>Address:</strong> {record.address || "—"}</p>
                                                                            <p><strong>Blood Type:</strong> {formatBloodType(record.bloodtype)}</p>
                                                                            <p><strong>Allergies:</strong> {record.allergies || "—"}</p>
                                                                            <p><strong>Medical Conditions:</strong> {record.medical_cond || "—"}</p>
                                                                            <p>
                                                                                <strong>Emergency:</strong>{" "}
                                                                                {record.emergency?.name || "—"} ({record.emergency?.relation || "—"}) – {record.emergency?.num || "—"}
                                                                            </p>
                                                                            {record.patientType === "Student" && (
                                                                                <>
                                                                                    <p><strong>Department:</strong> {formatDeptTypes(record.department)}</p>
                                                                                    <p><strong>Program:</strong> {formatDeptTypes(record.program)}</p>
                                                                                    <p> <strong>Year Level:</strong> {formatYearTypes(record.year_level)}</p>
                                                                                </>
                                                                            )}
                                                                        </div>

                                                                        <Separator />

                                                                        <div className="space-y-3 text-sm">
                                                                            <h4 className="font-semibold text-green-600 flex items-center gap-2">
                                                                                <Stethoscope className="h-4 w-4" /> Latest Appointment
                                                                            </h4>
                                                                            {record.latestAppointment?.timestart ? (
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                    <p>
                                                                                        <strong>Schedule:</strong> {formatAppointmentWindow(record.latestAppointment)}
                                                                                    </p>
                                                                                    <p>
                                                                                        <strong>Doctor:</strong> {formatStaffName(record.latestAppointment.doctor)}
                                                                                    </p>
                                                                                    <p>
                                                                                        <strong>Nurse:</strong> {formatStaffName(record.latestAppointment.consultation?.nurse)}
                                                                                    </p>
                                                                                    <p>
                                                                                        <strong>Appointment ID:</strong> {record.latestAppointment.id}
                                                                                    </p>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-muted-foreground">No recent appointment on file.</p>
                                                                            )}

                                                                            {record.latestAppointment?.consultation && (
                                                                                <div className="rounded-md border bg-muted/40 p-3 space-y-1">
                                                                                    <p className="text-sm font-semibold text-green-600">Consultation Notes</p>
                                                                                    <p><strong>Reason:</strong> {record.latestAppointment.consultation.reason_of_visit || "—"}</p>
                                                                                    <p><strong>Findings:</strong> {record.latestAppointment.consultation.findings || "—"}</p>
                                                                                    <p><strong>Diagnosis:</strong> {record.latestAppointment.consultation.diagnosis || "—"}</p>
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        Updated by {formatStaffName(record.latestAppointment.consultation.doctor)} on {formatManilaDateTime(record.latestAppointment.consultation.updatedAt) || "—"}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TabsContent>

                                                                    <TabsContent value="update" className="space-y-4">
                                                                        <form
                                                                            onSubmit={async (event) => {
                                                                                event.preventDefault();
                                                                                setUpdatingPatientId(record.id);
                                                                                const form = event.currentTarget as HTMLFormElement;
                                                                                const payload = {
                                                                                    type: record.patientType,
                                                                                    medical_cond: (form.elements.namedItem("medical_cond") as HTMLInputElement)?.value,
                                                                                    allergies: (form.elements.namedItem("allergies") as HTMLInputElement)?.value,
                                                                                };

                                                                                try {
                                                                                    const res = await fetch(`/api/doctor/patients/${record.id}`, {
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
                                                                            }}
                                                                            className="space-y-3"
                                                                        >
                                                                            <div>
                                                                                <Label className="block mb-1 font-medium" htmlFor="medical_cond">Medical Conditions</Label>
                                                                                <Input
                                                                                    id="medical_cond"
                                                                                    name="medical_cond"
                                                                                    defaultValue={record.medical_cond || ""}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <Label className="block mb-1 font-medium" htmlFor="allergies">Allergies</Label>
                                                                                <Input
                                                                                    id="allergies"
                                                                                    name="allergies"
                                                                                    defaultValue={record.allergies || ""}
                                                                                    placeholder="e.g. Penicillin, Peanuts"
                                                                                />
                                                                            </div>
                                                                            <Button
                                                                                type="submit"
                                                                                disabled={updatingPatientId === record.id}
                                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                            >
                                                                                {updatingPatientId === record.id ? (
                                                                                    <>
                                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                                        Saving...
                                                                                    </>
                                                                                ) : (
                                                                                    "Save Info"
                                                                                )}
                                                                            </Button>
                                                                        </form>
                                                                    </TabsContent>

                                                                    <TabsContent value="notes" className="space-y-4">
                                                                        <form
                                                                            onSubmit={async (event) => {
                                                                                event.preventDefault();
                                                                                if (!record.latestAppointment?.id) {
                                                                                    toast.error("No appointment available for notes");
                                                                                    return;
                                                                                }

                                                                                setSavingNotesPatientId(record.id);
                                                                                const form = event.currentTarget as HTMLFormElement;
                                                                                const body = {
                                                                                    appointment_id: record.latestAppointment.id,
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
                                                                            }}
                                                                            className="space-y-3"
                                                                        >
                                                                            {!record.latestAppointment?.id && (
                                                                                <p className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                                                                    This patient has no active appointment. Approve or schedule one to record consultation notes.

                                                                                </p>
                                                                            )}
                                                                            <div>
                                                                                <Label className="block mb-1 font-medium" htmlFor="reason_of_visit">Reason of Visit</Label>
                                                                                <Input
                                                                                    id="reason_of_visit"
                                                                                    name="reason_of_visit"
                                                                                    defaultValue={record.latestAppointment?.consultation?.reason_of_visit || ""}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <Label className="block mb-1 font-medium" htmlFor="findings">Findings</Label>
                                                                                <Input
                                                                                    id="findings"
                                                                                    name="findings"
                                                                                    defaultValue={record.latestAppointment?.consultation?.findings || ""}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <Label className="block mb-1 font-medium" htmlFor="diagnosis">Diagnosis</Label>
                                                                                <Input
                                                                                    id="diagnosis"
                                                                                    name="diagnosis"
                                                                                    defaultValue={record.latestAppointment?.consultation?.diagnosis || ""}
                                                                                />
                                                                            </div>
                                                                            <Button
                                                                                type="submit"
                                                                                disabled={savingNotesPatientId === record.id || !record.latestAppointment?.id}
                                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                            >
                                                                                {savingNotesPatientId === record.id ? (
                                                                                    <>
                                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                                        Saving...
                                                                                    </>
                                                                                ) : !record.latestAppointment?.id ? (
                                                                                    "No appointment"
                                                                                ) : (
                                                                                    "Save Notes"
                                                                                )}
                                                                            </Button>
                                                                        </form>
                                                                    </TabsContent>
                                                                </Tabs>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto text-sm sm:text-base">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}