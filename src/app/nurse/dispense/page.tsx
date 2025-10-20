"use client";

import { useEffect, useState } from "react";

import { NurseLayout } from "@/components/nurse/nurse-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatManilaDateTime } from "@/lib/time";

// Extend Dispense type to include batch usage
type Dispense = {
    dispense_id: string;
    quantity: number;
    createdAt: string;
    med: {
        item_name: string;
        clinic: { clinic_name: string };
    };
    consultation: {
        appointment: {
            patient: { username: string };
            clinic: { clinic_name: string };
        };
        doctor: { username: string } | null;
        nurse: { username: string } | null;
    };
    dispenseBatches: {
        quantity_used: number;
        replenishment: {
            expiry_date: string;
            date_received: string;
        };
    }[];
};

export default function NurseDispensePage() {
    const [dispenses, setDispenses] = useState<Dispense[]>([]);

    async function loadDispenses() {
        const res = await fetch("/api/nurse/dispense", { cache: "no-store" });
        const data = await res.json();
        setDispenses(data);
    }

    useEffect(() => {
        loadDispenses();
    }, []);



    return (
        <NurseLayout
            title="Dispense Records"
            description="Monitor dispensed medicines and review batch usage for accurate stock tracking."
        >
            <section className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-8">
                <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader className="border-b border-green-100/60">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                            Dispense History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-4">
                        <div className="overflow-x-auto w-full">
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
                                            <TableRow key={d.dispense_id} className="transition hover:bg-green-50">
                                                <TableCell>{d.med.clinic.clinic_name}</TableCell>
                                                <TableCell>{d.consultation.appointment.patient.username}</TableCell>
                                                <TableCell>{d.med.item_name}</TableCell>
                                                <TableCell>{d.quantity}</TableCell>
                                                <TableCell>
                                                    {d.consultation.doctor?.username || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {d.consultation.nurse?.username || "—"}
                                                </TableCell>
                                                <TableCell>{formatManilaDateTime(d.createdAt) || "—"}</TableCell>
                                                <TableCell>
                                                    {d.dispenseBatches.length > 0 ? (
                                                        <ul className="space-y-1 text-sm text-gray-700">
                                                            {d.dispenseBatches.map((batch, i) => (
                                                                <li key={i}>
                                                                    <span className="font-medium">{batch.quantity_used}</span>{" "}
                                                                    used from batch (Expiry: {new Date(batch.replenishment.expiry_date).toLocaleDateString()}, Received: {new Date(batch.replenishment.date_received).toLocaleDateString()})
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
                                            <TableCell colSpan={8} className="py-6 text-center text-gray-500">
                                                No dispense records found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );

}
