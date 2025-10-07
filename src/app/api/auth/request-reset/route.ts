// src/app/api/auth/request-reset/route.ts
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

        // 🔍 Find user via nested relations
        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { student: { OR: [{ email: contact }, { contactno: contact }] } },
                    { employee: { OR: [{ email: contact }, { contactno: contact }] } },
                ],
            },
            include: {
                student: true,
                employee: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "No account found with that contact." },
                { status: 404 }
            );
        }

        // 🎟️ Generate OTP (6 digits)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 💾 Clear previous tokens for this user/contact
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.user_id, contact },
        });

        // 💾 Save OTP to DB
        await prisma.passwordResetToken.create({
            data: {
                userId: user.user_id,
                token: code,
                contact,
                type: contact.includes("@") ? "EMAIL" : "PHONE",
                expiresAt,
            },
        });

        // ✉️ If contact is email → send via Gmail
        if (contact.includes("@")) {
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
        }
        // 📱 If contact is phone → send via Semaphore
        else {
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
