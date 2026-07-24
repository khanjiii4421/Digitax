import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const paymentMethods = await db.all("SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY display_order ASC, id ASC");
    return NextResponse.json({ success: true, data: paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
