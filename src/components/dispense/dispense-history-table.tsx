import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatManilaDateTime } from "@/lib/time";
import { Loader2 } from "lucide-react";

export type DispenseBatchUsage = {
    id?: string;
    quantity_used: number;
    expiry_date: string;
    date_received: string;
};

export type DispenseHistoryRow = {
    id: string;
    clinicName: string;
    recipient: string;
    visitType: "Consultation" | "Walk-in";
    medicineName: string;
    medicineClinic: string;
    quantity: number;
    doctorName: string;
    nurseName: string;
    scholarName: string;
    createdAt: string;
    batches: DispenseBatchUsage[];
    walkInContact?: string | null;
    walkInNotes?: string | null;
};

interface DispenseHistoryTableProps {
    rows: DispenseHistoryRow[];
    loading?: boolean;
    emptyMessage?: string;
}

function formatDate(value: string) {
    return (
        formatManilaDateTime(value, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: undefined,
            minute: undefined,
        }) || "—"
    );
}

function formatDateTime(value: string) {
    return formatManilaDateTime(value) || "—";
}

export function DispenseHistoryTable({ rows, loading = false, emptyMessage }: DispenseHistoryTableProps) {
    return (
        <div className="overflow-x-auto w-full">
            <Table className="min-w-full text-sm">
                <TableHeader className="bg-primary/10 text-primary">
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
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading records...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : rows.length > 0 ? (
                        rows.map((row) => (
                            <TableRow key={row.id} className="transition hover:bg-primary/10">
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.7rem] font-semibold text-primary"
                                    >
                                        {row.clinicName}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-gray-900">{row.recipient}</span>
                                        {row.visitType === "Walk-in" && (row.walkInContact || row.walkInNotes) ? (
                                            <>
                                                {row.walkInContact ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        Contact: {row.walkInContact}
                                                    </span>
                                                ) : null}
                                                {row.walkInNotes ? (
                                                    <span className="text-xs text-muted-foreground">Notes: {row.walkInNotes}</span>
                                                ) : null}
                                            </>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={
                                            row.visitType === "Consultation"
                                                ? "rounded-full border-primary/30 bg-primary/15/80 px-3 py-1 text-[0.7rem] font-semibold text-primary"
                                                : "rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-[0.7rem] font-semibold text-amber-600"
                                        }
                                    >
                                        {row.visitType}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{row.medicineName}</span>
                                        <span className="text-xs text-muted-foreground">{row.medicineClinic}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className="rounded-full bg-primary/10 px-3 py-1 text-[0.75rem] font-semibold text-primary">
                                        ×{row.quantity}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-gray-800">{row.doctorName}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-gray-800">{row.nurseName}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-gray-800">{row.scholarName}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">{formatDateTime(row.createdAt)}</span>
                                </TableCell>
                                <TableCell>
                                    {row.batches.length > 0 ? (
                                        <ul className="space-y-2 text-xs text-muted-foreground">
                                            {row.batches.map((batch, index) => (
                                                <li
                                                    key={batch.id ?? index}
                                                    className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between text-[0.7rem] font-semibold text-primary">
                                                        <span>Batch usage</span>
                                                        <span>−{batch.quantity_used}</span>
                                                    </div>
                                                    <div className="mt-1 space-y-1 text-[0.65rem] text-muted-foreground">
                                                        <p>Expiry: {formatDate(batch.expiry_date)}</p>
                                                        <p>Received: {formatDate(batch.date_received)}</p>
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
                            <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                                {emptyMessage ?? "No dispense records found"}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
