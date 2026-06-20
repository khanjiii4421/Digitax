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
    const queryId = info.insertId;

    // Notify admin
    const adminEmailRow = await db.get('SELECT value FROM settings WHERE `key` = ?', ['contact_email']);
    const adminEmail = adminEmailRow ? adminEmailRow.value : 'info@digitax.pk';

    await sendEmail({
      to: adminEmail,
      subject: `New Lead Inquiry: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `<h3>New Lead Inquiry</h3><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
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
