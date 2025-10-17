export type ServiceTypeValue = "Consultation" | "Dental" | "Assessment" | "Other";

export type ServiceOption = {
    label: string;
    value: string;
    serviceType: ServiceTypeValue;
};

const PHYSICIAN_SERVICE_OPTIONS: ServiceOption[] = [
    { label: "Physical examinations", value: "Assessment-physical", serviceType: "Assessment" },
    { label: "Consultations", value: "Consultation-general", serviceType: "Consultation" },
    { label: "Medical certificate issuance", value: "Consultation-cert", serviceType: "Consultation" },
];

const DENTIST_SERVICE_OPTIONS: ServiceOption[] = [
    { label: "Consultations and examinations", value: "Dental-consult", serviceType: "Dental" },
    { label: "Oral prophylaxis", value: "Dental-cleaning", serviceType: "Dental" },
    { label: "Tooth extractions", value: "Dental-extraction", serviceType: "Dental" },
    { label: "Dental certificate issuance", value: "Dental-cert", serviceType: "Dental" },
];

const ALL_SERVICE_OPTIONS: ServiceOption[] = [
    ...PHYSICIAN_SERVICE_OPTIONS,
    ...DENTIST_SERVICE_OPTIONS,
];

export function getServiceOptionsForSpecialization(
    specialization: string | null | undefined
): ServiceOption[] {
    if (!specialization) return [];
    if (specialization === "Physician") return PHYSICIAN_SERVICE_OPTIONS;
    if (specialization === "Dentist") return DENTIST_SERVICE_OPTIONS;
    return [];
}

export function resolveServiceType(value: string): ServiceTypeValue | null {
    const match = ALL_SERVICE_OPTIONS.find((option) => option.value === value);
    if (match) return match.serviceType;

    if (value.startsWith("Consultation")) return "Consultation";
    if (value.startsWith("Dental")) return "Dental";
    if (value.startsWith("Assessment")) return "Assessment";
    if (value.trim().length > 0) return "Other";
    return null;
}

export function getServiceLabel(value: string): string | null {
    const match = ALL_SERVICE_OPTIONS.find((option) => option.value === value);
    return match ? match.label : null;
}
