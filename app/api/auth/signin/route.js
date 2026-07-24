import db from '@/lib/db';
import { verifyPassword } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendTemplateEmail } from '@/lib/email';
import { checkRateLimit, getClientIp, isAccountLocked, recordFailedAttempt, resetFailedAttempts, sanitizeObject, securityHeaders } from '@/lib/security';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateKey = `signin:${ip}`;
    const rate = checkRateLimit(rateKey, 10, 15 * 60 * 1000);
    if (rate.limited) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many attempts. Please try again later.', data: null }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { email, password, remember } = sanitizeObject(body);

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email and password are required.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    // Check account lockout
    if (isAccountLocked(email)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.', data: null }),
        { status: 423, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const user = await db.get("SELECT id, name, email, password_hash, role, locked_until FROM users WHERE email = ? AND role = 'user'", [email]);

    if (!user || !verifyPassword(password, user.password_hash)) {
      if (user) recordFailedAttempt(email);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email or password.', data: null }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    // Check DB-level lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return new Response(
        JSON.stringify({ success: false, message: 'Account temporarily locked. Try again later.', data: null }),
        { status: 423, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    // Successful login
    resetFailedAttempts(email);
    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    const refreshToken = signToken({ id: user.id, tokenType: 'refresh' });
    const cookieStore = await cookies();

    const isRemember = remember === true || remember === 'true';
    const tokenMaxAge = isRemember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenMaxAge,
    });

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60,
    });

    cookieStore.set('remember', isRemember ? 'true' : 'false', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenMaxAge,
    });

    await sendTemplateEmail('login_alert', { name: user.name }, email);

    return new Response(
      JSON.stringify({ success: true, message: 'Signed in successfully!', data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server error.', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
