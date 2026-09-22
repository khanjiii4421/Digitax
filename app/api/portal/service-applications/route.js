import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { securityHeaders } from '@/lib/security';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const user = verifyToken(token);

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login.' },
        { status: 401, headers: securityHeaders }
      );
    }

    const body = await req.json();
    const {
      service_type,
      category,
      cnic_front_url = '',
      cnic_back_url = '',
      selfie_url = '',
      payment_method = '',
      payment_proof_url = '',
      coupon_code = '',
      discount_amount = 0,
      amount,
      extra_data = {}
    } = body;

    if (!service_type) {
      return NextResponse.json(
        { success: false, error: 'Service type is required.' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Get pricing for this service
    let defaultPrice = 2000;
    try {
      const sp = await db.get(
        'SELECT total_fee FROM service_pricing WHERE service_key = ? AND is_active = 1',
        [service_type]
      );
      if (sp && sp.total_fee !== undefined) defaultPrice = parseFloat(sp.total_fee);
    } catch (e) {}

    const finalAmount = amount !== undefined ? (parseFloat(amount) || defaultPrice) : defaultPrice;
    const finalDiscount = parseFloat(discount_amount) || 0;
    const notesJson = JSON.stringify(extra_data || {});

    const result = await db.run(
      `INSERT INTO ntn_applications (
        user_id, service_type, category, cnic_front_url, cnic_back_url,
        selfie_url, payment_method, payment_proof_url, payment_status,
        amount, coupon_code, discount_amount, admin_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, 'pending')`,
      [
        user.id,
        service_type,
        category || service_type,
        cnic_front_url,
        cnic_back_url,
        selfie_url,
        payment_method,
        payment_proof_url,
        finalAmount,
        coupon_code || null,
        finalDiscount,
        notesJson
      ]
    );

    const appId = result.insertId;

    // Increment coupon used_count if provided
    if (coupon_code) {
      try {
        await db.run('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [coupon_code.toUpperCase()]);
      } catch (e) {}
    }

    // Notify admins
    try {
      const admins = await db.all("SELECT id FROM users WHERE role = 'admin'");
      const userRecord = await db.get('SELECT name, email FROM users WHERE id = ?', [user.id]);
      const serviceTitle = (service_type || '').replace(/-/g, ' ').toUpperCase();

      for (const admin of admins) {
        await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
          admin.id,
          `New ${serviceTitle} Application`,
          `${userRecord?.name || 'A client'} submitted a new ${serviceTitle} application (#${appId}).`,
          'application',
          '/admin/applications'
        ]);
      }

      // Confirmation email
      if (userRecord?.email || user.email) {
        await sendEmail({
          to: userRecord?.email || user.email,
          subject: `${serviceTitle} Application Submitted - #${appId}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
              <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
                <div style="background:linear-gradient(135deg,#1a5276,#2980b9);padding:30px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:22px;">DIGITAX</h1>
                  <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;font-size:13px;">${serviceTitle} Confirmation</p>
                </div>
                <div style="padding:30px;">
                  <h2 style="color:#1a202c;font-size:18px;margin:0 0 5px;">Application #${appId} Received</h2>
                  <p style="color:#718096;font-size:14px;margin:0 0 20px;">Thank you for submitting your application. Our team will verify your documents and payment.</p>
                  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;width:40%;">Service</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;font-weight:bold;">${serviceTitle}</td></tr>
                    <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Amount</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;">Rs ${finalAmount.toLocaleString()}</td></tr>
                    <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Status</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#d69e2e;font-weight:bold;">Pending Review</td></tr>
                  </table>
                  <p style="color:#a0aec0;font-size:12px;text-align:center;">DIGITAX Automated Notification</p>
                </div>
              </div>
            </div>
          `,
          text: `Your ${serviceTitle} application #${appId} has been submitted successfully.`
        });
      }
    } catch (e) {}

    return NextResponse.json(
      { success: true, id: appId, message: 'Application submitted successfully' },
      { status: 201, headers: securityHeaders }
    );
  } catch (error) {
    console.error('Service application POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error processing application' },
      { status: 500, headers: securityHeaders }
    );
  }
}
