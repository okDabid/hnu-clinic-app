"use client";

import dynamic from "next/dynamic";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle, BadgeCheck, RefreshCcw, Search, Users2 } from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { parseMedicalHistory, serializeMedicalHistory } from "@/lib/medical-history";

import DoctorPatientsLoading from "./loading";
import { PatientDirectoryTable } from "@/app/nurse/records/patient-directory-table";
import type { RecordDetailsDialogTab } from "@/app/nurse/records/patient-record-dialog";
import type { PatientRecord } from "@/app/nurse/records/types";
import { usePagination } from "@/hooks/use-pagination";

const RecordDetailsDialog = dynamic(
    () => import("@/app/nurse/records/patient-record-dialog").then((mod) => mod.RecordDetailsDialog),
    {
        loading: () => (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading patient details…</div>
        ),
        ssr: false,
    }
);

export default function DoctorPatientsPage() {
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [appointmentFilter, setAppointmentFilter] = useState("All");
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
    const [activeTab, setActiveTab] = useState<RecordDetailsDialogTab>("details");
    const [updatingPatientId, setUpdatingPatientId] = useState<string | null>(null);
    const [savingNotesPatientId, setSavingNotesPatientId] = useState<string | null>(null);
    const [isRefreshing, startTransition] = useTransition();

    const deferredSearch = useDeferredValue(search.trim().toLowerCase());

    const loadRecords = useCallback(async () => {
        try {
            setLoadingRecords(true);
            const res = await fetch("/api/doctor/patients", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to load records");
            const data: PatientRecord[] = await res.json();
            startTransition(() => {
                setRecords(data);
            });
        } catch (error) {
            console.error(error);
            toast.error("Error loading patient records.");
        } finally {
            setLoadingRecords(false);
            setInitializing(false);
        }
    }, [startTransition]);

    useEffect(() => {
        void loadRecords();
    }, [loadRecords]);

    useEffect(() => {
        if (!selectedRecord) return;
        const latest = records.find((record) => record.id === selectedRecord.id);
        if (latest && latest !== selectedRecord) {
            setSelectedRecord(latest);
        }
    }, [records, selectedRecord]);

    const filteredRecords = useMemo(() => {
        if (!deferredSearch && statusFilter === "All" && typeFilter === "All" && appointmentFilter === "All") {
            return records;
        }

        return records.filter((record) => {
            const matchesSearch =
                record.fullName.toLowerCase().includes(deferredSearch) ||
                record.patientId.toLowerCase().includes(deferredSearch) ||
                record.patientType.toLowerCase().includes(deferredSearch) ||
                (record.department ?? "").toLowerCase().includes(deferredSearch) ||
                (record.department_office ?? "").toLowerCase().includes(deferredSearch) ||
                (record.program ?? "").toLowerCase().includes(deferredSearch);

            const matchesStatus = statusFilter === "All" || record.status === statusFilter;
            const matchesType = typeFilter === "All" || record.patientType === typeFilter;
            const matchesAppointment =
                appointmentFilter === "All" ||
                (appointmentFilter === "With" && record.latestAppointment) ||
                (appointmentFilter === "Without" && !record.latestAppointment);

            return matchesSearch && matchesStatus && matchesType && matchesAppointment;
        });
    }, [appointmentFilter, deferredSearch, records, statusFilter, typeFilter]);

    const { pageItems: paginatedRecords, currentPage, pageSize, setPage } = usePagination(filteredRecords, {
        resetDeps: [appointmentFilter, deferredSearch, statusFilter, typeFilter],
    });

    const totalPatients = records.length;
    const withAppointments = useMemo(
        () => records.filter((record) => Boolean(record.latestAppointment)).length,
        [records]
    );
    const withoutAppointments = totalPatients - withAppointments;

    function openDetails(record: PatientRecord, tab: RecordDetailsDialogTab = "details") {
        setSelectedRecord(record);
        setActiveTab(tab);
        setDetailOpen(true);
    }

    function closeDetails() {
        setDetailOpen(false);
        setSelectedRecord(null);
        setActiveTab("details");
    }

    async function handleUpdateInfo(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedRecord) return;

        setUpdatingPatientId(selectedRecord.id);
        const form = event.currentTarget;
        const rawMedicalCond = (form.elements.namedItem("medical_cond") as HTMLInputElement)?.value;
        const medicalHistory = parseMedicalHistory(rawMedicalCond);
        const serializedMedicalCond = serializeMedicalHistory(medicalHistory) ?? "";

        const payload = {
            type: selectedRecord.patientType,
            medical_cond: serializedMedicalCond,
            allergies: (form.elements.namedItem("allergies") as HTMLInputElement)?.value,
        };

        try {
            const res = await fetch(`/api/doctor/patients/${selectedRecord.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Patient information updated");
                await loadRecords();
            } else {
                const error = await res.json().catch(() => null);
                toast.error(error?.error ?? "Failed to update patient info");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update patient info");
        } finally {
            setUpdatingPatientId(null);
        }
    }

    async function handleSaveNotes(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedRecord?.latestAppointment?.id) {
            toast.error("No appointment available for notes");
            return;
        }

        setSavingNotesPatientId(selectedRecord.id);
        const form = event.currentTarget;
        const body = {
            appointment_id: selectedRecord.latestAppointment.id,
            reason_of_visit: (form.elements.namedItem("reason_of_visit") as HTMLInputElement)?.value,
            findings: (form.elements.namedItem("findings") as HTMLInputElement)?.value,
            diagnosis: (form.elements.namedItem("diagnosis") as HTMLInputElement)?.value,
        };

        try {
            const res = await fetch(`/api/doctor/patient-consultations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success("Consultation notes saved");
                form.reset();
                await loadRecords();
            } else {
                const error = await res.json().catch(() => null);
                toast.error(error?.error ?? "Failed to save consultation notes");
            }
        } finally {
            setSavingNotesPatientId(null);
        }
    }

    if (initializing) {
        return <DoctorPatientsLoading />;
    }

    return (
        <DoctorLayout
            title="Patient registry"
            description="Review medical records, follow up on clinic visits, and capture key notes for coordinated care."
            actions={
                <Button
                    variant="outline"
                    className="rounded-xl border-primary/30 text-primary hover:bg-primary/10/70"
                    onClick={loadRecords}
                    disabled={loadingRecords || isRefreshing}
                >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {loadingRecords || isRefreshing ? "Refreshing..." : "Refresh records"}
                </Button>
            }
        >
            <div className="space-y-6">
                <section className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-primary">Total profiles</CardTitle>
                                    <p className="text-sm text-muted-foreground">Student and employee records synced</p>
                                </div>
                                <Users2 className="h-9 w-9 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold text-primary">{totalPatients}</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-primary">With appointments</CardTitle>
                                    <p className="text-sm text-muted-foreground">Latest visit attached to the chart</p>
                                </div>
                                <BadgeCheck className="h-9 w-9 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold text-primary">{withAppointments}</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-primary">No appointment yet</CardTitle>
                                    <p className="text-sm text-muted-foreground">Profiles ready for intake coordination</p>
                                </div>
                                <AlertCircle className="h-9 w-9 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold text-primary">{withoutAppointments}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-3xl border-primary/20 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl text-primary">Patient directory</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Filter clinic records and open charts directly for quick bedside coordination.
                                </p>
                            </div>
                            <div className="space-y-1 md:w-72">
                                <Label className="text-sm font-semibold text-primary">Search Records</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or ID"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="h-9 w-full pl-10 pr-4"
                                    />
                                </div>
                            </div>
                            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Types</SelectItem>
                                        <SelectItem value="Student">Students</SelectItem>
                                        <SelectItem value="Employee">Employees</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Status</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Appointments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Appointments</SelectItem>
                                        <SelectItem value="With">With appointment</SelectItem>
                                        <SelectItem value="Without">No appointment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <PatientDirectoryTable
                                records={paginatedRecords}
                                loading={loadingRecords}
                                onOpenDetails={openDetails}
                                totalRecords={filteredRecords.length}
                                pageSize={pageSize}
                                currentPage={currentPage}
                                onPageChange={setPage}
                            />
                        </CardContent>
                    </Card>
                </section>
                {detailOpen && selectedRecord ? (
                    <RecordDetailsDialog
                        open={detailOpen}
                        record={selectedRecord}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onClose={closeDetails}
                        onUpdateInfo={handleUpdateInfo}
                        onSaveNotes={handleSaveNotes}
                        updatingPatientId={updatingPatientId}
                        savingNotesPatientId={savingNotesPatientId}
                    />
                ) : null}
            </div>
        </DoctorLayout>
    );
}
