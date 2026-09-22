import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { securityHeaders } from '@/lib/security';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const serviceKey = searchParams.get('service_key');

    let query = 'SELECT id, question, answer, category, service_key, display_order FROM faqs WHERE is_active = 1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (serviceKey) {
      query += ' AND service_key = ?';
      params.push(serviceKey);
    }

    query += ' ORDER BY display_order ASC, id ASC';
    const faqs = await db.all(query, params);

    return NextResponse.json({ success: true, data: faqs || [] }, { headers: securityHeaders });
  } catch (error) {
    console.error('FAQs GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load FAQs' }, { status: 500, headers: securityHeaders });
  }
}
