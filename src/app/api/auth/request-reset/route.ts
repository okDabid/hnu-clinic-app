export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { normalizeResetContact } from "@/lib/password-reset";
import { generateNumericCode } from "@/lib/security";
import { ipKey, jsonFieldKey, withRateLimit } from "@/lib/rate-limit";

async function handler(req: Request) {
    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON payload." },
                { status: 400 }
            );
        }

        const contact =
            typeof body === "object" && body && "contact" in body
                ? (body as { contact?: unknown }).contact
                : undefined;

        if (typeof contact !== "string") {
            return NextResponse.json(
                { error: "Contact email is required." },
                { status: 400 }
            );
        }

        const normalized = normalizeResetContact(contact);

        if (!normalized) {
            return NextResponse.json(
                { error: "Enter a valid email address." },
                { status: 400 }
            );
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
            return NextResponse.json({
                success: true,
                message: "If an account exists for that email, a reset code has been sent.",
            });
        }

        // Display name
        let fullName = user.username;
        if (user.student) fullName = `${user.student.fname} ${user.student.lname}`;
        if (user.employee) fullName = `${user.employee.fname} ${user.employee.lname}`;

        // Generate OTP and expiry
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Atomic token handling with rate limit
        const createdToken = await prisma.$transaction(async (tx) => {
            await tx.passwordResetToken.deleteMany({
                where: { userId: user.user_id, contact: normalized.normalized },
            });

            for (let attempt = 0; attempt < 5; attempt += 1) {
                const code = generateNumericCode(6);

                try {
                    return await tx.passwordResetToken.create({
                        data: {
                            userId: user.user_id,
                            token: code,
                            contact: normalized.normalized,
                            type: normalized.type,
                            expiresAt,
                        },
                        select: { id: true, token: true },
                    });
                } catch (error) {
                    if (
                        error instanceof Prisma.PrismaClientKnownRequestError &&
                        error.code === "P2002"
                    ) {
                        continue;
                    }

                    throw error;
                }
            }

            throw new Error("Unable to generate reset code. Please try again.");
        });

        const code = createdToken.token;

        const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; padding: 24px; border-radius: 16px; border: 1px solid #bbf7d0;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #ffffff; border-radius: 50%; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <img
                src="https://www.hnu-clinic-app.com/clinic-illustration.png"
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

        const textContent = `Hello, ${fullName}!

You requested to reset your password. Please use the code below to proceed:

${code}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

This message was automatically sent from the HNU Clinic Capstone Project website.`;

        try {
            await sendEmail({
                to: normalized.normalized,
                subject: "Password Reset Code",
                html: htmlContent,
                fromName: "HNU Clinic",
                text: textContent,
            });
        } catch (emailError) {
            console.error("Failed to send reset email:", emailError);
            try {
                await prisma.passwordResetToken.delete({ where: { id: createdToken.id } });
            } catch (cleanupError) {
                console.error(
                    "Failed to clean up reset token after email error:",
                    cleanupError,
                );
            }

            const missingSender =
                emailError instanceof Error &&
                emailError.message.includes("Missing GMAIL_USER in environment");

            if (missingSender) {
                return NextResponse.json(
                    { error: "Email service is not configured." },
                    { status: 500 },
                );
            }

            return NextResponse.json(
                { error: "Failed to send reset email. Please try again later." },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            message: "If an account exists for that email, a reset code has been sent.",
        });
    } catch (error: unknown) {
        console.error("REQUEST-RESET ERROR DETAILS:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error occurred";

        if (message === "Unable to generate reset code. Please try again.") {
            return NextResponse.json(
                { error: "Unable to generate reset code. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

export const POST = withRateLimit(
    [
        {
            key: ipKey("auth:request-reset:ip"),
            limit: 6,
            windowMs: 60 * 60_000,
            message:
                "Too many reset requests from this network. Please wait before trying again.",
        },
        {
            key: jsonFieldKey("contact", "auth:request-reset:contact"),
            limit: 4,
            windowMs: 60 * 60_000,
            message:
                "Too many reset requests for this email. Please wait before requesting another code.",
        },
    ],
    handler
);
