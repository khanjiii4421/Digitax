import db from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    const applications = await db.all(
      `SELECT a.*, u.name as user_name, u.email as user_email, u.number as user_phone, u.cnic as user_cnic
       FROM ntn_applications a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC`
    );

    return new Response(JSON.stringify({ success: true, applications }), { status: 200 });
  } catch (error) {
    console.error("Admin applications GET error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, payment_status, status, admin_notes, admin_file_url } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Application ID is required." }), { status: 400 });
    }

    const existing = await db.get("SELECT * FROM ntn_applications a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = ?", [id]);
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: "Application not found." }), { status: 404 });
    }

    const fields = [];
    const values = [];

    if (payment_status !== undefined) { fields.push("payment_status = ?"); values.push(payment_status); }
    if (status !== undefined) { fields.push("status = ?"); values.push(status); }
    if (admin_notes !== undefined) { fields.push("admin_notes = ?"); values.push(admin_notes); }
    if (admin_file_url !== undefined) { fields.push("admin_file_url = ?"); values.push(admin_file_url); }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.run(`UPDATE ntn_applications SET ${fields.join(", ")} WHERE id = ?`, values);

    // Notify user if admin file was uploaded
    if (admin_file_url !== undefined && admin_file_url) {
      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        existing.user_id,
        'Your Document is Ready',
        'Your completed NTN Registration document has been uploaded. You can download it from Completed Files.',
        'application',
        '/portal/completed'
      ]);
      // Email
      if (existing.email) {
        await sendEmail({
          to: existing.email,
          subject: 'Your NTN Document is Ready',
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;"><div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;"><div style="background:linear-gradient(135deg,#1a5276,#2980b9);padding:25px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:20px;">DIGITAX</h1><p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:12px;">Document Ready</p></div><div style="padding:25px;"><p style="color:#1a202c;font-size:14px;">Dear ${existing.name || 'Valued Client'},</p><h2 style="color:#16a34a;font-size:18px;margin:15px 0 10px;">Your NTN Document is Ready</h2><p style="color:#2d3748;font-size:14px;line-height:1.6;">Your completed NTN Registration document has been uploaded. You can download it from the Completed Files section in your portal.</p><div style="text-align:center;margin:20px 0;"><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/completed" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;">View Documents</a></div></div></div></div>`,
          text: `Dear ${existing.name || 'Client'}, your NTN Registration document is ready. View it in your portal: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/completed`
        });
      }
    }

    // Notify user if status changed
    if (status !== undefined && status !== existing.status) {
      const statusLabels = {
        'pending': 'Pending',
        'in-review': 'In Review',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'rejected': 'Rejected'
      };
      const statusLabel = statusLabels[status] || status;
      const notifTitle = status === 'rejected' ? 'Application Rejected' : `Application Status: ${statusLabel}`;
      const notifMsg = status === 'rejected'
        ? `Your NTN Registration application was rejected. ${admin_notes ? 'Reason: ' + admin_notes : 'Please contact support for more details.'}`
        : `Your NTN Registration application is now: ${statusLabel}`;

      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        existing.user_id,
        notifTitle,
        notifMsg,
        'application',
        '/portal/applications'
      ]);

      // Email
      if (existing.email) {
        const isReject = status === 'rejected';
        const isApprove = status === 'completed';
        const accentColor = isReject ? '#dc2626' : isApprove ? '#16a34a' : '#1a5276';
        const safeNotes = (admin_notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

        await sendEmail({
          to: existing.email,
          subject: notifTitle,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
              <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
                <div style="background:linear-gradient(135deg,${accentColor},${accentColor}dd);padding:25px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:20px;">DIGITAX</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:12px;">${isReject ? 'Application Rejected' : isApprove ? 'Application Approved' : 'Application Update'}</p>
                </div>
                <div style="padding:25px;">
                  <p style="color:#1a202c;font-size:14px;margin:0 0 10px;">Dear ${existing.name || 'Valued Client'},</p>
                  <h2 style="color:${accentColor};font-size:18px;margin:10px 0;">${notifTitle}</h2>
                  <div style="background:#f7fafc;border-left:4px solid ${accentColor};padding:12px 15px;border-radius:6px;margin:15px 0;">
                    <p style="color:#2d3748;font-size:14px;line-height:1.6;margin:0;">${notifMsg}</p>
                  </div>
                  ${safeNotes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px 15px;margin:15px 0;">
                    <p style="color:#92400e;font-size:11px;font-weight:bold;margin:0 0 5px;text-transform:uppercase;letter-spacing:0.5px;">Admin Note</p>
                    <p style="color:#78350f;font-size:13px;line-height:1.5;margin:0;">${safeNotes}</p>
                  </div>` : ''}
                  <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                    <tr><td style="padding:8px 12px;background:#f7fafc;border:1px solid #e2e8f0;font-size:12px;color:#718096;width:40%;">Application ID</td><td style="padding:8px 12px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;font-weight:bold;">#${existing.id}</td></tr>
                    <tr><td style="padding:8px 12px;background:#f7fafc;border:1px solid #e2e8f0;font-size:12px;color:#718096;">Status</td><td style="padding:8px 12px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:${accentColor};font-weight:bold;">${statusLabel}</td></tr>
                    <tr><td style="padding:8px 12px;background:#f7fafc;border:1px solid #e2e8f0;font-size:12px;color:#718096;">Payment Status</td><td style="padding:8px 12px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;">${payment_status || existing.payment_status}</td></tr>
                  </table>
                  <div style="text-align:center;margin:20px 0;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/applications" style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;">View Application</a>
                  </div>
                  <p style="color:#a0aec0;font-size:11px;text-align:center;margin:15px 0 0;border-top:1px solid #e2e8f0;padding-top:12px;">This is an automated notification from DIGITAX.</p>
                </div>
              </div>
            </div>
          `,
          text: `Dear ${existing.name || 'Client'},\n\n${notifTitle}\n\n${notifMsg}\n\n${admin_notes ? 'Admin Note: ' + admin_notes + '\n\n' : ''}Application: #${existing.id}\nStatus: ${statusLabel}\n\nView: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/applications\n\n--\nDIGITAX Team`
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Admin applications PATCH error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), { status: 500 });
  }
}
