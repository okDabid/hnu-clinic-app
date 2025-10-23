"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BarChart2, CalendarRange, Loader2, PieChart, FileDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import { NurseLayout } from "@/components/nurse/nurse-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { formatManilaDateTime } from "@/lib/time";

import NurseReportsLoading from "./loading";
import { type PatientTypeKey, type ReportsResponse } from "./types";

const QUARTER_OPTIONS = [
    { label: "Q1", value: "1" },
    { label: "Q2", value: "2" },
    { label: "Q3", value: "3" },
    { label: "Q4", value: "4" },
] as const;

function formatRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    // End date in the API is the start of the next quarter. Subtract a day for display.
    endDate.setDate(endDate.getDate() - 1);

    const startText = formatManilaDateTime(startDate, {
        month: "short",
        day: "numeric",
        hour: undefined,
        minute: undefined,
    });
    const endText = formatManilaDateTime(endDate, {
        month: "short",
        day: "numeric",
        hour: undefined,
        minute: undefined,
    });

    if (startText && endText) {
        return `${startText} – ${endText}`;
    }
    return startText || endText || "";
}

const patientTrendConfig = {
    uniquePatients: {
        label: "Unique patients",
        color: "#15803d",
    },
    consultations: {
        label: "Consultations",
        color: "#4ade80",
    },
} as const;

const patientMixConfig = {
    Student: { label: "Student", color: "#0d9488" },
    Employee: { label: "Employee", color: "#2563eb" },
    Unknown: { label: "Unspecified", color: "#94a3b8" },
} as const satisfies Record<PatientTypeKey, { label: string; color: string }>;

const numberFormatter = new Intl.NumberFormat("en-PH");

function isMobileDevice() {
    if (typeof navigator === "undefined") return false;
    const userAgent = navigator.userAgent || navigator.vendor || "";
    return /(android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini)/i.test(userAgent);
}

function isIOSDevice() {
    if (typeof navigator === "undefined") return false;
    const userAgent = navigator.userAgent || navigator.vendor || "";
    return /(iphone|ipad|ipod)/i.test(userAgent);
}

function buildReportFilename(year: number, quarter?: number | null) {
    const base = `nurse-quarterly-report-${year}`;
    return typeof quarter === "number" && Number.isFinite(quarter)
        ? `${base}-q${quarter}.pdf`
        : `${base}.pdf`;
}

