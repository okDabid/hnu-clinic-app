// src/app/api/auth/request-reset/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { contact } = await req.json();
        if (!contact) {
            return NextResponse.json({ error: "Contact (email or phone) required." }, { status: 400 });
        }

        // 🔍 Find user by email or phone
        const user = await prisma.users.findFirst({
            where: {
                OR: [{ email: contact }, { phone: contact }],
            },
        });

        if (!user) {
            return NextResponse.json({ error: "No account found with that contact." }, { status: 404 });
        }

        // 🎟️ Generate 6-digit code and token hash
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(32).toString("hex");

        // ⏳ Expiration: 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 💾 Save to PasswordResetToken table
        await prisma.passwordResetToken.create({
            data: {
                userId: user.user_id,
                token,
                contact,
                type: contact.includes("@") ? "EMAIL" : "PHONE",
                expiresAt,
            },
        });

        // 🔔 Send via email or SMS
        if (contact.includes("@")) {
            // ✉️ Send Email via Nodemailer
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: `"HNU Clinic" <${process.env.EMAIL_USER}>`,
                to: contact,
                subject: "Password Reset Code",
                text: `Your password reset code is: ${code}\nIt will expire in 10 minutes.`,
            });
        } else {
            // 📱 Send SMS via Semaphore
            const resp = await fetch("https://api.semaphore.co/api/v4/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apikey: process.env.SEMAPHORE_API_KEY,
                    number: contact,
                    message: `Your HNU Clinic password reset code: ${code} (valid for 10 mins)`,
                    sendername: "HNClinic",
                }),
            });

            if (!resp.ok) console.error("Failed to send SMS via Semaphore");
        }

        return NextResponse.json({ success: true, message: "Reset code sent successfully." });
    } catch (error) {
        console.error("Reset error:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
