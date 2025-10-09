export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { contact } = await req.json();

        if (!contact) {
            return NextResponse.json(
                { error: "Contact (email or phone) required." },
                { status: 400 }
            );
        }

        console.log("⚙️ Starting password reset for:", contact);

        // 🔍 Find the user by email or phone
        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { student: { is: { email: contact } } },
                    { student: { is: { contactno: contact } } },
                    { employee: { is: { email: contact } } },
                    { employee: { is: { contactno: contact } } },
                ],
            },
            include: {
                student: { select: { fname: true, lname: true } },
                employee: { select: { fname: true, lname: true } },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "No account found with that contact." },
                { status: 404 }
            );
        }

        // 👤 Display name
        let fullName = user.username;
        if (user.student) fullName = `${user.student.fname} ${user.student.lname}`;
        if (user.employee) fullName = `${user.employee.fname} ${user.employee.lname}`;

        // 🎟️ Generate OTP and expiry
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 💾 Save token
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.user_id, contact },
        });

        await prisma.passwordResetToken.create({
            data: {
                userId: user.user_id,
                token: code,
                contact,
                type: contact.includes("@") ? "EMAIL" : "PHONE",
                expiresAt,
            },
        });

        // ✉️ EMAIL HANDLER
        if (contact.includes("@")) {
            const EMAIL_USER = process.env.EMAIL_USER;
            const EMAIL_PASS = process.env.EMAIL_PASS;

            if (!EMAIL_USER || !EMAIL_PASS) {
                console.error("❌ Missing EMAIL_USER or EMAIL_PASS in environment");
                return NextResponse.json(
                    { error: "Email service not configured." },
                    { status: 500 }
                );
            }

            // ✅ Gmail transporter (production-safe config)
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

            // ⏱ Set connection timeout (helps on Vercel)
            transporter.set("timeout", 10000);

            try {
                await transporter.verify();
                console.log("✅ Gmail transporter ready in production");
            } catch (verifyErr) {
                console.error("❌ Gmail transporter verification failed:", verifyErr);
            }

            const htmlContent = `
                <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; padding: 24px; border-radius: 16px; border: 1px solid #bbf7d0;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block; background-color: #ffffff; border-radius: 50%; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <img
                        src="https://hnu-clinic-app.vercel.app/clinic-illustration.png"
                        alt="HNU Clinic Logo"
                        width="48"
                        height="48"
                        style="display: block; margin: auto;"
                        />
                    </div>
                    <h1 style="color: #16a34a; font-size: 22px; margin: 12px 0 4px; font-weight: 700;">HNU Clinic</h1>
                    <p style="color: #065f46; margin: 0; font-size: 14px;">Password Reset Request</p>
                    </div>

                    <!-- Body -->
                    <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #d1fae5; text-align: center; color: #065f46;">
                    <p style="font-size: 16px;">Hello, <strong>${fullName}</strong>,</p>
                    <p style="font-size: 15px; color: #065f46;">
                        You requested to reset your password. Please use the code below to proceed:
                    </p>

                    <div style="background-color: #ecfdf5; border: 1px dashed #10b981; padding: 14px 24px; border-radius: 10px; margin: 20px auto; display: inline-block;">
                        <code style="font-size: 26px; font-weight: bold; color: #15803d; letter-spacing: 3px;">
                        ${code.split("").join(" ")}
                        </code>
                    </div>

                    <p style="font-size: 15px; color: #065f46;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #065f46;">
                        If you didn’t request this, please ignore this email.
                    </p>
                    </div>

                    <!-- Footer -->
                    <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px;">
                    This message was automatically sent from the <strong>HNU Clinic Capstone Project</strong> website.
                    </p>
                </div>
                `;

            // 📨 Send email with retry logic
            try {
                const info = await transporter.sendMail({
                    from: `"HNU Clinic" <${EMAIL_USER}>`,
                    to: contact,
                    subject: "Password Reset Code",
                    html: htmlContent,
                });
                console.log("📧 Email sent:", info.messageId);
            } catch (err) {
                console.error("❌ Email send failed, retrying once:", err);
                await new Promise((res) => setTimeout(res, 2000)); // wait 2s and retry once
                const info = await transporter.sendMail({
                    from: `"HNU Clinic" <${EMAIL_USER}>`,
                    to: contact,
                    subject: "Password Reset Code",
                    html: htmlContent,
                });
                console.log("📧 Email sent after retry:", info.messageId);
            }
        }

        // 📱 SMS HANDLER (Semaphore)
        else {
            const API_KEY = process.env.SEMAPHORE_API_KEY;
            const SENDER_NAME = process.env.SEMAPHORE_SENDER_NAME || "HNUCLINIC";

            if (!API_KEY) {
                console.error("❌ Missing SEMAPHORE_API_KEY");
                return NextResponse.json(
                    { error: "SMS service not configured." },
                    { status: 500 }
                );
            }

            if (typeof contact !== "string") {
                return NextResponse.json(
                    { error: "Invalid contact type." },
                    { status: 400 }
                );
            }

            // 🧹 Normalize phone number (Philippine format)
            let smsNumber = contact.trim();
            if (/^09\d{9}$/.test(smsNumber)) smsNumber = "+63" + smsNumber.slice(1);
            else if (/^63\d{10}$/.test(smsNumber)) smsNumber = "+" + smsNumber;

            if (!smsNumber.startsWith("+63")) {
                return NextResponse.json(
                    { error: "Invalid Philippine number format." },
                    { status: 400 }
                );
            }

            console.log("📞 Sending SMS to:", smsNumber);

            const payload = {
                apikey: API_KEY,
                number: smsNumber,
                message: `Your HNU Clinic password reset code is ${code}. Valid for 10 minutes.`,
                sendername: SENDER_NAME,
            };

            try {
                const resp = await fetch("https://api.semaphore.co/api/v4/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const result = await resp.json().catch(() => ({}));
                console.log("📩 Semaphore API response:", result);

                if (!resp.ok || result.status === "Failed") {
                    return NextResponse.json(
                        { error: "Failed to send SMS.", details: result },
                        { status: 502 }
                    );
                }
            } catch (err) {
                console.error("❌ SMS send failed:", err);
                return NextResponse.json(
                    { error: "Failed to send SMS.", details: String(err) },
                    { status: 502 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: "Reset code sent successfully.",
        });
    } catch (error: unknown) {
        console.error("REQUEST-RESET ERROR DETAILS:", error);
        return NextResponse.json(
            {
                error: "Internal server error.",
                details: error instanceof Error ? error.message : JSON.stringify(error),
            },
            { status: 500 }
        );
    }
}
