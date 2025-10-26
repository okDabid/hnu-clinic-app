export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { normalizeResetContact } from "@/lib/password-reset";
import { generateNumericCode } from "@/lib/security";
import {
    assertRateLimit,
    RateLimitError,
    getClientIp,
    applyRateLimitHeaders,
    RateLimitResult,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
    let headerSource: RateLimitResult | null = null;
    try {
        const clientIp = getClientIp(req);
        const ipResult = assertRateLimit({
            key: `auth:reset-request:ip:${clientIp}`,
            limit: 5,
            windowMs: 15 * 60 * 1000,
            message: "Too many password reset requests from this IP. Please try again later.",
        });
        headerSource = ipResult;

        const { contact } = await req.json();

        if (typeof contact !== "string") {
            const response = NextResponse.json(
                { error: "Contact email is required." },
                { status: 400 }
            );
            return applyRateLimitHeaders(response, headerSource);
        }

        const normalized = normalizeResetContact(contact);

        if (!normalized) {
            const response = NextResponse.json(
                { error: "Enter a valid email address." },
                { status: 400 }
            );
            return applyRateLimitHeaders(response, headerSource);
        }

        const contactResult = assertRateLimit({
            key: `auth:reset-request:contact:${normalized.normalized}`,
            limit: 3,
            windowMs: 60 * 60 * 1000,
            message:
                "Too many password reset requests for this contact. Please wait before requesting another code.",
        });

        if (
            !headerSource ||
            contactResult.remaining < headerSource.remaining ||
            (contactResult.remaining === headerSource.remaining &&
                contactResult.reset < headerSource.reset)
        ) {
            headerSource = contactResult;
        }

        // Find user by email
        const user = await prisma.users.findFirst({
            where: {
                OR: [
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
                ],
            },
            include: {
                student: { select: { fname: true, lname: true } },
                employee: { select: { fname: true, lname: true } },
            },
        });

        if (!user) {
            const response = NextResponse.json({
                success: true,
                message: "If an account exists for that email, a reset code has been sent.",
            });
            return applyRateLimitHeaders(response, headerSource);
        }

        // Display name
        let fullName = user.username;
        if (user.student) fullName = `${user.student.fname} ${user.student.lname}`;
        if (user.employee) fullName = `${user.employee.fname} ${user.employee.lname}`;

        // Generate OTP and expiry
        const code = generateNumericCode(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Atomic token handling with rate limit
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

        const response = NextResponse.json({
            success: true,
            message: "If an account exists for that email, a reset code has been sent.",
        });
        return applyRateLimitHeaders(response, headerSource);
    } catch (error: unknown) {
        console.error("REQUEST-RESET ERROR DETAILS:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error occurred";

        if (error instanceof RateLimitError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status, headers: error.headers },
            );
        }

        if (message === "Reset already requested recently.") {
            const response = NextResponse.json(
                {
                    error:
                        "A reset code was already sent recently. Please try again later.",
                },
                { status: 429 }
            );
            return applyRateLimitHeaders(response, headerSource);
        }

        const response = NextResponse.json(
            { error: "Internal server error.", details: message },
            { status: 500 }
        );
        return applyRateLimitHeaders(response, headerSource);
    }
}
