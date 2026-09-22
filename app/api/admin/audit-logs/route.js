import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { securityHeaders } from '@/lib/security';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const admin = verifyToken(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs = await db.all(
      'SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?',
      [limit]
    );

    return NextResponse.json({ success: true, data: logs || [] }, { headers: securityHeaders });
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500, headers: securityHeaders });
  }
}
