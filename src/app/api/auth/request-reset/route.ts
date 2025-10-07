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

        // ✅ Find user safely via 1-to-1 relation (works on Vercel)
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

        // ✅ Determine display name
        let fullName = user.username;
        if (user.student) fullName = `${user.student.fname} ${user.student.lname}`;
        if (user.employee) fullName = `${user.employee.fname} ${user.employee.lname}`;

        // 🎟️ Generate OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 💾 Remove old tokens and insert new one
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
                console.error("Missing EMAIL_USER or EMAIL_PASS in environment.");
                return NextResponse.json(
                    { error: "Email server not configured." },
                    { status: 500 }
                );
            }

            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; background-color: #f7fafc; padding: 20px;">
                    <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="background-color: #16a34a; padding: 24px; text-align: center;">
                            <img 
                                src="https://hnu-clinic-app.vercel.app/clinic-illustration.png" 
                                alt="HNU Clinic Logo" 
                                width="60" height="60"
                                style="display:block;margin:0 auto 10px auto;border-radius:50%;background:white;padding:5px;"
                            />
                            <h1 style="color:#ffffff;font-size:22px;margin:0;">HNU Clinic</h1>
                            <p style="color:#d1fae5;margin:4px 0 0;">Password Reset Code</p>
                        </div>
                        <div style="padding:24px;text-align:center;">
                            <p style="color:#374151;font-size:16px;">Hello, ${fullName},</p>
                            <p style="color:#4b5563;font-size:15px;line-height:1.5;">
                                You requested to reset your password. Use the code below to proceed:
                            </p>
                            <div style="background-color:#f0fdf4;border:1px dashed #16a34a;padding:12px;border-radius:8px;margin:20px auto;width:fit-content;">
                                <span style="font-size:26px;font-weight:bold;color:#15803d;">${code}</span>
                            </div>
                            <p style="color:#6b7280;font-size:14px;line-height:1.5;">
                                This code will expire in <strong>10 minutes</strong>.<br>
                                If you didn’t request this, please ignore this email.
                            </p>
                            <a href="https://hnu-clinic-app.vercel.app/login"
                                style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;margin-top:16px;font-weight:500;">
                                Go to Login Page
                            </a>
                        </div>
                        <div style="background-color:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">
                            © ${new Date().getFullYear()} HNU Clinic Capstone Project
                        </div>
                    </div>
                </div>
            `;

            try {
                await transporter.sendMail({
                    from: `"HNU Clinic" <${process.env.EMAIL_USER}>`,
                    to: contact,
                    subject: "Password Reset Code",
                    text: `Your password reset code is: ${code}. It will expire in 10 minutes.`,
                    html: htmlContent,
                });
            } catch (err) {
                console.error("Email send failed:", err);
                return NextResponse.json(
                    { error: "Failed to send reset email." },
                    { status: 500 }
                );
            }
        }

        // 📱 SMS HANDLER
        else {
            if (!process.env.SEMAPHORE_API_KEY) {
                console.error("Missing SEMAPHORE_API_KEY environment variable.");
                return NextResponse.json(
                    { error: "SMS service not configured." },
                    { status: 500 }
                );
            }

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
