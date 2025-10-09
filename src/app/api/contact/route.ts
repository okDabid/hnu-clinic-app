import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { name, email, message } = await req.json();
        const EMAIL_USER = process.env.EMAIL_USER;
        const EMAIL_PASS = process.env.EMAIL_PASS;
        const EMAIL_RECEIVER = process.env.EMAIL_RECEIVER || EMAIL_USER;

        // Validate fields
        if (!name || !email || !message) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587, // ✅ TLS port works on Vercel
            secure: false, // STARTTLS instead of SSL
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false, // ✅ Prevent SSL errors on serverless
            },
        });


        // Email options
        const mailOptions = {
            from: email,
            to: EMAIL_RECEIVER || EMAIL_RECEIVER, // Recipient
            subject: `New message from ${name}`,
            text: `
                Name: ${name}
                Email: ${email}
                Message: ${message}
            `,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
