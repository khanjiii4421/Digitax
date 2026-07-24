import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const application = await db.get("SELECT * FROM family_applications WHERE id = ?", [id]);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action, notes = '', consultantId = null, fileUrl = '', status = '' } = body;

    let updatedPaymentStatus = application.payment_status;
    let updatedStatus = application.status;
    let notifTitle = '';
    let notifMsg = '';

    switch (action) {
      case 'approve_payment':
        updatedPaymentStatus = 'Payment Verified';
        // Mandatory requirement: Only when Payment Status becomes Verified, application changes to Ready For Processing / Under Review
        updatedStatus = 'Under Review';
        notifTitle = 'Payment Verified! Application in Processing';
        notifMsg = `Payment for Order #${application.order_number} has been verified by our team. Your application is now Under Review.`;

        await db.run("UPDATE family_payments SET status = 'Payment Verified', verified_at = CURRENT_TIMESTAMP WHERE application_id = ?", [id]);
        break;

      case 'reject_payment':
        updatedPaymentStatus = 'Rejected';
        updatedStatus = 'Payment Pending';
        notifTitle = 'Payment Rejected';
        notifMsg = `Payment proof for Order #${application.order_number} was rejected. Note: ${notes || 'Please re-upload a valid proof.'}`;

        await db.run("UPDATE family_payments SET status = 'Rejected', notes = ? WHERE application_id = ?", [notes, id]);
        break;

      case 'assign_consultant':
        await db.run("UPDATE family_applications SET assigned_consultant_id = ? WHERE id = ?", [consultantId, id]);
        notifTitle = 'Tax Consultant Assigned';
        notifMsg = `A dedicated tax consultant has been assigned to your case #${application.order_number}.`;
        break;

      case 'update_status':
        if (!status) {
          return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
        }

        // Prevent moving to processing/fbr/completed if payment is not verified!
        const restrictedStatuses = ['Under Review', 'Processing', 'FBR Submitted', 'Completed'];
        if (restrictedStatuses.includes(status) && updatedPaymentStatus !== 'Payment Verified') {
          return NextResponse.json({
            success: false,
            error: 'Cannot move to processing until payment is verified by admin.'
          }, { status: 400 });
        }

        updatedStatus = status;
        notifTitle = `Application Status Update: ${status}`;
        notifMsg = `Your application #${application.order_number} status has been updated to "${status}". ${notes}`;
        break;

      case 'request_documents':
        updatedStatus = 'Documents Pending';
        notifTitle = 'Additional Documents Requested';
        notifMsg = `Our team requires additional documents for case #${application.order_number}. Details: ${notes}`;
        break;

      case 'upload_return':
        await db.run("UPDATE family_applications SET filed_return_url = ? WHERE id = ?", [fileUrl, id]);
        await db.run("INSERT INTO family_documents (application_id, category, doc_type, file_name, file_url) VALUES (?, 'previous_tax', 'admin_filed_return', 'Filed Tax Return PDF', ?)", [id, fileUrl]);
        notifTitle = 'Filed Tax Return Uploaded';
        notifMsg = `Your officially filed tax return document has been uploaded for Order #${application.order_number}.`;
        break;

      case 'upload_wealth_statement':
        await db.run("UPDATE family_applications SET wealth_statement_url = ? WHERE id = ?", [fileUrl, id]);
        await db.run("INSERT INTO family_documents (application_id, category, doc_type, file_name, file_url) VALUES (?, 'previous_tax', 'admin_wealth_statement', 'Wealth Statement PDF', ?)", [id, fileUrl]);
        notifTitle = 'Wealth Statement Uploaded';
        notifMsg = `Your wealth statement document has been uploaded for Order #${application.order_number}.`;
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Update main application record
    await db.run(`
      UPDATE family_applications SET
        payment_status = ?,
        status = ?,
        admin_notes = IF(? != '', ?, admin_notes)
      WHERE id = ?
    `, [updatedPaymentStatus, updatedStatus, notes, notes, id]);

    // Status History
    await db.run("INSERT INTO family_status_history (application_id, status, notes, changed_by) VALUES (?, ?, ?, ?)", [
      id, updatedStatus, `${action.toUpperCase()}: ${notes}`, decoded.id
    ]);

    // Activity Log
    await db.run("INSERT INTO family_activity_logs (application_id, user_id, action, description) VALUES (?, ?, ?, ?)", [
      id, decoded.id, action.toUpperCase(), `Admin performed ${action}. ${notes}`
    ]);

    // Send User Notification
    if (notifTitle) {
      await db.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, ?, ?, 'info', ?)
      `, [
        application.user_id,
        notifTitle,
        notifMsg,
        `/portal/family-tax/${id}`
      ]);

      const user = await db.get("SELECT email, name FROM users WHERE id = ?", [application.user_id]);
      if (user && user.email) {
        // Email type styling
        const isReject = action === 'reject_payment' || (action === 'update_status' && (status || '').toLowerCase().includes('reject'));
        const isApprove = action === 'approve_payment' || (action === 'update_status' && status === 'Completed');
        const accentColor = isReject ? '#dc2626' : isApprove ? '#16a34a' : '#1a5276';
        const headerText = isReject ? 'Application Requires Attention' : isApprove ? 'Application Approved' : 'Application Update';
        const fullName = user.name || 'Valued Client';
        const safeNotes = (notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

        await sendEmail({
          to: user.email,
          subject: notifTitle,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
              <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
                <div style="background:linear-gradient(135deg,${accentColor},${accentColor}dd);padding:30px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:22px;">DIGITAX</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:5px 0 0;font-size:13px;">${headerText}</p>
                </div>
                <div style="padding:30px;">
                  <p style="color:#1a202c;font-size:15px;margin:0 0 5px;">Dear ${fullName},</p>
                  <p style="color:#1a202c;font-size:18px;font-weight:bold;margin:15px 0 10px;">${notifTitle}</p>
                  <div style="background:#f7fafc;border-left:4px solid ${accentColor};padding:15px 18px;border-radius:6px;margin:20px 0;">
                    <p style="color:#2d3748;font-size:14px;line-height:1.6;margin:0;">${notifMsg}</p>
                  </div>
                  ${safeNotes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px 15px;margin:20px 0;">
                    <p style="color:#92400e;font-size:12px;font-weight:bold;margin:0 0 5px;text-transform:uppercase;letter-spacing:0.5px;">Admin Note</p>
                    <p style="color:#78350f;font-size:14px;line-height:1.5;margin:0;">${safeNotes}</p>
                  </div>` : ''}
                  <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px 12px;background:#f7fafc;border:1px solid #e2e8f0;font-size:12px;color:#718096;width:40%;">Order Number</td><td style="padding:8px 12px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;font-weight:bold;">#${application.order_number}</td></tr>
                    <tr><td style="padding:8px 12px;background:#f7fafc;border:1px solid #e2e8f0;font-size:12px;color:#718096;">Payment Status</td><td style="padding:8px 12px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;">${updatedPaymentStatus}</td></tr>
                    <tr><td style="padding:8px 12px;background:#f7fafc;border:1px solid #e2e8f0;font-size:12px;color:#718096;">Application Status</td><td style="padding:8px 12px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;">${updatedStatus}</td></tr>
                  </table>
                  <div style="text-align:center;margin:25px 0;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/family-tax/${id}" style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:bold;font-size:14px;">View in Portal</a>
                  </div>
                  <p style="color:#a0aec0;font-size:12px;text-align:center;margin:20px 0 0;border-top:1px solid #e2e8f0;padding-top:15px;">This is an automated notification from DIGITAX. Please do not reply to this email.<br>For support, log in to your portal and use the contact form.</p>
                </div>
              </div>
            </div>
          `,
          text: `Dear ${fullName},\n\n${notifTitle}\n\n${notifMsg}\n\n${notes ? 'Admin Note: ' + notes + '\n\n' : ''}Order: #${application.order_number}\nPayment Status: ${updatedPaymentStatus}\nApplication Status: ${updatedStatus}\n\nView in Portal: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/family-tax/${id}\n\n--\nDIGITAX Team`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Action completed successfully',
      status: updatedStatus,
      paymentStatus: updatedPaymentStatus
    });

  } catch (error) {
    console.error('Admin Action Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process admin action' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const application = await db.get("SELECT * FROM family_applications WHERE id = ?", [id]);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // Delete related sub-entities first
    await db.run("DELETE FROM family_members WHERE application_id = ?", [id]);
    await db.run("DELETE FROM family_income_sources WHERE application_id = ?", [id]);
    await db.run("DELETE FROM family_assets WHERE application_id = ?", [id]);
    await db.run("DELETE FROM family_liabilities WHERE application_id = ?", [id]);
    await db.run("DELETE FROM family_bank_accounts WHERE application_id = ?", [id]);
    await db.run("DELETE FROM family_documents WHERE application_id = ?", [id]);
    await db.run("DELETE FROM family_payments WHERE application_id = ?", [id]);
    await db.run("DELETE FROM family_status_history WHERE application_id = ?", [id]);
    await db.run("DELETE FROM family_activity_logs WHERE application_id = ?", [id]);

    // Delete application record
    await db.run("DELETE FROM family_applications WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: `Application #${application.order_number} deleted successfully.`
    });

  } catch (error) {
    console.error('Delete Application Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete application' }, { status: 500 });
  }
}
