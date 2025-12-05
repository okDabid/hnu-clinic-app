"use client";

import { useEffect, useMemo, useState } from "react";

import { NurseLayout } from "@/components/nurse/nurse-layout";
import { DispenseHistoryTable, DispenseHistoryRow } from "@/components/dispense/dispense-history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatManilaDateTime } from "@/lib/time";
import { summarizeDispenses } from "@/lib/dispense-summary";
import { formatProfileName } from "@/lib/staff-name";

import NurseDispenseLoading from "./loading";

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
        username: string;
        student: { fname: string | null; mname: string | null; lname: string | null } | null;
        employee: { fname: string | null; mname: string | null; lname: string | null } | null;
    } | null;
    dispenseBatches: {
        id?: string;
        quantity_used: number;
        replenishment: {
            expiry_date: string;
            date_received: string;
        };
    }[];
};

export default function NurseDispensePage() {
    const [dispenses, setDispenses] = useState<Dispense[]>([]);
    const [initializing, setInitializing] = useState(true);

    const { total, consultations, walkIns, latestDispense, totalQuantity } = useMemo(
        () => summarizeDispenses(dispenses),
        [dispenses]
    );

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

    async function loadDispenses() {
        try {
            const res = await fetch("/api/nurse/dispense", { cache: "no-store" });
            if (!res.ok) {
                throw new Error("Failed to load dispense records");
            }
            const data = await res.json();
            setDispenses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setInitializing(false);
        }
    }

    useEffect(() => {
        loadDispenses();
    }, []);

    if (initializing) {
        return <NurseDispenseLoading />;
    }

    return (
        <NurseLayout
            title="Dispense Records"
            description="Monitor dispensed medicines and review batch usage for accurate stock tracking."
        >
            <section className="mx-auto w-full max-w-5xl space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-white  to-primary/5/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total dispenses</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-3xl font-bold text-primary">{total}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {totalQuantity > 0 ? `${totalQuantity} total items issued` : "No medicines dispensed yet."}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border border-primary/20 bg-white/90 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Consultations served</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-3xl font-bold text-primary">{consultations}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Dispenses linked to consultations handled by the clinic team.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border border-primary/20 bg-white/90 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Walk-ins assisted</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-3xl font-bold text-primary">{walkIns}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Walk-ins coordinated with scholars for medicine requests.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border border-primary/20 bg-white/90 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Last dispense</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-lg font-semibold text-primary">
                                {latestDispense ? formatManilaDateTime(latestDispense) : "Awaiting first record"}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Timestamps are adjusted to Manila local time.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex flex-col rounded-3xl border border-primary/20 bg-white/80 shadow-sm transition hover:-translate-y-px hover:shadow-md">
                    <CardHeader className="border-b border-primary/20/60">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                            Dispense History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-4">
                        <DispenseHistoryTable rows={tableRows} />
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );

}
