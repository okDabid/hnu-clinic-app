import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedVerifyPromise: Promise<void> | null = null;

/**
 * Returns a cached Nodemailer transporter instance to avoid repeated setup.
 */
async function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment");
    }

    cachedTransporter = nodemailer.createTransport({
        pool: true,
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
        maxConnections: 3,
        maxMessages: 100,
    });

    return cachedTransporter;
}

async function ensureTransporterReady(transporter: nodemailer.Transporter) {
    if (!cachedVerifyPromise) {
        cachedVerifyPromise = transporter
            .verify()
            .then(() => {
                console.log("Gmail transporter ready");
            })
            .catch((verifyErr) => {
                console.error("Gmail transporter verification failed:", verifyErr);
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
 * Sends an email using a pooled Gmail transporter.
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

    await ensureTransporterReady(transporter);

    try {
        const info = await transporter.sendMail({
            from: `"${fromName}" <${EMAIL_USER}>`,
            to,
            subject,
            html,
            replyTo,
            text,
        });
        console.log("Email sent:", info.messageId);
    } catch (err) {
        console.error("Email send failed, retrying once:", err);
        await new Promise((res) => setTimeout(res, 2000));
        const info = await transporter.sendMail({
            from: `"${fromName}" <${EMAIL_USER}>`,
            to,
            subject,
            html,
            replyTo,
            text,
        });
        console.log("Email sent after retry:", info.messageId);
    }
}
