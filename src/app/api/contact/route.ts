import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email";
import {
  assertRateLimit,
  RateLimitError,
  getClientIp,
  applyRateLimitHeaders,
  RateLimitResult,
} from "@/lib/rate-limit";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export async function POST(req: Request) {
  let headerSource: RateLimitResult | null = null;
  try {
    const clientIp = getClientIp(req);
    const ipResult = assertRateLimit({
      key: `contact:ip:${clientIp}`,
      limit: 3,
      windowMs: 5 * 60 * 1000,
      message: "Too many messages from this IP. Please wait a few minutes before trying again.",
    });
    headerSource = ipResult;

    const { name, email, message } = (await req.json()) as ContactFormData;

    // Validate inputs
    if (!name || !email || !message) {
      const response = NextResponse.json(
        { error: "All fields are required. Please fill out the form completely." },
        { status: 400 }
      );
      return applyRateLimitHeaders(response, headerSource);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailResult = assertRateLimit({
      key: `contact:email:${normalizedEmail}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
      message: "Too many messages from this email address. Please try again later.",
    });

    if (
      !headerSource ||
      emailResult.remaining < headerSource.remaining ||
      (emailResult.remaining === headerSource.remaining && emailResult.reset < headerSource.reset)
    ) {
      headerSource = emailResult;
    }

    // Themed HTML email
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4; padding: 24px; border-radius: 16px; border: 1px solid #bbf7d0;">
        <h1 style="color: #16a34a; text-align: center; margin-bottom: 8px;">HNU Clinic</h1>
        <p style="text-align: center; color: #065f46; font-size: 14px; margin-bottom: 20px;">
          New inquiry received from your website’s contact form 💬
        </p>

        <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #d1fae5;">
          <p style="margin: 0; font-size: 16px; color: #065f46;"><strong>👤 Name:</strong> ${name}</p>
          <p style="margin: 8px 0 0; font-size: 16px; color: #065f46;"><strong>📧 Email:</strong> 
            <a href="mailto:${email}" style="color: #16a34a; text-decoration: none;">${email}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #dcfce7; margin: 20px 0;" />
          <p style="font-size: 16px; color: #065f46;"><strong>💬 Message:</strong></p>
          <p style="background-color: #ecfdf5; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #10b981; color: #064e3b; font-size: 15px; line-height: 1.5;">
            ${message.replace(/\n/g, "<br>")}
          </p>
        </div>

        <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px;">
          This message was sent from the <strong>HNU Clinic Capstone Project</strong> website.
        </p>
      </div>
    `;

  const inbox = process.env.EMAIL_USER;
  if (!inbox) {
    const response = NextResponse.json(
      { error: "Email service is not configured." },
      { status: 500 }
    );
    return applyRateLimitHeaders(response, headerSource);
  }

    await sendEmail({
      to: inbox,
      subject: `📩 New Inquiry from ${name}`,
      html: htmlContent,
      fromName: "HNU Clinic Contact Form",
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    });

    const response = NextResponse.json({
      message: "Message sent successfully! Thank you for contacting HNU Clinic.",
    });
    return applyRateLimitHeaders(response, headerSource);
  } catch (error) {
    // Type-safe error handling
    if (error instanceof Error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status, headers: error.headers }
        );
      }
      console.error("Email error:", error.message);
      const response = NextResponse.json(
        { error: `Failed to send message: ${error.message}` },
        { status: 500 }
      );
      return applyRateLimitHeaders(response, headerSource);
    }

    console.error("Unknown error occurred while sending email.");
    const response = NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
    return applyRateLimitHeaders(response, headerSource);
  }
}
