export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
    formatPhoneForSms,
    normalizeResetContact,
} from "@/lib/password-reset";

export async function POST(req: Request) {
    try {
        const { contact } = await req.json();

        if (typeof contact !== "string") {
            return NextResponse.json(
                { error: "Contact (email or phone) required." },
                { status: 400 }
            );
        }

        const normalized = normalizeResetContact(contact);

        if (!normalized) {
            return NextResponse.json(
                { error: "Enter a valid email address or PH mobile number." },
                { status: 400 }
            );
        }

        console.log("⚙️ Starting password reset for:", normalized.normalized);

        // 🔍 Find user by email or phone
        const user = await prisma.users.findFirst({
            where: {
                OR:
                    normalized.type === "EMAIL"
                        ? [
                              {
                                  student: {
                                      is: {
                                          email: {
                                              equals: normalized.normalized,
                                              mode: "insensitive",
                                          },
                                      },
                                  },
                              },
                              {
                                  employee: {
                                      is: {
                                          email: {
                                              equals: normalized.normalized,
                                              mode: "insensitive",
                                          },
                                      },
                                  },
                              },
                          ]
                        : [
                              {
                                  student: {
                                      is: {
                                          contactno: {
                                              in: normalized.variants,
                                          },
                                      },
                                  },
                              },
                              {
                                  employee: {
                                      is: {
                                          contactno: {
                                              in: normalized.variants,
                                          },
                                      },
                                  },
                              },
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

        // 💾 Atomic token handling with rate limit
        await prisma.$transaction(async (tx) => {
            const existing = await tx.passwordResetToken.findFirst({
                where: { userId: user.user_id, expiresAt: { gt: new Date() } },
            });

            if (existing) {
                throw new Error("Reset already requested recently.");
            }

            await tx.passwordResetToken.deleteMany({
                where: { userId: user.user_id, contact: normalized.normalized },
            });

            await tx.passwordResetToken.create({
                data: {
                    userId: user.user_id,
                    token: code,
                    contact: normalized.normalized,
                    type: normalized.type,
                    expiresAt,
                },
            });
        });

        // ✉️ EMAIL HANDLER
        if (normalized.type === "EMAIL") {
            const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; padding: 24px; border-radius: 16px; border: 1px solid #bbf7d0;">
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

          <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #d1fae5; text-align: center; color: #065f46;">
            <p style="font-size: 16px;">Hello, <strong>${fullName}</strong>!</p>
            <p style="font-size: 15px;">You requested to reset your password. Please use the code below to proceed:</p>
            <div style="background-color: #ecfdf5; border: 1px dashed #10b981; padding: 14px 24px; border-radius: 10px; margin: 20px auto; display: inline-block;">
              <code style="font-size: 26px; font-weight: bold; color: #15803d; letter-spacing: 3px;">${code}</code>
            </div>
            <p style="font-size: 15px;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="font-size: 14px;">If you didn’t request this, please ignore this email.</p>
          </div>

          <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px;">
            This message was automatically sent from the <strong>HNU Clinic Capstone Project</strong> website.
          </p>
        </div>
      `;

            await sendEmail({
                to: normalized.normalized,
                subject: "Password Reset Code",
                html: htmlContent,
                fromName: "HNU Clinic",
            });
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

            const smsNumber = formatPhoneForSms(normalized.normalized);

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
            } catch (err: unknown) {
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
        const message =
            error instanceof Error ? error.message : "Unknown error occurred";

        if (message === "Reset already requested recently.") {
            return NextResponse.json(
                {
                    error:
                        "A reset code was already sent recently. Please try again later.",
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error.", details: message },
            { status: 500 }
        );
    }
}
