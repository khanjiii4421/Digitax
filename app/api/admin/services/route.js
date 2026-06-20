import db from '@/lib/db';

export async function GET() {
  try {
    const items = await db.all('SELECT * FROM services');
    return new Response(JSON.stringify(items), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch services' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { category_id, title, price, working_days, description, requirements, icon_url, status } = await req.json();
    await db.run(`
      INSERT INTO services (category_id, title, price, working_days, description, requirements, icon_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [category_id, title, price, working_days, description, requirements, icon_url, status]);
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create service' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, category_id, title, price, working_days, description, requirements, icon_url, status } = await req.json();
    await db.run(`
      UPDATE services SET 
        category_id = ?, title = ?, price = ?, working_days = ?, 
        description = ?, requirements = ?, icon_url = ?, status = ?
      WHERE id = ?
    `, [category_id, title, price, working_days, description, requirements, icon_url, status, id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update service' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await db.run('DELETE FROM services WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete service' }), { status: 500 });
  }
}
