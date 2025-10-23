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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { PatientRecord } from "./types";

interface PatientDetailDialogProps {
    open: boolean;
    record: PatientRecord | null;
    onClose: () => void;
}

function PatientDetailDialogComponent({ open, record, onClose }: PatientDetailDialogProps) {
    if (!record) return null;

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
            <DialogContent className="max-h-[80vh] overflow-y-auto rounded-3xl sm:max-w-3xl sm:max-h-none">
                <DialogHeader>
                    <DialogTitle className="text-xl text-green-700">Patient snapshot</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Contact details and medical notes shared with the clinic team.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 text-sm">
                    <div className="rounded-2xl bg-green-50/70 p-4 text-green-700">
                        <p className="text-lg font-semibold">{record.fullName}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-green-500">Patient ID</p>
                                <p className="font-medium text-green-700">{record.patientId}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-green-500">Type</p>
                                <p className="font-medium text-green-700">{record.patientType}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-green-500">Date of birth</p>
                                <p className="font-medium text-green-700">{formatDateOnly(record.date_of_birth)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-green-500">Gender</p>
                                <p className="font-medium text-green-700">{record.gender ?? "—"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-green-700">
                                <Users2 className="h-4 w-4" /> Academic / department info
                            </h4>
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
                        </div>
                        <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-green-700">
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
                                    <dd>{record.medical_cond || "—"}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                            <h4 className="text-sm font-semibold text-green-700">Contact information</h4>
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
                        <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                            <h4 className="text-sm font-semibold text-green-700">Emergency contact</h4>
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

                    <div className="space-y-3 rounded-2xl border border-green-100 bg-white/70 p-4">
                        <h4 className="text-sm font-semibold text-green-700">Latest appointment</h4>
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

