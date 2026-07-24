import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, paymentMethod, paymentProofUrl, transactionRef = '' } = await req.json();

    if (!applicationId || !paymentMethod || !paymentProofUrl) {
      return NextResponse.json({ success: false, error: 'Missing payment parameters' }, { status: 400 });
    }

    const appRecord = await db.get(
      "SELECT * FROM family_applications WHERE id = ? AND user_id = ?",
      [applicationId, decoded.id]
    );

    if (!appRecord) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const newPaymentStatus = 'Payment Verification Pending';
    const newStatus = 'Payment Verification';

    // Update application
    await db.run(`
      UPDATE family_applications SET
        payment_method = ?,
        payment_proof_url = ?,
        payment_status = ?,
        status = ?
      WHERE id = ?
    `, [paymentMethod, paymentProofUrl, newPaymentStatus, newStatus, applicationId]);

    // Insert payment record
    await db.run(`
      INSERT INTO family_payments (
        application_id, order_number, payment_method, amount, status, payment_proof_url, transaction_ref
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [applicationId, appRecord.order_number, paymentMethod, appRecord.amount || 5000, newPaymentStatus, paymentProofUrl, transactionRef]);

    // Status history & Activity log
    await db.run("INSERT INTO family_status_history (application_id, status, notes, changed_by) VALUES (?, ?, ?, ?)", [
      applicationId, newStatus, `Payment proof submitted via ${paymentMethod}`, decoded.id
    ]);

    await db.run("INSERT INTO family_activity_logs (application_id, user_id, action, description) VALUES (?, ?, ?, ?)", [
      applicationId, decoded.id, 'SUBMIT_PAYMENT_PROOF', `Uploaded receipt for Order #${appRecord.order_number}`
    ]);

    // System Notification
    await db.run(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'info', ?)
    `, [
      decoded.id,
      'Payment Submitted',
      `Payment proof for Order #${appRecord.order_number} received. Verification in progress.`,
      `/portal/family-tax/${applicationId}`
    ]);

    // Send Admin Email for Payment
    const adminEmail = process.env.ADMIN_EMAIL || "info@digitax.pk";
    await sendEmail({
      to: adminEmail,
      subject: `Payment Proof Uploaded (#${appRecord.order_number})`,
      text: `A client has uploaded payment proof for Family Tax Application #${appRecord.order_number}.\n\nMethod: ${paymentMethod}\nRef: ${transactionRef}\n\nPlease review it in the admin dashboard.`
    });

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully. Pending admin verification.',
      status: newStatus,
      paymentStatus: newPaymentStatus
    });

  } catch (error) {
    console.error('Error submitting payment proof:', error);
    return NextResponse.json({ success: false, error: 'Failed to process payment proof' }, { status: 500 });
  }
}
