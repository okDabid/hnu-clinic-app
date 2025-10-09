import { NextResponse } from "next/server";
import nodemailer, { SentMessageInfo } from "nodemailer";

interface ContactFormData {
    name: string;
    email: string;
    message: string;
}

export async function POST(req: Request) {
    try {
        const { name, email, message } = (await req.json()) as ContactFormData;

        // 🧾 Validate inputs
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "All fields are required. Please fill out the form completely." },
                { status: 400 }
            );
        }

        // ✉️ Configure mail transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 🌿 Themed HTML email
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

        // 📤 Mail configuration
        const mailOptions = {
            from: `"HNU Clinic Contact Form" <${process.env.EMAIL_USER}>`,
            replyTo: email,
            to: process.env.EMAIL_USER,
            subject: `📩 New Inquiry from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
            html: htmlContent,
        };

        // 🚀 Send email
        const info: SentMessageInfo = await transporter.sendMail(mailOptions);

        console.log("✅ Email sent:", info.messageId);

        return NextResponse.json({
            message: "✅ Message sent successfully! Thank you for contacting HNU Clinic.",
        });
    } catch (error) {
        // 🧠 Type-safe error handling
        if (error instanceof Error) {
            console.error("❌ Email error:", error.message);
            return NextResponse.json(
                { error: `❌ Failed to send message: ${error.message}` },
                { status: 500 }
            );
        }

        console.error("❌ Unknown error occurred while sending email.");
        return NextResponse.json(
            { error: "❌ An unexpected error occurred. Please try again later." },
            { status: 500 }
        );
    }
}
