import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sanitizeObject, securityHeaders } from "@/lib/security";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated." }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Get queries for this user (by user_id or email)
    const queries = await db.all(
      "SELECT * FROM queries WHERE user_id = ? OR email = ? ORDER BY created_at DESC",
      [user.id, user.email]
    );

    // Get replies for each query
    const withReplies = await Promise.all(queries.map(async (q) => {
      const replies = await db.all("SELECT * FROM query_replies WHERE query_id = ? ORDER BY created_at ASC", [q.id]);
      return { ...q, replies };
    }));

    return new Response(JSON.stringify(withReplies), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated." }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { query_id, message } = sanitizeObject(body);

    if (!query_id || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "query_id and message are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Verify this query belongs to the user
    const query = await db.get("SELECT * FROM queries WHERE id = ? AND (user_id = ? OR email = ?)", [query_id, user.id, user.email]);
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query not found or access denied." }),
        { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Add client reply
    await db.run("INSERT INTO query_replies (query_id, sender_type, sender_id, message) VALUES (?, 'client', ?, ?)", [query_id, user.id, message]);

    // Notify admins
    const admins = await db.all("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
        admin.id,
        'Client Reply',
        `${user.name} replied to query: "${query.subject}"`,
        'reply',
        '/admin/queries'
      ]);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
