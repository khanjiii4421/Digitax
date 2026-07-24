import db from '@/lib/db';
import { signToken, verifyToken } from '@/lib/auth';
import { securityHeaders } from '@/lib/security';

export async function POST(req) {
  try {
    const refreshToken = req.cookies.get('admin_refresh_token')?.value;
    if (!refreshToken) {
      return new Response(
        JSON.stringify({ success: false, message: 'Refresh token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const payload = verifyToken(refreshToken);
    if (!payload || payload.tokenType !== 'refresh') {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid or expired refresh token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const user = await db.get(
      "SELECT id, name, email, role FROM users WHERE id = ? AND is_active = 1 AND role IN ('admin','superadmin')",
      [payload.id]
    );
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Admin not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const newToken = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    const newRefreshToken = signToken({ id: user.id, tokenType: 'refresh' });

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const remember = req.cookies.get('remember')?.value === 'true';
    const tokenMaxAge = remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    cookieStore.set('admin_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenMaxAge,
    });

    cookieStore.set('admin_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/admin/auth/refresh',
      maxAge: 30 * 24 * 60 * 60,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Token refreshed', data: { user } }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to refresh token' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
