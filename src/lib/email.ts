import { createSign } from "crypto";

interface AccessToken {
    token: string;
    expiresAt: number;
}

let cachedAccessToken: AccessToken | null = null;

const REQUIRED_GMAIL_ENV_VARS = [
    "GMAIL_CLIENT_EMAIL",
    "GMAIL_PRIVATE_KEY",
    "GMAIL_SENDER",
] as const;

export function getMissingEmailEnvVars(): string[] {
    return REQUIRED_GMAIL_ENV_VARS.filter((key) => {
        const value = process.env[key];
        return typeof value !== "string" || value.trim() === "";
    });
}

export function isEmailServiceConfigured(): boolean {
    return getMissingEmailEnvVars().length === 0;
}

const GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1/users";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function getEnv(name: string) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function base64UrlEncode(input: string | Buffer) {
    return Buffer.from(input)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

async function fetchAccessToken(): Promise<AccessToken> {
    const clientEmail = getEnv("GMAIL_CLIENT_EMAIL");
    const privateKey = getEnv("GMAIL_PRIVATE_KEY").replace(/\\n/g, "\n");
    const sender = getEnv("GMAIL_SENDER");

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: clientEmail,
        scope: GMAIL_SCOPE,
        aud: GMAIL_TOKEN_URL,
        exp: now + 3600,
        iat: now,
        sub: sender,
    };

    const unsignedAssertion = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;

    const signer = createSign("RSA-SHA256");
    signer.update(unsignedAssertion);
    signer.end();
    const signature = signer.sign(privateKey);
    const assertion = `${unsignedAssertion}.${base64UrlEncode(signature)}`;

    const response = await fetch(GMAIL_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to obtain Gmail access token:", response.status, errorBody);
        throw new Error("Unable to obtain Gmail access token");
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    const expiresAt = Date.now() + Math.max(data.expires_in - 60, 0) * 1000;

    return { token: data.access_token, expiresAt };
}

async function getAccessToken(): Promise<string> {
    if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
        return cachedAccessToken.token;
    }

    cachedAccessToken = await fetchAccessToken();
    return cachedAccessToken.token;
}

function buildPlainText(html: string, explicitText?: string) {
    if (explicitText) return explicitText;
    return html
        .replace(/<\/(p|div|br)\s*>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function buildMimeMessage({
    fromName,
    sender,
    to,
    subject,
    html,
    text,
    replyTo,
}: {
    fromName: string;
    sender: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
}) {
    const plainText = buildPlainText(html, text);

    if (plainText) {
        const boundary = "hnu-clinic-boundary";
        const parts = [
            "MIME-Version: 1.0",
            "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
            "",
            `--${boundary}`,
            "Content-Type: text/plain; charset=UTF-8",
            "",
            plainText,
            `--${boundary}`,
            "Content-Type: text/html; charset=UTF-8",
            "",
            html,
            `--${boundary}--`,
            "",
        ];

        if (replyTo) {
            parts.unshift(`Reply-To: ${replyTo}`);
        }

        parts.unshift(`Subject: ${subject}`);
        parts.unshift(`To: ${to}`);
        parts.unshift(`From: ${fromName} <${sender}>`);

        return parts.join("\r\n");
    }

    const headers = [
        `From: ${fromName} <${sender}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
    ];

    if (replyTo) {
        headers.push(`Reply-To: ${replyTo}`);
    }

    return headers.join("\r\n") + "\r\n\r\n" + html;
}

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
    replyTo?: string;
    text?: string;
}

export async function sendEmail({
    to,
    subject,
    html,
    fromName = "HNU Clinic",
    replyTo,
    text,
}: SendEmailOptions): Promise<void> {
    const sender = getEnv("GMAIL_SENDER");
    const accessToken = await getAccessToken();
    const mimeMessage = buildMimeMessage({
        fromName,
        sender,
        to,
        subject,
        html,
        text,
        replyTo,
    });

    const raw = base64UrlEncode(Buffer.from(mimeMessage, "utf8"));

    const response = await fetch(`${GMAIL_API_URL}/me/messages/send`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to send Gmail message:", response.status, errorBody);
        throw new Error("Failed to send email via Gmail API");
    }

    console.log("Email sent via Gmail API");
}
