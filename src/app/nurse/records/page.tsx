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
    FileText
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
    const [selected, setSelected] = useState<PatientRecord | null>(null);

    async function loadRecords() {
        const res = await fetch("/api/nurse/records", { cache: "no-store" });
        const data = await res.json();
        setRecords(data);
    }

    useEffect(() => {
        loadRecords();
    }, []);

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
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => signOut({ callbackUrl: "/login?logout=success" })}
                >
                    Logout
                </Button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Patient Records</h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
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
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Records Table */}
                <section className="px-6 pt-6 pb-12 flex-1 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-green-600">Patient Records</CardTitle>
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
                                        {records.length > 0 ? (
                                            records.map((r) => (
                                                <TableRow key={r.id} className="hover:bg-green-50">
                                                    <TableCell>{r.patientId}</TableCell>
                                                    <TableCell>{r.fullName}</TableCell>
                                                    <TableCell>{r.patientType}</TableCell>
                                                    <TableCell>{r.gender}</TableCell>
                                                    <TableCell>{new Date(r.date_of_birth).toLocaleDateString()}</TableCell>
                                                    <TableCell>{r.status}</TableCell>
                                                    <TableCell>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => setSelected(r)}
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
                                                                    <p><strong>Emergency Contact:</strong> {r.emergency?.name || "—"} ({r.emergency?.relation || "—"}) - {r.emergency?.num || "—"}</p>

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

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
