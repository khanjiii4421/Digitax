import db from '@/lib/db';

export async function GET() {
  const slabs = await db.all('SELECT * FROM tax_slabs ORDER BY tax_year DESC, salary_from ASC');
  return new Response(JSON.stringify(slabs), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req) {
  try {
    const { tax_year, salary_from, salary_to, tax_amount } = await req.json();
    if (!tax_year || salary_from === undefined || salary_to === undefined || tax_amount === undefined) {
      return new Response(JSON.stringify({ error: 'All fields required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    await db.run('INSERT INTO tax_slabs (tax_year, salary_from, salary_to, tax_amount) VALUES (?, ?, ?, ?)', [tax_year, salary_from, salary_to, tax_amount]);
    return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PUT(req) {
  try {
    const { id, tax_year, salary_from, salary_to, tax_amount } = await req.json();
    if (!id || !tax_year || salary_from === undefined || salary_to === undefined || tax_amount === undefined) {
      return new Response(JSON.stringify({ error: 'All fields required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    await db.run('UPDATE tax_slabs SET tax_year = ?, salary_from = ?, salary_to = ?, tax_amount = ? WHERE id = ?', [tax_year, salary_from, salary_to, tax_amount, id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await db.run('DELETE FROM tax_slabs WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
