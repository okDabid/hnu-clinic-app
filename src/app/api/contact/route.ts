import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        console.log("Resend key:", process.env.RESEND_API_KEY ? "Loaded ✅" : "❌ Missing");

        await resend.emails.send({
            from: "HNU Clinic <onboarding@resend.dev>", // ✅ verified sender
            to: "hnucliniccapstone@gmail.com",           // ✅ your receiving inbox
            replyTo: email,                              // ✅ for direct replies
            subject: `New message from ${name}`,
            html: `
        <div style="font-family:sans-serif;line-height:1.5">
          <h2>New Contact Form Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `,
        });

        return NextResponse.json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("Resend error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
