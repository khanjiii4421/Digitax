import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    const admin = verifyToken(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasClientEnv = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const hasServerEnv = !!process.env.GOOGLE_CLIENT_ID;
    const clientIdMasked = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID 
      ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.substring(0, 12) + '...'
      : 'NOT_SET';

    return NextResponse.json({
      success: true,
      data: {
        googleConfigured: hasClientEnv || hasServerEnv,
        hasClientEnv,
        hasServerEnv,
        clientIdMasked,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
