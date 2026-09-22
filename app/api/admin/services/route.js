import db from '@/lib/db';

function toSlug(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function GET() {
  try {
    const items = await db.all('SELECT * FROM services ORDER BY display_order ASC, id ASC');
    return new Response(JSON.stringify(items), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch services' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      category_id, 
      title, 
      price, 
      working_days, 
      description, 
      requirements, 
      icon_url, 
      status = 'active',
      slug,
      display_order = 0,
      cta_text = 'Apply Now',
      portal_url
    } = body;

    const finalSlug = slug?.trim() || toSlug(title);
    const finalOrder = parseInt(display_order, 10) || 0;

    await db.run(`
      INSERT INTO services (category_id, title, price, working_days, description, requirements, icon_url, status, slug, display_order, cta_text, portal_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [category_id, title, price, working_days, description, requirements, icon_url, status, finalSlug, finalOrder, cta_text, portal_url]);

    return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error creating service:", error);
    return new Response(JSON.stringify({ error: 'Failed to create service' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { 
      id, 
      category_id, 
      title, 
      price, 
      working_days, 
      description, 
      requirements, 
      icon_url, 
      status = 'active',
      slug,
      display_order = 0,
      cta_text = 'Apply Now',
      portal_url
    } = body;

    const finalSlug = slug?.trim() || toSlug(title);
    const finalOrder = parseInt(display_order, 10) || 0;

    await db.run(`
      UPDATE services SET 
        category_id = ?, title = ?, price = ?, working_days = ?, 
        description = ?, requirements = ?, icon_url = ?, status = ?,
        slug = ?, display_order = ?, cta_text = ?, portal_url = ?
      WHERE id = ?
    `, [category_id, title, price, working_days, description, requirements, icon_url, status, finalSlug, finalOrder, cta_text, portal_url, id]);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error updating service:", error);
    return new Response(JSON.stringify({ error: 'Failed to update service' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await db.run('DELETE FROM services WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete service' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
