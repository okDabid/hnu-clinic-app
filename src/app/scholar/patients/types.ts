export type StaffSummary = {
    id: string;
    username: string;
    fullName: string | null;
};

export type ConsultationSummary = {
    id: string;
    reason_of_visit: string | null;
    findings: string | null;
    diagnosis: string | null;
    updatedAt: string | null;
    doctor: StaffSummary | null;
    nurse: StaffSummary | null;
};

export type AppointmentSummary = {
    id: string;
    timestart: string | null;
    timeend: string | null;
    doctor: StaffSummary | null;
    consultation: ConsultationSummary | null;
};

export type PatientRecord = {
    id: string;
    userId: string;
    patientId: string;
    fullName: string;
    patientType: "Student" | "Employee";
    gender: string | null;
    date_of_birth: string | null;
    status: string;
    department?: string | null;
    program?: string | null;
    year_level?: string | null;
    contactno?: string | null;
    address?: string | null;
    bloodtype?: string | null;
    allergies?: string | null;
    medical_cond?: string | null;
    emergency?: {
        name?: string | null;
        num?: string | null;
        relation?: string | null;
    };
    appointment_id: string | null;
    latestAppointment: AppointmentSummary | null;
};

export type PreparedPatientRecord = PatientRecord & {
    searchText: string;
};

export function buildPatientSearchText(record: PatientRecord): string {
    return [
        record.fullName,
        record.patientId,
        record.patientType,
        record.department,
        record.program,
        record.year_level,
        record.contactno,
        record.address,
        record.emergency?.name,
        record.emergency?.num,
        record.emergency?.relation,
        record.status,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

export function preparePatientRecord(record: PatientRecord): PreparedPatientRecord {
    return {
        ...record,
        searchText: buildPatientSearchText(record),
    };
}

export function preparePatientRecords(
    records: PatientRecord[] | null | undefined
): PreparedPatientRecord[] {
    if (!Array.isArray(records)) {
        return [];
    }

    return records.map((record) => preparePatientRecord(record));
}
