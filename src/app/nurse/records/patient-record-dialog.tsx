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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    const isUpdating = updatingPatientId === record.id;
    const isSavingNotes = savingNotesPatientId === record.id;
    const hasAppointment = Boolean(record.latestAppointment?.id);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose();
                }
            }}
        >
            <DialogContent className="max-h-[80vh] overflow-y-auto rounded-3xl sm:max-w-3xl sm:max-h-none">
                <div className="space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-green-700">Patient snapshot</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Review shared details before updating vitals or logging notes.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-2xl bg-green-50/70 p-4 text-green-700">
                        <p className="text-lg font-semibold">{record.fullName}</p>
                        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
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
                                    <strong>Medical Conditions:</strong> {record.medical_cond || "—"}
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
                                <h4 className="flex items-center gap-2 font-semibold text-green-600">
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
                                        <p className="text-sm font-semibold text-green-600">Consultation Notes</p>
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
                        </TabsContent>

                        <TabsContent value="update" className="space-y-4">
                            <form onSubmit={onUpdateInfo} className="space-y-3">
                                <div>
                                    <Label className="mb-1 block font-medium" htmlFor="medical_cond">
                                        Medical Conditions
                                    </Label>
                                    <Input id="medical_cond" name="medical_cond" defaultValue={record.medical_cond || ""} />
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
                                    className="bg-green-600 text-white hover:bg-green-700"
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
                                        This patient has no active appointment. Approve or schedule one to record consultation
                                        notes.
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
                                    className="bg-green-600 text-white hover:bg-green-700"
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

