import db from '@/lib/db';

export async function GET() {
  const settings = await db.all('SELECT * FROM settings');
  return new Response(JSON.stringify(settings), { status: 200 });
}

export async function POST(req) {
  try {
    const settings = await req.json();
    
    for (const [key, value] of Object.entries(settings)) {
      const existing = await db.get('SELECT key FROM settings WHERE key = ?', [key]);
      if (existing) {
        await db.run('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
      } else {
        await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
      }
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to save' }), { status: 500 });
  }
}
