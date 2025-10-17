"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, PlusCircle, Pencil } from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import {
    format12Hour,
    toManilaDateString,
    toManilaTimeString,
} from "@/lib/time";


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

    const uniqueClinicCount = useMemo(
        () => new Set(slots.map((slot) => slot.clinic.clinic_name)).size,
        [slots]
    );

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
        const isEditing = Boolean(editingSlot);

        if (isEditing) {
            if (!formData.available_date || !formData.available_timestart || !formData.available_timeend) {
                toast.error("Please provide both start and end times.");
                return;
            }
        } else {
            if (!formData.clinic_id || !formData.available_timestart || !formData.available_timeend) {
                toast.error("Clinic, start time, and end time are required.");
                return;
            }
        }

        const body = isEditing
            ? {
                availability_id: editingSlot!.availability_id,
                clinic_id: formData.clinic_id,
                available_date: formData.available_date,
                available_timestart: formData.available_timestart,
                available_timeend: formData.available_timeend,
            }
            : {
                clinic_id: formData.clinic_id,
                available_timestart: formData.available_timestart,
                available_timeend: formData.available_timeend,
            };
        const method = isEditing ? "PUT" : "POST";

        try {
            setLoading(true);
            const res = await fetch("/api/doctor/consultation", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                toast.error(data.error ?? "Failed to save duty hours");
            } else {
                if (isEditing) {
                    toast.success("Schedule updated!");
                    setSlots((prev) =>
                        prev.map((slot) =>
                            slot.availability_id === editingSlot!.availability_id ? data : slot
                        )
                    );
                } else {
                    toast.success(data.message ?? "Duty hours generated!");
                    if (Array.isArray(data.slots)) {
                        setSlots(data.slots);
                    }
                }
                setDialogOpen(false);
                setFormData({
                    clinic_id: "",
                    available_date: "",
                    available_timestart: "",
                    available_timeend: "",
                });
                setEditingSlot(null);
            }
        } catch {
            toast.error("Failed to save duty hours");
        } finally {
            setLoading(false);
        }
    }

    return (
        <DoctorLayout
            title="Consultation availability"
            description="Manage your duty hours, adjust clinic assignments, and publish new consultation slots."
            actions={
                <Button
                    className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                    onClick={() => {
                        setDialogOpen(true);
                        setEditingSlot(null);
                        setFormData({
                            clinic_id: "",
                            available_date: "",
                            available_timestart: "",
                            available_timeend: "",
                        });
                    }}
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> New availability
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Consultation Section */}
                <section className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6">
                    <Card className="rounded-3xl border border-green-100/70 bg-gradient-to-r from-green-100/70 via-white to-green-50/80 shadow-sm">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-base font-semibold text-green-700">
                                Availability overview
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {slots.length === 0
                                    ? "No active slots yet. Generate duty hours to publish a new schedule."
                                    : `You currently have ${slots.length} availability ${slots.length === 1 ? "entry" : "entries"} across ${uniqueClinicCount} clinic${uniqueClinicCount === 1 ? "" : "s"}.`}
                            </p>
                        </CardHeader>
                    </Card>
                    <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                        <CardHeader className="flex flex-col gap-3 border-b border-green-100/70 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="text-xl font-semibold text-green-700 sm:text-2xl">
                                My duty hours
                            </CardTitle>

                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
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
                                        <PlusCircle className="h-4 w-4" /> Set duty hours
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="rounded-3xl border border-green-100 bg-white/95">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg font-semibold text-green-700">
                                            {editingSlot ? "Edit consultation slot" : "Generate duty hours"}
                                        </DialogTitle>
                                        <DialogDescription className="text-sm text-muted-foreground">
                                            {editingSlot
                                                ? "Update the start or end time for this specific day."
                                                : "Set your daily duty hours and we will populate the upcoming schedule automatically."}
                                        </DialogDescription>
                                        {!editingSlot && (
                                            <p className="text-sm text-muted-foreground">
                                                Duty hours will be plotted on weekdays (Mon–Fri for physicians, Mon–Sat for dentists) for the next four weeks.
                                            </p>
                                        )}
                                    </DialogHeader>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <Label>Clinic</Label>
                                            <select
                                                value={formData.clinic_id}
                                                onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                                                required
                                                className="w-full border rounded-md p-2"
                                                disabled={loading}
                                            >
                                                <option value="">Select clinic</option>
                                                {clinics.map((c) => (
                                                    <option key={c.clinic_id} value={c.clinic_id}>
                                                        {c.clinic_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {editingSlot && (
                                            <div>
                                                <Label>Date</Label>
                                                <Input type="date" value={formData.available_date} disabled readOnly />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={formData.available_timestart}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, available_timestart: e.target.value })
                                                    }
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div>
                                                <Label>End Time</Label>
                                                <Input
                                                    type="time"
                                                    value={formData.available_timeend}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, available_timeend: e.target.value })
                                                    }
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                                            >
                                                {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                                {editingSlot ? "Save Changes" : "Generate"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col pt-4 text-sm text-muted-foreground">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" /> Loading slots...
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
                                                            className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70 gap-2"
                                                            onClick={() => {
                                                                setEditingSlot(slot);
                                                                setFormData({
                                                                    clinic_id: slot.clinic.clinic_id,
                                                                    available_date: toManilaDateString(slot.available_date),
                                                                    available_timestart: toManilaTimeString(slot.available_timestart),
                                                                    available_timeend: toManilaTimeString(slot.available_timeend),
                                                                });
                                                                setDialogOpen(true);
                                                            }}
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
                                <div className="py-6 text-center text-muted-foreground">
                                    No consultation slots added yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

            </div>
        </DoctorLayout>
    );
}
