"use client";

import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

import {
    formatAppointmentWindow,
    formatDepartment,
    formatProgram,
    formatStaffName,
    PATIENT_STATUS_CLASSES,
} from "@/lib/patient-format";

import type { PatientRecord } from "./types";

interface PatientsTableProps {
    records: PatientRecord[];
    loading: boolean;
    onSelect: (record: PatientRecord) => void;
}

function PatientsTableComponent({ records, loading, onSelect }: PatientsTableProps) {
    const rows = useMemo(() => {
        return records.map((record) => {
            const statusKey = record.status.toLowerCase();
            const statusClasses = PATIENT_STATUS_CLASSES[statusKey] ?? PATIENT_STATUS_CLASSES.inactive;

            return (
                <TableRow
                    key={`${record.patientType}-${record.id}`}
                    className="cursor-pointer text-sm transition hover:bg-green-50/60 focus-visible:bg-green-50/60"
                    tabIndex={0}
                    role="button"
                    onClick={() => onSelect(record)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelect(record);
                        }
                    }}
                >
                    <TableCell className="font-medium text-green-700">
                        <div className="flex flex-col">
                            <span>{record.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                                {record.contactno ? record.contactno : "No contact number"}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell>{record.patientId}</TableCell>
                    <TableCell>
                        <Badge className="rounded-full border-green-200 bg-green-50 text-green-700">
                            {record.patientType}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {record.patientType === "Student"
                            ? formatProgram(record.program) || "—"
                            : formatDepartment(record.department) || "—"}
                    </TableCell>
                    <TableCell>
                        <Badge className={`rounded-full px-2 py-1 text-xs ${statusClasses}`}>{record.status}</Badge>
                    </TableCell>
                    <TableCell>
                        {record.latestAppointment ? (
                            <div className="flex flex-col">
                                <span>{formatAppointmentWindow(record.latestAppointment)}</span>
                                <span className="text-xs text-muted-foreground">
                                    with {formatStaffName(record.latestAppointment.doctor)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                </TableRow>
            );
        });
    }, [records, onSelect]);

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                        <TableHead className="min-w-[200px]">Patient</TableHead>
                        <TableHead className="min-w-[140px]">ID</TableHead>
                        <TableHead className="min-w-[120px]">Type</TableHead>
                        <TableHead className="min-w-[160px]">Program / Department</TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[200px]">Latest appointment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                <div className="flex items-center justify-center gap-2 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading patient records...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                No patient records match your filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export const PatientsTable = memo(PatientsTableComponent);

