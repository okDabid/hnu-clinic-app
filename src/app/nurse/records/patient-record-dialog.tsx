"use client";

import { memo } from "react";
import { Loader2, Stethoscope } from "lucide-react";

import { formatManilaDateTime } from "@/lib/time";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import type { PatientRecord } from "./types";

export type RecordDetailsDialogTab = "details" | "update" | "notes";

interface RecordDetailsDialogProps {
    open: boolean;
    record: PatientRecord | null;
    activeTab: RecordDetailsDialogTab;
    onTabChange: (tab: RecordDetailsDialogTab) => void;
    onClose: () => void;
    onUpdateInfo: (event: React.FormEvent<HTMLFormElement>) => void;
    onSaveNotes: (event: React.FormEvent<HTMLFormElement>) => void;
    updatingPatientId: string | null;
    savingNotesPatientId: string | null;
}

function RecordDetailsDialogComponent({
    open,
    record,
    activeTab,
    onTabChange,
    onClose,
    onUpdateInfo,
    onSaveNotes,
    updatingPatientId,
    savingNotesPatientId,
}: RecordDetailsDialogProps) {
    if (!record) return null;

    const medicalHistoryText = formatMedicalHistory(parseMedicalHistory(record.medical_cond));
    const isUpdating = updatingPatientId === record.id;
    const isSavingNotes = savingNotesPatientId === record.id;
    const hasAppointment = Boolean(record.latestAppointment?.id);
    const initials = record.fullName
        .split(" ")
        .map((chunk) => chunk.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose();
                }
            }}
        >
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                <div className="space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-primary">Patient snapshot</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Review shared details before updating vitals or logging notes.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-primary">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 border border-primary/40 bg-white shadow-sm">
                                <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
                                    {initials || "PT"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-lg font-semibold">{record.fullName}</p>
                                <p className="text-xs font-medium uppercase tracking-wide text-primary/70">
                                    {record.patientType}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 rounded-xl bg-white/60 p-3 text-sm text-primary sm:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary/70">Patient ID</p>
                                <p className="font-semibold">{record.patientId}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary/70">Date of birth</p>
                                <p className="font-semibold">{formatDateOnly(record.date_of_birth)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary/70">Gender</p>
                                <p className="font-semibold">{record.gender ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-primary/70">Latest status</p>
                                <p className="font-semibold">{record.status}</p>
                            </div>
                        </div>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => onTabChange(value as RecordDetailsDialogTab)}
                        className="space-y-4"
                    >
                        <div className="flex justify-center">
                            <TabsList className="flex flex-wrap gap-2">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="update">Update Info</TabsTrigger>
                                <TabsTrigger value="notes">Consultation Notes</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                <p>
                                    <strong>Contact:</strong> {record.contactno || "—"}
                                </p>
                                <p>
                                    <strong>Address:</strong> {record.address || "—"}
                                </p>
                                <p>
                                    <strong>Blood Type:</strong> {formatBloodType(record.bloodtype)}
                                </p>
                                <p>
                                    <strong>Allergies:</strong> {record.allergies || "—"}
                                </p>
                                <p>
                                    <strong>Medical Conditions:</strong> {medicalHistoryText || "—"}
                                </p>
                                <p>
                                    <strong>Emergency:</strong> {record.emergency?.name || "—"} ({
                                        record.emergency?.relation || "—"
                                    }) – {record.emergency?.num || "—"}
                                </p>
                                {record.patientType === "Student" ? (
                                    <>
                                        <p>
                                            <strong>Department:</strong> {formatDepartment(record.department)}
                                        </p>
                                        <p>
                                            <strong>Program:</strong> {formatProgram(record.program)}
                                        </p>
                                        <p>
                                            <strong>Year Level:</strong> {formatYearLevel(record.year_level)}
                                        </p>
                                    </>
                                ) : null}
                            </div>

                            <Separator />

                            <div className="space-y-3 text-sm">
                                <h4 className="flex items-center gap-2 font-semibold text-primary">
                                    <Stethoscope className="h-4 w-4" /> Latest appointment
                                </h4>
                                {record.latestAppointment?.timestart ? (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <p>
                                            <strong>Schedule:</strong> {formatAppointmentWindow(record.latestAppointment)}
                                        </p>
                                        <p>
                                            <strong>Doctor:</strong> {formatStaffName(record.latestAppointment.doctor)}
                                        </p>
                                        <p>
                                            <strong>Nurse:</strong>{" "}
                                            {formatStaffName(record.latestAppointment.consultation?.nurse)}
                                        </p>
                                        <p>
                                            <strong>Appointment ID:</strong> {record.latestAppointment.id}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No recent appointment on file.</p>
                                )}

                                {record.latestAppointment?.consultation ? (
                                    <div className="space-y-1 rounded-md border bg-muted/40 p-3">
                                        <p className="text-sm font-semibold text-primary">Consultation Notes</p>
                                        <p>
                                            <strong>Reason:</strong> {record.latestAppointment.consultation.reason_of_visit || "—"}
                                        </p>
                                        <p>
                                            <strong>Findings:</strong> {record.latestAppointment.consultation.findings || "—"}
                                        </p>
                                        <p>
                                            <strong>Diagnosis:</strong> {record.latestAppointment.consultation.diagnosis || "—"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Updated by {formatStaffName(record.latestAppointment.consultation.doctor)} on {" "}
                                            {formatManilaDateTime(record.latestAppointment.consultation.updatedAt) || "—"}
                                        </p>
                                    </div>
                                ) : null}
                            </div>

                            <Separator />

                            <div className="space-y-3 text-sm">
                                <h4 className="font-semibold text-primary">Appointment history</h4>
                                {record.appointments.length ? (
                                    <div className="space-y-2">
                                        {record.appointments.map((appointment) => {
                                            const purpose =
                                                appointment.service_type ||
                                                appointment.consultation?.reason_of_visit ||
                                                appointment.remarks ||
                                                "—";

                                            return (
                                                <div
                                                    key={appointment.id}
                                                    className="rounded-lg border border-primary/10 bg-muted/30 p-3"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="font-semibold">
                                                            {formatAppointmentWindow(appointment)}
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className="border-primary/30 bg-white text-primary"
                                                        >
                                                            {appointment.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Doctor: {formatStaffName(appointment.doctor)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Purpose: {purpose}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No appointments recorded yet.</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="update" className="space-y-4">
                            <form onSubmit={onUpdateInfo} className="space-y-3">
                                <div>
                                    <Label className="mb-1 block font-medium" htmlFor="medical_cond">
                                        Medical Conditions
                                    </Label>
                                    <Input
                                        id="medical_cond"
                                        name="medical_cond"
                                        defaultValue={medicalHistoryText}
                                        placeholder="e.g. Asthma, Hypertension, other details"
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium" htmlFor="allergies">
                                        Allergies
                                    </Label>
                                    <Input
                                        id="allergies"
                                        name="allergies"
                                        defaultValue={record.allergies || ""}
                                        placeholder="e.g. Penicillin, Peanuts"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="bg-primary text-white hover:bg-primary/90"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        "Save info"
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="notes" className="space-y-4">
                            <form onSubmit={onSaveNotes} className="space-y-3">
                                {!hasAppointment ? (
                                    <p className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                                        This patient has no active appointment. You cannot save consultation notes without an
                                        appointment.
                                    </p>
                                ) : null}
                                <div>
                                    <Label className="mb-1 block font-medium" htmlFor="reason_of_visit">
                                        Reason of Visit
                                    </Label>
                                    <Input
                                        id="reason_of_visit"
                                        name="reason_of_visit"
                                        defaultValue={record.latestAppointment?.consultation?.reason_of_visit || ""}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium" htmlFor="findings">
                                        Findings
                                    </Label>
                                    <Input
                                        id="findings"
                                        name="findings"
                                        defaultValue={record.latestAppointment?.consultation?.findings || ""}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium" htmlFor="diagnosis">
                                        Diagnosis
                                    </Label>
                                    <Input
                                        id="diagnosis"
                                        name="diagnosis"
                                        defaultValue={record.latestAppointment?.consultation?.diagnosis || ""}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isSavingNotes || !hasAppointment}
                                    className="bg-primary text-white hover:bg-primary/90"
                                >
                                    {isSavingNotes ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : hasAppointment ? (
                                        "Save notes"
                                    ) : (
                                        "No appointment"
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const RecordDetailsDialog = memo(RecordDetailsDialogComponent);

