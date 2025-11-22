import fetch from "node-fetch";

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing ${name} in environment`);
    }
    return value;
}

export interface SmsPayload {
    to: string;
    message: string;
}

export async function sendSms({ to, message }: SmsPayload): Promise<void> {
    const appKey = getRequiredEnv("PHILSMS_APP_KEY");
    const appSecret = getRequiredEnv("PHILSMS_APP_SECRET");
    const senderId = process.env.PHILSMS_SENDER_ID?.trim();

    const payload: Record<string, unknown> = {
        app_key: appKey,
        app_secret: appSecret,
        recipients: [to],
        message,
    };

    if (senderId) {
        payload.sender_id = senderId;
    }

    const response = await fetch(
        process.env.PHILSMS_API_URL?.trim() || "https://app.philsms.com/api/v3/sms/send",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        },
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PhilSMS request failed (${response.status}): ${errorText}`);
    }

    const result = (await response.json()) as {
        success?: boolean;
        code?: number;
        message?: string;
    };

    if (result.success === false || (typeof result.code === "number" && result.code >= 400)) {
        throw new Error(result.message || "PhilSMS rejected the SMS payload.");
    }
}
