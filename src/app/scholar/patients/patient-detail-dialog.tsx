"use client";

import { memo } from "react";
import { HeartPulse, Users2 } from "lucide-react";

import {
    formatAppointmentWindow,
    formatBloodType,
    formatDateOnly,
    formatDepartment,
    formatProgram,
    formatStaffName,
    formatYearLevel,
} from "@/lib/patient-format";
import { formatMedicalHistory, parseMedicalHistory } from "@/lib/medical-history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { PreparedPatientRecord } from "./types";

interface PatientDetailDialogProps {
    open: boolean;
    record: PreparedPatientRecord | null;
    onClose: () => void;
}

function PatientDetailDialogComponent({ open, record, onClose }: PatientDetailDialogProps) {
    if (!record) return null;

    const medicalHistoryText = formatMedicalHistory(parseMedicalHistory(record.medical_cond));
    const medcert = record.latestAppointment?.consultation?.medcert;
    const medcertStatusClasses =
        medcert?.status === "Valid"
            ? "border-emerald-200 bg-primary/10 text-primary"
            : "border-slate-200 bg-slate-100 text-slate-600";

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-primary">Patient snapshot</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Contact details and medical notes shared with the clinic team.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 text-sm">
                    <div className="rounded-2xl bg-primary/10/70 p-4 text-primary">
                        <p className="text-lg font-semibold">{record.fullName}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary">Patient ID</p>
                                <p className="font-medium text-primary">{record.patientId}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary">Type</p>
                                <p className="font-medium text-primary">{record.patientType}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary">Date of birth</p>
                                <p className="font-medium text-primary">{formatDateOnly(record.date_of_birth)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary">Gender</p>
                                <p className="font-medium text-primary">{record.gender ?? "—"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3 rounded-2xl border border-primary/20 bg-white/70 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <Users2 className="h-4 w-4" /> Academic / department info
                            </h4>
                            {record.patientType === "Student" ? (
                                <dl className="grid gap-2 text-muted-foreground">
                                    <div>
                                        <dt className="text-xs uppercase tracking-wide">Program</dt>
                                        <dd>{formatProgram(record.program)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-wide">Department</dt>
                                        <dd>{formatDepartment(record.department)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-wide">Year level</dt>
                                        <dd>{formatYearLevel(record.year_level)}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <dl className="grid gap-2 text-muted-foreground">
                                    <div>
                                        <dt className="text-xs uppercase tracking-wide">Department / Office</dt>
                                        <dd>{formatDepartment(record.department_office)}</dd>
                                    </div>
                                </dl>
                            )}
                        </div>
                        <div className="space-y-3 rounded-2xl border border-primary/20 bg-white/70 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <HeartPulse className="h-4 w-4" /> Medical details
                            </h4>
                            <dl className="grid gap-2 text-muted-foreground">
                                <div>
                                    <dt className="text-xs uppercase tracking-wide">Blood type</dt>
                                    <dd>{formatBloodType(record.bloodtype)}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase tracking-wide">Allergies</dt>
                                    <dd>{record.allergies || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase tracking-wide">Medical conditions</dt>
                                    <dd>{medicalHistoryText || "—"}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3 rounded-2xl border border-primary/20 bg-white/70 p-4">
                            <h4 className="text-sm font-semibold text-primary">Contact information</h4>
                            <dl className="grid gap-2 text-muted-foreground">
                                <div>
                                    <dt className="text-xs uppercase tracking-wide">Phone</dt>
                                    <dd>{record.contactno || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase tracking-wide">Address</dt>
                                    <dd>{record.address || "—"}</dd>
                                </div>
                            </dl>
                        </div>
                        <div className="space-y-3 rounded-2xl border border-primary/20 bg-white/70 p-4">
                            <h4 className="text-sm font-semibold text-primary">Emergency contact</h4>
                            <dl className="grid gap-2 text-muted-foreground">
                                <div>
                                    <dt className="text-xs uppercase tracking-wide">Name</dt>
                                    <dd>{record.emergency?.name || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase tracking-wide">Relation</dt>
                                    <dd>{record.emergency?.relation || "—"}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase tracking-wide">Contact number</dt>
                                    <dd>{record.emergency?.num || "—"}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-primary/20 bg-white/70 p-4">
                        <h4 className="text-sm font-semibold text-primary">Latest appointment</h4>
                        {record.latestAppointment ? (
                            <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                                <div>
                                    <p className="text-xs uppercase tracking-wide">Schedule</p>
                                    <p>{formatAppointmentWindow(record.latestAppointment)}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide">Doctor</p>
                                    <p>{formatStaffName(record.latestAppointment.doctor)}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-xs uppercase tracking-wide">Consultation notes</p>
                                    <p>
                                        {record.latestAppointment.consultation?.diagnosis ||
                                            record.latestAppointment.consultation?.findings ||
                                            record.latestAppointment.consultation?.reason_of_visit ||
                                            "No notes provided"}
                                    </p>
                                </div>
                                {medcert ? (
                                    <div className="sm:col-span-2">
                                        <div className="flex flex-wrap items-center gap-2 text-primary">
                                            <p className="text-xs uppercase tracking-wide">Medical certificate</p>
                                            <Badge
                                                variant="outline"
                                                className={`rounded-full px-2 py-1 text-[11px] ${medcertStatusClasses}`}
                                            >
                                                {medcert.status}
                                            </Badge>
                                        </div>
                                        <div className="mt-1 space-y-1 text-muted-foreground">
                                            <p>
                                                <strong>Issued on:</strong> {formatDateOnly(medcert.issueDate)}
                                            </p>
                                            <p>
                                                <strong>Valid until:</strong> {formatDateOnly(medcert.validUntil)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Certificate ID: {medcert.id}</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No appointment history attached yet.</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" className="rounded-xl" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const PatientDetailDialog = memo(PatientDetailDialogComponent);

