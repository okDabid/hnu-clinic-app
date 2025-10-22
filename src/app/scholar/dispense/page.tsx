"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import ScholarLayout from "@/components/scholar/scholar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import ScholarDispenseLoading from "./loading";

type DispenseRecord = {
    dispense_id: string;
    quantity: number;
    createdAt: string;
    med: {
        item_name: string;
        clinic: { clinic_name: string };
    };
    walk_in_name: string | null;
    walk_in_contact: string | null;
    walk_in_notes: string | null;
    scholar: {
        username: string;
        student: { fname: string | null; mname: string | null; lname: string | null } | null;
        employee: { fname: string | null; mname: string | null; lname: string | null } | null;
    } | null;
};

type MedicineOption = {
    med_id: string;
    item_name: string;
    clinicName: string;
    quantity: number;
};

type DispenseResponse = {
    dispenses: DispenseRecord[];
    medicines: MedicineOption[];
    error?: string;
};

function formatScholarName(
    scholar:
        | {
              username: string;
              student: { fname: string | null; mname: string | null; lname: string | null } | null;
              employee: { fname: string | null; mname: string | null; lname: string | null } | null;
          }
        | null
) {
    if (!scholar) return "—";

    const fromStudent = scholar.student
        ? [scholar.student.fname, scholar.student.mname, scholar.student.lname].filter(Boolean).join(" ")
        : "";

    if (fromStudent) return fromStudent;

    const fromEmployee = scholar.employee
        ? [scholar.employee.fname, scholar.employee.mname, scholar.employee.lname].filter(Boolean).join(" ")
        : "";

    return fromEmployee || scholar.username || "—";
}

export default function ScholarDispensePage() {
    const [dispenses, setDispenses] = useState<DispenseRecord[]>([]);
    const [medicines, setMedicines] = useState<MedicineOption[]>([]);
    const [initializing, setInitializing] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "",
        contact: "",
        notes: "",
        med_id: "",
        quantity: "",
    });

    const selectedMedicine = useMemo(
        () => medicines.find((medicine) => medicine.med_id === form.med_id) ?? null,
        [form.med_id, medicines]
    );

    async function loadData() {
        try {
            setLoading(true);
            const res = await fetch("/api/scholar/dispense", { cache: "no-store" });
            const data: DispenseResponse = await res.json();

            if (!res.ok) {
                toast.error(data?.error || "Failed to load walk-in dispenses");
                return;
            }

            setDispenses(Array.isArray(data.dispenses) ? data.dispenses : []);
            setMedicines(Array.isArray(data.medicines) ? data.medicines : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load walk-in dispenses");
        } finally {
            setInitializing(false);
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.name.trim() || !form.med_id || !form.quantity) {
            toast.error("Please complete the required fields");
            return;
        }

        const quantity = Number(form.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            toast.error("Quantity must be a positive number");
            return;
        }

        if (selectedMedicine && quantity > selectedMedicine.quantity) {
            toast.error("Quantity exceeds available stock");
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch("/api/scholar/dispense", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    med_id: form.med_id,
                    quantity,
                    walkInName: form.name.trim(),
                    walkInContact: form.contact.trim() || null,
                    walkInNotes: form.notes.trim() || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error || "Failed to record walk-in dispense");
                return;
            }

            setDispenses((previous) => [data as DispenseRecord, ...previous]);
            setMedicines((previous) =>
                previous.map((medicine) =>
                    medicine.med_id === form.med_id
                        ? { ...medicine, quantity: Math.max(0, medicine.quantity - quantity) }
                        : medicine
                )
            );
            setForm({ name: "", contact: "", notes: "", med_id: "", quantity: "" });
            toast.success("Walk-in dispense recorded");
        } catch (error) {
            console.error(error);
            toast.error("Failed to record walk-in dispense");
        } finally {
            setSubmitting(false);
        }
    }

    if (initializing) {
        return <ScholarDispenseLoading />;
    }

    return (
        <ScholarLayout
            title="Walk-in dispensing"
            description="Log medicines provided to community walk-ins and highlight the scholars assisting them."
            actions={
                <Button
                    className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                    onClick={() => loadData()}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing
                        </>
                    ) : (
                        "Refresh"
                    )}
                </Button>
            }
        >
            <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6">
                <Card className="rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                    <CardHeader className="space-y-1 border-b border-green-100/70">
                        <CardTitle className="text-lg font-semibold text-green-700 sm:text-xl">
                            Record a walk-in dispense
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Capture walk-in details and medicine usage to keep the stock ledger balanced.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label className="font-medium text-green-700">Walk-in name</Label>
                                <Input
                                    value={form.name}
                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="Enter walk-in's name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-medium text-green-700">Contact number</Label>
                                <Input
                                    value={form.contact}
                                    onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
                                    placeholder="Optional contact information"
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label className="font-medium text-green-700">Medicine</Label>
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
                                <Label className="font-medium text-green-700">Quantity</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.quantity}
                                    onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                    placeholder="Enter quantity"
                                    required
                                />
                                {selectedMedicine ? (
                                    <p className="text-xs text-muted-foreground">
                                        Available stock: {selectedMedicine.quantity}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label className="font-medium text-green-700">Notes</Label>
                                <Textarea
                                    value={form.notes}
                                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                                    rows={3}
                                    placeholder="Optional context about the request"
                                />
                            </div>

                            <div className="sm:col-span-2 flex justify-end">
                                <Button
                                    type="submit"
                                    className="rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                                        </>
                                    ) : (
                                        "Record walk-in dispense"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border border-green-100/70 bg-white/85 shadow-sm">
                    <CardHeader className="border-b border-green-100/70">
                        <CardTitle className="text-lg font-semibold text-green-700 sm:text-xl">
                            Recent walk-in dispenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {dispenses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table className="min-w-full text-sm">
                                    <TableHeader className="bg-green-100/70 text-green-700">
                                        <TableRow>
                                            <TableHead>Clinic</TableHead>
                                            <TableHead>Walk-in</TableHead>
                                            <TableHead>Medicine</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Scholar</TableHead>
                                            <TableHead>Dispensed At</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dispenses.map((dispense) => (
                                            <TableRow key={dispense.dispense_id} className="hover:bg-green-50">
                                                <TableCell>{dispense.med.clinic.clinic_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-gray-800">
                                                            {dispense.walk_in_name ?? "—"}
                                                        </span>
                                                        {dispense.walk_in_contact ? (
                                                            <span className="text-xs text-gray-500">
                                                                Contact: {dispense.walk_in_contact}
                                                            </span>
                                                        ) : null}
                                                        {dispense.walk_in_notes ? (
                                                            <span className="text-xs text-gray-500">
                                                                Notes: {dispense.walk_in_notes}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{dispense.med.item_name}</TableCell>
                                                <TableCell>{dispense.quantity}</TableCell>
                                                <TableCell>{formatScholarName(dispense.scholar)}</TableCell>
                                                <TableCell>{formatManilaDateTime(dispense.createdAt) || "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No walk-in dispenses recorded yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </ScholarLayout>
    );
}
