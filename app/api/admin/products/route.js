import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { securityHeaders } from '@/lib/security';

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const items = await db.all('SELECT * FROM products ORDER BY display_order ASC');
    return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (e) {
    console.error('Products GET error:', e);
    return new Response(JSON.stringify({ error: 'Failed to load products.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { title, description, price, image_url, button_text, button_link, display_order } = body;

    if (!title || title.trim() === '') {
      return new Response(JSON.stringify({ error: 'Title is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    }

    const result = await db.run(
      'INSERT INTO products (title, description, price, image_url, button_text, button_link, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), description || '', price || '', image_url || '', button_text || 'Start Now', button_link || '/portal', display_order || 0]
    );

    return new Response(JSON.stringify({ success: true, id: result.insertId }), { status: 201, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (e) {
    console.error('Products POST error:', e);
    return new Response(JSON.stringify({ error: 'Failed to save product.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}

export async function PUT(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { id, title, description, price, image_url, button_text, button_link, display_order } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Product ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    }
    if (!title || title.trim() === '') {
      return new Response(JSON.stringify({ error: 'Title is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    }

    const existing = await db.get('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Product not found.' }), { status: 404, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    }

    await db.run(
      'UPDATE products SET title=?, description=?, price=?, image_url=?, button_text=?, button_link=?, display_order=? WHERE id=?',
      [title.trim(), description || '', price || '', image_url || '', button_text || 'Start Now', button_link || '/portal', display_order || 0, id]
    );

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (e) {
    console.error('Products PUT error:', e);
    return new Response(JSON.stringify({ error: 'Failed to update product.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}

export async function DELETE(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Product ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    }

    const existing = await db.get('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Product not found.' }), { status: 404, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
    }

    await db.run('DELETE FROM products WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (e) {
    console.error('Products DELETE error:', e);
    return new Response(JSON.stringify({ error: 'Failed to delete product.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}
