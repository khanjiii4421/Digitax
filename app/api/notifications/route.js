import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { securityHeaders } from "@/lib/security";

export async function GET() {
  try {
    // Check both token and admin_token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || cookieStore.get("admin_token")?.value;
    const user = verifyToken(token);

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ success: false, notifications: [], unreadCount: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const notifications = await db.all(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
      [user.id]
    );

    const unreadRow = await db.get(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [user.id]
    );

    return new Response(
      JSON.stringify({ success: true, notifications, unreadCount: unreadRow.count }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, notifications: [], unreadCount: 0 }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function PATCH(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || cookieStore.get("admin_token")?.value;
    const user = verifyToken(token);

    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ success: false }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const { id, markAllRead } = await req.json();

    if (markAllRead) {
      await db.run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [user.id]);
    } else if (id) {
      await db.run("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [id, user.id]);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
