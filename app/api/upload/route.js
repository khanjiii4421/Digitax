import { promises as fs } from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/auth';
import { securityHeaders } from '@/lib/security';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getUser(req) {
  const token = req.cookies.get('token')?.value || req.cookies.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req) {
  try {
    const user = getUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'site';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `File type ${file.type} is not allowed` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const rawExt = path.extname(file.name || '').toLowerCase();
    if (!rawExt || !ALLOWED_EXTS.has(rawExt)) {
      return new Response(
        JSON.stringify({ error: `File extension ${rawExt || 'unknown'} is not permitted` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 10MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      );
    }

    const crypto = await import('crypto');
    const randomHex = crypto.randomBytes(8).toString('hex');
    const cleanBase = path.basename(file.name, rawExt).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30).toLowerCase();
    const finalName = `${Date.now()}_${randomHex}_${cleanBase}${rawExt}`;

    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, finalName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${sanitizedFolder}/${finalName}`;

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  } catch (error) {
    console.error('Upload Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload file' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }
}
