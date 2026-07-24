import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sanitizeObject, securityHeaders } from '@/lib/security';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req) {
  try {
    const user = getUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const application = await db.get(
      "SELECT * FROM ntn_applications WHERE user_id = ? AND status IN ('draft','pending') AND is_resumable = 1 ORDER BY updated_at DESC LIMIT 1",
      [user.id]
    );

    const hasResumable = !!application;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          hasResumable,
          application: application ? {
            id: application.id,
            service_type: application.service_type,
            category: application.category,
            form_data: application.form_data ? JSON.parse(application.form_data) : null,
            cnic_front_url: application.cnic_front_url,
            cnic_back_url: application.cnic_back_url,
            selfie_url: application.selfie_url,
            payment_method: application.payment_method,
            status: application.status,
            created_at: application.created_at,
            updated_at: application.updated_at,
          } : null,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to check resume status' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}

export async function POST(req) {
  try {
    const user = getUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const body = await req.json();
    const sanitized = sanitizeObject(body);

    const existing = await db.get(
      "SELECT id FROM ntn_applications WHERE user_id = ? AND status IN ('draft','pending') AND is_resumable = 1",
      [user.id]
    );

    let applicationId;

    if (existing) {
      const updates = [];
      const values = [];

      if (sanitized.form_data !== undefined) {
        updates.push('form_data = ?');
        values.push(JSON.stringify(sanitized.form_data));
      }
      if (sanitized.service_type) {
        updates.push('service_type = ?');
        values.push(sanitized.service_type);
      }
      if (sanitized.category) {
        updates.push('category = ?');
        values.push(sanitized.category);
      }
      if (sanitized.cnic_front_url) {
        updates.push('cnic_front_url = ?');
        values.push(sanitized.cnic_front_url);
      }
      if (sanitized.cnic_back_url) {
        updates.push('cnic_back_url = ?');
        values.push(sanitized.cnic_back_url);
      }
      if (sanitized.selfie_url) {
        updates.push('selfie_url = ?');
        values.push(sanitized.selfie_url);
      }
      if (sanitized.payment_method) {
        updates.push('payment_method = ?');
        values.push(sanitized.payment_method);
      }
      if (sanitized.payment_proof_url) {
        updates.push('payment_proof_url = ?');
        values.push(sanitized.payment_proof_url);
      }

      if (updates.length > 0) {
        values.push(existing.id);
        await db.run(`UPDATE ntn_applications SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, values);
      }

      applicationId = existing.id;
    } else {
      const result = await db.run(
        `INSERT INTO ntn_applications (user_id, service_type, category, form_data, status, is_resumable)
         VALUES (?, ?, ?, ?, 'draft', 1)`,
        [
          user.id,
          sanitized.service_type || 'ntn-registration',
          sanitized.category || null,
          sanitized.form_data ? JSON.stringify(sanitized.form_data) : '{}',
        ]
      );
      applicationId = result.insertId;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Application saved', data: { id: applicationId } }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to save application' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = getUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const body = await req.json();
    await db.run(
      "UPDATE ntn_applications SET is_resumable = 0 WHERE id = ? AND user_id = ? AND status IN ('draft','pending')",
      [body.id, user.id]
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Resume discarded' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to discard resume' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
