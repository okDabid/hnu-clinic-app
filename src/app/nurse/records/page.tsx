"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    Menu, X,
    Users,
    Package,
    Home,
    ClipboardList,
    Pill,
    FileText,
    Search,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
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
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // 🔹 Separate loading states
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [savingData, setSavingData] = useState(false);

    // 🔹 Logout
    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    // 🔹 Load records
    async function loadRecords() {
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
    }

    useEffect(() => {
        loadRecords();
    }, []);

    // 🔹 Filters
    const filtered = records.filter((r) => {
        const matchesSearch =
            r.fullName.toLowerCase().includes(search.toLowerCase()) ||
            r.patientId.toLowerCase().includes(search.toLowerCase()) ||
            r.patientType.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "All" || r.status === statusFilter;
        const matchesType = typeFilter === "All" || r.patientType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

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

            {/* Main */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Patient Records</h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5" />}
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

                {/* Table */}
                <section className="px-6 pt-6 pb-12 flex-1 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                {/* Search */}
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
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Patient ID</TableHead>
                                                <TableHead>Full Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Gender</TableHead>
                                                <TableHead>DOB</TableHead>
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
                                                            {/* Dialog for managing record */}
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                                    >
                                                                        Manage
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-2xl">
                                                                    <DialogHeader>
                                                                        <DialogTitle>{r.fullName}</DialogTitle>
                                                                        <DialogDescription>
                                                                            {r.patientType} Patient Record
                                                                        </DialogDescription>
                                                                    </DialogHeader>

                                                                    <Tabs defaultValue="details">
                                                                        <TabsList className="grid grid-cols-2 gap-2">
                                                                            <TabsTrigger value="details">Details</TabsTrigger>
                                                                            <TabsTrigger value="update">Update & Notes</TabsTrigger>
                                                                        </TabsList>

                                                                        {/* DETAILS TAB */}
                                                                        <TabsContent value="details" className="space-y-2">
                                                                            <p><strong>Patient ID:</strong> {r.patientId}</p>
                                                                            <p><strong>Gender:</strong> {r.gender}</p>
                                                                            <p><strong>DOB:</strong> {new Date(r.date_of_birth).toLocaleDateString()}</p>
                                                                            <p><strong>Status:</strong> {r.status}</p>
                                                                            <p><strong>Contact:</strong> {r.contactno || "—"}</p>
                                                                            <p><strong>Address:</strong> {r.address || "—"}</p>
                                                                            <p><strong>Blood Type:</strong> {r.bloodtype || "—"}</p>
                                                                            <p><strong>Allergies:</strong> {r.allergies || "—"}</p>
                                                                            <p><strong>Medical Conditions:</strong> {r.medical_cond || "—"}</p>
                                                                            <p>
                                                                                <strong>Emergency:</strong> {r.emergency?.name || "—"} (
                                                                                {r.emergency?.relation || "—"}) - {r.emergency?.num || "—"}
                                                                            </p>
                                                                            {r.patientType === "Student" && (
                                                                                <>
                                                                                    <p><strong>Department:</strong> {r.department || "—"}</p>
                                                                                    <p><strong>Program:</strong> {r.program || "—"}</p>
                                                                                    <p><strong>Year Level:</strong> {r.year_level || "—"}</p>
                                                                                </>
                                                                            )}
                                                                        </TabsContent>

                                                                        {/* UPDATE TAB */}
                                                                        <TabsContent value="update">
                                                                            {/* Medical Condition Update */}
                                                                            <form
                                                                                className="space-y-3 mb-6"
                                                                                onSubmit={async (e) => {
                                                                                    e.preventDefault();
                                                                                    setSavingData(true);
                                                                                    const form = e.currentTarget as HTMLFormElement;
                                                                                    const body = {
                                                                                        type: r.patientType,
                                                                                        medical_cond: (
                                                                                            form.elements.namedItem("medical_cond") as HTMLInputElement
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
                                                                            >
                                                                                <div>
                                                                                    <Label>Medical Conditions</Label>
                                                                                    <Input
                                                                                        name="medical_cond"
                                                                                        defaultValue={r.medical_cond || ""}
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
                                                                                        "Save"
                                                                                    )}
                                                                                </Button>
                                                                            </form>

                                                                            {/* Consultation Notes */}
                                                                            <form
                                                                                className="space-y-3"
                                                                                onSubmit={async (e) => {
                                                                                    e.preventDefault();
                                                                                    setSavingData(true);
                                                                                    const form = e.currentTarget as HTMLFormElement;
                                                                                    const body = {
                                                                                        appointment_id: "TODO_APPOINTMENT_ID",
                                                                                        nurse_user_id: session?.user?.id,
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

                                                                                    const res = await fetch(`/api/nurse/consultations`, {
                                                                                        method: "POST",
                                                                                        headers: { "Content-Type": "application/json" },
                                                                                        body: JSON.stringify(body),
                                                                                    });

                                                                                    if (res.ok) {
                                                                                        toast.success("Consultation notes saved");
                                                                                    } else {
                                                                                        toast.error("Failed to save consultation");
                                                                                    }
                                                                                    setSavingData(false);
                                                                                }}
                                                                            >
                                                                                <div>
                                                                                    <Label>Reason of Visit</Label>
                                                                                    <Input name="reason_of_visit" />
                                                                                </div>
                                                                                <div>
                                                                                    <Label>Findings</Label>
                                                                                    <Input name="findings" />
                                                                                </div>
                                                                                <div>
                                                                                    <Label>Diagnosis</Label>
                                                                                    <Input name="diagnosis" />
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
                                                        colSpan={7}
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

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
