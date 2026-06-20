import { promises as fs } from "fs";
import path from "path";

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

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const files = await getFilesRecursively(uploadsDir);
    // Sort files by upload time (newest first)
    files.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    return new Response(JSON.stringify(files), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to list uploads." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req) {
  try {
    const { filePath } = await req.json();
    if (!filePath || !filePath.startsWith("/uploads/")) {
      return new Response(
        JSON.stringify({ error: "Invalid file path." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const cleanPath = filePath.replace(/^\/uploads\//, "");
    const fullPath = path.join(process.cwd(), "public", "uploads", cleanPath);
    await fs.unlink(fullPath);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete file." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
