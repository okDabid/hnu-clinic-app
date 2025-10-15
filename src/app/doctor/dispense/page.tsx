"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
    Menu,
    X,
    User,
    CalendarDays,
    ClipboardList,
    FileText,
    Home,
    Loader2,
    Clock4,
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
import { formatManilaDateTime } from "@/lib/time";

type DispenseRecord = {
    dispense_id: string;
    quantity: number;
    createdAt: string;
    med: {
        item_name: string;
        clinic: { clinic_name: string };
    };
    consultation: {
        appointment: {
            patient: { username: string } | null;
            clinic: { clinic_name: string } | null;
        } | null;
        doctor: { username: string } | null;
        nurse: { username: string } | null;
    };
    dispenseBatches: {
        id: string;
        quantity_used: number;
        replenishment: {
            expiry_date: string;
            date_received: string;
        };
    }[];
};

type ConsultationOption = {
    consultation_id: string;
    patientName: string;
    clinicName: string;
    appointmentDate: string | null;
    consultedAt: string | null;
};

type MedicineOption = {
    med_id: string;
    item_name: string;
    clinicName: string;
    quantity: number;
};

type DispenseResponse = {
    dispenses: DispenseRecord[];
    consultations: ConsultationOption[];
    medicines: MedicineOption[];
    error?: string;
};

function formatDateTime(
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions
) {
    const formatted = formatManilaDateTime(value, options);
    return formatted || "—";
}

function formatDate(value: string | null | undefined) {
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

export default function DoctorDispensePage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dispenses, setDispenses] = useState<DispenseRecord[]>([]);
    const [consultations, setConsultations] = useState<ConsultationOption[]>([]);
    const [medicines, setMedicines] = useState<MedicineOption[]>([]);
    const [form, setForm] = useState({
        consultation_id: "",
        med_id: "",
        quantity: "",
    });

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    const selectedMedicine = useMemo(
        () => medicines.find((med) => med.med_id === form.med_id) || null,
        [medicines, form.med_id]
    );

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const res = await fetch("/api/doctor/dispense", { cache: "no-store" });
                const data: DispenseResponse = await res.json();

                if (!res.ok) {
                    toast.error(data?.error || "Failed to load dispense data");
                    return;
                }

                setDispenses(data.dispenses || []);
                setConsultations(data.consultations || []);
                setMedicines(data.medicines || []);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load dispense data");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!form.consultation_id || !form.med_id || !form.quantity) {
            toast.error("Please complete all fields");
            return;
        }

        const quantity = Number(form.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            toast.error("Quantity must be a positive number");
            return;
        }

        if (selectedMedicine && quantity > selectedMedicine.quantity) {
            toast.error("Quantity exceeds current stock");
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch("/api/doctor/dispense", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    consultation_id: form.consultation_id,
                    med_id: form.med_id,
                    quantity,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data?.error || "Failed to record dispense");
                return;
            }

            setDispenses((prev) => [data as DispenseRecord, ...prev]);
            setMedicines((prev) =>
                prev.map((med) =>
                    med.med_id === form.med_id
                        ? { ...med, quantity: Math.max(0, med.quantity - quantity) }
                        : med
                )
            );
            setForm({ consultation_id: "", med_id: "", quantity: "" });
            toast.success("Dispense recorded successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to record dispense");
        } finally {
            setSubmitting(false);
        }
    }

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
                    <Link href="/doctor/dispense" className="flex items-center gap-2 text-green-600 font-semibold">
                        <Pill className="h-5 w-5" /> Dispense
                    </Link>
                    <Link href="/doctor/patients" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Patients
                    </Link>
                    <Link href="/doctor/certificates" className="flex items-center gap-2 hover:text-green-600">
                        <FileText className="h-5 w-5" /> MedCerts
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
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Dispense Management</h2>
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
                                <DropdownMenuItem asChild><Link href="/doctor/certificates">MedCerts</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <section className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-6xl mx-auto flex-1 flex flex-col gap-6">
                    <Card className="shadow-lg rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl text-green-600 font-semibold">
                                Record a Dispense
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="font-medium text-gray-700">Consultation</Label>
                                    <Select
                                        value={form.consultation_id}
                                        onValueChange={(value) =>
                                            setForm((prev) => ({ ...prev, consultation_id: value }))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select consultation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {consultations.length > 0 ? (
                                                consultations.map((consultation) => (
                                                    <SelectItem
                                                        key={consultation.consultation_id}
                                                        value={consultation.consultation_id}
                                                    >
                                                        <div className="flex flex-col text-left">
                                                            <span className="font-medium">
                                                                {consultation.patientName}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {consultation.clinicName} · Appointment: {formatDateTime(consultation.appointmentDate)}
                                                            </span>
                                                            {consultation.consultedAt && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Consultation recorded: {formatDateTime(consultation.consultedAt)}
                                                                </span>
                                                            )}

                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no_consultation" disabled>
                                                    No consultations available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-medium text-gray-700">Medicine</Label>
                                    <Select
                                        value={form.med_id}
                                        onValueChange={(value) => setForm((prev) => ({ ...prev, med_id: value }))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select medicine" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {medicines.length > 0 ? (
                                                medicines.map((medicine) => (
                                                    <SelectItem key={medicine.med_id} value={medicine.med_id}>
                                                        <div className="flex flex-col text-left">
                                                            <span className="font-medium">{medicine.item_name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {medicine.clinicName} · Stock: {medicine.quantity}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no_medicine" disabled>
                                                    No medicines available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-medium text-gray-700">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.quantity}
                                        onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                                        placeholder="Enter quantity"
                                        required
                                    />
                                    {selectedMedicine ? (
                                        <p className="text-xs text-muted-foreground">
                                            Available stock: {selectedMedicine.quantity}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="sm:col-span-2 flex justify-end">
                                    <Button
                                        type="submit"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Record Dispense"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 rounded-2xl shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl text-green-600 font-semibold">
                                Recent Dispense Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-gray-600">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading records...
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table className="min-w-full text-sm">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Clinic</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Doctor</TableHead>
                                                <TableHead>Nurse</TableHead>
                                                <TableHead>Dispensed At</TableHead>
                                                <TableHead>Batch Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dispenses.length > 0 ? (
                                                dispenses.map((d) => (
                                                    <TableRow key={d.dispense_id} className="hover:bg-green-50">
                                                        <TableCell>{d.med.clinic.clinic_name}</TableCell>
                                                        <TableCell>
                                                            {d.consultation.appointment?.patient?.username || "—"}
                                                        </TableCell>
                                                        <TableCell>{d.med.item_name}</TableCell>
                                                        <TableCell>{d.quantity}</TableCell>
                                                        <TableCell>{d.consultation.doctor?.username || "—"}</TableCell>
                                                        <TableCell>{d.consultation.nurse?.username || "—"}</TableCell>
                                                        <TableCell>{formatDateTime(d.createdAt)}</TableCell>
                                                        <TableCell>
                                                            {d.dispenseBatches.length > 0 ? (
                                                                <ul className="text-xs text-gray-700 space-y-1">
                                                                    {d.dispenseBatches.map((batch) => (
                                                                        <li key={batch.id}>
                                                                            <span className="font-medium">{batch.quantity_used}</span>{" "}
                                                                            used (Expiry: {formatDate(batch.replenishment.expiry_date)}, Received: {formatDate(batch.replenishment.date_received)})
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center text-gray-500 py-6">
                                                        No dispense records found
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

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto text-sm sm:text-base">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}