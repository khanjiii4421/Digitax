import db from '@/lib/db';
import { hashPassword } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendTemplateEmail } from '@/lib/email';
import { checkRateLimit, getClientIp, sanitizeObject, securityHeaders } from '@/lib/security';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateKey = `signup:${ip}`;
    const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
    if (rate.limited) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many attempts. Please try again later.', data: null }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { name, number, email, cnic, password } = sanitizeObject(body);

    if (!name || !number || !email || !cnic || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'All fields are required.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    if (name.length < 3) {
      return new Response(
        JSON.stringify({ success: false, message: 'Name must be at least 3 characters long.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, message: 'Password must be at least 6 characters long.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(cnic)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid CNIC format. Please use 12345-1234567-1 format.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const phoneDigits = number.replace(/[-\s]/g, '');
    if (!/^\d{10,11}$/.test(phoneDigits)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Phone number must be 10 or 11 digits.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    // Check for existing email
    const existingEmail = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail) {
      return new Response(
        JSON.stringify({ success: false, message: 'An account with this email already exists.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    // Check for existing CNIC
    const existingCnic = await db.get('SELECT id FROM users WHERE cnic = ?', [cnic]);
    if (existingCnic) {
      return new Response(
        JSON.stringify({ success: false, message: 'An account with this CNIC already exists.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const passwordHash = hashPassword(password);

    const info = await db.run('INSERT INTO users (name, number, email, cnic, password_hash) VALUES (?, ?, ?, ?, ?)', [name, number, email, cnic, passwordHash]);

    const user = {
      id: info.insertId,
      name,
      email,
      role: 'user'
    };

    const token = signToken(user);
    const refreshToken = signToken({ id: user.id, tokenType: 'refresh' });
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60,
    });

    await sendTemplateEmail('welcome_email', { name }, email);

    // Create welcome notification
    await db.run('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)', [
      user.id, 'Welcome to DIGITAX!', 'Your account has been created successfully. Explore your portal to get started.', 'success'
    ]);

    return new Response(
      JSON.stringify({ success: true, message: 'Account created successfully!', data: { user } }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const msg = error.message?.includes('cnic') ? 'An account with this CNIC already exists.' : 'An account with this email already exists.';
      return new Response(
        JSON.stringify({ success: false, message: msg, data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }
    return new Response(
      JSON.stringify({ success: false, message: 'Server error.', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
