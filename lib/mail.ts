import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: Number(process.env.NODEMAILER_PORT),
    secure: process.env.NODEMAILER_SECURE === "true",
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
    },
});

export const sendVerificationEmail = async (email: string, token: string) => {
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const fromEmail = process.env.NODEMAILER_FROM || "LinkID <noreply@linkid.me>";
    const tokenExpiryHours = process.env.TOKEN_EXPIRY_HOURS || "24";

    const confirmLink = `${appUrl}/verify-email?token=${token}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f4f5; color: #18181b; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #09090b; }
            p { font-size: 16px; line-height: 1.6; color: #52525b; margin-bottom: 24px; }
            .button { display: inline-block; background-color: #18181b; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 24px; }
            .footer { font-size: 14px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 24px; margin-top: 24px; }
            .link { color: #18181b; text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Verify your account</h1>
            <p>Welcome to <strong>LinkID</strong>! Before you can start building your digital profile, we need to verify your email address.</p>
            <a href="${confirmLink}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
            <p class="link">${confirmLink}</p>
            <p>This link will expire in ${process.env.TOKEN_EXPIRY_HOURS || 24} hours.</p>
            <div class="footer">
                If you didn't create an account, you can safely ignore this email.
            </div>
        </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
        from: `"LinkID" <${process.env.NODEMAILER_FROM || "noreply@linkid.me"}>`,
        to: email,
        subject: "Verify your LinkID account",
        html: htmlContent,
    });
}
