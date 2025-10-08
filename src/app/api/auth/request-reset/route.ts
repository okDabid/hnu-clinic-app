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
                <div style="font-family: Arial, sans-serif; background-color: #111827; padding: 20px;">
                    <div style="max-width: 480px; margin: auto; background: #1f2937; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">

                    <!-- Header -->
                    <div style="background-color: #16a34a; padding: 36px 24px; text-align: center; position: relative;">
                        <div style="width: 72px; height: 72px; background-color: #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                        <img 
                            src="https://hnu-clinic-app.vercel.app/clinic-illustration.png" 
                            alt="Shield Icon" 
                            width="40" height="40"
                            style="display: block; margin: 0 auto;" 
                        />
                        </div>
                        <h1 style="color:#ffffff; font-size:24px; font-weight:700; margin:0;">HNU Clinic</h1>
                        <p style="color:#bbf7d0; margin:6px 0 0; font-size:15px;">Password Reset Code</p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 32px 24px; text-align: center; color: #e5e7eb;">
                        <p style="margin-top:0;">Hello, <strong style="color:#ffffff;">${fullName}</strong>,</p>
                        <p style="margin:10px 0;">You requested to reset your password. Use this code:</p>

                        <div style="background-color:#064e3b; border:1px dashed #16a34a; padding:14px 24px; border-radius:10px; display:inline-block; margin:24px 0;">
                        <code style="font-size:30px; font-weight:bold; color:#22c55e; letter-spacing:6px;">
                            ${code}
                        </code>
                        </div>

                        <p style="color:#d1d5db; margin:6px 0;">This code will expire in <strong>10 minutes</strong>.</p>
                        <p style="color:#9ca3af; margin-bottom:0;">If you didn’t request this, please ignore this message.</p>
                    </div>

                    </div>
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

            const params = new URLSearchParams({
                apikey: API_KEY,
                number: smsNumber,
                message: `Your HNU Clinic password reset code is ${code}. Valid for 10 minutes.`,
                sendername: SENDER_NAME,
            });

            try {
                const resp = await fetch("https://api.semaphore.co/api/v4/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: params.toString(),
                });

                const resultText = await resp.text();
                console.log("📩 Semaphore API response:", resultText);

                if (!resp.ok || resultText.includes('"status":"Failed"')) {
                    return NextResponse.json(
                        { error: "Failed to send SMS.", details: resultText },
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
