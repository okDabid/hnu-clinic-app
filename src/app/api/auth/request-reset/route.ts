// src/app/api/auth/request-reset/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { contact } = await req.json();

        if (!contact) {
            return NextResponse.json(
                { error: "Contact (email or phone) required." },
                { status: 400 }
            );
        }

        // Find user by email or phone
        const user = await prisma.users.findFirst({
            where: {
                OR: [{ email: contact }, { phone: contact }],
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "No account found with that contact." },
                { status: 404 }
            );
        }

        // 6-digit OTP (store in token field)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Optionally clear old tokens for this contact first
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.user_id, contact },
        });

        await prisma.passwordResetToken.create({
            data: {
                userId: user.user_id,
                token: code, // <-- store the OTP here
                contact,
                type: contact.includes("@") ? "EMAIL" : "PHONE",
                expiresAt,
            },
        });

        if (contact.includes("@")) {
            // Email via Nodemailer
            const nodemailer = await import("nodemailer");
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
                text: `Your password reset code is: ${code}\nThis code will expire in 10 minutes.`,
            });
        } else {
            // SMS via Semaphore
            const resp = await fetch("https://api.semaphore.co/api/v4/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apikey: process.env.SEMAPHORE_API_KEY,
                    number: contact,
                    message: `Your HNU Clinic password reset code: ${code} (valid 10 mins)`,
                    sendername: "HNClinic",
                }),
            });

            if (!resp.ok) {
                console.error("Semaphore send failed:", await resp.text());
            }
        }

        return NextResponse.json({
            success: true,
            message: "Reset code sent successfully.",
        });
    } catch (error) {
        console.error(
            "REQUEST-RESET ERROR:",
            error instanceof Error ? error.message : error
        );
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
