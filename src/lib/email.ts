import fetch from "node-fetch";

interface CachedAccessToken {
    token: string;
    expiry: number;
}

let cachedAccessToken: CachedAccessToken | null = null;
let accessTokenPromise: Promise<string> | null = null;

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing ${name} in environment`);
    }
    return value;
}

async function fetchAccessToken(): Promise<string> {
    if (cachedAccessToken && cachedAccessToken.expiry > Date.now()) {
        return cachedAccessToken.token;
    }

    if (!accessTokenPromise) {
        const clientId = getRequiredEnv("GMAIL_CLIENT_ID");
        const clientSecret = getRequiredEnv("GMAIL_CLIENT_SECRET");
        const refreshToken = getRequiredEnv("GMAIL_REFRESH_TOKEN");

        const body = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        });

        accessTokenPromise = fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        })
            .then(async (response) => {
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(
                        `Failed to refresh Gmail access token: ${response.status} ${response.statusText} - ${errorBody}`,
                    );
                }

                const json = (await response.json()) as {
                    access_token?: string;
                    expires_in?: number;
                };

                if (!json.access_token || !json.expires_in) {
                    throw new Error("Gmail token response missing access_token or expires_in");
                }

                cachedAccessToken = {
                    token: json.access_token,
                    expiry: Date.now() + (json.expires_in - 60) * 1000,
                };

                return json.access_token;
            })
            .finally(() => {
                accessTokenPromise = null;
            });
    }

    return accessTokenPromise as Promise<string>;
}

function toBase64Url(input: Buffer): string {
    return input
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function isAscii(value: string): boolean {
    return /^[\x00-\x7F]*$/.test(value);
}

const Q_SAFE = new Set([
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)), // a-z
    ...Array.from({ length: 10 }, (_, i) => String.fromCharCode(48 + i)), // 0-9
    "!",
    "*",
    "+",
    "-",
    ".",
    "/",
]);

function encodeHeader(value: string): string {
    const sanitized = value.replace(/[\r\n]+/g, " ").trim();

    if (isAscii(sanitized)) {
        return sanitized;
    }

    const bytes = Buffer.from(sanitized, "utf-8");
    const tokens: string[] = [];

    for (const byte of bytes) {
        const char = String.fromCharCode(byte);
        if (char === " ") {
            tokens.push("_");
        } else if (Q_SAFE.has(char)) {
            tokens.push(char);
        } else {
            tokens.push(`=${byte.toString(16).toUpperCase().padStart(2, "0")}`);
        }
    }

    const prefix = "=?UTF-8?Q?";
    const suffix = "?=";
    const maxLength = 75 - prefix.length - suffix.length;
    const segments: string[] = [];
    let current = "";

    for (const token of tokens) {
        if (current.length + token.length > maxLength && current) {
            segments.push(current);
            current = "";
        }

        if (token.length > maxLength) {
            // Token is longer than allowed (should only happen for =XX sequences)
            segments.push(token);
            continue;
        }

        current += token;
    }

    if (current) {
        segments.push(current);
    }

    return segments.map((part) => `${prefix}${part}${suffix}`).join(" ");
}

function formatAddress(email: string, name?: string): string {
    if (!name) {
        return email;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
        return email;
    }

    if (!isAscii(trimmedName)) {
        return `${encodeHeader(trimmedName)} <${email}>`;
    }

    const escapedName = trimmedName.replace(/(["\\])/g, "\\$1");
    return `"${escapedName}" <${email}>`;
}

function buildMimeMessage({
    from,
    to,
    subject,
    html,
    text,
    replyTo,
}: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
}): string {
    const headers = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${encodeHeader(subject)}`,
        "MIME-Version: 1.0",
    ];

    if (replyTo) {
        headers.push(`Reply-To: ${replyTo}`);
    }

    const boundary = `mail_${Date.now().toString(36)}`;

    if (text) {
        headers.push(`Content-Type: multipart/alternative; boundary=\"${boundary}\"`, "", `--${boundary}`);
        headers.push("Content-Type: text/plain; charset=UTF-8", "", text, "", `--${boundary}`);
        headers.push("Content-Type: text/html; charset=UTF-8", "", html, "", `--${boundary}--`, "");
    } else {
        headers.push("Content-Type: text/html; charset=UTF-8", "", html);
    }

    return headers.join("\r\n");
}

async function sendWithGmail(rawMessage: string) {
    const accessToken = await fetchAccessToken();

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMessage }),
    });

    if (!response.ok) {
        if (response.status === 401) {
            cachedAccessToken = null;
        }

        const errorBody = await response.text();
        throw new Error(`Gmail API send failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return (await response.json()) as { id?: string };
}

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
    replyTo?: string;
    text?: string;
}

function clearTokenCache() {
    cachedAccessToken = null;
    accessTokenPromise = null;
}

/**
 * Sends an email using the Gmail API with OAuth 2.0 credentials.
 * Automatically retries once if sending fails.
 */
export async function sendEmail({
    to,
    subject,
    html,
    fromName = "HNU Clinic",
    replyTo,
    text,
}: SendEmailOptions): Promise<void> {
    const emailUser = getRequiredEnv("GMAIL_USER");
    const fromHeader = formatAddress(emailUser, fromName);
    const toHeader = formatAddress(to);
    const replyToHeader = replyTo ? formatAddress(replyTo) : undefined;

    const raw = toBase64Url(
        Buffer.from(
            buildMimeMessage({
                from: fromHeader,
                to: toHeader,
                subject,
                html,
                text,
                replyTo: replyToHeader,
            }),
            "utf-8",
        ),
    );

    try {
        const result = await sendWithGmail(raw);
        console.log("Email sent via Gmail API:", result.id ?? "unknown id");
    } catch (err) {
        console.error("Email send failed, retrying once:", err);
        await new Promise((res) => setTimeout(res, 2000));
        clearTokenCache();
        const result = await sendWithGmail(raw);
        console.log("Email sent via Gmail API after retry:", result.id ?? "unknown id");
    }
}
