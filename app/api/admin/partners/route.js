import db from '@/lib/db';

export async function GET() {
  const items = await db.all('SELECT * FROM partners ORDER BY display_order ASC');
  return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req) {
  try {
    const { name, image_url, display_order } = await req.json();
    if (!name || !image_url) return new Response(JSON.stringify({ error: 'Name and image required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    await db.run('INSERT INTO partners (name, image_url, display_order) VALUES (?, ?, ?)', [name, image_url, display_order || 0]);
    return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await db.run('DELETE FROM partners WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
