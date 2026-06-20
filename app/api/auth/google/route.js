import db from '@/lib/db';
import crypto from 'crypto';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { sendTemplateEmail } from '@/lib/email';
import { securityHeaders } from '@/lib/security';

export async function POST(req) {
  try {
    let email, name, oauthId;

    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    // If google-auth-library is available and client ID is set, verify the token
    if (googleClientId) {
      try {
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(googleClientId);
        const body = await req.json();
        const credential = body.credential;

        if (!credential) {
          return new Response(
            JSON.stringify({ success: false, message: 'Google credential is required.', data: null }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
          );
        }

        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name || payload.given_name || 'Google User';
        oauthId = payload.sub;
      } catch (verifyErr) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid Google credential.', data: null }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
        );
      }
    } else {
      // Fallback for development without Google credentials
      try {
        const body = await req.json();
        email = body.email || 'google_user@gmail.com';
        name = body.name || 'Google User';
        oauthId = body.sub || body.oauth_id || crypto.randomBytes(16).toString('hex');
      } catch (e) {
        email = 'google_user@gmail.com';
        name = 'Google User';
        oauthId = crypto.randomBytes(16).toString('hex');
      }
    }

    // Find or create user
    let user = await db.get('SELECT id, name, email, role, oauth_provider FROM users WHERE email = ?', [email]);

    if (!user) {
      const passwordHash = crypto.randomBytes(32).toString('hex');
      const info = await db.run('INSERT INTO users (name, email, password_hash, role, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, ?)', [name, email, passwordHash, 'user', 'google', oauthId]);
      user = { id: info.insertId, name, email, role: 'user' };

      await sendTemplateEmail('welcome_email', { name }, email);

      // Create welcome notification
      await db.run('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)', [
        user.id, 'Welcome to DIGITAX!', 'Your account has been created via Google Sign-In.', 'success'
      ]);
    } else if (!user.oauth_provider) {
      // Link Google account to existing user
      await db.run('UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?', ['google', oauthId, user.id]);
    }

    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Signed in with Google successfully!', data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Google authentication failed.', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
