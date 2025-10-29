import fs from "node:fs";
import path from "node:path";

import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedVerifyPromise: Promise<void> | null = null;
let cachedDkimConfig: nodemailer.DKIMOptions | null | undefined;

function resolvePrivateKey(inlineKey: string | undefined, keyPath: string | undefined): string | null {
    if (inlineKey) {
        return inlineKey.replace(/\\n/g, "\n");
    }

    if (!keyPath) {
        return null;
    }

    const resolvedPath = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);

    try {
        return fs.readFileSync(resolvedPath, "utf8");
    } catch (error) {
        console.error(`Failed to read DKIM private key from ${resolvedPath}:`, error);
        return null;
    }
}

function getDkimConfig(): nodemailer.DKIMOptions | null | undefined {
    if (typeof cachedDkimConfig !== "undefined") {
        return cachedDkimConfig;
    }

    const domainName = process.env.EMAIL_DKIM_DOMAIN?.trim();
    const keySelector = process.env.EMAIL_DKIM_SELECTOR?.trim();
    const privateKey = resolvePrivateKey(process.env.EMAIL_DKIM_PRIVATE_KEY, process.env.EMAIL_DKIM_PRIVATE_KEY_PATH);

    if (!domainName || !keySelector || !privateKey) {
        cachedDkimConfig = null;
        return cachedDkimConfig;
    }

    cachedDkimConfig = {
        domainName,
        keySelector,
        privateKey,
        cacheDir: process.env.EMAIL_DKIM_CACHE_DIR,
    };

    return cachedDkimConfig;
}

function parseNumber(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
    if (typeof value === "undefined") return fallback;
    const normalized = value.trim().toLowerCase();
    if (normalized === "1" || normalized === "true") return true;
    if (normalized === "0" || normalized === "false") return false;
    return fallback;
}

/**
 * Returns a cached Nodemailer transporter instance to avoid repeated setup.
 * The transporter is now configurable via environment variables so we can
 * migrate away from Gmail SMTP without touching the codebase again.
 */
async function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment");
    }

    const host = process.env.EMAIL_SMTP_HOST || "smtp.gmail.com";
    const port = parseNumber(process.env.EMAIL_SMTP_PORT, host === "smtp.gmail.com" ? 587 : 587);
    const secure = parseBoolean(process.env.EMAIL_SMTP_SECURE, port === 465);
    const requireTLS = parseBoolean(process.env.EMAIL_SMTP_REQUIRE_TLS, true);
    const rejectUnauthorized = parseBoolean(process.env.EMAIL_SMTP_REJECT_UNAUTHORIZED, false);
    const pool = parseBoolean(process.env.EMAIL_SMTP_POOL, true);
    const maxConnections = parseNumber(process.env.EMAIL_MAX_CONNECTIONS, 3);
    const maxMessages = parseNumber(process.env.EMAIL_MAX_MESSAGES, 100);
    const connectionTimeout = process.env.EMAIL_SMTP_CONNECTION_TIMEOUT_MS
        ? parseNumber(process.env.EMAIL_SMTP_CONNECTION_TIMEOUT_MS, 10_000)
        : undefined;
    const greetingTimeout = process.env.EMAIL_SMTP_GREETING_TIMEOUT_MS
        ? parseNumber(process.env.EMAIL_SMTP_GREETING_TIMEOUT_MS, 10_000)
        : undefined;
    const socketTimeout = process.env.EMAIL_SMTP_SOCKET_TIMEOUT_MS
        ? parseNumber(process.env.EMAIL_SMTP_SOCKET_TIMEOUT_MS, 10_000)
        : undefined;
    const name = process.env.EMAIL_SMTP_NAME;
    const localAddress = process.env.EMAIL_SMTP_LOCAL_ADDRESS;
    const requireTLSMinVersion = process.env.EMAIL_SMTP_TLS_MIN_VERSION;
    const tlsCiphers = process.env.EMAIL_SMTP_TLS_CIPHERS;

    const transporterOptions: nodemailer.TransportOptions & { pool?: boolean } = {
        host,
        port,
        secure,
        requireTLS,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized,
            minVersion: requireTLSMinVersion,
            ciphers: tlsCiphers,
        },
        connectionTimeout,
        greetingTimeout,
        socketTimeout,
    };

    if (pool) {
        transporterOptions.pool = true;
        transporterOptions.maxConnections = maxConnections;
        transporterOptions.maxMessages = maxMessages;
    }

    if (name) {
        transporterOptions.name = name;
    }

    if (localAddress) {
        transporterOptions.localAddress = localAddress;
    }

    const dkim = getDkimConfig();
    if (dkim) {
        transporterOptions.dkim = dkim;
    }

    cachedTransporter = nodemailer.createTransport(transporterOptions);

    return cachedTransporter;
}

async function ensureTransporterReady(transporter: nodemailer.Transporter) {
    if (!cachedVerifyPromise) {
        cachedVerifyPromise = transporter
            .verify()
            .then(() => {
                console.log("Email transporter ready");
            })
            .catch((verifyErr) => {
                cachedVerifyPromise = null;
                throw verifyErr;
            });
    }

    await cachedVerifyPromise;
}

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
    replyTo?: string;
    text?: string;
}

/**
 * Sends an email using the pooled transporter.
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
    const transporter = await getTransporter();
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
    const unsubscribe = process.env.EMAIL_LIST_UNSUBSCRIBE;
    const unsubscribePost = process.env.EMAIL_LIST_UNSUBSCRIBE_POST;
    const mailerHeader = process.env.EMAIL_X_MAILER || "HNU Clinic Mailer";

    if (!EMAIL_FROM || !EMAIL_USER) {
        throw new Error("Missing EMAIL_USER or EMAIL_FROM in environment");
    }

    await ensureTransporterReady(transporter);

    const baseMailOptions: nodemailer.SendMailOptions = {
        from: fromName ? `"${fromName}" <${EMAIL_FROM}>` : EMAIL_FROM,
        to,
        subject,
        html,
    };

    if (replyTo) {
        baseMailOptions.replyTo = replyTo;
    }

    if (text) {
        baseMailOptions.text = text;
    }

    baseMailOptions.headers = {
        ...baseMailOptions.headers,
        "X-Mailer": mailerHeader,
    };

    if (unsubscribe) {
        baseMailOptions.headers = {
            ...baseMailOptions.headers,
            "List-Unsubscribe": unsubscribe,
        };
    }

    if (unsubscribePost) {
        baseMailOptions.headers = {
            ...baseMailOptions.headers,
            "List-Unsubscribe-Post": unsubscribePost,
        };
    }

    try {
        const info = await transporter.sendMail(baseMailOptions);
        console.log("Email sent:", info.messageId);
    } catch (err) {
        console.error("Email send failed, retrying once:", err);
        await new Promise((res) => setTimeout(res, 2000));
        const info = await transporter.sendMail(baseMailOptions);
        console.log("Email sent after retry:", info.messageId);
    }
}
