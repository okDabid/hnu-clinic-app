export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_NUMBER_REGEX = /^09\d{9}$/;

export function sanitizePhoneNumber(value: string): string {
    if (!value) return "";

    let cleaned = value.replace(/\D/g, "");

    if (/^9\d{9}$/.test(cleaned)) {
        cleaned = `0${cleaned}`;
    }

    if (cleaned.length > 11) {
        cleaned = cleaned.slice(0, 11);
    }

    return cleaned;
}

type ContactValidationInput = {
    email?: string | null;
    contactNumber?: string | null;
    emergencyNumber?: string | null;
};

type ContactValidationSuccess = {
    success: true;
    email: string;
    contactNumber: string;
    emergencyNumber: string;
};

type ContactValidationError = {
    success: false;
    error: string;
};

export type ContactValidationResult = ContactValidationSuccess | ContactValidationError;

export function validateAndNormalizeContacts(input: ContactValidationInput): ContactValidationResult {
    const email = (input.email ?? "").trim();

    if (email && !EMAIL_REGEX.test(email)) {
        return { success: false, error: "Please enter a valid email address." };
    }

    const contactNumber = input.contactNumber ? sanitizePhoneNumber(input.contactNumber) : "";
    if (contactNumber && !PHONE_NUMBER_REGEX.test(contactNumber)) {
        return {
            success: false,
            error: "Contact number must follow the 09XXXXXXXXX format (11 digits only).",
        };
    }

    const emergencyNumber = input.emergencyNumber ? sanitizePhoneNumber(input.emergencyNumber) : "";
    if (emergencyNumber && !PHONE_NUMBER_REGEX.test(emergencyNumber)) {
        return {
            success: false,
            error: "Emergency contact number must follow the 09XXXXXXXXX format (11 digits only).",
        };
    }

    return {
        success: true,
        email,
        contactNumber,
        emergencyNumber,
    };
}
