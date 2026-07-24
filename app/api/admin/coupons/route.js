import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const coupons = await db.all("SELECT * FROM coupons ORDER BY id DESC");
    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { code, discountType = 'fixed', discountValue = 0, minAmount = 0, maxUses = 100, expiresAt = null } = body;

    if (!code || !discountValue) {
      return NextResponse.json({ success: false, error: 'Code and Discount Value are required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await db.get("SELECT id FROM coupons WHERE code = ?", [cleanCode]);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 400 });
    }

    const res = await db.run(`
      INSERT INTO coupons (code, discount_type, discount_value, min_amount, max_uses, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [cleanCode, discountType, parseFloat(discountValue), parseFloat(minAmount), parseInt(maxUses, 10), expiresAt || null]);

    return NextResponse.json({ success: true, message: 'Coupon created successfully', id: res.insertId });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ success: false, error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Coupon ID is required' }, { status: 400 });
    }

    await db.run("DELETE FROM coupons WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete coupon' }, { status: 500 });
  }
}
