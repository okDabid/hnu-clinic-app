"use client";

import { useEffect, useMemo, useState } from "react";

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
import { Badge } from "@/components/ui/badge";
import { formatManilaDateTime } from "@/lib/time";

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
    walk_in_name: string | null;
    walk_in_contact: string | null;
    walk_in_notes: string | null;
    scholar: {
        username: string;
        student: { fname: string | null; mname: string | null; lname: string | null } | null;
        employee: { fname: string | null; mname: string | null; lname: string | null } | null;
    } | null;
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
    const [initializing, setInitializing] = useState(true);

    const { total, consultations, walkIns, latestDispense, totalQuantity } = useMemo(() => {
        let walkInCount = 0;
        let latest: string | null = null;
        let quantityTotal = 0;

        for (const record of dispenses) {
            if (!record.consultation) {
                walkInCount += 1;
            }

            quantityTotal += Number(record.quantity) || 0;

            if (!latest || new Date(record.createdAt).getTime() > new Date(latest).getTime()) {
                latest = record.createdAt;
            }
        }

        return {
            total: dispenses.length,
            consultations: dispenses.length - walkInCount,
            walkIns: walkInCount,
            latestDispense: latest,
            totalQuantity: quantityTotal,
        };
    }, [dispenses]);

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

    function formatStaffName(
        staff:
            | {
                  username: string;
                  student: { fname: string | null; mname: string | null; lname: string | null } | null;
                  employee: { fname: string | null; mname: string | null; lname: string | null } | null;
              }
            | null
    ) {
        if (!staff) return "—";

        const fromStudent = staff.student
            ? [staff.student.fname, staff.student.mname, staff.student.lname].filter(Boolean).join(" ")
            : "";

        if (fromStudent) {
            return fromStudent;
        }

        const fromEmployee = staff.employee
            ? [staff.employee.fname, staff.employee.mname, staff.employee.lname].filter(Boolean).join(" ")
            : "";

        return fromEmployee || staff.username || "—";
    }



    if (initializing) {
        return <NurseDispenseLoading />;
    }

    return (
        <NurseLayout
            title="Dispense Records"
            description="Monitor dispensed medicines and review batch usage for accurate stock tracking."
        >
            <section className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card className="rounded-3xl border border-green-100/70 bg-gradient-to-br from-green-50 via-white to-green-100/60 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total dispenses</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-3xl font-bold text-green-700">{total}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {totalQuantity > 0 ? `${totalQuantity} total items issued` : "No medicines dispensed yet."}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Consultations served</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-3xl font-bold text-green-700">{consultations}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Dispenses linked to consultations handled by the clinic team.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Walk-ins assisted</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-3xl font-bold text-green-700">{walkIns}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Walk-ins coordinated with scholars for medicine requests.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Last dispense</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-lg font-semibold text-green-700">
                                {latestDispense ? formatManilaDateTime(latestDispense) : "Awaiting first record"}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Timestamps are adjusted to Manila local time.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader className="border-b border-green-100/60">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                            Dispense History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-4">
                        <div className="overflow-x-auto w-full">
                            <Table className="min-w-full text-sm">
                                <TableHeader className="bg-green-50 text-green-700">
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">Clinic</TableHead>
                                        <TableHead className="whitespace-nowrap">Recipient</TableHead>
                                        <TableHead className="whitespace-nowrap">Visit Type</TableHead>
                                        <TableHead className="whitespace-nowrap">Medicine</TableHead>
                                        <TableHead className="whitespace-nowrap">Quantity</TableHead>
                                        <TableHead className="whitespace-nowrap">Doctor</TableHead>
                                        <TableHead className="whitespace-nowrap">Nurse</TableHead>
                                        <TableHead className="whitespace-nowrap">Scholar</TableHead>
                                        <TableHead className="whitespace-nowrap">Dispensed At</TableHead>
                                        <TableHead className="whitespace-nowrap">Batch Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dispenses.length > 0 ? (
                                        dispenses.map((d) => (
                                            <TableRow key={d.dispense_id} className="transition hover:bg-green-50">
                                                <TableCell>
                                                    <Badge
                                                        className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[0.7rem] font-semibold text-green-700"
                                                        variant="outline"
                                                    >
                                                        {d.consultation?.appointment?.clinic?.clinic_name ??
                                                            d.med.clinic.clinic_name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-gray-900">
                                                            {d.consultation?.appointment?.patient?.username ??
                                                                d.walk_in_name ??
                                                                "—"}
                                                        </span>
                                                        {!d.consultation && (
                                                            <>
                                                                {d.walk_in_contact ? (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Contact: {d.walk_in_contact}
                                                                    </span>
                                                                ) : null}
                                                                {d.walk_in_notes ? (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Notes: {d.walk_in_notes}
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            d.consultation
                                                                ? "rounded-full border-green-200 bg-green-100/80 px-3 py-1 text-[0.7rem] font-semibold text-green-700"
                                                                : "rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-[0.7rem] font-semibold text-amber-600"
                                                        }
                                                    >
                                                        {d.consultation ? "Consultation" : "Walk-in"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{d.med.item_name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {d.med.clinic.clinic_name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="rounded-full bg-green-600/10 px-3 py-1 text-[0.75rem] font-semibold text-green-700">
                                                        ×{d.quantity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {d.consultation?.doctor?.username || "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {d.consultation?.nurse?.username || "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {formatStaffName(d.scholar)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatManilaDateTime(d.createdAt) || "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {d.dispenseBatches.length > 0 ? (
                                                        <ul className="space-y-2 text-xs text-muted-foreground">
                                                            {d.dispenseBatches.map((batch, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="rounded-2xl border border-green-100 bg-green-50/60 px-3 py-2 shadow-sm"
                                                                >
                                                                    <div className="flex items-center justify-between text-[0.7rem] font-semibold text-green-700">
                                                                        <span>Batch usage</span>
                                                                        <span>−{batch.quantity_used}</span>
                                                                    </div>
                                                                    <div className="mt-1 space-y-1 text-[0.65rem] text-muted-foreground">
                                                                        <p>Expiry: {new Date(batch.replenishment.expiry_date).toLocaleDateString()}</p>
                                                                        <p>Received: {new Date(batch.replenishment.date_received).toLocaleDateString()}</p>
                                                                    </div>
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
                                            <TableCell colSpan={10} className="py-6 text-center text-gray-500">
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
