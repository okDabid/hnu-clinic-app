"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    Menu, X,
    Users,
    Package,
    Home,
    ClipboardList,
    Pill,
    FileText,
    Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type PatientRecord = {
    id: string;
    patientId: string;
    fullName: string;
    patientType: "Student" | "Employee";
    gender: string;
    date_of_birth: string;
    status: string;
    // full details
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

    async function loadRecords() {
        const res = await fetch("/api/nurse/records", { cache: "no-store" });
        const data = await res.json();
        setRecords(data);
    }

    useEffect(() => {
        loadRecords();
    }, []);

    // 🔍 Filter records
    const filtered = records.filter((r) =>
        r.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.patientId.toLowerCase().includes(search.toLowerCase()) ||
        r.patientType.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar … same as before */}

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header … same as before */}

                {/* Records Table */}
                <section className="px-6 pt-6 pb-12 flex-1 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-2xl font-bold text-green-600">
                                Patient Records
                            </CardTitle>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search patients..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
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
                                                    <TableCell>
                                                        {new Date(r.date_of_birth).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{r.status}</TableCell>
                                                    <TableCell>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                >
                                                                    View Details
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-lg">
                                                                <DialogHeader>
                                                                    <DialogTitle>{r.fullName}</DialogTitle>
                                                                    <DialogDescription>
                                                                        {r.patientType} Patient Record
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-2">
                                                                    <p><strong>Patient ID:</strong> {r.patientId}</p>
                                                                    <p><strong>Gender:</strong> {r.gender}</p>
                                                                    <p><strong>Date of Birth:</strong> {new Date(r.date_of_birth).toLocaleDateString()}</p>
                                                                    <p><strong>Contact No:</strong> {r.contactno || "—"}</p>
                                                                    <p><strong>Address:</strong> {r.address || "—"}</p>
                                                                    <p><strong>Blood Type:</strong> {r.bloodtype || "—"}</p>
                                                                    <p><strong>Allergies:</strong> {r.allergies || "—"}</p>
                                                                    <p><strong>Medical Conditions:</strong> {r.medical_cond || "—"}</p>
                                                                    <p>
                                                                        <strong>Emergency Contact:</strong>{" "}
                                                                        {r.emergency?.name || "—"} ({r.emergency?.relation || "—"}) - {r.emergency?.num || "—"}
                                                                    </p>

                                                                    {/* Only for students */}
                                                                    {r.patientType === "Student" && (
                                                                        <>
                                                                            <p><strong>Department:</strong> {r.department || "—"}</p>
                                                                            <p><strong>Program:</strong> {r.program || "—"}</p>
                                                                            <p><strong>Specialization:</strong> {r.specialization || "—"}</p>
                                                                            <p><strong>Year Level:</strong> {r.year_level || "—"}</p>
                                                                        </>
                                                                    )}
                                                                </div>
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
            </main>
        </div>
    );
}
