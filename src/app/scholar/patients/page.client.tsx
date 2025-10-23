"use client";

import dynamic from "next/dynamic";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle, BadgeCheck, RefreshCcw, Search, Users2 } from "lucide-react";

import ScholarLayout from "@/components/scholar/scholar-layout";
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

import ScholarPatientsLoading from "./loading";
import { PatientsTable } from "./patients-table";
import { preparePatientRecords, type PreparedPatientRecord } from "./types";

const PatientDetailDialog = dynamic(
    () => import("./patient-detail-dialog").then((mod) => mod.PatientDetailDialog),
    {
        loading: () => (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading patient details…</div>
        ),
        ssr: false,
    }
);

export type ScholarPatientsPageClientProps = {
    initialRecords: PreparedPatientRecord[];
    initialLoaded: boolean;
};

export function ScholarPatientsPageClient({ initialRecords, initialLoaded }: ScholarPatientsPageClientProps) {
    const [records, setRecords] = useState<PreparedPatientRecord[]>(() => [...initialRecords]);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(!initialLoaded);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("active");
    const [appointmentFilter, setAppointmentFilter] = useState("all");
    const [selected, setSelected] = useState<PreparedPatientRecord | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [isRefreshing, startTransition] = useTransition();

    const deferredSearch = useDeferredValue(search.trim().toLowerCase());

    const loadRecords = useCallback(async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            query.set("type", "all");
            query.set("status", "all");
            const res = await fetch(`/api/scholar/patients?${query.toString()}`, { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to fetch patient list");
                return;
            }
            startTransition(() => {
                setRecords(Array.isArray(data) ? preparePatientRecords(data) : []);
            });
        } catch (err) {
            console.error(err);
            toast.error("Unable to load patients");
        } finally {
            setLoading(false);
            setInitializing(false);
        }
    }, [startTransition]);

    useEffect(() => {
        if (!initialLoaded) {
            void loadRecords();
        }
    }, [initialLoaded, loadRecords]);

    const filteredRecords = useMemo(() => {
        if (
            !deferredSearch &&
            typeFilter === "all" &&
            statusFilter === "all" &&
            appointmentFilter === "all"
        ) {
            return records;
        }

        return records.filter((record) => {
            if (typeFilter !== "all" && record.patientType.toLowerCase() !== typeFilter) {
                return false;
            }
            if (statusFilter !== "all") {
                if (statusFilter === "active" && record.status.toLowerCase() !== "active") return false;
                if (statusFilter === "inactive" && record.status.toLowerCase() !== "inactive") return false;
            }
            if (appointmentFilter === "with" && !record.latestAppointment) return false;
            if (appointmentFilter === "without" && record.latestAppointment) return false;

            if (!deferredSearch) return true;

            return record.searchText.includes(deferredSearch);
        });
    }, [appointmentFilter, deferredSearch, records, statusFilter, typeFilter]);

    const totalPatients = records.length;
    const withAppointments = useMemo(
        () => records.filter((record) => Boolean(record.latestAppointment)).length,
        [records]
    );
    const withoutAppointments = totalPatients - withAppointments;

    function openDetails(record: PreparedPatientRecord) {
        setSelected(record);
        setDetailOpen(true);
    }

    function closeDetails() {
        setDetailOpen(false);
        setSelected(null);
    }

    if (initializing) {
        return <ScholarPatientsLoading />;
    }

    return (
        <ScholarLayout
            title="Patient intake overview"
            description="Review student and employee profiles, confirm eligibility, and keep contact details ready for the care team."
            actions={
                <Button
                    variant="outline"
                    onClick={loadRecords}
                    className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/70"
                    disabled={loading || isRefreshing}
                >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {loading || isRefreshing ? "Refreshing..." : "Refresh records"}
                </Button>
            }
        >
            <div className="flex flex-col gap-6">
                <section className="grid gap-4 md:grid-cols-3">
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-green-700">Total profiles</CardTitle>
                                <p className="text-sm text-muted-foreground">Student and employee records synced</p>
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
                                <CardTitle className="text-base font-semibold text-green-700">With appointments</CardTitle>
                                <p className="text-sm text-muted-foreground">Latest visit attached to the chart</p>
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
                                <CardTitle className="text-base font-semibold text-green-700">No appointment yet</CardTitle>
                                <p className="text-sm text-muted-foreground">Students ready for intake coordination</p>
                            </div>
                            <AlertCircle className="h-9 w-9 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold text-green-700">{withoutAppointments}</p>
                        </CardContent>
                    </Card>
                </section>

                <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                    <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl text-green-700">Patient directory</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Filter student and employee details before handing off to nurses or doctors.
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
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="student">Students</SelectItem>
                                        <SelectItem value="employee">Employees</SelectItem>
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
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Appointment link</Label>
                                <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                                    <SelectTrigger className="rounded-xl border-green-200">
                                        <SelectValue placeholder="Appointment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="with">With appointment</SelectItem>
                                        <SelectItem value="without">No appointment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-green-700">Search records</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, ID, or program"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="rounded-xl border-green-200 pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <PatientsTable
                            records={filteredRecords}
                            loading={loading}
                            onSelect={openDetails}
                        />
                    </CardContent>
                </Card>
            </div>
            {detailOpen && selected ? (
                <PatientDetailDialog open={detailOpen} record={selected} onClose={closeDetails} />
            ) : null}

        </ScholarLayout>
    );
}

export default ScholarPatientsPageClient;
