import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { securityHeaders } from '@/lib/security';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key) {
      const pricing = await db.get(
        'SELECT service_key, service_name, government_fee, digitax_fee, total_fee, currency, description, is_active FROM service_pricing WHERE service_key = ?',
        [key]
      );
      if (!pricing) {
        return NextResponse.json(
          { success: false, error: 'Service pricing not found' },
          { status: 404, headers: securityHeaders }
        );
      }
      return NextResponse.json({ success: true, data: pricing }, { headers: securityHeaders });
    }

    const allPricing = await db.all(
      'SELECT service_key, service_name, government_fee, digitax_fee, total_fee, currency, description, is_active FROM service_pricing WHERE is_active = 1 ORDER BY id ASC'
    );

    return NextResponse.json({ success: true, data: allPricing || [] }, { headers: securityHeaders });
  } catch (error) {
    console.error('Service pricing GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve service pricing' },
      { status: 500, headers: securityHeaders }
    );
  }
}
