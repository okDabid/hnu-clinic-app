import fetch from "node-fetch";

export async function sendSMS(to: string, message: string) {
    const apiKey = process.env.SEMAPHORE_API_KEY;
    const sender = process.env.SEMAPHORE_SENDER || "HNClinic";

    const response = await fetch("https://semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            apikey: apiKey!,
            number: to,
            message,
            sendername: sender,
        }),
    });

    const data = await response.json();
    console.log(`📱 SMS sent to ${to}:`, data);
}
