import db from "@/lib/db";
import { sendEmail, buildStatusNotificationEmail } from "@/lib/email";

export async function GET() {
  try {
    const applications = await db.all(
      `SELECT a.*, u.name as user_name, u.email as user_email, u.number as user_phone, u.cnic as user_cnic
       FROM ntn_applications a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE (a.deleted_at IS NULL OR a.deleted_at = '')
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

    const existing = await db.get(
      `SELECT a.*, u.name as user_name, u.email as user_email, u.number as user_phone, u.cnic as user_cnic 
       FROM ntn_applications a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`, 
      [id]
    );
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

    const clientEmail = existing.user_email || existing.email;
    const clientName = existing.user_name || existing.name || "Valued Client";
    const displayId = '#' + (Number(existing.id) < 2192 ? (2191 + Number(existing.id || 1)) : existing.id);
    const catLabel = (existing.category || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "NTN Registration";

    // Notify user if admin file was uploaded
    if (admin_file_url !== undefined && admin_file_url) {
      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        existing.user_id,
        'Your Official Certificate is Ready',
        'Your completed NTN Certificate / document has been uploaded. You can download it directly from your portal.',
        'application',
        '/portal/completed'
      ]);
      
      if (clientEmail) {
        const html = buildStatusNotificationEmail({
          recipientName: clientName,
          title: "Your Official Document is Ready! 🎉",
          subtitle: "NTN Certificate & Tax Registration File Uploaded",
          status: "Completed",
          statusLabel: "Completed & Ready",
          statusType: "approved",
          message: "Great news! Your NTN registration has been successfully processed and your official document is now ready for download.",
          adminNotes: admin_notes,
          details: [
            { label: "Application ID", value: displayId, bold: true },
            { label: "Category", value: catLabel },
            { label: "Document Status", value: "Official PDF Ready" },
            { label: "Completed On", value: new Date().toLocaleDateString() },
          ],
          actionUrl: "/portal/completed",
          actionText: "Download Official Document"
        });

        await sendEmail({
          to: clientEmail,
          subject: `Your Official NTN Document is Ready - ${displayId}`,
          html,
          text: `Dear ${clientName},\n\nYour NTN Registration document is ready for download.\n\nApplication ID: ${displayId}\nView and Download: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/completed\n\n--\nDIGITAX Team`
        });
      }
    }

    // Notify user if status changed
    if (status !== undefined && status !== existing.status) {
      const statusLabels = {
        'pending': 'Pending Review',
        'in-review': 'In Review',
        'in-progress': 'Processing with FBR',
        'completed': 'Completed & Approved',
        'rejected': 'Application Rejected'
      };
      const statusLabel = statusLabels[status] || status;
      const isReject = status === 'rejected';
      const isApprove = status === 'completed';

      const notifTitle = isReject ? 'Application Requires Attention' : `Application Status: ${statusLabel}`;
      const notifMsg = isReject
        ? `Your NTN Registration application was rejected. ${admin_notes ? 'Reason: ' + admin_notes : 'Please check your email or contact our support team.'}`
        : `Your NTN Registration application status has been updated to "${statusLabel}".`;

      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        existing.user_id,
        notifTitle,
        notifMsg,
        'application',
        '/portal/applications'
      ]);

      if (clientEmail) {
        const html = buildStatusNotificationEmail({
          recipientName: clientName,
          title: isReject ? "Application Update Required" : isApprove ? "Application Approved! 🎉" : "Application Status Update",
          subtitle: `NTN Registration & Advisory &bull; Ref: ${displayId}`,
          status: status,
          statusLabel: statusLabel,
          statusType: isReject ? "rejected" : isApprove ? "approved" : "pending",
          message: isReject 
            ? "Your NTN Registration application was reviewed by our tax consultants and requires your attention."
            : `Your NTN Registration application status has been updated to "${statusLabel}". Our certified consultants are actively working on your file.`,
          adminNotes: admin_notes,
          details: [
            { label: "Application Ref", value: displayId, bold: true },
            { label: "Service", value: catLabel },
            { label: "Status", value: statusLabel, bold: true },
            { label: "Payment Status", value: (payment_status || existing.payment_status || "Pending").toUpperCase() },
            { label: "Last Updated", value: new Date().toLocaleString() }
          ],
          actionUrl: "/portal/applications",
          actionText: "View & Track Application"
        });

        await sendEmail({
          to: clientEmail,
          subject: `${notifTitle} - Ref: ${displayId}`,
          html,
          text: `Dear ${clientName},\n\n${notifTitle}\n\n${notifMsg}\n\n${admin_notes ? 'Consultant Notes: ' + admin_notes + '\n\n' : ''}Application: ${displayId}\nStatus: ${statusLabel}\n\nTrack progress: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/applications\n\n--\nDIGITAX Team`
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Admin applications PATCH error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Application ID is required." }), { status: 400 });
    }

    // Soft delete
    await db.run(
      "UPDATE ntn_applications SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    return new Response(JSON.stringify({ success: true, message: "Application deleted successfully." }), { status: 200 });
  } catch (error) {
    console.error("Admin applications DELETE error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), { status: 500 });
  }
}