function downloadBlob(blob: Blob, filename: string, isMobile: boolean) {
    if (typeof window === "undefined") return;

    const url = URL.createObjectURL(blob);

    const scheduleCleanup = () => {
        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    };

    if (isIOSDevice()) {
        const newWindow = window.open(url, "_blank");

        if (!newWindow) {
            window.location.href = url;
        }

        scheduleCleanup();
        return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    if (isMobile) {
        link.rel = "noopener";
        link.target = "_blank";
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    scheduleCleanup();
}

export type NurseReportsPageClientProps = {
    initialYear: number;
    initialQuarter: number;
    initialReports: ReportsResponse | null;
};

export function NurseReportsPageClient({
    initialYear,
    initialQuarter,
    initialReports,
}: NurseReportsPageClientProps) {
    const [year, setYear] = useState(initialYear);
    const [quarter, setQuarter] = useState(initialQuarter);
    const [data, setData] = useState<ReportsResponse | null>(initialReports);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [initializing, setInitializing] = useState(!initialReports);

    const initialSelectionRef = useRef({ year: initialYear, quarter: initialQuarter });
    const hasServerSnapshotRef = useRef(Boolean(initialReports));

    const years = useMemo(() => {
        return Array.from({ length: 5 }, (_, index) => initialYear - index);
    }, [initialYear]);

    useEffect(() => {
        let ignore = false;

        const matchesServerSnapshot =
            hasServerSnapshotRef.current &&
            year === initialSelectionRef.current.year &&
            quarter === initialSelectionRef.current.quarter;

        if (matchesServerSnapshot) {
            setInitializing(false);
            hasServerSnapshotRef.current = false;
            return () => {
                ignore = true;
            };
        }

        async function loadReports() {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ year: String(year) });
                if (quarter) {
                    params.set("quarter", String(quarter));
                }

                const response = await fetch(`/api/nurse/reports?${params.toString()}`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    const body = await response.json().catch(() => null);
                    const message = body?.error ?? "Failed to load reports";
                    throw new Error(message);
                }

                const payload = (await response.json()) as ReportsResponse;
                if (ignore) return;

                setData(payload);

                if (
                    payload.selectedQuarter?.quarter &&
                    payload.selectedQuarter.quarter !== quarter
                ) {
                    setQuarter(payload.selectedQuarter.quarter);
                }
            } catch (err) {
                if (ignore) return;
                setError(err instanceof Error ? err.message : "Failed to load reports");
                setData(null);
            } finally {
                if (!ignore) {
                    setLoading(false);
                    setInitializing(false);
                    hasServerSnapshotRef.current = false;
                }
            }
        }

        void loadReports();

        return () => {
            ignore = true;
        };
    }, [year, quarter]);

    const selectedQuarter = useMemo(() => {
        if (!data) return null;
        return data.quarters.find((item) => item.quarter === quarter) ?? data.selectedQuarter;
    }, [data, quarter]);

    const quarterChartData = useMemo(() => {
        if (!data) return [];
        return data.quarters.map((item) => ({
            label: `${item.label} ${data.year}`,
            uniquePatients: item.uniquePatients,
            consultations: item.consultations,
        }));
    }, [data]);

    const topDiagnoses = useMemo(() => {
        if (!selectedQuarter) return [];
        return selectedQuarter.diagnosisCounts.slice(0, 8);
    }, [selectedQuarter]);

    const hasData = !!data && data.quarters.some((item) => item.consultations > 0);

    if (initializing) {
        return <NurseReportsLoading />;
    }

    const selectionForPdf = data?.selectedQuarter?.quarter ?? quarter;

    return (
        <NurseLayout
            title="Quarterly Reports"
            description="Generate patient and illness insights for any quarter to prepare compliance-ready summaries."
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        className="rounded-xl bg-green-600 text-white hover:bg-green-700"
                        disabled={!data || exportingPdf}
                        onClick={async () => {
                            if (!data) return;
                            setExportingPdf(true);
                            try {
                                const params = new URLSearchParams({ year: String(data.year) });
                                if (selectionForPdf) {
                                    params.set("quarter", String(selectionForPdf));
                                }

                                const response = await fetch(`/api/nurse/reports/pdf?${params.toString()}`);
                                if (!response.ok) {
                                    const body = await response.json().catch(() => null);
                                    throw new Error(body?.error ?? "Failed to generate PDF report");
                                }

                                const blob = await response.blob();
                                const mobile = isMobileDevice();
                                const filename = buildReportFilename(data.year, selectionForPdf);

                                downloadBlob(blob, filename, mobile);
                            } catch (pdfError) {
                                console.error(pdfError);
                                if (typeof window !== "undefined") {
                                    window.alert(
                                        pdfError instanceof Error
                                            ? pdfError.message
                                            : "Failed to generate PDF report"
                                    );
                                }
                            } finally {
                                setExportingPdf(false);
                            }
                        }}
                    >
                        {exportingPdf ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileDown className="mr-2 h-4 w-4" />
                        )}
                        Generate PDF
                    </Button>
                </div>
            }
        >
            <section className="space-y-6">
                <Card className="rounded-3xl border-transparent bg-white/80 shadow-sm md:border-green-100/70">
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <CardTitle className="text-xl font-semibold text-green-700">
                                Report filters
                            </CardTitle>
                            <CardDescription>
                                Choose the timeframe to refresh patient volume and illness distribution analytics.
                            </CardDescription>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-green-500">
                                    Year
                                </span>
                                <Select
                                    value={String(year)}
                                    onValueChange={(value) => {
                                        setYear(Number(value));
                                    }}
                                >
                                    <SelectTrigger className="w-[140px] rounded-xl border-green-200 bg-white/90">
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((option) => (
                                            <SelectItem key={option} value={String(option)}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-green-500">
                                    Quarter
                                </span>
                                <Select
                                    value={String(quarter)}
                                    onValueChange={(value) => {
                                        setQuarter(Number(value));
                                    }}
                                >
                                    <SelectTrigger className="w-[140px] rounded-xl border-green-200 bg-white/90">
                                        <SelectValue placeholder="Select quarter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QUARTER_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    {loading ? (
                        <CardContent className="flex items-center gap-3 pb-6 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                            Generating the latest report…
                        </CardContent>
                    ) : error ? (
                        <CardContent className="flex items-center gap-3 pb-6 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </CardContent>
                    ) : null}
                </Card>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold text-green-700">
                                    Consultations overview
                                </CardTitle>
                                <CardDescription>
                                    Quarter-by-quarter comparison of unique patients and total consultations.
                                </CardDescription>
                            </div>
                            <Badge className="flex items-center gap-2 rounded-full bg-green-50 text-green-700">
                                <CalendarRange className="h-3.5 w-3.5" /> {data?.year ?? year}
                            </Badge>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {hasData ? (
                                <ChartContainer
                                    config={patientTrendConfig}
                                    className="h-[320px] w-full"
                                >
                                    <BarChart data={quarterChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#bbf7d0" />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis tickFormatter={(value) => numberFormatter.format(value)} />
                                        <ChartTooltip cursor={{ fill: "rgba(21, 128, 61, 0.05)" }} content={<ChartTooltipContent />} />
                                        <Legend iconType="circle" />
                                        <Bar
                                            dataKey="uniquePatients"
                                            fill={patientTrendConfig.uniquePatients.color}
                                            radius={[10, 10, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="consultations"
                                            fill={patientTrendConfig.consultations.color}
                                            radius={[10, 10, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-green-200 bg-green-50/50 text-sm text-muted-foreground">
                                    No consultation data recorded for the selected period.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-green-700">
                                <PieChart className="h-5 w-5" /> Patient mix
                            </CardTitle>
                            <CardDescription>
                                Distribution of student and employee visits across the selected quarter.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedQuarter ? (
                                <>
                                    <div className="space-y-3">
                                        {(
                                            Object.keys(patientMixConfig) as PatientTypeKey[]
                                        ).map((key) => {
                                            const count = selectedQuarter.patientTypeCounts[key] ?? 0;
                                            const total = selectedQuarter.consultations || 1;
                                            const percentage = Math.round((count / total) * 100);
                                            const config = patientMixConfig[key];
                                            return (
                                                <div key={key} className="flex items-center justify-between rounded-2xl bg-green-50/80 px-4 py-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-green-700">{config.label}</p>
                                                        <p className="text-xs text-muted-foreground">{count} consultations</p>
                                                    </div>
                                                    <Badge style={{ backgroundColor: config.color }} className="rounded-full text-white">
                                                        {Number.isFinite(percentage) ? `${percentage}%` : "0%"}
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="rounded-2xl bg-green-100/40 p-4 text-sm text-green-700">
                                        <p className="font-semibold">{selectedQuarter.label} summary</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatRange(selectedQuarter.startDate, selectedQuarter.endDate)}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Select a quarter to see how student and employee visits compare.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-green-700">
                                Top diagnoses
                            </CardTitle>
                            <CardDescription>
                                Most frequently recorded diagnoses in the selected quarter.
                            </CardDescription>
                        </div>
                        <Badge className="rounded-full bg-green-50 text-green-700">
                            <BarChart2 className="mr-2 h-4 w-4" /> {selectedQuarter?.diagnosisCounts.length ?? 0} unique entries
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {topDiagnoses.length > 0 ? (
                            <div className="space-y-3">
                                {topDiagnoses.map((diagnosis, index) => (
                                    <div
                                        key={diagnosis.diagnosis}
                                        className="flex items-center justify-between rounded-2xl border border-green-100 bg-white/90 px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-green-600">#{index + 1}</span>
                                            <span className="text-sm font-medium text-green-700">{diagnosis.diagnosis}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{diagnosis.count} cases</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No diagnosis data recorded for the selected quarter.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-green-700">
                            Quarterly breakdown
                        </CardTitle>
                        <CardDescription>
                            Consultation volume, unique patients, and illness distribution for each quarter.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Quarter</TableHead>
                                    <TableHead>Consultations</TableHead>
                                    <TableHead>Unique patients</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Unspecified</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.quarters.map((item) => (
                                    <TableRow key={item.quarter}>
                                        <TableCell className="font-semibold text-green-700">{item.label}</TableCell>
                                        <TableCell>{numberFormatter.format(item.consultations)}</TableCell>
                                        <TableCell>{numberFormatter.format(item.uniquePatients)}</TableCell>
                                        <TableCell>{numberFormatter.format(item.patientTypeCounts.Student ?? 0)}</TableCell>
                                        <TableCell>{numberFormatter.format(item.patientTypeCounts.Employee ?? 0)}</TableCell>
                                        <TableCell>{numberFormatter.format(item.patientTypeCounts.Unknown ?? 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}

export default NurseReportsPageClient;
