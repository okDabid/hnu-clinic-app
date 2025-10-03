"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    Menu, X, Users, Package, Home,
    ClipboardList, Pill, FileText,
    Search, Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

// ✅ Patient type
type PatientRecord = {
    id: string;
    patientId: string;
    fullName: string;
    patientType: "Student" | "Employee";
    gender: string;
    date_of_birth: string;
    status: string;
    department?: string | null;
    program?: string | null;
    specialization?: string | null;
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
};

export default function NurseRecordsPage() {
    const [menuOpen] = useState(false);
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { data: session } = useSession();
    const nurseId = session?.user?.id; // nurse_user_id for consultation

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    async function loadRecords() {
        const res = await fetch("/api/nurse/records", { cache: "no-store" });
        const data = await res.json();
        setRecords(data);
    }

    useEffect(() => {
        loadRecords();
    }, []);

    // 🔍 Filtering logic
    const filtered = records.filter((r) => {
        const matchesSearch =
            r.fullName.toLowerCase().includes(search.toLowerCase()) ||
            r.patientId.toLowerCase().includes(search.toLowerCase()) ||
            r.patientType.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "All" || r.status === statusFilter;

        const matchesType =
            typeFilter === "All" || r.patientType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    // ✅ Update health data API call
    async function updateHealthData(id: string, type: string, payload: any) {
        const res = await fetch(`/api/nurse/records/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, ...payload }),
        });

        if (res.ok) {
            toast.success("Health data updated!");
            await loadRecords();
        } else {
            const err = await res.json();
            toast.error(err.error || "Failed to update health data");
        }
    }

    // ✅ Add consultation notes API call
    async function addConsultation(appointmentId: string, payload: any) {
        const res = await fetch(`/api/nurse/consultations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointment_id: appointmentId, nurse_user_id: nurseId, ...payload }),
        });

        if (res.ok) {
            toast.success("Consultation notes saved!");
        } else {
            const err = await res.json();
            toast.error(err.error || "Failed to save consultation");
        }
    }

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link href="/nurse" className="flex items-center gap-2 hover:text-green-600">
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link href="/nurse/accounts" className="flex items-center gap-2 hover:text-green-600">
                        <Users className="h-5 w-5" /> Accounts
                    </Link>
                    <Link href="/nurse/inventory" className="flex items-center gap-2 hover:text-green-600">
                        <Package className="h-5 w-5" /> Inventory
                    </Link>
                    <Link href="/nurse/clinic" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Clinic
                    </Link>
                    <Link href="/nurse/dispense" className="flex items-center gap-2 hover:text-green-600">
                        <Pill className="h-5 w-5" /> Dispense
                    </Link>
                    <Link href="/nurse/records" className="flex items-center gap-2 text-green-600 font-semibold">
                        <FileText className="h-5 w-5" /> Records
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Patient Records</h2>
                </header>

                {/* Records Table */}
                <section className="px-6 pt-6 pb-12 flex-1 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                {/* Search Bar */}
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
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
                                {/* Patient Type Filter */}
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-full md:w-40">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Patient</SelectItem>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient ID</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Gender</TableHead>
                                            <TableHead>Date of Birth</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.length > 0 ? (
                                            filtered.map((r) => (
                                                <TableRow key={r.id} className="hover:bg-green-50">
                                                    <TableCell>{r.patientId}</TableCell>
                                                    <TableCell>{r.fullName}</TableCell>
                                                    <TableCell>{r.patientType}</TableCell>
                                                    <TableCell>{r.gender}</TableCell>
                                                    <TableCell>{new Date(r.date_of_birth).toLocaleDateString()}</TableCell>
                                                    <TableCell>{r.status}</TableCell>
                                                    <TableCell className="space-x-2">
                                                        {/* View details */}
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                                                    View
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-lg">
                                                                <DialogHeader>
                                                                    <DialogTitle>{r.fullName}</DialogTitle>
                                                                    <DialogDescription>{r.patientType} Patient Record</DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-2">
                                                                    <p><strong>Contact No:</strong> {r.contactno || "—"}</p>
                                                                    <p><strong>Address:</strong> {r.address || "—"}</p>
                                                                    <p><strong>Blood Type:</strong> {r.bloodtype || "—"}</p>
                                                                    <p><strong>Allergies:</strong> {r.allergies || "—"}</p>
                                                                    <p><strong>Medical Conditions:</strong> {r.medical_cond || "—"}</p>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>

                                                        {/* Update health data */}
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                                                    Update
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Update Health Data</DialogTitle>
                                                                </DialogHeader>
                                                                <form
                                                                    className="space-y-3"
                                                                    onSubmit={async (e) => {
                                                                        e.preventDefault();
                                                                        const form = e.currentTarget as HTMLFormElement;
                                                                        const payload = {
                                                                            contactno: (form.elements.namedItem("contactno") as HTMLInputElement).value,
                                                                            address: (form.elements.namedItem("address") as HTMLInputElement).value,
                                                                            bloodtype: (form.elements.namedItem("bloodtype") as HTMLInputElement).value,
                                                                            allergies: (form.elements.namedItem("allergies") as HTMLInputElement).value,
                                                                            medical_cond: (form.elements.namedItem("medical_cond") as HTMLInputElement).value,
                                                                        };
                                                                        await updateHealthData(r.id, r.patientType, payload);
                                                                    }}
                                                                >
                                                                    <Input name="contactno" placeholder="Contact No" defaultValue={r.contactno || ""} />
                                                                    <Input name="address" placeholder="Address" defaultValue={r.address || ""} />
                                                                    <Input name="bloodtype" placeholder="Blood Type" defaultValue={r.bloodtype || ""} />
                                                                    <Input name="allergies" placeholder="Allergies" defaultValue={r.allergies || ""} />
                                                                    <Input name="medical_cond" placeholder="Medical Conditions" defaultValue={r.medical_cond || ""} />
                                                                    <DialogFooter>
                                                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                                                            Save
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>

                                                        {/* Consultation notes */}
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                                                                    Notes
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Add Consultation Notes</DialogTitle>
                                                                </DialogHeader>
                                                                <form
                                                                    className="space-y-3"
                                                                    onSubmit={async (e) => {
                                                                        e.preventDefault();
                                                                        const form = e.currentTarget as HTMLFormElement;
                                                                        const payload = {
                                                                            reason_of_visit: (form.elements.namedItem("reason") as HTMLInputElement).value,
                                                                            findings: (form.elements.namedItem("findings") as HTMLInputElement).value,
                                                                            diagnosis: (form.elements.namedItem("diagnosis") as HTMLInputElement).value,
                                                                        };
                                                                        await addConsultation(r.id, payload); // ⚠️ r.id must map to appointment_id
                                                                    }}
                                                                >
                                                                    <Input name="reason" placeholder="Reason of Visit" />
                                                                    <Input name="findings" placeholder="Findings" />
                                                                    <Input name="diagnosis" placeholder="Diagnosis" />
                                                                    <DialogFooter>
                                                                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                                                                            Save
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </form>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                                                    No patient records found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
