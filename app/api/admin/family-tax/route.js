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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');

    let sql = `
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM family_applications a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.is_draft = 0
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      sql += ' AND a.payment_status = ?';
      params.push(paymentStatus);
    }

    if (search) {
      sql += ' AND (a.order_number LIKE ? OR a.full_name LIKE ? OR a.cnic LIKE ? OR a.mobile LIKE ? OR a.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY a.id DESC';

    const applications = await db.all(sql, params);

    // Summary counts
    const totalCount = (await db.get("SELECT COUNT(*) as count FROM family_applications WHERE is_draft = 0"))?.count || 0;
    const pendingPaymentCount = (await db.get("SELECT COUNT(*) as count FROM family_applications WHERE is_draft = 0 AND payment_status = 'Pending Payment'"))?.count || 0;
    const verificationPendingCount = (await db.get("SELECT COUNT(*) as count FROM family_applications WHERE is_draft = 0 AND payment_status = 'Payment Verification Pending'"))?.count || 0;
    const verifiedCount = (await db.get("SELECT COUNT(*) as count FROM family_applications WHERE is_draft = 0 AND payment_status = 'Payment Verified'"))?.count || 0;
    const completedCount = (await db.get("SELECT COUNT(*) as count FROM family_applications WHERE is_draft = 0 AND status = 'Completed'"))?.count || 0;

    return NextResponse.json({
      success: true,
      data: applications,
      counts: {
        total: totalCount,
        pendingPayment: pendingPaymentCount,
        verificationPending: verificationPendingCount,
        verified: verifiedCount,
        completed: completedCount
      }
    });

  } catch (error) {
    console.error('Admin Fetch Family Tax Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
