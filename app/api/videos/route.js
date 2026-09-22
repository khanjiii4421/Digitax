import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { securityHeaders } from '@/lib/security';

export async function GET() {
  try {
    const videos = await db.all('SELECT * FROM videos ORDER BY id DESC');
    return NextResponse.json({ success: true, data: videos || [] }, { headers: securityHeaders });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch videos' }, { status: 500, headers: securityHeaders });
  }
}
