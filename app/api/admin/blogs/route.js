import db from '@/lib/db';

export async function GET() {
  try {
    const items = await db.all('SELECT * FROM blogs ORDER BY display_order ASC, id DESC');
    return new Response(JSON.stringify(items), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch blogs' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { title, description, image_url, link, display_order } = await req.json();
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), { status: 400 });
    }
    const result = await db.run('INSERT INTO blogs (title, description, image_url, link, display_order) VALUES (?, ?, ?, ?, ?)', [title, description || '', image_url || '', link || '', display_order || 0]);
    return new Response(JSON.stringify({ success: true, id: result.insertId }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add blog' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, title, description, image_url, link, display_order } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
    }
    await db.run('UPDATE blogs SET title = ?, description = ?, image_url = ?, link = ?, display_order = ? WHERE id = ?', [title || '', description || '', image_url || '', link || '', display_order || 0, id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update blog' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await db.run('DELETE FROM blogs WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete blog' }), { status: 500 });
  }
}
