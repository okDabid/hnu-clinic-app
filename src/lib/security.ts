import { randomBytes } from "crypto";

const PASSWORD_ALPHABET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateRandomPassword(length = 12): string {
    if (length <= 0) {
        throw new Error("Password length must be greater than zero");
    }

    let password = "";
    while (password.length < length) {
        const bytes = randomBytes(length);
        for (let i = 0; i < bytes.length && password.length < length; i += 1) {
            const index = bytes[i] % PASSWORD_ALPHABET.length;
            password += PASSWORD_ALPHABET[index];
        }
    }

    return password;
}

export function generateNumericCode(length = 6): string {
    if (length <= 0) {
        throw new Error("Code length must be greater than zero");
    }

    let code = "";
    while (code.length < length) {
        const bytes = randomBytes(length);
        for (let i = 0; i < bytes.length && code.length < length; i += 1) {
            code += (bytes[i] % 10).toString();
        }
    }

    return code;
}
