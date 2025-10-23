"use client";

import dynamic from "next/dynamic";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, BadgeCheck, RefreshCcw, Search, Users2 } from "lucide-react";
import { toast } from "sonner";

import { NurseLayout } from "@/components/nurse/nurse-layout";
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

import NurseRecordsLoading from "./loading";
import { PatientDirectoryTable } from "./patient-directory-table";
import type { RecordDetailsDialogTab } from "./patient-record-dialog";
import type { PatientRecord } from "./types";

const RecordDetailsDialog = dynamic(
    () => import("./patient-record-dialog").then((mod) => mod.RecordDetailsDialog),
    {
        loading: () => (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading patient details…</div>
        ),
        ssr: false,
    }
);

export type NurseRecordsPageClientProps = {
    initialRecords: PatientRecord[] | null;
};

export function NurseRecordsPageClient({ initialRecords }: NurseRecordsPageClientProps) {
    const { data: session } = useSession();
    const [records, setRecords] = useState<PatientRecord[]>(() => initialRecords ?? []);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [appointmentFilter, setAppointmentFilter] = useState("All");
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [initializing, setInitializing] = useState(!initialRecords);
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
            const res = await fetch("/api/nurse/records", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to load records");
            const data: PatientRecord[] = await res.json();
            startTransition(() => {
                setRecords(data);
            });
        } catch {
            toast.error("Error loading records.");
        } finally {
            setLoadingRecords(false);
            setInitializing(false);
        }
    }, [startTransition]);

    useEffect(() => {
        if (!initialRecords) {
            void loadRecords();
        }
    }, [initialRecords, loadRecords]);

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

        const term = deferredSearch;
        return records.filter((record) => {
            const matchesSearch =
                record.fullName.toLowerCase().includes(term) ||
                record.patientId.toLowerCase().includes(term) ||
                record.patientType.toLowerCase().includes(term) ||
                (record.department ?? "").toLowerCase().includes(term) ||
                (record.program ?? "").toLowerCase().includes(term);

            const matchesStatus = statusFilter === "All" || record.status === statusFilter;
            const matchesType = typeFilter === "All" || record.patientType === typeFilter;
            const matchesAppointment =
                appointmentFilter === "All" ||
                (appointmentFilter === "With" && record.latestAppointment) ||
                (appointmentFilter === "Without" && !record.latestAppointment);

            return matchesSearch && matchesStatus && matchesType && matchesAppointment;
        });
    }, [appointmentFilter, deferredSearch, records, statusFilter, typeFilter]);

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
        const body = {
            type: selectedRecord.patientType,
            medical_cond: (form.elements.namedItem("medical_cond") as HTMLInputElement)?.value,
            allergies: (form.elements.namedItem("allergies") as HTMLInputElement)?.value,
        };

        try {
            const res = await fetch(`/api/nurse/records/${selectedRecord.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success("Medical condition updated");
                await loadRecords();
            } else {
                toast.error("Failed to update condition");
            }
        } finally {
            setUpdatingPatientId(null);
        }
    }

    async function handleSaveNotes(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!session?.user?.id) {
            toast.error("You must be signed in to save notes.");
            return;
        }
        if (!selectedRecord?.latestAppointment?.id) {
            toast.error("No scheduled appointment to attach these notes to.");
            return;
        }

        setSavingNotesPatientId(selectedRecord.id);
        const form = event.currentTarget;
        const body = {
            appointment_id: selectedRecord.latestAppointment.id,
            nurse_user_id: session.user.id,
            reason_of_visit: (form.elements.namedItem("reason_of_visit") as HTMLInputElement)?.value,
            findings: (form.elements.namedItem("findings") as HTMLInputElement)?.value,
            diagnosis: (form.elements.namedItem("diagnosis") as HTMLInputElement)?.value,
        };

        try {
            const res = await fetch(`/api/nurse/consultations`, {
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
                toast.error(error?.error ?? "Failed to save consultation");
            }
        } finally {
            setSavingNotesPatientId(null);
        }
    }

    if (initializing) {
        return <NurseRecordsLoading />;
    }

    return (
        <NurseLayout
            title="Patient records"
            description="Coordinate patient histories, capture consultation notes, and support physicians during follow-ups."
            actions={
                <Button
                    variant="outline"
                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
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
                        <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-green-700">
                                        Total records
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Student and employee charts monitored
                                    </p>
                                </div>
                                <Users2 className="h-9 w-9 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold text-green-700">{totalPatients}</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-green-700">
                                        With appointments
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Visits ready for vitals and documentation
                                    </p>
                                </div>
                                <BadgeCheck className="h-9 w-9 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold text-green-700">{withAppointments}</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-green-700">
                                        Needs scheduling
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Profiles awaiting their next appointment
                                    </p>
                                </div>
                                <AlertCircle className="h-9 w-9 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-semibold text-green-700">{withoutAppointments}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl text-green-700">Patient directory</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Filter clinic records and open charts directly for quick bedside coordination.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Patient type</Label>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="rounded-xl border-green-200">
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="Student">Students</SelectItem>
                                            <SelectItem value="Employee">Employees</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Account status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="rounded-xl border-green-200">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Appointment link</Label>
                                    <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                                        <SelectTrigger className="rounded-xl border-green-200">
                                            <SelectValue placeholder="Appointments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="With">With appointment</SelectItem>
                                            <SelectItem value="Without">No appointment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-green-700">Search records</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or ID"
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            className="rounded-xl border-green-200 pl-9"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <PatientDirectoryTable
                                records={filteredRecords}
                                loading={loadingRecords}
                                onOpenDetails={openDetails}
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
        </NurseLayout>
    );
}

export default NurseRecordsPageClient;
