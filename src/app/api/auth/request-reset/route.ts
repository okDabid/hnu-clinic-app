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
                    { student: { email: contact } },
                    { student: { contactno: contact } },
                    { employee: { email: contact } },
                    { employee: { contactno: contact } },
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

        // ✅ Get user's name (student or employee)
        let fullName = user.username; // fallback

        if (user.role === "PATIENT" || user.role === "SCHOLAR") {
            const student = await prisma.student.findUnique({
                where: { user_id: user.user_id },
                select: { fname: true, lname: true },
            });
            if (student) fullName = `${student.fname} ${student.lname}`;
        }

        if (user.role === "NURSE" || user.role === "DOCTOR") {
            const employee = await prisma.employee.findUnique({
                where: { user_id: user.user_id },
                select: { fname: true, lname: true },
            });
            if (employee) fullName = `${employee.fname} ${employee.lname}`;
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
                        
                        <!-- Header -->
                        <div style="background-color: #16a34a; padding: 24px; text-align: center;">
                            <img 
                                src="https://hnu-clinic-app.vercel.app/clinic-illustration.png" 
                                alt="HNU Clinic Logo" 
                                width="60" 
                                height="60" 
                                style="display: block; margin: 0 auto 10px auto; border-radius: 50%; background: white; padding: 5px;"
                            />
                            <h1 style="color: #ffffff; font-size: 22px; margin: 0;">HNU Clinic</h1>
                            <p style="color: #d1fae5; margin: 4px 0 0;">Password Reset Code</p>
                        </div>

                        <!-- Body -->
                        <div style="padding: 24px; text-align: center;">
                            <p style="color: #374151; font-size: 16px;">Hello, ${fullName},</p>
                            <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
                                You requested to reset your password. Use the code below to proceed:
                            </p>

                            <div style="background-color: #f0fdf4; border: 1px dashed #16a34a; padding: 12px; border-radius: 8px; margin: 20px auto; width: fit-content;">
                                <span style="font-size: 26px; font-weight: bold; color: #15803d;">${code}</span>
                            </div>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                                This code will expire in <strong>10 minutes</strong>. 
                                If you didn’t request this, please ignore this email.
                            </p>

                            <a href="https://hnu-clinic-app.vercel.app/login" 
                            style="display: inline-block; background-color: #16a34a; color: #ffffff; 
                                    text-decoration: none; padding: 10px 20px; border-radius: 6px; 
                                    margin-top: 16px; font-weight: 500;">
                                Go to Login Page
                            </a>
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #f9fafb; padding: 16px; text-align: center; 
                                    font-size: 12px; color: #9ca3af;">
                            © ${new Date().getFullYear()} HNU Clinic Capstone Project
                        </div>
                    </div>
                </div>
            `;

            await transporter.sendMail({
                from: `"HNU Clinic" <${process.env.EMAIL_USER}>`,
                to: contact,
                subject: "Password Reset Code",
                text: `Your password reset code is: ${code}. It will expire in 10 minutes.`,
                html: htmlContent, // ✅ HTML version
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
