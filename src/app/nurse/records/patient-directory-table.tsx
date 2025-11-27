"use client";

import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    formatYearLevel,
    PATIENT_STATUS_CLASSES,
} from "@/lib/patient-format";

import type { PatientRecord } from "./types";

interface PatientDirectoryTableProps {
    records: PatientRecord[];
    loading: boolean;
    onOpenDetails: (record: PatientRecord) => void;
    totalRecords: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

function PatientDirectoryTableComponent({
    records,
    loading,
    onOpenDetails,
    totalRecords,
    pageSize,
    currentPage,
    onPageChange,
}: PatientDirectoryTableProps) {
    const rows = useMemo(() => {
        return records.map((record) => {
            const statusKey = record.status.toLowerCase();
            const statusClasses = PATIENT_STATUS_CLASSES[statusKey] ?? PATIENT_STATUS_CLASSES.inactive;

            return (
                <TableRow
                    key={record.id}
                    className="cursor-pointer text-sm transition hover:bg-primary/10/60 focus-visible:bg-primary/10/60"
                    tabIndex={0}
                    role="button"
                    onClick={() => onOpenDetails(record)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onOpenDetails(record);
                        }
                    }}
                >
                    <TableCell className="font-medium text-primary">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-primary/20 bg-primary/5">
                                <AvatarFallback className="text-xs font-semibold text-primary">
                                    {record.fullName
                                        .split(" ")
                                        .map((chunk) => chunk.charAt(0))
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase() || "PT"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span>{record.fullName}</span>
                                <span className="text-xs text-muted-foreground">
                                    {record.contactno ? record.contactno : "No contact number"}
                                </span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{record.patientId}</TableCell>
                    <TableCell>
                        <Badge className="rounded-full border-primary/30 bg-primary/10 text-primary">
                            {record.patientType}
                        </Badge>
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap text-muted-foreground">
                        {record.patientType === "Student" ? (
                            <>
                                <span className="block font-medium text-foreground">
                                    {formatDepartment(record.department)}
                                </span>
                                <span className="block">{formatProgram(record.program)}</span>
                                <span className="block text-xs text-muted-foreground">
                                    {formatYearLevel(record.year_level)}
                                </span>
                            </>
                        ) : (
                            <span className="block font-medium text-foreground">
                                {formatDepartment(record.department_office)}
                            </span>
                        )}
                    </TableCell>
                    <TableCell>
                        <Badge className={`rounded-full px-2 py-1 text-xs ${statusClasses}`}>{record.status}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap">
                        {record.latestAppointment?.timestart ? (
                            <div className="flex flex-col">
                                <span>{formatAppointmentWindow(record.latestAppointment)}</span>
                                <span className="text-xs text-muted-foreground">
                                    Doctor: {formatStaffName(record.latestAppointment.doctor)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Nurse: {formatStaffName(record.latestAppointment.consultation?.nurse)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </TableCell>
                </TableRow>
            );
        });
    }, [records, onOpenDetails]);

    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = totalRecords === 0 ? 0 : Math.min(startIndex + records.length - 1, totalRecords);

    return (
        <div className="overflow-x-auto">
            <Table className="min-w-full text-sm">
                <TableHeader>
                    <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                        <TableHead className="min-w-[220px]">Patient</TableHead>
                        <TableHead className="min-w-[140px]">ID</TableHead>
                        <TableHead className="min-w-[120px]">Type</TableHead>
                        <TableHead className="min-w-[220px]">Program / Department</TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[220px]">Latest appointment</TableHead>
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

            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                    Showing {startIndex}-{endIndex} of {totalRecords}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading || currentPage <= 1}
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    >
                        Previous
                    </Button>
                    <span className="text-xs">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading || currentPage >= totalPages}
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

export const PatientDirectoryTable = memo(PatientDirectoryTableComponent);

