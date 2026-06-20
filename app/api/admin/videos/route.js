import db from '@/lib/db';

function extractYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

export async function GET() {
  try {
    const items = await db.all('SELECT * FROM videos ORDER BY id DESC');
    return new Response(JSON.stringify(items), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch videos' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { title, url } = await req.json();
    const ytId = extractYoutubeId(url);
    if (!ytId) {
      return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), { status: 400 });
    }
    await db.run('INSERT INTO videos (youtube_id, title) VALUES (?, ?)', [ytId, title]);
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to add video' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await db.run('DELETE FROM videos WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete video' }), { status: 500 });
  }
}
