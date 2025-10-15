"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    Menu, X,
    Users,
    Package,
    Home,
    ClipboardList,
    Pill,
    Search,
    Loader2,
    Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { formatManilaDateTime } from "@/lib/time";
import { BLOOD_TYPES } from "@/lib/patient-records-update";

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

function formatAppointmentWindow(
    appointment: PatientRecord["latestAppointment"]
): string {
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

export default function NurseRecordsPage() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Separate loading states
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [savingData, setSavingData] = useState(false);

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
            const res = await fetch("/api/nurse/records", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to load records");
            const data = await res.json();
            setRecords(data);
        } catch {
            toast.error("Error loading records.");
        } finally {
            setLoadingRecords(false);
        }
    }, []);


    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return records.filter((r) => {
            const matchesSearch =
                r.fullName.toLowerCase().includes(term) ||
                r.patientId.toLowerCase().includes(term) ||
                r.patientType.toLowerCase().includes(term) ||
                (r.department ?? "").toLowerCase().includes(term) ||
                (r.program ?? "").toLowerCase().includes(term);

            const matchesStatus = statusFilter === "All" || r.status === statusFilter;
            const matchesType = typeFilter === "All" || r.patientType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [records, search, statusFilter, typeFilter]);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-green-50">
            {/* Sidebar */}
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

                {/* Navigation */}
                <nav className="flex flex-col gap-2 text-gray-700">
                    <Link
                        href="/nurse"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>

                    <Link
                        href="/nurse/accounts"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Users className="h-5 w-5" />
                        Accounts
                    </Link>

                    <Link
                        href="/nurse/inventory"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Package className="h-5 w-5" />
                        Inventory
                    </Link>

                    <Link
                        href="/nurse/clinic"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <ClipboardList className="h-5 w-5" />
                        Clinic
                    </Link>

                    <Link
                        href="/nurse/dispense"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Pill className="h-5 w-5" />
                        Dispense
                    </Link>

                    <Link
                        href="/nurse/records"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200"
                    >
                        <ClipboardList className="h-5 w-5" />
                        Records
                    </Link>
                </nav>

                {/* Spacer pushes logout to bottom */}
                <Separator className="my-8" />

                {/* Logout Button */}
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

            {/* Main */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-lg sm:text-xl font-bold text-green-600">Patient Records</h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                >
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href="/nurse">Dashboard</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/accounts">Accounts</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/inventory">Inventory</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/clinic">Clinic</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/dispense">Dispense</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/records">Records</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Content */}
                <section className="px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col space-y-8 max-w-7xl mx-auto w-full">
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition flex flex-col">
                        <CardHeader className="border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                Patient List
                            </CardTitle>
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                {/* Search */}
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search patients..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                {/* Status Filter */}
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full md:w-40">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Status</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                {/* Type Filter */}
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-full md:w-40">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Patients</SelectItem>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                            {loadingRecords ? (
                                <div className="flex items-center justify-center py-10 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Loading records...
                                </div>
                            ) : (
                                <div className="overflow-x-auto flex-1">
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
                                                <TableHead>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filtered.length > 0 ? (
                                                filtered.map((r) => (
                                                    <TableRow key={r.id} className="hover:bg-green-50 transition">
                                                        <TableCell>{r.patientId}</TableCell>
                                                        <TableCell>{r.fullName}</TableCell>
                                                        <TableCell>{r.patientType}</TableCell>
                                                        <TableCell>{r.gender || "—"}</TableCell>
                                                        <TableCell>{formatDateOnly(r.date_of_birth)}</TableCell>
                                                        <TableCell>{r.status}</TableCell>
                                                        <TableCell className="whitespace-pre-wrap text-muted-foreground">
                                                            {r.patientType === "Student" ? (
                                                                <>
                                                                    <span className="block font-medium text-foreground">
                                                                        {formatDeptTypes(r.department)}
                                                                    </span>
                                                                    <span className="block">
                                                                        {formatDeptTypes(r.program)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="whitespace-pre-wrap">
                                                            {r.latestAppointment?.timestart ? (
                                                                <>
                                                                    <span className="block">
                                                                        {formatAppointmentWindow(r.latestAppointment)}
                                                                    </span>
                                                                    <span className="block text-xs text-muted-foreground">
                                                                        Doctor: {formatStaffName(r.latestAppointment.doctor)}
                                                                    </span>
                                                                    <span className="block text-xs text-muted-foreground">
                                                                        Nurse: {formatStaffName(r.latestAppointment.consultation?.nurse)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap min-w-[90px] sm:min-w-[110px]">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700 text-white px-3 text-xs sm:text-sm"
                                                                    >
                                                                        Manage
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-2xl sm:max-w-2xl w-[95vw] sm:w-auto rounded-lg p-4 sm:p-6 max-h-[85vh] sm:max-h-none overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle>{r.fullName}</DialogTitle>
                                                                        <DialogDescription>
                                                                            {r.patientType} Patient Record
                                                                        </DialogDescription>
                                                                    </DialogHeader>

                                                                    {/* Tabs for clarity */}
                                                                    <Tabs defaultValue="details" className="space-y-4">
                                                                        <div className="flex justify-center">
                                                                            <TabsList className="flex flex-wrap gap-2">
                                                                                <TabsTrigger value="details">Details</TabsTrigger>
                                                                                <TabsTrigger value="update">Update Info</TabsTrigger>
                                                                                <TabsTrigger value="notes">Consultation Notes</TabsTrigger>
                                                                            </TabsList>
                                                                        </div>

                                                                        {/* 🧍 DETAILS TAB */}
                                                                        <TabsContent value="details" className="space-y-4">
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                                <p><strong>Patient ID:</strong> {r.patientId}</p>
                                                                                <p><strong>Status:</strong> {r.status}</p>
                                                                                <p><strong>Gender:</strong> {r.gender || "—"}</p>
                                                                                <p><strong>DOB:</strong> {formatDateOnly(r.date_of_birth)}</p>
                                                                                <p><strong>Contact:</strong> {r.contactno || "—"}</p>
                                                                                <p><strong>Address:</strong> {r.address || "—"}</p>
                                                                                <p><strong>Blood Type:</strong> {formatBloodType(r.bloodtype)}</p>
                                                                                <p><strong>Allergies:</strong> {r.allergies || "—"}</p>
                                                                                <p><strong>Medical Conditions:</strong> {r.medical_cond || "—"}</p>
                                                                                <p>
                                                                                    <strong>Emergency:</strong>{" "}
                                                                                    {r.emergency?.name || "—"} ({r.emergency?.relation || "—"}) – {r.emergency?.num || "—"}
                                                                                </p>
                                                                                {r.patientType === "Student" && (
                                                                                    <>
                                                                                        <p><strong>Department:</strong> {formatDeptTypes(r.department)}</p>
                                                                                        <p><strong>Program:</strong> {formatDeptTypes(r.program)}</p>
                                                                                        <p><strong>Year Level:</strong> {formatYearTypes(r.year_level)}</p>
                                                                                    </>
                                                                                )}
                                                                            </div>

                                                                            <Separator />

                                                                            <div className="space-y-3 text-sm">
                                                                                <h4 className="font-semibold text-green-600 flex items-center gap-2">
                                                                                    <Stethoscope className="h-4 w-4" /> Latest Appointment
                                                                                </h4>
                                                                                {r.latestAppointment?.timestart ? (
                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                        <p>
                                                                                            <strong>Schedule:</strong> {formatAppointmentWindow(r.latestAppointment)}
                                                                                        </p>
                                                                                        <p>
                                                                                            <strong>Doctor:</strong> {formatStaffName(r.latestAppointment.doctor)}
                                                                                        </p>
                                                                                        <p>
                                                                                            <strong>Nurse:</strong> {formatStaffName(r.latestAppointment.consultation?.nurse)}
                                                                                        </p>
                                                                                        <p>
                                                                                            <strong>Appointment ID:</strong> {r.latestAppointment.id}
                                                                                        </p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className="text-muted-foreground">No recent appointment on file.</p>
                                                                                )}

                                                                                {r.latestAppointment?.consultation && (
                                                                                    <div className="rounded-md border bg-muted/40 p-3 space-y-1">
                                                                                        <p className="text-sm font-semibold text-green-600">Consultation Notes</p>
                                                                                        <p><strong>Reason:</strong> {r.latestAppointment.consultation.reason_of_visit || "—"}</p>
                                                                                        <p><strong>Findings:</strong> {r.latestAppointment.consultation.findings || "—"}</p>
                                                                                        <p><strong>Diagnosis:</strong> {r.latestAppointment.consultation.diagnosis || "—"}</p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            Updated by {formatStaffName(r.latestAppointment.consultation.doctor)} on {formatManilaDateTime(r.latestAppointment.consultation.updatedAt) || "—"}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TabsContent>

                                                                        {/* 🩺 UPDATE INFO TAB */}
                                                                        <TabsContent value="update" className="space-y-4 pt-2">
                                                                            <form
                                                                                onSubmit={async (e) => {
                                                                                    e.preventDefault();
                                                                                    setSavingData(true);
                                                                                    const form = e.currentTarget as HTMLFormElement;
                                                                                    const body = {
                                                                                        type: r.patientType,
                                                                                        medical_cond: (
                                                                                            form.elements.namedItem("medical_cond") as HTMLInputElement
                                                                                        ).value,
                                                                                        allergies: (form.elements.namedItem("allergies") as HTMLInputElement
                                                                                        ).value,
                                                                                    };

                                                                                    const res = await fetch(`/api/nurse/records/${r.id}`, {
                                                                                        method: "PATCH",
                                                                                        headers: { "Content-Type": "application/json" },
                                                                                        body: JSON.stringify(body),
                                                                                    });

                                                                                    if (res.ok) {
                                                                                        toast.success("Medical condition updated");
                                                                                        await loadRecords();
                                                                                    } else {
                                                                                        toast.error("Failed to update condition");
                                                                                    }

                                                                                    setSavingData(false);
                                                                                }}
                                                                                className="space-y-3"
                                                                            >
                                                                                <div>
                                                                                    <Label className="block mb-1 font-medium" htmlFor="medical_cond">Medical Conditions</Label>
                                                                                    <Input
                                                                                        id="medical_cond"
                                                                                        name="medical_cond"
                                                                                        defaultValue={r.medical_cond || ""}
                                                                                    />
                                                                                </div>

                                                                                <div>
                                                                                    <Label className="block mb-1 font-medium" htmlFor="allergies">Allergies</Label>
                                                                                    <Input
                                                                                        id="allergies"
                                                                                        name="allergies"
                                                                                        defaultValue={r.allergies || ""}
                                                                                        placeholder="e.g. Penicillin, Peanuts"
                                                                                    />
                                                                                </div>
                                                                                <Button
                                                                                    type="submit"
                                                                                    disabled={savingData}
                                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                                >
                                                                                    {savingData ? (
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

                                                                        {/* 🧾 CONSULTATION NOTES TAB */}
                                                                        <TabsContent value="notes" className="space-y-4 pt-2">
                                                                            <form
                                                                                onSubmit={async (e) => {
                                                                                    e.preventDefault();
                                                                                    if (!session?.user?.id) {
                                                                                        toast.error("You must be signed in to save notes.");
                                                                                        return;
                                                                                    }

                                                                                    if (!r.latestAppointment?.id) {
                                                                                        toast.error("No scheduled appointment to attach these notes to.");
                                                                                        return;
                                                                                    }
                                                                                    setSavingData(true);
                                                                                    const form = e.currentTarget as HTMLFormElement;
                                                                                    const nurseId = session.user.id;
                                                                                    const body = {
                                                                                        appointment_id: r.latestAppointment.id,
                                                                                        nurse_user_id: nurseId,
                                                                                        reason_of_visit: (
                                                                                            form.elements.namedItem("reason_of_visit") as HTMLInputElement
                                                                                        ).value,
                                                                                        findings: (
                                                                                            form.elements.namedItem("findings") as HTMLInputElement
                                                                                        ).value,
                                                                                        diagnosis: (
                                                                                            form.elements.namedItem("diagnosis") as HTMLInputElement
                                                                                        ).value,
                                                                                    };

                                                                                    try {
                                                                                        const res = await fetch(`/api/nurse/consultations`, {
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
                                                                                            toast.error(error?.error ?? "Failed to save consultation");
                                                                                        }
                                                                                    } finally {
                                                                                        setSavingData(false);
                                                                                    }
                                                                                }}
                                                                                className="space-y-3"
                                                                            >
                                                                                {!r.latestAppointment?.id && (
                                                                                    <p className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                                                                        This patient has no active appointment. Schedule or approve an appointment to record consultation notes.
                                                                                    </p>
                                                                                )}
                                                                                <div>
                                                                                    <Label className="block mb-1 font-medium" htmlFor="reason_of_visit">Reason of Visit</Label>
                                                                                    <Input
                                                                                        id="reason_of_visit"
                                                                                        name="reason_of_visit"
                                                                                        defaultValue={r.latestAppointment?.consultation?.reason_of_visit || ""}
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="block mb-1 font-medium" htmlFor="findings">Findings</Label>
                                                                                    <Input
                                                                                        id="findings"
                                                                                        name="findings"
                                                                                        defaultValue={r.latestAppointment?.consultation?.findings || ""}
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="block mb-1 font-medium" htmlFor="diagnosis">Diagnosis</Label>
                                                                                    <Input
                                                                                        id="diagnosis"
                                                                                        name="diagnosis"
                                                                                        defaultValue={r.latestAppointment?.consultation?.diagnosis || ""}
                                                                                    />
                                                                                </div>
                                                                                <Button
                                                                                    type="submit"
                                                                                    disabled={savingData || !r.latestAppointment?.id}
                                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                                >
                                                                                    {savingData ? (
                                                                                        <>
                                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                                            Saving...
                                                                                        </>
                                                                                    ) : !r.latestAppointment?.id ? (
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
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={9}
                                                        className="text-center text-gray-500 py-6"
                                                    >
                                                        No patient records found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto text-sm sm:text-base">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
