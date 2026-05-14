import { Resend } from "resend";
import nodemailer from "nodemailer";

// 1. Ingest environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY ||
  (process.env.SMTP_PASS?.startsWith("re_") ? process.env.SMTP_PASS : null);

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const EMAIL_FROM = process.env.EMAIL_FROM || '"ScopeAI" <onboarding@resend.dev>';

// Standardized From Header Parser
function getFromHeader(): string {
  return EMAIL_FROM.includes("<") ? EMAIL_FROM : `ScopeAI <${EMAIL_FROM}>`;
}

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  const subject = `[ScopeAI] Email Verification Code: ${code}`;
  const text = `Your ScopeAI verification code is: ${code}. This code will expire in 10 minutes.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #0f172a; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: block; margin: 0 auto; width: 48px; height: 48px; background-color: #4f46e5; border-radius: 10px; color: #ffffff !important; font-size: 24px; font-weight: bold; line-height: 48px; text-align: center;">S</div>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: bold; margin-bottom: 16px; text-align: center;">ScopeAI Verification</h2>
      <p style="font-size: 14px; color: #334155;">Thank you for signing up! Use the 6-digit code below to verify your email address:</p>
      <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0f172a; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">&copy; ${new Date().getFullYear()} ScopeAI. All rights reserved.</p>
    </div>
  `;

  // --- METHOD A: Nodemailer SMTP (If configured in .env) ---
  if (SMTP_HOST && SMTP_HOST !== "smtp.resend.com") {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // Use SSL/TLS if 465
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: getFromHeader(),
        to,
        subject,
        text,
        html,
      });

      console.log(`[Email Service] Verification sent to ${to} successfully via Nodemailer SMTP.`);
      return true;
    } catch (error) {
      console.error("[Email Service] Nodemailer verification dispatch failed:", error);
      // Fall back to other modes if SMTP explicitly errors
    }
  }

  // --- METHOD B: Resend SDK (Alternative) ---
  if (RESEND_API_KEY && RESEND_API_KEY !== "re_xxxx_xxxxxxxxx") {
    try {
      const resend = new Resend(RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: getFromHeader(),
        to: [to],
        subject,
        text,
        html,
      });

      if (error) throw new Error(error.message);

      console.log(`[Email Service] Verification sent to ${to} via Resend SDK (ID: ${data?.id})`);
      return true;
    } catch (error) {
      console.error("[Email Service] Resend SDK verification dispatch failed:", error);
    }
  }

  // --- METHOD C: Developer Fallback (Visual Emulator in Console) ---
  const horizontalRule = "================================================";
  console.log(`\n${horizontalRule}`);
  console.log(`[ScopeAI EMAIL SIMULATOR]`);
  console.log(`${horizontalRule}`);
  console.log(`Target Recipient:  ${to}`);
  console.log(`Verification OTP:  [ ${code} ]`);
  console.log(`Timestamp:         ${new Date().toLocaleTimeString()}`);
  console.log(`${horizontalRule}`);
  console.log(`TIP: Add SMTP credentials or RESEND_API_KEY to activate live delivery.\n`);

  return true;
}

export async function sendResetPasswordEmail(to: string, resetLink: string): Promise<boolean> {
  const subject = `[ScopeAI] Password Reset Request`;
  const text = `To reset your ScopeAI password, click the link below:\n\n${resetLink}\n\nIf you did not request a password reset, please ignore this email.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #0f172a; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: block; margin: 0 auto; width: 48px; height: 48px; background-color: #4f46e5; border-radius: 10px; color: #ffffff !important; font-size: 24px; font-weight: bold; line-height: 48px; text-align: center;">S</div>
      </div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: bold; margin-bottom: 16px; text-align: center;">Reset Your Password</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center;">We received a request to reset your password for ScopeAI. Click the button below to set up a new credential:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #4f46e5; color: #ffffff !important; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06);">Reset Password</a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">If you did not request this change, you can safely disregard this email. For security, this link will allow you to configure a new password for your email address.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <div style="background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 6px; padding: 12px; text-align: center;">
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 4px 0;">Trouble with the button? Copy and paste this link:</p>
        <a href="${resetLink}" style="font-size: 11px; color: #6366f1; word-break: break-all;">${resetLink}</a>
      </div>
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px;">&copy; ${new Date().getFullYear()} ScopeAI. All rights reserved.</p>
    </div>
  `;

  // --- METHOD A: Nodemailer SMTP (If configured in .env) ---
  if (SMTP_HOST && SMTP_HOST !== "smtp.resend.com") {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: getFromHeader(),
        to,
        subject,
        text,
        html,
      });

      console.log(`[Email Service] Reset email successfully dispatched to ${to} via Nodemailer SMTP.`);
      return true;
    } catch (error) {
      console.error("[Email Service] Nodemailer password reset failed:", error);
    }
  }

  // --- METHOD B: Resend SDK (Alternative) ---
  if (RESEND_API_KEY && RESEND_API_KEY !== "re_xxxx_xxxxxxxxx") {
    try {
      const resend = new Resend(RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: getFromHeader(),
        to: [to],
        subject,
        text,
        html,
      });

      if (error) throw new Error(error.message);

      console.log(`[Email Service] Reset email sent to ${to} via Resend SDK (ID: ${data?.id})`);
      return true;
    } catch (error) {
      console.error("[Email Service] Resend SDK password reset failed:", error);
    }
  }

  // --- METHOD C: Developer Fallback (Visual Emulator) ---
  const hr = "------------------------------------------------";
  console.log(`\n${hr}`);
  console.log(`[ScopeAI EMAIL SIMULATOR - RESET PASSWORD]`);
  console.log(`${hr}`);
  console.log(`Target Recipient:  ${to}`);
  console.log(`Reset Link URL:    ${resetLink}`);
  console.log(`${hr}\n`);

  return true;
}
