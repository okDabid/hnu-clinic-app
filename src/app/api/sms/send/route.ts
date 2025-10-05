import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { number, message } = await req.json();

        if (!number || !message) {
            return NextResponse.json({ error: "Missing number or message" }, { status: 400 });
        }

        const res = await fetch("https://semaphore.co/api/v4/messages", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                apikey: process.env.SEMAPHORE_API_KEY!,
                number,
                message,
                sendername: process.env.SEMAPHORE_SENDER_NAME || "HNClinic",
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Semaphore error:", data);
            return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error("SMS send error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
