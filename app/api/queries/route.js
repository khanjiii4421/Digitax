import db from '@/lib/db';
import { sendTemplateEmail, sendEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { sanitizeObject, securityHeaders } from '@/lib/security';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, subject, message, phone } = sanitizeObject(body);

    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ success: false, message: 'All fields (Name, Email, Subject, Message) are required.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email format.', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    // Try to get logged-in user ID
    let userId = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      const user = verifyToken(token);
      if (user && user.id) userId = user.id;
    } catch(e) {}

    const info = await db.run('INSERT INTO queries (name, email, phone, subject, message, user_id) VALUES (?, ?, ?, ?, ?, ?)', [name, email, phone || null, subject, message, userId]);
    const queryId = info.insertId || info.lastInsertRowid;

    // Notify admin
    const adminEmailRow = await db.get("SELECT value FROM settings WHERE `key` = 'admin_email'") || await db.get("SELECT value FROM settings WHERE `key` = 'contact_email'");
    const adminEmail = adminEmailRow ? adminEmailRow.value : 'info@digitax.com';

    await sendEmail({
      to: adminEmail,
      subject: `New Lead Inquiry: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:#111827;padding:20px;text-align:center;">
              <h2 style="color:#ffffff;margin:0;font-size:18px;">DIGITAX Lead Inquiry</h2>
            </div>
            <div style="padding:24px;">
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <tr><td style="padding:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;width:30%;">Name</td><td style="padding:8px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;font-weight:bold;">${name}</td></tr>
                <tr><td style="padding:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Email</td><td style="padding:8px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${email}</td></tr>
                <tr><td style="padding:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Phone</td><td style="padding:8px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${phone || 'N/A'}</td></tr>
                <tr><td style="padding:8px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Subject</td><td style="padding:8px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#0056A8;font-weight:bold;">${subject}</td></tr>
              </table>
              <div style="background:#f8fafc;border-left:4px solid #0056A8;padding:14px;border-radius:6px;">
                <p style="color:#64748b;font-size:11px;font-weight:bold;margin:0 0 6px;text-transform:uppercase;">Message</p>
                <p style="color:#1e293b;font-size:13px;line-height:1.6;margin:0;">${message.replace(/\n/g, '<br/>')}</p>
              </div>
            </div>
          </div>
        </div>
      `
    });

    // Send confirmation to client
    await sendTemplateEmail('new_query_notification', { name, subject, message }, email);

    // Create notifications for all admins
    const admins = await db.all("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        admin.id,
        'New Query Received',
        `${name} submitted a query: "${subject}"`,
        'query',
        '/admin/queries'
      ]);
    }

    // Create notification for the client too
    if (userId) {
      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        userId,
        'Query Submitted',
        `Your query "${subject}" has been received. Our team will respond shortly.`,
        'info',
        '/portal/queries'
      ]);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Your message has been submitted successfully!', data: { id: queryId } }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server error while submitting query.', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
