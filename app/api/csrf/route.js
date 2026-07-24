import crypto from 'crypto';
import { securityHeaders } from '@/lib/security';

const csrfTokens = new Map();

export async function GET(req) {
  const sessionId = req.cookies.get('token')?.value?.slice(0, 16) || crypto.randomUUID();
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, { token, created: Date.now() });

  const res = new Response(
    JSON.stringify({ success: true, data: { csrfToken: token } }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
  );

  res.headers.set('X-CSRF-Token', token);
  return res;
}

export async function POST(req) {
  const { csrfToken } = await req.json();
  const sessionId = req.cookies.get('token')?.value?.slice(0, 16) || req.cookies.get('admin_token')?.value?.slice(0, 16);
  const stored = csrfTokens.get(sessionId);

  if (!stored || stored.token !== csrfToken || Date.now() - stored.created > 3600000) {
    if (stored) csrfTokens.delete(sessionId);
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid or expired CSRF token' }),
      { status: 403, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }

  csrfTokens.delete(sessionId);
  return new Response(
    JSON.stringify({ success: true, message: 'CSRF token validated' }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
  );
}
