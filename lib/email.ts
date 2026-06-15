import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
    auth: { user, pass },
  });
}

export async function sendSupportEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html: string;
}): Promise<void> {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || "noreply@linkid.app";

  if (!transporter) {
    const msg = "SMTP is not configured for support-email delivery.";
    if (process.env.NODE_ENV !== "production") {
      console.warn(msg);
    }
    throw new Error(msg);
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.warn(`⚠️ DEV FALLBACK: Failed to send email to ${to}`);
      console.warn(`📧 EMAIL SUBJECT: ${subject}`);
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("SMTP Error:", (error as Error).message);
      return;
    }
    throw error;
  }
}

export async function sendDeleteOtpEmail(
  to: string,
  otp: string
): Promise<void> {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || "noreply@linkid.app";

  if (!transporter) {
    const msg = "SMTP is not configured for account-deletion OTP delivery";
    if (process.env.NODE_ENV !== "production") {
      console.warn(msg);
    }
    throw new Error(msg);
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "LinkID — Account Deletion Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fafafa; border-radius: 12px;">
          <h2 style="margin: 0 0 8px; color: #dc2626; font-size: 20px;">⚠️ Account Deletion Request</h2>
          <p style="margin: 0 0 24px; color: #374151; font-size: 14px; line-height: 1.6;">
            You requested to permanently delete your LinkID account. Use the verification code below to confirm. This code expires in <strong>10 minutes</strong>.
          </p>
          <div style="background: #ffffff; border: 2px dashed #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #dc2626;">${otp}</span>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
            If you did not request this, please ignore this email. Your account will remain safe.
          </p>
        </div>
      `,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.warn(`⚠️ DEV FALLBACK: Failed to send email to ${to}`);
      console.warn(`📧 DELETE ACCOUNT OTP: ${otp}`);
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("SMTP Error:", (error as Error).message);
      return;
    }
    throw error;
  }
}
export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || "noreply@linkid.app";
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
      throw new Error("NEXTAUTH_URL environment variable is not set");
  }
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  if (!transporter) {
    const msg = "SMTP is not configured for verification email delivery";
    if (process.env.NODE_ENV !== "production") {
      console.warn(msg);
      console.warn(`📧 VERIFY URL: ${verifyUrl}`);
    }
    throw new Error(msg);
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject: "LinkID — Verify your email address",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fafafa; border-radius: 12px;">
          <h2 style="margin: 0 0 8px; color: #7c3aed; font-size: 20px;">Welcome to LinkID 🔗</h2>
          <p style="margin: 0 0 24px; color: #374151; font-size: 14px; line-height: 1.6;">
            Thanks for signing up! Please verify your email address to activate your account. This link expires in <strong>24 hours</strong>.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            Verify Email Address
          </a>
          <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
            If you did not create a LinkID account, please ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.warn(`⚠️ DEV FALLBACK: Failed to send verification email to ${to}`);
      console.warn(`📧 VERIFY URL: ${verifyUrl}`);
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("SMTP Error:", (error as Error).message);
      return;
    }
    throw error;
  }
}