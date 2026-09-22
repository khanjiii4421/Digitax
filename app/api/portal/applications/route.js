import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { securityHeaders } from "@/lib/security";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated." }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const applications = await db.all(
      "SELECT * FROM ntn_applications WHERE user_id = ? AND (deleted_at IS NULL OR deleted_at = '') ORDER BY created_at DESC",
      [user.id]
    );

    return new Response(JSON.stringify({ success: true, applications }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    console.error("Portal applications GET error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated." }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { category, cnic_front_url, cnic_back_url, selfie_url, payment_method, payment_proof_url, coupon_code = '', discount_amount = 0, amount } = body;

    if (!category || !cnic_front_url || !cnic_back_url || !selfie_url || !payment_method || !payment_proof_url) {
      return new Response(
        JSON.stringify({ success: false, error: "All fields including payment proof are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    let defaultPrice = 1500;
    try {
      const sp = await db.get("SELECT total_fee FROM service_pricing WHERE service_key = 'ntn-registration' AND is_active = 1");
      if (sp && sp.total_fee !== undefined) defaultPrice = parseFloat(sp.total_fee);
    } catch(e) {}

    const finalAmount = amount !== undefined ? (parseFloat(amount) || defaultPrice) : defaultPrice;
    const finalDiscount = parseFloat(discount_amount) || 0;

    // Try to ensure coupon columns exist on the table (no-op if already present)
    try { await db.exec("ALTER TABLE ntn_applications ADD COLUMN coupon_code VARCHAR(50) AFTER amount"); } catch (e) {}
    try { await db.exec("ALTER TABLE ntn_applications ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER coupon_code"); } catch (e) {}

    const result = await db.run(
      `INSERT INTO ntn_applications (user_id, service_type, category, cnic_front_url, cnic_back_url, selfie_url, payment_method, payment_proof_url, payment_status, amount, coupon_code, discount_amount, status)
       VALUES (?, 'ntn-registration', ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, 'pending')`,
      [user.id, category, cnic_front_url, cnic_back_url, selfie_url, payment_method, payment_proof_url, finalAmount, coupon_code || null, finalDiscount]
    );

    // Increment coupon used_count if a valid coupon code was applied
    if (coupon_code) {
      try {
        await db.run("UPDATE coupons SET used_count = used_count + 1 WHERE code = ?", [coupon_code.toUpperCase()]);
      } catch (e) {}
    }

    // Notify admins about new application
    const admins = await db.all("SELECT id FROM users WHERE role = 'admin'");
    const userRecord = await db.get("SELECT name, email FROM users WHERE id = ?", [user.id]);
    for (const admin of admins) {
      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        admin.id,
        'New NTN Application',
        `${userRecord?.name || 'A user'} submitted a new NTN Registration application.`,
        'application',
        '/admin/applications'
      ]);
    }

    // Send confirmation email to client and alert to admin
    try {
      const rawId = result.insertId || result.lastInsertRowid || result.id || 1;
      const displayAppId = Number(rawId) < 2192 ? (2191 + Number(rawId)) : rawId;
      const catLabel = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const discountHtml = finalDiscount > 0
        ? `<tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Discount</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#22c55e;font-weight:bold;">- Rs ${finalDiscount.toLocaleString()} (Coupon: ${coupon_code.toUpperCase()})</td></tr>`
        : '';
      const discountText = finalDiscount > 0 ? ` Discount: -Rs ${finalDiscount} (Coupon: ${coupon_code.toUpperCase()}).` : '';

      const adminEmailRow = await db.get("SELECT value FROM settings WHERE `key` = 'admin_email'");
      const adminEmail = adminEmailRow?.value || "info@digitax.com";
      const siteLogoRow = await db.get("SELECT value FROM settings WHERE `key` = 'site_logo'");
      const logoUrl = siteLogoRow?.value || "https://digitax.pk/icon.jpg";

      // 1. Email to Client
      await sendEmail({
        to: userRecord?.email || user.email,
        subject: `NTN Registration Application Submitted - #${displayAppId}`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;">
            <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
              <div style="background:linear-gradient(135deg,#0056A8,#0077cc);padding:30px;text-align:center;">
                <div style="display:inline-block;background:#ffffff;padding:8px 16px;border-radius:10px;margin-bottom:12px;">
                  <span style="font-size:20px;font-weight:900;color:#0056A8;letter-spacing:1px;">DIGITAX</span>
                </div>
                <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">Application Confirmation</h1>
                <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px;">NTN Registration & Tax Advisory</p>
              </div>
              <div style="padding:30px;">
                <h2 style="color:#111827;font-size:18px;margin:0 0 6px;">Application Submitted Successfully!</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Dear ${userRecord?.name || 'Valued Client'}, thank you for submitting your NTN Registration application with DIGITAX.</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;width:40%;">Application ID</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#0056A8;font-weight:bold;">#${displayAppId}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Category</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${catLabel}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Payment Method</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${payment_method}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Amount</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;font-weight:bold;">Rs ${finalAmount.toLocaleString()}</td></tr>
                  ${discountHtml}
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Submitted On</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${new Date().toLocaleString()}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Status</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#d97706;font-weight:bold;">Pending Review</td></tr>
                </table>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-bottom:24px;">
                  <p style="color:#1e40af;font-size:13px;margin:0;line-height:1.5;">Your application is under review. Our tax consultants will verify your payment and details. You can track live progress directly in your portal dashboard.</p>
                </div>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/applications" style="display:inline-block;background:#0056A8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(0,86,168,0.25);">Track Application</a>
                </div>
                <p style="color:#94a3b8;font-size:12px;text-align:center;margin:20px 0 0;border-top:1px solid #f1f5f9;padding-top:16px;">This is an automated notification from DIGITAX (Pvt) Limited.</p>
              </div>
            </div>
          </div>
        `,
        text: `NTN Registration Application #${displayAppId} submitted. Category: ${catLabel}, Payment: ${payment_method}, Amount: Rs ${finalAmount.toLocaleString()}.${discountText} Status: Pending Review.`
      });

      // 2. Email to Admin (info@digitax.com)
      await sendEmail({
        to: adminEmail,
        subject: `🚨 New Application Received: NTN Registration - #${displayAppId}`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;">
            <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:#111827;padding:24px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;">DIGITAX Admin Alert</h1>
                <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">New NTN Registration Application Received</p>
              </div>
              <div style="padding:28px;">
                <p style="color:#111827;font-size:15px;margin:0 0 16px;">A new NTN Registration application has been submitted on the portal.</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;width:40%;">Application ID</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#0056A8;font-weight:bold;">#${displayAppId}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Applicant Name</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;font-weight:bold;">${userRecord?.name || 'N/A'}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Applicant Email</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${userRecord?.email || user.email}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Category</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${catLabel}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Amount Paid</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;font-weight:bold;">Rs ${finalAmount.toLocaleString()}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Payment Method</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${payment_method}</td></tr>
                </table>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/admin/applications" style="display:inline-block;background:#0056A8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 32px;border-radius:10px;">Review in Admin Panel</a>
                </div>
              </div>
            </div>
          </div>
        `,
        text: `New NTN Application #${displayAppId} from ${userRecord?.name || 'User'} (${userRecord?.email || user.email}). Category: ${catLabel}, Amount: Rs ${finalAmount}, Payment: ${payment_method}. View in Admin Panel: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/admin/applications`
      });
    } catch(emailErr) {
      console.warn("Email dispatch error:", emailErr?.message);
    }

    const rawId = result.insertId || result.lastInsertRowid || result.id || 1;
    const displayAppId = Number(rawId) < 2192 ? (2191 + Number(rawId)) : rawId;
    return new Response(JSON.stringify({ success: true, id: displayAppId, rawId }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    console.error("Portal applications POST error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function DELETE(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated." }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Application ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Verify ownership
    const app = await db.get(
      "SELECT id, status FROM ntn_applications WHERE id = ? AND user_id = ? AND (deleted_at IS NULL OR deleted_at = '')",
      [id, user.id]
    );

    if (!app) {
      return new Response(
        JSON.stringify({ success: false, error: "Application not found or unauthorized." }),
        { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Lifecycle check: block deletion for applications under review or beyond
    const blockedStatuses = ['in-review', 'in-progress', 'Under Review', 'Processing', 'FBR Submitted', 'completed', 'Completed'];
    if (blockedStatuses.includes(app.status)) {
      return new Response(
        JSON.stringify({ success: false, error: "This application is currently under review or completed and cannot be deleted. Please contact support for assistance." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Soft delete
    await db.run(
      "UPDATE ntn_applications SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND user_id = ?",
      [user.id, id, user.id]
    );

    return new Response(
      JSON.stringify({ success: true, message: "Application cancelled successfully." }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    console.error("Portal applications DELETE error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

