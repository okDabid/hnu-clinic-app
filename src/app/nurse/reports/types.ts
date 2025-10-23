export type PatientTypeKey = "Student" | "Employee" | "Unknown";

export type DiagnosisCount = {
    diagnosis: string;
    count: number;
};

export type QuarterReport = {
    quarter: number;
    label: string;
    startDate: string;
    endDate: string;
    consultations: number;
    uniquePatients: number;
    patientTypeCounts: Record<PatientTypeKey, number>;
    diagnosisCounts: DiagnosisCount[];
};

export type ReportsResponse = {
    year: number;
    quarters: QuarterReport[];
    totals: {
        consultations: number;
        uniquePatients: number;
    };
    selectedQuarter: QuarterReport;
    yearlyTopDiagnoses: DiagnosisCount[];
};

export function getCurrentQuarter(date: Date = new Date()): number {
    return Math.floor(date.getMonth() / 3) + 1;
}

export function getInitialReportSelection(date: Date = new Date()) {
    const year = date.getFullYear();
    const quarter = getCurrentQuarter(date);
    return { year, quarter };
}
