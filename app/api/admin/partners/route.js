import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { securityHeaders } from '@/lib/security';

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  const items = await db.all('SELECT * FROM partners ORDER BY display_order ASC');
  return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { name, image_url, display_order } = await req.json();
    if (!name || !image_url) return new Response(JSON.stringify({ error: 'Name and image required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    await db.run('INSERT INTO partners (name, image_url, display_order) VALUES (?, ?, ?)', [name, image_url, display_order || 0]);
    return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}

export async function DELETE(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await req.json();
    await db.run('DELETE FROM partners WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}
