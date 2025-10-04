"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
    Menu,
    X,
    Home,
    User,
    CalendarDays,
    ClipboardList,
    Loader2,
    Pencil,
    PlusCircle,
    Clock4,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type Clinic = {
    clinic_id: string;
    clinic_name: string;
};

type Availability = {
    availability_id: string;
    available_date: string;
    available_timestart: string;
    available_timeend: string;
    clinic: Clinic;
};

export default function DoctorConsultationPage() {
    const [menuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<Availability[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);

    const [formData, setFormData] = useState({
        clinic_id: "",
        available_date: "",
        available_timestart: "",
        available_timeend: "",
    });
    const [editingSlot, setEditingSlot] = useState<Availability | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    function toLocalTime(iso: string): string {
        const date = new Date(iso);
        const hours = date.getHours().toString().padStart(2, "0");
        const mins = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${mins}`;
    }

    async function loadSlots() {
        try {
            setLoading(true);
            const res = await fetch("/api/doctor/consultation", { cache: "no-store" });
            const data = await res.json();
            if (data.error) toast.error(data.error);
            else setSlots(data);
        } catch {
            toast.error("Failed to load consultation slots");
        } finally {
            setLoading(false);
        }
    }

    async function loadClinics() {
        try {
            const res = await fetch("/api/clinics", { cache: "no-store" });
            const data = await res.json();
            if (!data.error) setClinics(data);
        } catch {
            console.warn("Failed to fetch clinics list");
        }
    }

    useEffect(() => {
        loadSlots();
        loadClinics();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (
            !formData.clinic_id ||
            !formData.available_date ||
            !formData.available_timestart ||
            !formData.available_timeend
        ) {
            toast.error("All fields are required.");
            return;
        }

        const body = editingSlot
            ? { availability_id: editingSlot.availability_id, ...formData }
            : formData;
        const method = editingSlot ? "PUT" : "POST";

        try {
            setLoading(true);
            const res = await fetch("/api/doctor/consultation", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                toast.success(editingSlot ? "Schedule updated!" : "Duty hours added!");
                setDialogOpen(false);
                setFormData({
                    clinic_id: "",
                    available_date: "",
                    available_timestart: "",
                    available_timeend: "",
                });
                setEditingSlot(null);
                loadSlots();
            }
        } catch {
            toast.error("Failed to save duty hours");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link href="/doctor" className="flex items-center gap-2 hover:text-green-600">
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link href="/doctor/account" className="flex items-center gap-2 hover:text-green-600">
                        <User className="h-5 w-5" /> Account
                    </Link>
                    <Link href="/doctor/consultation" className="flex items-center gap-2 text-green-600 font-semibold">
                        <Clock4 className="h-5 w-5" /> Consultation
                    </Link>
                    <Link href="/doctor/appointments" className="flex items-center gap-2 hover:text-green-600">
                        <CalendarDays className="h-5 w-5" /> Appointments
                    </Link>
                    <Link href="/doctor/patients" className="flex items-center gap-2 hover:text-green-600">
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

            {/* Main */}
            <main className="flex-1 flex flex-col">
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Consultation Slots</h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href="/doctor">Dashboard</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/account">Account</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/consultation">Consultation</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/appointments">Appointments</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/patients">Patients</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Duty Hours Table */}
                <section className="px-6 py-8 max-w-6xl mx-auto w-full space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-semibold text-green-700">My Duty Hours</h3>

                        {/* 🟢 FIX — Reset state before opening dialog for ADD */}
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                    onClick={() => {
                                        setEditingSlot(null);
                                        setFormData({
                                            clinic_id: "",
                                            available_date: "",
                                            available_timestart: "",
                                            available_timeend: "",
                                        });
                                    }}
                                >
                                    <PlusCircle className="h-4 w-4" /> Add Slot
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="rounded-xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingSlot ? "Edit Consultation Slot" : "Add Consultation Slot"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {editingSlot
                                            ? "Modify your existing consultation slot."
                                            : "Add a new consultation slot."}
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label>Clinic</Label>
                                        <select
                                            value={formData.clinic_id}
                                            onChange={(e) =>
                                                setFormData({ ...formData, clinic_id: e.target.value })
                                            }
                                            required
                                            className="w-full border rounded-md p-2"
                                        >
                                            <option value="">Select clinic</option>
                                            {clinics.map((c) => (
                                                <option key={c.clinic_id} value={c.clinic_id}>
                                                    {c.clinic_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.available_date}
                                            onChange={(e) =>
                                                setFormData({ ...formData, available_date: e.target.value })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Start Time</Label>
                                            <Input
                                                type="time"
                                                value={formData.available_timestart}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        available_timestart: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>End Time</Label>
                                            <Input
                                                type="time"
                                                value={formData.available_timeend}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        available_timeend: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                            {editingSlot ? "Save Changes" : "Add Slot"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-green-600">
                                Scheduled Consultation Slots
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-6 text-gray-500">Loading slots...</div>
                            ) : slots.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Start Time</TableHead>
                                            <TableHead>End Time</TableHead>
                                            <TableHead>Clinic</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {slots.map((slot) => (
                                            <TableRow key={slot.availability_id}>
                                                <TableCell>{slot.available_date.slice(0, 10)}</TableCell>
                                                <TableCell>{toLocalTime(slot.available_timestart)}</TableCell>
                                                <TableCell>{toLocalTime(slot.available_timeend)}</TableCell>
                                                <TableCell>{slot.clinic.clinic_name}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            // 🟢 FIX — Set proper editing state before opening
                                                            setEditingSlot(slot);
                                                            setFormData({
                                                                clinic_id: slot.clinic.clinic_id,
                                                                available_date: slot.available_date.slice(0, 10),
                                                                available_timestart: toLocalTime(
                                                                    slot.available_timestart
                                                                ),
                                                                available_timeend: toLocalTime(
                                                                    slot.available_timeend
                                                                ),
                                                            });
                                                            setDialogOpen(true);
                                                        }}
                                                        className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
                                                    >
                                                        <Pencil className="h-4 w-4" /> Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    No consultation slots added yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}
