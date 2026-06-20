import db from '@/lib/db';
import crypto from 'crypto';
import { sendTemplateEmail } from '@/lib/email';
import { checkRateLimit, getClientIp, sanitizeObject, securityHeaders } from '@/lib/security';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateKey = `forgot-pwd:${ip}`;
    const rate = checkRateLimit(rateKey, 3, 15 * 60 * 1000);
    if (rate.limited) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many requests. Try again later.', data: null }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { email } = sanitizeObject(body);

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email is required.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const user = await db.get('SELECT id, name, email FROM users WHERE email = ?', [email]);
    if (!user) {
      // Don't reveal if email exists - always return success
      return new Response(
        JSON.stringify({ success: true, message: 'If the email exists, an OTP has been sent.', data: null }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    await db.run('UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?', [otp, expires, user.id]);

    await sendTemplateEmail('forgot_password_otp', { name: user.name, otp }, email);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent to your email.', data: null }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server error.', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
