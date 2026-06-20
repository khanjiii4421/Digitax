import db from '@/lib/db';
import { hashPassword } from '@/lib/db';
import { sendTemplateEmail } from '@/lib/email';
import { sanitizeObject, securityHeaders, checkRateLimit, getClientIp } from '@/lib/security';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateKey = `reset-pwd:${ip}`;
    const rate = checkRateLimit(rateKey, 3, 15 * 60 * 1000);
    if (rate.limited) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many attempts. Try again later.', data: null }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { email, otp, password } = sanitizeObject(body);

    if (!email || !otp || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email, OTP, and new password are required.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, message: 'Password must be at least 6 characters.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const user = await db.get('SELECT id, name, otp_code, otp_expires FROM users WHERE email = ?', [email]);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid request.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    if (!user.otp_code || user.otp_code !== otp) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid OTP code.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    if (user.otp_expires && new Date(user.otp_expires) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, message: 'OTP has expired. Please request a new one.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    // Update password and clear OTP
    const newPasswordHash = hashPassword(password);
    await db.run('UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires = NULL WHERE id = ?', [newPasswordHash, user.id]);

    await sendTemplateEmail('password_reset_success', { name: user.name }, email);

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset successfully.', data: null }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server error.', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
