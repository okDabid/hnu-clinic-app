export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_NUMBER_REGEX = /^09\d{9}$/;

export function sanitizePhoneNumber(value: string): string {
    if (!value) return "";

    if (/[^0-9]/.test(value)) {
        return "INVALID";
    }

    if (/^9\d{9}$/.test(value)) {
        value = `0${value}`;
    }

    if (value.length > 11) {
        value = value.slice(0, 11);
    }

    return value;
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
    if (contactNumber === "INVALID" || (contactNumber && !PHONE_NUMBER_REGEX.test(contactNumber))) {
        return {
            success: false,
            error: "Contact number must contain only digits and follow the 09XXXXXXXXX format.",
        };
    }

    const emergencyNumber = input.emergencyNumber ? sanitizePhoneNumber(input.emergencyNumber) : "";
    if (emergencyNumber === "INVALID" || (emergencyNumber && !PHONE_NUMBER_REGEX.test(emergencyNumber))) {
        return {
            success: false,
            error: "Emergency contact number must contain only digits and follow the 09XXXXXXXXX format.",
        };
    }

    return {
        success: true,
        email,
        contactNumber,
        emergencyNumber,
    };
}
