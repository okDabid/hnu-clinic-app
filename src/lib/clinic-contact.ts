export const CLINIC_CONTACT_NUMBER_LENGTH = 11;
export const PH_MOBILE_PREFIX = "09";

const PH_MOBILE_PATTERN = new RegExp(
    `^${PH_MOBILE_PREFIX}\\d{${CLINIC_CONTACT_NUMBER_LENGTH - PH_MOBILE_PREFIX.length}}$`
);

export function isValidClinicContactNumber(value: unknown): value is string {
    return typeof value === "string" && PH_MOBILE_PATTERN.test(value.trim());
}

export function sanitizeClinicContactInput(value: string): string {
    return value.replace(/\D/g, "").slice(0, CLINIC_CONTACT_NUMBER_LENGTH);
}
