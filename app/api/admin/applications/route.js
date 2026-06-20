import db from "@/lib/db";

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

    const existing = await db.get("SELECT * FROM ntn_applications WHERE id = ?", [id]);
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: "Application not found." }), { status: 404 });
    }

    const fields = [];
    const values = [];

    if (payment_status !== undefined) { fields.push("payment_status = ?"); values.push(payment_status); }
    if (status !== undefined) { fields.push("status = ?"); values.push(status); }
    if (admin_notes !== undefined) { fields.push("admin_notes = ?"); values.push(admin_notes); }
    if (admin_file_url !== undefined) { fields.push("admin_file_url = ?"); values.push(admin_file_url); }

    fields.push("updated_at = NOW()");
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
      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        existing.user_id,
        'Application Status Updated',
        `Your NTN Registration application is now: ${statusLabels[status] || status}`,
        'application',
        '/portal/applications'
      ]);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Admin applications PATCH error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), { status: 500 });
  }
}
