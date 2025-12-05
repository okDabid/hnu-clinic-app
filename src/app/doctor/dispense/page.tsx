"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatManilaDateTime } from "@/lib/time";
import { summarizeDispenses } from "@/lib/dispense-summary";
import { formatProfileName } from "@/lib/staff-name";
import { DispenseHistoryRow, DispenseHistoryTable } from "@/components/dispense/dispense-history-table";

import DoctorDispenseLoading from "./loading";

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
    } | null;
    walk_in_id_number: string | null;
    walk_in_contact: string | null;
    walk_in_notes: string | null;
    scholar: {
        user_id: string;
        username: string;
        student: { fname: string | null; mname: string | null; lname: string | null } | null;
        employee: { fname: string | null; mname: string | null; lname: string | null } | null;
    } | null;
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

function formatDateTime(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
    const formatted = formatManilaDateTime(value, options);
    return formatted || "—";
}

export default function DoctorDispensePage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dispenses, setDispenses] = useState<DispenseRecord[]>([]);
    const [consultations, setConsultations] = useState<ConsultationOption[]>([]);
    const [medicines, setMedicines] = useState<MedicineOption[]>([]);
    const [initializing, setInitializing] = useState(true);
    const [form, setForm] = useState({
        consultation_id: "",
        med_id: "",
        quantity: "",
    });

    const summary = useMemo(() => summarizeDispenses(dispenses), [dispenses]);

    const tableRows = useMemo<DispenseHistoryRow[]>(
        () =>
            dispenses.map((record) => ({
                id: record.dispense_id,
                clinicName:
                    record.consultation?.appointment?.clinic?.clinic_name ?? record.med.clinic.clinic_name,
                recipient:
                    record.consultation?.appointment?.patient?.username ??
                    (record.walk_in_id_number ? `Walk-in ID: ${record.walk_in_id_number}` : "—"),
                visitType: record.consultation ? "Consultation" : "Walk-in",
                medicineName: record.med.item_name,
                medicineClinic: record.med.clinic.clinic_name,
                quantity: record.quantity,
                doctorName: formatProfileName(record.consultation?.doctor),
                nurseName: formatProfileName(record.consultation?.nurse),
                scholarName: formatProfileName(record.scholar),
                createdAt: record.createdAt,
                batches: record.dispenseBatches.map((batch) => ({
                    id: batch.id,
                    quantity_used: batch.quantity_used,
                    expiry_date: batch.replenishment.expiry_date,
                    date_received: batch.replenishment.date_received,
                })),
                walkInContact: record.walk_in_contact,
                walkInNotes: record.walk_in_notes,
            })),
        [dispenses]
    );

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
                setInitializing(false);
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

    if (initializing) {
        return <DoctorDispenseLoading />;
    }

    return (
        <DoctorLayout
            title="Dispensing log"
            description="Document issued medicines, validate stock balances, and maintain accurate clinic records."
            actions={
                <Button
                    className="rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                    onClick={() => {
                        setForm({ consultation_id: "", med_id: "", quantity: "" });
                    }}
                >
                    Reset form
                </Button>
            }
        >
            <div className="space-y-6 min-w-0">
                <section className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 min-w-0">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Card className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-white to-primary/5 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Dispenses logged</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <p className="text-3xl font-bold text-primary">{summary.total}</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {summary.total > 0
                                        ? `${summary.totalQuantity} items issued to patients`
                                        : "No dispense activity recorded yet."}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-primary/20 bg-white/90 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Consultation-linked</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <p className="text-3xl font-bold text-primary">{summary.consultations}</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Medicines recorded directly against physician encounters.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-primary/20 bg-white/90 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Walk-ins coordinated</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <p className="text-3xl font-bold text-primary">{summary.walkIns}</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Requests fulfilled alongside the scholar walk-in workflow.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-primary/20 bg-white/90 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Last dispense</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <p className="text-lg font-semibold text-primary">
                                    {summary.latestDispense ? formatDateTime(summary.latestDispense) : "Awaiting first record"}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">Timestamps follow Manila local time.</p>
                            </CardContent>
                        </Card>
                    </div>
                    <Card className="rounded-3xl border border-primary/20 bg-white/85 shadow-sm">
                        <CardHeader className="space-y-1 border-b border-primary/20">
                            <CardTitle className="text-lg font-semibold text-primary sm:text-xl">
                                Record a dispense
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Link the dispensed medicine to a consultation to keep the inventory and patient record aligned.
                            </p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="font-medium text-primary">Consultation</Label>
                                    <Select
                                        value={form.consultation_id}
                                        onValueChange={(value) =>
                                            setForm((prev) => ({ ...prev, consultation_id: value }))
                                        }
                                    >
                                        <SelectTrigger className="w-full min-h-[90px] rounded-xl border border-primary/25 bg-white/80 px-4 py-3 text-base leading-relaxed whitespace-normal text-left focus:ring-2 focus:ring-primary/50">
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
                                    <Label className="font-medium text-primary">Medicine</Label>
                                    <Select
                                        value={form.med_id}
                                        onValueChange={(value) => setForm((prev) => ({ ...prev, med_id: value }))}
                                    >
                                        <SelectTrigger className="w-full rounded-xl border border-primary/25 bg-white/80">
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
                                    <Label className="font-medium text-primary">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.quantity}
                                        onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                                        placeholder="Enter quantity"
                                        required
                                        className="rounded-xl border border-primary/25 bg-white/80 focus-visible:ring-primary"
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
                                        className="rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
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

                    <Card className="flex-1 rounded-3xl border border-primary/20 bg-white/85 shadow-sm">
                        <CardHeader className="border-b border-primary/20">
                            <CardTitle className="text-lg font-semibold text-primary sm:text-xl">
                                Recent dispense records
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <DispenseHistoryTable rows={tableRows} loading={loading} />
                        </CardContent>
                    </Card>
                </section>

            </div>
        </DoctorLayout>
    );
}
