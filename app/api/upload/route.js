import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'site'; // e.g., 'logo', 'hero', 'services'

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create clean filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const finalName = `${timestamp}_${cleanName}`;

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, finalName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${folder}/${finalName}`;

    return new Response(JSON.stringify({ success: true, url: publicUrl }), { status: 200 });
  } catch (error) {
    console.error('Upload Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload file' }), { status: 500 });
  }
}
