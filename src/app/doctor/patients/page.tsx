"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { formatManilaDateTime } from "@/lib/time";

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

export default function DoctorPatientsPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    useEffect(() => {
        async function loadRecords() {
            try {
                setLoading(true);
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
                setLoading(false);
            }
        }

        loadRecords();
    }, []);

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const matchesSearch = [
                record.fullName,
                record.patientId,
                record.patientType,
                record.contactno ?? "",
                record.address ?? "",
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(search.toLowerCase()));

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
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link href="/doctor" className="flex items-center gap-2 hover:text-green-600">
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link href="/doctor/account" className="flex items-center gap-2 hover:text-green-600">
                        <User className="h-5 w-5" /> Account
                    </Link>
                    <Link href="/doctor/consultation" className="flex items-center gap-2 hover:text-green-600">
                        <Clock4 className="h-5 w-5" /> Consultation
                    </Link>
                    <Link href="/doctor/appointments" className="flex items-center gap-2 hover:text-green-600">
                        <CalendarDays className="h-5 w-5" /> Appointments
                    </Link>
                    <Link href="/doctor/dispense" className="flex items-center gap-2 hover:text-green-600">
                        <Pill className="h-5 w-5" /> Dispense
                    </Link>
                    <Link href="/doctor/certificates" className="flex items-center gap-2 hover:text-green-600">
                        <FileText className="h-5 w-5" /> MedCerts
                    </Link>
                    <Link
                        href="/doctor/patients"
                        className="flex items-center gap-2 text-green-600 font-semibold"
                    >
                        <ClipboardList className="h-5 w-5" /> Patients
                    </Link>
                </nav>
                <Separator className="my-6" />
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
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
                            <CardTitle className="text-lg sm:text-xl font-semibold text-green-600 flex items-center justify-between">
                                <span>Patient Directory</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                                <Input
                                    placeholder="Search patients..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="w-full sm:max-w-sm"
                                />
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="status-filter" className="text-sm font-medium text-gray-600">
                                            Status
                                        </Label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger id="status-filter" className="sm:w-40">
                                                <SelectValue placeholder="Filter status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All</SelectItem>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="type-filter" className="text-sm font-medium text-gray-600">
                                            Patient Type
                                        </Label>
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger id="type-filter" className="sm:w-40">
                                                <SelectValue placeholder="Filter type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All</SelectItem>
                                                <SelectItem value="Student">Student</SelectItem>
                                                <SelectItem value="Employee">Employee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading patient records...
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">No patient records found.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table className="min-w-full text-sm">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Patient ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Gender</TableHead>
                                                <TableHead>DOB</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Latest Appointment</TableHead>
                                                <TableHead className="text-center">Details</TableHead>
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
                                                    <TableCell>
                                                        {record.latestAppointment?.timestart
                                                            ? formatAppointmentWindow(record.latestAppointment)
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                                                    View
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-2xl">
                                                                <DialogHeader>
                                                                    <DialogTitle>{record.fullName}</DialogTitle>
                                                                    <DialogDescription>
                                                                        {record.patientType} patient record overview
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-6">
                                                                    <div>
                                                                        <h3 className="font-semibold text-green-600 mb-2">
                                                                            Personal Information
                                                                        </h3>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                            <p><strong>Patient ID:</strong> {record.patientId}</p>
                                                                            <p><strong>Status:</strong> {record.status}</p>
                                                                            <p><strong>Gender:</strong> {record.gender || "—"}</p>
                                                                            <p><strong>Date of Birth:</strong> {formatDateOnly(record.date_of_birth)}</p>
                                                                            <p><strong>Contact:</strong> {record.contactno || "—"}</p>
                                                                            <p><strong>Address:</strong> {record.address || "—"}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Separator />
                                                                    <div>
                                                                        <h3 className="font-semibold text-green-600 mb-2">Health Profile</h3>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                            <p><strong>Blood Type:</strong> {record.bloodtype || "—"}</p>
                                                                            <p><strong>Allergies:</strong> {record.allergies || "—"}</p>
                                                                            <p><strong>Medical Conditions:</strong> {record.medical_cond || "—"}</p>
                                                                            <p>
                                                                                <strong>Emergency Contact:</strong>{" "}
                                                                                {record.emergency?.name || "—"} ({record.emergency?.relation || "—"}) –{" "}
                                                                                {record.emergency?.num || "—"}
                                                                            </p>
                                                                        </div>
                                                                        {record.patientType === "Student" && (
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-3">
                                                                                <p><strong>Department:</strong> {record.department || "—"}</p>
                                                                                <p><strong>Program:</strong> {record.program || "—"}</p>
                                                                                <p><strong>Year Level:</strong> {record.year_level || "—"}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Separator />
                                                                    <div className="space-y-2 text-sm">
                                                                        <h3 className="font-semibold text-green-600">Latest Appointment</h3>
                                                                        {record.latestAppointment?.timestart ? (
                                                                            <>
                                                                                <p>
                                                                                    <strong>Schedule:</strong>{" "}
                                                                                    {formatAppointmentWindow(record.latestAppointment)}
                                                                                </p>
                                                                                <p>
                                                                                    <strong>Appointment ID:</strong>{" "}
                                                                                    {record.latestAppointment.id}
                                                                                </p>
                                                                            </>
                                                                        ) : (
                                                                            <p className="text-gray-500">No recent appointment on file.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
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