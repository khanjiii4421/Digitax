import db from '@/lib/db';

export async function GET() {
  const settings = await db.all('SELECT * FROM settings');
  return new Response(JSON.stringify(settings), { status: 200 });
}

export async function POST(req) {
  try {
    const settings = await req.json();
    
    // MySQL atomic upsert for each setting
    for (const [key, value] of Object.entries(settings)) {
      await db.run('INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)', [key, value]);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to save' }), { status: 500 });
  }
}
