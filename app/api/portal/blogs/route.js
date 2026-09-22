import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { securityHeaders } from '@/lib/security';

export async function GET() {
  try {
    const blogs = await db.all('SELECT * FROM blogs ORDER BY display_order ASC, id DESC');
    return NextResponse.json({ success: true, data: blogs || [] }, { headers: securityHeaders });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to load blogs' }, { status: 500, headers: securityHeaders });
  }
}
