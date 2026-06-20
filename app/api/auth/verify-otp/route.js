import db from '@/lib/db';
import { sanitizeObject, securityHeaders, checkRateLimit, getClientIp } from '@/lib/security';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateKey = `verify-otp:${ip}`;
    const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
    if (rate.limited) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many attempts. Try again later.', data: null }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { email, otp } = sanitizeObject(body);

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email and OTP are required.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const user = await db.get('SELECT id, name, otp_code, otp_expires FROM users WHERE email = ?', [email]);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid or expired OTP.', data: null }),
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

    return new Response(
      JSON.stringify({ success: true, message: 'OTP verified successfully.', data: null }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server error.', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
