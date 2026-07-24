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
      "SELECT * FROM ntn_applications WHERE user_id = ? ORDER BY created_at DESC",
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
    const { category, cnic_front_url, cnic_back_url, selfie_url, payment_method, payment_proof_url, coupon_code = '', discount_amount = 0, amount = 1500 } = body;

    if (!category || !cnic_front_url || !cnic_back_url || !selfie_url || !payment_method || !payment_proof_url) {
      return new Response(
        JSON.stringify({ success: false, error: "All fields including payment proof are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const finalAmount = parseFloat(amount) || 1500;
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

    // Send confirmation email to client
    try {
      const appId = result.insertId;
      const catLabel = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const discountHtml = finalDiscount > 0
        ? `<tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Discount</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#22c55e;font-weight:bold;">- Rs ${finalDiscount.toLocaleString()} (Coupon: ${coupon_code.toUpperCase()})</td></tr>`
        : '';
      const discountText = finalDiscount > 0 ? ` Discount: -Rs ${finalDiscount} (Coupon: ${coupon_code.toUpperCase()}).` : '';
      await sendEmail({
        to: userRecord?.email || user.email,
        subject: `NTN Registration Application Submitted - #${appId}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
            <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:linear-gradient(135deg,#1a5276,#2980b9);padding:30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">DIGITAX</h1>
                <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;font-size:13px;">NTN Registration Confirmation</p>
              </div>
              <div style="padding:30px;">
                <h2 style="color:#1a202c;font-size:18px;margin:0 0 5px;">Application Submitted Successfully!</h2>
                <p style="color:#718096;font-size:14px;margin:0 0 20px;">Thank you for submitting your NTN Registration application.</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;width:40%;">Application ID</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;font-weight:bold;">#${appId}</td></tr>
                  <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Category</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;">${catLabel}</td></tr>
                  <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Payment Method</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;">${payment_method}</td></tr>
                  <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Amount</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;">Rs ${finalAmount.toLocaleString()}</td></tr>
                  ${discountHtml}
                  <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Submitted On</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#1a202c;">${new Date().toLocaleString()}</td></tr>
                  <tr><td style="padding:10px;background:#f7fafc;border:1px solid #e2e8f0;font-size:13px;color:#718096;">Status</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#d69e2e;font-weight:bold;">Pending Review</td></tr>
                </table>
                <div style="background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:15px;margin-bottom:20px;">
                  <p style="color:#2b6cb0;font-size:13px;margin:0;">Your application is under review. We will verify your payment and notify you once processing begins. You can track progress in your portal dashboard.</p>
                </div>
                <p style="color:#a0aec0;font-size:12px;text-align:center;margin:20px 0 0;">This is an automated email from DIGITAX. Please do not reply to this message.</p>
              </div>
            </div>
          </div>
        `,
        text: `NTN Registration Application #${appId} submitted. Category: ${catLabel}, Payment: ${payment_method}, Amount: Rs ${finalAmount.toLocaleString()}.${discountText} Status: Pending Review.`
      });
    } catch(emailErr) {}

    return new Response(JSON.stringify({ success: true, id: result.insertId }), {
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
