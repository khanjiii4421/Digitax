import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { securityHeaders } from '@/lib/security';

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const settings = await db.all('SELECT * FROM settings');
    return new Response(JSON.stringify(settings), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const settings = await req.json();
    
    for (const [key, value] of Object.entries(settings)) {
      const existing = await db.get('SELECT `key` FROM settings WHERE `key` = ?', [key]);
      if (existing) {
        await db.run('UPDATE settings SET value = ? WHERE `key` = ?', [value, key]);
      } else {
        await db.run('INSERT INTO settings (`key`, value) VALUES (?, ?)', [key, value]);
      }
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to save settings' }), { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } });
  }
}
