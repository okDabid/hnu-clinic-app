"use client";

import { useEffect, useMemo, useState } from "react";
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

type PatientTypeKey = "Student" | "Employee" | "Unknown";

type DiagnosisCount = {
    diagnosis: string;
    count: number;
};

type QuarterReport = {
    quarter: number;
    label: string;
    startDate: string;
    endDate: string;
    consultations: number;
    uniquePatients: number;
    patientTypeCounts: Record<PatientTypeKey, number>;
    diagnosisCounts: DiagnosisCount[];
};

type ReportsResponse = {
    year: number;
    quarters: QuarterReport[];
    totals: {
        consultations: number;
        uniquePatients: number;
    };
    selectedQuarter: QuarterReport;
    yearlyTopDiagnoses: DiagnosisCount[];
};

const QUARTER_OPTIONS = [
    { label: "Q1", value: "1" },
    { label: "Q2", value: "2" },
    { label: "Q3", value: "3" },
    { label: "Q4", value: "4" },
] as const;

function getCurrentQuarter() {
    const now = new Date();
    return Math.floor(now.getMonth() / 3) + 1;
}

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

export default function NurseReportsPage() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [quarter, setQuarter] = useState(getCurrentQuarter());
    const [data, setData] = useState<ReportsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);

    const years = useMemo(() => {
        return Array.from({ length: 5 }, (_, index) => currentYear - index);
    }, [currentYear]);

    useEffect(() => {
        let ignore = false;

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

    const patientMixData = useMemo(() => {
        if (!data) return [];
        return data.quarters.map((item) => ({
            label: item.label,
            Student: item.patientTypeCounts.Student ?? 0,
            Employee: item.patientTypeCounts.Employee ?? 0,
            Unknown: item.patientTypeCounts.Unknown ?? 0,
        }));
    }, [data]);

    const topDiagnoses = useMemo(() => {
        if (!selectedQuarter) return [];
        return selectedQuarter.diagnosisCounts.slice(0, 8);
    }, [selectedQuarter]);

    const hasData = !!data && data.quarters.some((item) => item.consultations > 0);

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
                                const params = new URLSearchParams({ year: String(year) });
                                if (quarter) {
                                    params.set("quarter", String(quarter));
                                }

                                const response = await fetch(`/api/nurse/reports/pdf?${params.toString()}`);
                                if (!response.ok) {
                                    const body = await response.json().catch(() => null);
                                    throw new Error(body?.error ?? "Failed to generate PDF report");
                                }

                                const blob = await response.blob();
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = `nurse-quarterly-report-${year}-q${quarter}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
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
                <Card className="rounded-3xl border-green-100/70 bg-white/80 shadow-sm">
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
                    ) : null}
                    {error ? (
                        <CardContent className="flex items-center gap-2 rounded-b-3xl border-t border-dashed border-red-200 bg-red-50/70 px-6 py-4 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </CardContent>
                    ) : null}
                </Card>

                {selectedQuarter ? (
                    <section className="grid gap-5 lg:grid-cols-3">
                        <Card className="rounded-3xl border-green-100/70 bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 text-white shadow-md">
                            <CardHeader className="gap-3">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <BarChart2 className="h-5 w-5" />
                                    Quarter summary
                                </CardTitle>
                                <Badge className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs text-white">
                                    {selectedQuarter.label} • {data?.year}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-white/90">
                                <p className="text-base font-semibold text-white">
                                    {numberFormatter.format(selectedQuarter.uniquePatients)} unique patients cared for.
                                </p>
                                <p>
                                    {numberFormatter.format(selectedQuarter.consultations)} consultations documented between
                                    {" "}
                                    {formatRange(selectedQuarter.startDate, selectedQuarter.endDate)}.
                                </p>
                                <p>
                                    Top diagnosis:{" "}
                                    <span className="font-medium">
                                        {selectedQuarter.diagnosisCounts[0]?.diagnosis ?? "Unspecified"}
                                    </span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-green-700">
                                    <CalendarRange className="h-5 w-5 text-green-600" />
                                    Patient mix
                                </CardTitle>
                                <CardDescription>
                                    View how student and employee visits compare this quarter.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3 text-center text-sm font-medium text-green-700">
                                    {(Object.keys(patientMixConfig) as PatientTypeKey[]).map((key) => (
                                        <div
                                            key={key}
                                            className="rounded-2xl border border-green-100 bg-green-50/70 px-3 py-2"
                                        >
                                            <p className="text-xs uppercase tracking-wide text-green-500">
                                                {patientMixConfig[key].label}
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {numberFormatter.format(
                                                    selectedQuarter.patientTypeCounts[key] ?? 0
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-green-700">
                                    <PieChart className="h-5 w-5 text-green-600" />
                                    Year-to-date illnesses
                                </CardTitle>
                                <CardDescription>
                                    Leading diagnoses across all quarters for {data?.year}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data?.yearlyTopDiagnoses.length ? (
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        {data.yearlyTopDiagnoses.slice(0, 5).map((item) => (
                                            <li key={item.diagnosis} className="flex items-center justify-between">
                                                <span>{item.diagnosis}</span>
                                                <span className="font-medium text-green-700">
                                                    {numberFormatter.format(item.count)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No diagnoses recorded for this year yet.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                ) : null}

                {hasData ? (
                    <section className="grid gap-5 lg:grid-cols-2">
                        <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-green-700">Quarterly patient volume</CardTitle>
                                <CardDescription>
                                    Track how many patients were assisted each quarter alongside the consultation totals.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={patientTrendConfig}
                                    className="rounded-2xl border bg-white/70 p-4"
                                >
                                    <BarChart data={quarterChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                        <ChartTooltip
                                            cursor={{ fill: "rgba(134, 239, 172, 0.2)" }}
                                            content={<ChartTooltipContent />}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="uniquePatients"
                                            fill="var(--color-uniquePatients)"
                                            radius={[8, 8, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="consultations"
                                            fill="var(--color-consultations)"
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-green-700">Patient mix by quarter</CardTitle>
                                <CardDescription>
                                    Compare student and employee consultations across the academic year.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer
                                    config={patientMixConfig}
                                    className="rounded-2xl border bg-white/70 p-4"
                                >
                                    <BarChart data={patientMixData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                        <ChartTooltip
                                            cursor={{ fill: "rgba(134, 239, 172, 0.2)" }}
                                            content={<ChartTooltipContent />}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="Student"
                                            stackId="a"
                                            fill="var(--color-Student)"
                                            radius={[8, 8, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="Employee"
                                            stackId="a"
                                            fill="var(--color-Employee)"
                                            radius={[8, 8, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="Unknown"
                                            stackId="a"
                                            fill="var(--color-Unknown)"
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </section>
                ) : (
                    <Card className="rounded-3xl border-green-100/70 bg-white/80 text-center text-sm text-muted-foreground shadow-sm">
                        <CardContent className="py-10">
                            There are no consultations logged for the selected year yet. Choose a different period to see
                            insights.
                        </CardContent>
                    </Card>
                )}

                {topDiagnoses.length ? (
                    <Card className="rounded-3xl border-green-100/70 bg-white/90 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg text-green-700">
                                Leading illnesses for {selectedQuarter?.label} {data?.year}
                            </CardTitle>
                            <CardDescription>
                                The most frequently recorded diagnoses this quarter help spotlight preventive focus areas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-green-600">Diagnosis</TableHead>
                                        <TableHead className="text-green-600">Consultations</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topDiagnoses.map((item) => (
                                        <TableRow key={item.diagnosis}>
                                            <TableCell className="font-medium text-green-700">
                                                {item.diagnosis}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {numberFormatter.format(item.count)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : null}
            </section>
        </NurseLayout>
    );
}
