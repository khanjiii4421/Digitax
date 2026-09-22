import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const users = await db.all("SELECT id, name, number, email, cnic, role FROM users ORDER BY id DESC");
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch users." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id, name, number, email, cnic, role } = await req.json();
    if (!id || !name || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    await db.run(`
      UPDATE users 
      SET name = ?, number = ?, email = ?, cnic = ?, role = ? 
      WHERE id = ?
    `, [name, number || "", email, cnic || "", role || "user", id]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update user." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(
        JSON.stringify({ error: "User ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    await db.run("DELETE FROM users WHERE id = ?", [id]);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete user." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
