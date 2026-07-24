import nodemailer from 'nodemailer';
import { env } from '@/src/lib/config/env';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: (env.SMTP_PORT || 587) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: env.SMTP_FROM || 'noreply@digitax.pk',
      to,
      subject,
      html,
      text: text || '',
    });

    if (info.messageId) {
      console.log(`Email sent to ${to}: ${info.messageId}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail(to, name) {
  return sendEmail({
    to,
    subject: 'Welcome to Digitax',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Welcome to Digitax!</h2>
        <p>Dear ${name},</p>
        <p>Your account has been created successfully. You can now:</p>
        <ul>
          <li>Apply for tax registration</li>
          <li>Track your applications</li>
          <li>Contact our support team</li>
        </ul>
        <p>Best regards,<br/>Digitax Team</p>
      </div>
    `,
  });
}

export async function sendOtpEmail(to, name, otp) {
  return sendEmail({
    to,
    subject: 'Digitax - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Password Reset Request</h2>
        <p>Dear ${name},</p>
        <p>Your OTP for password reset is:</p>
        <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a56db;">${otp}</span>
        </div>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br/>Digitax Team</p>
      </div>
    `,
  });
}
