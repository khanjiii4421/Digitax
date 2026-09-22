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

    const pricing = await db.all('SELECT * FROM service_pricing ORDER BY id ASC');
    return NextResponse.json({ success: true, data: pricing }, { headers: securityHeaders });
  } catch (error) {
    console.error('Admin service pricing GET error:', error);
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
    const { service_key, service_name, government_fee = 0, digitax_fee = 0, total_fee, currency = 'PKR', description = '', is_active = 1 } = body;

    if (!service_key || !service_name) {
      return NextResponse.json({ success: false, error: 'Service key and name are required' }, { status: 400, headers: securityHeaders });
    }

    const gov = parseFloat(government_fee) || 0;
    const dtx = parseFloat(digitax_fee) || 0;
    const total = total_fee !== undefined ? parseFloat(total_fee) : gov + dtx;

    const existing = await db.get('SELECT id FROM service_pricing WHERE service_key = ?', [service_key]);

    if (existing) {
      await db.run(
        `UPDATE service_pricing SET
          service_name = ?,
          government_fee = ?,
          digitax_fee = ?,
          total_fee = ?,
          currency = ?,
          description = ?,
          is_active = ?,
          updated_by = ?
        WHERE service_key = ?`,
        [service_name, gov, dtx, total, currency, description, is_active ? 1 : 0, admin.id, service_key]
      );
    } else {
      await db.run(
        `INSERT INTO service_pricing (service_key, service_name, government_fee, digitax_fee, total_fee, currency, description, is_active, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [service_key, service_name, gov, dtx, total, currency, description, is_active ? 1 : 0, admin.id]
      );
    }

    const ip = getClientIp(req);
    await logAudit({
      adminId: admin.id,
      adminName: admin.name,
      action: 'UPDATE_SERVICE_PRICING',
      entity: 'service_pricing',
      entityId: service_key,
      details: { service_name, government_fee: gov, digitax_fee: dtx, total_fee: total, is_active },
      ipAddress: ip
    });

    return NextResponse.json({ success: true, message: 'Service pricing updated successfully' }, { headers: securityHeaders });
  } catch (error) {
    console.error('Admin service pricing update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update pricing' }, { status: 500, headers: securityHeaders });
  }
}
