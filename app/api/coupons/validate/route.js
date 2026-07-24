import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const { code, amount = 5000 } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ success: false, error: 'Please enter a coupon code' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await db.get("SELECT * FROM coupons WHERE code = ? AND is_active = 1", [cleanCode]);

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive coupon code' }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'This coupon code has expired' }, { status: 400 });
    }

    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ success: false, error: 'This coupon code limit has been reached' }, { status: 400 });
    }

    const baseAmount = parseFloat(amount);
    if (coupon.min_amount > 0 && baseAmount < coupon.min_amount) {
      return NextResponse.json({ success: false, error: `Minimum order amount of PKR ${coupon.min_amount} required` }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percent') {
      discountAmount = (baseAmount * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }

    discountAmount = Math.min(discountAmount, baseAmount);
    const finalAmount = Math.max(0, baseAmount - discountAmount);

    return NextResponse.json({
      success: true,
      message: 'Coupon code applied successfully!',
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      finalAmount
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to validate coupon' }, { status: 500 });
  }
}
