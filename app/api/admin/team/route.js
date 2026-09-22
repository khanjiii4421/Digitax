import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { securityHeaders } from "@/lib/security";

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const items = await db.all("SELECT * FROM team ORDER BY display_order ASC, id ASC");
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch team members." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { photo_url, name, role, display_order, enabled } = await req.json();
    if (!name || !role) {
      return new Response(
        JSON.stringify({ error: "Name and Role are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    await db.run(`
      INSERT INTO team (photo_url, name, role, display_order, enabled) 
      VALUES (?, ?, ?, ?, ?)
    `, [photo_url || "", name, role, display_order || 0, enabled !== undefined ? enabled : 1]);

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create team member." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id, photo_url, name, role, display_order, enabled } = await req.json();
    if (!id || !name || !role) {
      return new Response(
        JSON.stringify({ error: "ID, Name, and Role are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    await db.run(`
      UPDATE team 
      SET photo_url = ?, name = ?, role = ?, display_order = ?, enabled = ? 
      WHERE id = ?
    `, [photo_url || "", name, role, display_order || 0, enabled !== undefined ? enabled : 1, id]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update team member." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
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
        JSON.stringify({ error: "Team member ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    await db.run("DELETE FROM team WHERE id = ?", [id]);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete team member." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
