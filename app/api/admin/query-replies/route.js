import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { securityHeaders } from "@/lib/security";

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('query_id');

    if (!queryId) {
      return new Response(
        JSON.stringify({ success: false, error: "query_id is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const replies = await db.all("SELECT * FROM query_replies WHERE query_id = ? ORDER BY created_at ASC", [queryId]);
    return new Response(JSON.stringify(replies), {
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
