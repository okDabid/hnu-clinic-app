export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PHONE_NUMBER_REGEX = /^(?:\+639|09)\d{9}$/;

export function sanitizePhoneNumber(value: string): string {
    if (!value) {
        return "";
    }

    const cleaned = value.replace(/[^+\d]/g, "");

    if (!cleaned) {
        return "";
    }

    if (cleaned.startsWith("+")) {
        return `+${cleaned.slice(1).replace(/\+/g, "")}`;
    }

    return cleaned.replace(/\+/g, "");
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
            error: "Contact number must follow the 09XXXXXXXXX or +639XXXXXXXXX format.",
        };
    }

    const emergencyNumber = input.emergencyNumber ? sanitizePhoneNumber(input.emergencyNumber) : "";
    if (emergencyNumber && !PHONE_NUMBER_REGEX.test(emergencyNumber)) {
        return {
            success: false,
            error: "Emergency contact number must follow the 09XXXXXXXXX or +639XXXXXXXXX format.",
        };
    }

    return {
        success: true,
        email,
        contactNumber,
        emergencyNumber,
    };
}
