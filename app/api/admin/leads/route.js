import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sendEmail, buildStatusNotificationEmail } from "@/lib/email";
import { securityHeaders } from "@/lib/security";

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== "admin" && decoded.role !== "subadmin")) return null;
  return decoded;
}

export async function GET(req) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, message: "Admin authorization required." }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();

    // Registered clients with their application counts
    const usersQuery = search
      ? `SELECT u.id, u.name, u.email, u.number as phone, u.cnic, u.created_at,
           (SELECT COUNT(*) FROM ntn_applications a WHERE a.user_id = u.id AND (a.deleted_at IS NULL OR a.deleted_at = '')) as ntn_count,
           (SELECT COUNT(*) FROM family_applications fa WHERE fa.user_id = u.id) as family_count,
           (SELECT MAX(a.created_at) FROM ntn_applications a WHERE a.user_id = u.id) as last_ntn_date,
           (SELECT a.status FROM ntn_applications a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) as last_status
         FROM users u 
         WHERE u.role = 'user' AND (u.name LIKE ? OR u.email LIKE ? OR u.number LIKE ?)
         ORDER BY u.created_at DESC 
         LIMIT 200`
      : `SELECT u.id, u.name, u.email, u.number as phone, u.cnic, u.created_at,
           (SELECT COUNT(*) FROM ntn_applications a WHERE a.user_id = u.id AND (a.deleted_at IS NULL OR a.deleted_at = '')) as ntn_count,
           (SELECT COUNT(*) FROM family_applications fa WHERE fa.user_id = u.id) as family_count,
           (SELECT MAX(a.created_at) FROM ntn_applications a WHERE a.user_id = u.id) as last_ntn_date,
           (SELECT a.status FROM ntn_applications a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) as last_status
         FROM users u 
         WHERE u.role = 'user'
         ORDER BY u.created_at DESC 
         LIMIT 200`;

    const likeSearch = `%${search}%`;
    const users = search
      ? await db.all(usersQuery, [likeSearch, likeSearch, likeSearch])
      : await db.all(usersQuery);

    // Draft leads (applications that are stuck in pending with minimal activity)
    const draftLeads = await db.all(
      `SELECT a.id, a.user_id, a.category, a.status, a.payment_status, a.created_at, a.updated_at,
         u.name as user_name, u.email as user_email, u.number as user_phone
       FROM ntn_applications a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.status = 'pending' AND (a.deleted_at IS NULL OR a.deleted_at = '')
         AND a.created_at < datetime('now', '-2 days')
       ORDER BY a.created_at DESC
       LIMIT 100`
    );

    // Stats
    const totalUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const totalApplications = await db.get("SELECT COUNT(*) as count FROM ntn_applications WHERE (deleted_at IS NULL OR deleted_at = '')");
    const pendingCount = await db.get("SELECT COUNT(*) as count FROM ntn_applications WHERE status = 'pending' AND (deleted_at IS NULL OR deleted_at = '')");
    const completedCount = await db.get("SELECT COUNT(*) as count FROM ntn_applications WHERE status = 'completed' AND (deleted_at IS NULL OR deleted_at = '')");

    return new Response(
      JSON.stringify({
        success: true,
        users: users || [],
        draftLeads: draftLeads || [],
        stats: {
          totalUsers: totalUsers?.count || 0,
          totalApplications: totalApplications?.count || 0,
          pendingCount: pendingCount?.count || 0,
          completedCount: completedCount?.count || 0,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

// Send promotional email to a client
export async function POST(req) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, message: "Admin authorization required." }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { to, name, subject, message, discount } = body;

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ success: false, message: "Recipient, subject, and message are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const html = buildStatusNotificationEmail({
      recipientName: name || "Valued Client",
      title: subject,
      subtitle: "Special Offer from DIGITAX",
      status: "Promotional",
      statusLabel: discount ? `🎉 ${discount} OFF — Limited Time` : "Exclusive Offer",
      statusType: "approved",
      message: message,
      adminNotes: "",
      details: discount ? [{ label: "Special Discount", value: discount, bold: true }] : [],
      actionUrl: "/portal",
      actionText: "Apply Now — Start Your Application"
    });

    await sendEmail({
      to,
      subject,
      html,
      text: `Dear ${name || "Valued Client"},\n\n${message}\n\n-- DIGITAX Team\nhttps://digitax.pk`
    });

    return new Response(
      JSON.stringify({ success: true, message: "Promotional email sent successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Failed to send email." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
