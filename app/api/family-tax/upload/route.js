import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'general';
    const docType = formData.get('docType') || 'document';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.' 
      }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size exceeds maximum limit of 10MB.' 
      }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'family-tax');
    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = path.extname(file.name) || (file.type.includes('pdf') ? '.pdf' : '.jpg');
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExt}`;
    const filePath = path.join(uploadDir, safeName);

    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/family-tax/${safeName}`;

    return NextResponse.json({
      success: true,
      file: {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        category,
        docType
      }
    });

  } catch (error) {
    console.error('File Upload Error:', error);
    return NextResponse.json({ success: false, error: 'File upload failed' }, { status: 500 });
  }
}
