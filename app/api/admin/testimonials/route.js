import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { securityHeaders } from "@/lib/security";

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const items = await db.all("SELECT * FROM testimonials ORDER BY id DESC");
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch testimonials." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { photo_url, name, role, review } = await req.json();
    if (!name || !review) {
      return new Response(
        JSON.stringify({ error: "Name and Review are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    await db.run(`
      INSERT INTO testimonials (photo_url, name, role, review) 
      VALUES (?, ?, ?, ?)
    `, [photo_url || "", name, role || "", review]);

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create testimonial." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function PUT(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id, photo_url, name, role, review } = await req.json();
    if (!id || !name || !review) {
      return new Response(
        JSON.stringify({ error: "ID, Name, and Review are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    await db.run(`
      UPDATE testimonials 
      SET photo_url = ?, name = ?, role = ?, review = ? 
      WHERE id = ?
    `, [photo_url || "", name, role || "", review, id]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update testimonial." }),
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
        JSON.stringify({ error: "Testimonial ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    await db.run("DELETE FROM testimonials WHERE id = ?", [id]);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete testimonial." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
