import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        await resend.emails.send({
            from: "HNU Clinic <onboarding@resend.dev>",
            to: "hnucliniccapstone@gmail.com",
            replyTo: email, // ✅ correct for SDK
            subject: `New message from ${name}`,
            text: `
        You received a new message from the HNU Clinic contact form.

        Name: ${name}
        Email: ${email}
        Message:
        ${message}
      `,
        });

        return NextResponse.json({
            success: true,
            message: "Message sent successfully!",
        });
    } catch (error) {
        console.error("Resend error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
