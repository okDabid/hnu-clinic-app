import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, text: string) {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"HNU Clinic" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
}
