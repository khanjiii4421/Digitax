import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getClientIp, securityHeaders } from '@/lib/security';

export async function GET() {
  try {
    const rows = await db.all(
      "SELECT `key`, value FROM settings WHERE `key` IN ('website_mode', 'maintenance_message', 'maintenance_title', 'maintenance_contact', 'closed_message')"
    );
    const settingsMap = {};
    for (const r of rows) settingsMap[r.key] = r.value;

    return NextResponse.json({
      success: true,
      data: {
        mode: settingsMap['website_mode'] || 'ONLINE',
        maintenance_title: settingsMap['maintenance_title'] || 'System Maintenance in Progress',
        maintenance_message: settingsMap['maintenance_message'] || 'We are currently performing scheduled maintenance.',
        maintenance_contact: settingsMap['maintenance_contact'] || 'info@digitax.pk',
        closed_message: settingsMap['closed_message'] || 'The portal is currently closed.'
      }
    }, { headers: securityHeaders });
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
    const { mode, maintenance_title, maintenance_message, maintenance_contact, closed_message } = body;

    const validModes = ['ONLINE', 'MAINTENANCE', 'CLOSED'];
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json({ success: false, error: 'Invalid mode. Must be ONLINE, MAINTENANCE, or CLOSED' }, { status: 400, headers: securityHeaders });
    }

    const updates = [
      ['website_mode', mode || 'ONLINE'],
      ['maintenance_title', maintenance_title || ''],
      ['maintenance_message', maintenance_message || ''],
      ['maintenance_contact', maintenance_contact || ''],
      ['closed_message', closed_message || '']
    ];

    for (const [k, v] of updates) {
      await db.run('INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?', [k, v, v]);
    }

    const ip = getClientIp(req);
    await logAudit({
      adminId: admin.id,
      adminName: admin.name,
      action: 'UPDATE_WEBSITE_MODE',
      entity: 'settings',
      entityId: 'website_mode',
      details: { mode, maintenance_title },
      ipAddress: ip
    });

    return NextResponse.json({ success: true, message: `Website mode updated to ${mode}` }, { headers: securityHeaders });
  } catch (error) {
    console.error('Website mode update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update website mode' }, { status: 500, headers: securityHeaders });
  }
}
