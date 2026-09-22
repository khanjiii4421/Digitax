import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { securityHeaders } from '@/lib/security';

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const items = await db.all('SELECT * FROM blogs ORDER BY display_order ASC, id DESC');
    return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch blogs' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { title, description, image_url, link, display_order } = await req.json();
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    }
    const result = await db.run('INSERT INTO blogs (title, description, image_url, link, display_order) VALUES (?, ?, ?, ?, ?)', [title, description || '', image_url || '', link || '', display_order || 0]);
    return new Response(JSON.stringify({ success: true, id: result.insertId }), { status: 201, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add blog' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}

export async function PUT(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id, title, description, image_url, link, display_order } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    }
    await db.run('UPDATE blogs SET title = ?, description = ?, image_url = ?, link = ?, display_order = ? WHERE id = ?', [title || '', description || '', image_url || '', link || '', display_order || 0, id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update blog' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}

export async function DELETE(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await req.json();
    await db.run('DELETE FROM blogs WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete blog' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}
