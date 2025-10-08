export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

/**
 * Password Reset Request Handler
 * Sends a password reset code via Email or SMS using Semaphore API
 */
export async function POST(req: Request) {
    try {
        const { contact } = await req.json();

        if (!contact) {
            return NextResponse.json(
                { error: "Contact (email or phone) required." },
                { status: 400 }
            );
        }

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

        // 👤 Determine display name
        let fullName = user.username;
        if (user.student) fullName = `${user.student.fname} ${user.student.lname}`;
        if (user.employee) fullName = `${user.employee.fname} ${user.employee.lname}`;

        // 🎟️ Generate OTP and expiry
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 💾 Save the token
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
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                return NextResponse.json(
                    { error: "Email service not configured." },
                    { status: 500 }
                );
            }

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f7fafc; padding: 20px;">
          <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background-color: #16a34a; padding: 24px; text-align: center;">
              <img src="https://hnu-clinic-app.vercel.app/clinic-illustration.png"
                   alt="HNU Clinic Logo" width="60" height="60"
                   style="display:block;margin:0 auto 10px;border-radius:50%;background:white;padding:5px;" />
              <h1 style="color:#ffffff;font-size:22px;margin:0;">HNU Clinic</h1>
              <p style="color:#d1fae5;margin:4px 0 0;">Password Reset Code</p>
            </div>
            <div style="padding:24px;text-align:center;">
              <p>Hello, ${fullName},</p>
              <p>You requested to reset your password. Use this code:</p>
              <div style="background-color:#f0fdf4;border:1px dashed #16a34a;padding:12px;border-radius:8px;margin:20px auto;width:fit-content;">
                <span style="font-size:26px;font-weight:bold;color:#15803d;">${code}</span>
              </div>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn’t request this, please ignore this message.</p>
            </div>
          </div>
        </div>
      `;

            await transporter.sendMail({
                from: `"HNU Clinic" <${process.env.EMAIL_USER}>`,
                to: contact,
                subject: "Password Reset Code",
                html: htmlContent,
            });
        }

        // 📱 SMS HANDLER (Semaphore)
        else {
            if (!process.env.SEMAPHORE_API_KEY) {
                return NextResponse.json(
                    { error: "SMS service not configured." },
                    { status: 500 }
                );
            }

            // ✅ Convert 09... to +639... format
            let smsNumber = contact;
            if (/^09\d{9}$/.test(contact)) {
                smsNumber = "+63" + contact.slice(1);
            }

            const params = new URLSearchParams({
                apikey: process.env.SEMAPHORE_API_KEY,
                number: smsNumber,
                message: `Your HNU Clinic password reset code is ${code}. Valid for 10 minutes.`,
                sendername: "SEMAPHORE", // ✅ Use default until your own sender is approved
            });

            const resp = await fetch("https://semaphore.co/api/v4/messages", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString(),
            });

            const resultText = await resp.text();
            console.log("📩 Semaphore API response:", resultText);

            if (!resp.ok) {
                return NextResponse.json(
                    { error: "Failed to send SMS.", details: resultText },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: "Reset code sent successfully.",
        });
    } catch (error: unknown) {
        console.error("REQUEST-RESET ERROR:", error);
        return NextResponse.json(
            {
                error: "Internal server error.",
                details: error instanceof Error ? error.message : JSON.stringify(error),
            },
            { status: 500 }
        );
    }
}
