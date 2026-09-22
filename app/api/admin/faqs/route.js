import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getClientIp, securityHeaders } from '@/lib/security';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const admin = verifyToken(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
    }

    const faqs = await db.all('SELECT * FROM faqs ORDER BY display_order ASC, id ASC');
    return NextResponse.json({ success: true, data: faqs }, { headers: securityHeaders });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500, headers: securityHeaders });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const admin = verifyToken(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
    }

    const body = await req.json();
    const { id, question, answer, category = 'general', service_key = '', display_order = 0, is_active = 1 } = body;

    if (!question || !answer) {
      return NextResponse.json({ success: false, error: 'Question and answer are required' }, { status: 400, headers: securityHeaders });
    }

    if (id) {
      await db.run(
        'UPDATE faqs SET question = ?, answer = ?, category = ?, service_key = ?, display_order = ?, is_active = ? WHERE id = ?',
        [question, answer, category, service_key, display_order, is_active ? 1 : 0, id]
      );
    } else {
      await db.run(
        'INSERT INTO faqs (question, answer, category, service_key, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [question, answer, category, service_key, display_order, is_active ? 1 : 0]
      );
    }

    const ip = getClientIp(req);
    await logAudit({
      adminId: admin.id,
      adminName: admin.name,
      action: id ? 'UPDATE_FAQ' : 'CREATE_FAQ',
      entity: 'faqs',
      entityId: id || '',
      details: { question, category },
      ipAddress: ip
    });

    return NextResponse.json({ success: true, message: 'FAQ saved successfully' }, { headers: securityHeaders });
  } catch (error) {
    console.error('Admin FAQ save error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save FAQ' }, { status: 500, headers: securityHeaders });
  }
}

export async function DELETE(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const admin = verifyToken(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: securityHeaders });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await db.run('DELETE FROM faqs WHERE id = ?', [id]);

    const ip = getClientIp(req);
    await logAudit({
      adminId: admin.id,
      adminName: admin.name,
      action: 'DELETE_FAQ',
      entity: 'faqs',
      entityId: id,
      ipAddress: ip
    });

    return NextResponse.json({ success: true, message: 'FAQ deleted' }, { headers: securityHeaders });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete FAQ' }, { status: 500, headers: securityHeaders });
  }
}
