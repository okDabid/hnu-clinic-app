export const CLINIC_CONTACT_NUMBER_LENGTH = 11;

const DIGITS_ONLY_PATTERN = new RegExp(`^\\d{${CLINIC_CONTACT_NUMBER_LENGTH}}$`);

export function isValidClinicContactNumber(value: unknown): value is string {
    return typeof value === "string" && DIGITS_ONLY_PATTERN.test(value.trim());
}

export function sanitizeClinicContactInput(value: string): string {
    return value.replace(/\D/g, "").slice(0, CLINIC_CONTACT_NUMBER_LENGTH);
}
