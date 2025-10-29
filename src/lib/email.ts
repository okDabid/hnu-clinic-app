import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedVerifyPromise: Promise<void> | null = null;

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
    const maxConnections = parseNumber(process.env.EMAIL_MAX_CONNECTIONS, 3);
    const maxMessages = parseNumber(process.env.EMAIL_MAX_MESSAGES, 100);
    const requireTLS = parseBoolean(process.env.EMAIL_SMTP_REQUIRE_TLS, true);
    const rejectUnauthorized = parseBoolean(process.env.EMAIL_SMTP_REJECT_UNAUTHORIZED, false);

    cachedTransporter = nodemailer.createTransport({
        pool: true,
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
        },
        maxConnections,
        maxMessages,
    });

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
                console.error("Email transporter verification failed:", verifyErr);
            });
    }

    try {
        await cachedVerifyPromise;
    } catch {
        cachedVerifyPromise = null;
    }
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

    if (unsubscribe) {
        baseMailOptions.headers = {
            ...baseMailOptions.headers,
            "List-Unsubscribe": unsubscribe,
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
