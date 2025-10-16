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
    Clock4,
    Loader2,
    PlusCircle,
    Pencil,
    Pill,
    FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { format12Hour, toManilaTimeString } from "@/lib/time";

import Image from "next/image";

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
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState<Availability[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [formData, setFormData] = useState({
        clinic_id: "",
        available_timestart: "",
        available_timeend: "",
    });
    const [editingSlot, setEditingSlot] = useState<Availability | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const weekStartISO = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        const diff = (day + 6) % 7;
        const monday = new Date(now);
        monday.setDate(monday.getDate() - diff);
        return monday.toISOString().slice(0, 10);
    }, []);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
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
            const res = await fetch("/api/meta/clinics", { cache: "no-store" });
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
        if (!formData.clinic_id || !formData.available_timestart || !formData.available_timeend) {
            toast.error("All fields are required.");
            return;
        }

        const body = editingSlot
            ? {
                  availability_id: editingSlot.availability_id,
                  available_timestart: formData.available_timestart,
                  available_timeend: formData.available_timeend,
                  clinic_id: formData.clinic_id,
              }
            : {
                  clinic_id: formData.clinic_id,
                  start_time: formData.available_timestart,
                  end_time: formData.available_timeend,
                  week_start: weekStartISO,
              };
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
                if (editingSlot) {
                    toast.success("Schedule updated!");
                } else {
                    const createdCount = Array.isArray(data?.created) ? data.created.length : 1;
                    toast.success(
                        createdCount > 1
                            ? `Duty hours added for ${createdCount} day${createdCount > 1 ? "s" : ""}!`
                            : "Duty hours added!"
                    );
                }
                setDialogOpen(false);
                setFormData({
                    clinic_id: "",
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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200"
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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
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

            {/* Main */}
            <main className="flex-1 w-full overflow-x-hidden flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-lg sm:text-xl font-bold text-green-600">Consultation Slots</h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href="/doctor">Dashboard</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/account">Account</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/consultation">Consultation</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/appointments">Appointments</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/dispense">Dispense</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/doctor/patients">Patients</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Consultation Section */}
                <section className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-8">
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition flex flex-col">
                        <CardHeader className="border-b flex justify-between items-center">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                My Duty Hours
                            </CardTitle>

                            <Dialog
                                open={dialogOpen}
                                onOpenChange={(open) => {
                                    setDialogOpen(open);
                                    if (!open) {
                                        setEditingSlot(null);
                                        setFormData({
                                            clinic_id: "",
                                            available_timestart: "",
                                            available_timeend: "",
                                        });
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                        onClick={() => {
                                            setEditingSlot(null);
                                            setFormData({
                                                clinic_id: "",
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
                                        <DialogTitle>{editingSlot ? "Edit Consultation Slot" : "Add Consultation Slot"}</DialogTitle>
                                        <DialogDescription>
                                            {editingSlot ? "Modify your existing consultation slot." : "Add a new consultation slot."}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <Label>Clinic</Label>
                                            <select
                                                value={formData.clinic_id}
                                                onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
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

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={formData.available_timestart}
                                                    onChange={(e) => setFormData({ ...formData, available_timestart: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label>End Time</Label>
                                                <Input
                                                    type="time"
                                                    value={formData.available_timeend}
                                                    onChange={(e) => setFormData({ ...formData, available_timeend: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {!editingSlot && (
                                            <p className="text-sm text-muted-foreground bg-green-50 border border-green-100 rounded-md p-3">
                                                Schedules will be generated automatically for the current week. Physicians receive Monday–Friday slots while dentists receive Monday–Saturday slots.
                                            </p>
                                        )}

                                        <DialogFooter>
                                            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                                                {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                                {editingSlot ? "Save Changes" : "Add Slot"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col pt-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-10 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading slots...
                                </div>
                            ) : slots.length > 0 ? (
                                <div className="overflow-x-auto w-full">
                                    <Table className="min-w-full text-sm">
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
                                                <TableRow key={slot.availability_id} className="hover:bg-green-50 transition">
                                                    <TableCell>
                                                        {new Date(slot.available_date).toLocaleDateString("en-CA", {
                                                            timeZone: "Asia/Manila",
                                                        })}
                                                    </TableCell>
                                                    <TableCell>{format12Hour(slot.available_timestart)}</TableCell>
                                                    <TableCell>{format12Hour(slot.available_timeend)}</TableCell>
                                                    <TableCell>{slot.clinic.clinic_name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingSlot(slot);
                                                                setFormData({
                                                                    clinic_id: slot.clinic.clinic_id,
                                                                    available_timestart: toManilaTimeString(slot.available_timestart),
                                                                    available_timeend: toManilaTimeString(slot.available_timeend),
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
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    No consultation slots added yet.
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
