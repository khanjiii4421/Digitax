import { promises as fs } from "fs";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { securityHeaders } from "@/lib/security";

async function getFilesRecursively(dir, relativePath = "") {
  let results = [];
  try {
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const file of list) {
      const resPath = path.join(dir, file.name);
      const rel = relativePath ? `${relativePath}/${file.name}` : file.name;
      if (file.isDirectory()) {
        results = results.concat(await getFilesRecursively(resPath, rel));
      } else {
        const stats = await fs.stat(resPath);
        results.push({
          name: file.name,
          path: `/uploads/${rel}`,
          size: stats.size,
          mtime: stats.mtime,
        });
      }
    }
  } catch (e) {
    // Directory might not exist yet
  }
  return results;
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const files = await getFilesRecursively(uploadsDir);
    // Sort files by upload time (newest first)
    files.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    return new Response(JSON.stringify(files), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to list uploads." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function DELETE(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { filePath } = await req.json();
    if (!filePath || typeof filePath !== 'string' || !filePath.startsWith("/uploads/")) {
      return new Response(
        JSON.stringify({ error: "Invalid file path." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    const cleanPath = filePath.replace(/^\/uploads\//, "");
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    const fullPath = path.resolve(uploadsDir, cleanPath);

    // Path traversal check
    if (!fullPath.startsWith(uploadsDir)) {
      return new Response(
        JSON.stringify({ error: "Access denied: Invalid file path." }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    await fs.unlink(fullPath);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete file." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
