import db from '@/lib/db';

export async function GET() {
  try {
    const items = await db.all('SELECT * FROM service_categories');
    return new Response(JSON.stringify(items), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    await db.run('INSERT INTO service_categories (name) VALUES (?)', [name]);
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create category' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, name } = await req.json();
    await db.run('UPDATE service_categories SET name = ? WHERE id = ?', [name, id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update category' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    // Delete category and its services
    await db.run('DELETE FROM services WHERE category_id = ?', [id]);
    await db.run('DELETE FROM service_categories WHERE id = ?', [id]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), { status: 500 });
  }
}
