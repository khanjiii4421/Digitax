import db from "@/lib/db";
import { sendTemplateEmail, sendEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sanitizeObject, securityHeaders } from "@/lib/security";

function getAdmin(req) {
  // Check via cookie - simplified since layout already guards
  return null; // Will get admin from cookie in each handler
}

export async function GET() {
  try {
    const queries = await db.all("SELECT * FROM queries ORDER BY created_at DESC");
    return new Response(JSON.stringify(queries), {
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

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status, reply_message } = sanitizeObject(body);

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Update status if provided
    if (status) {
      await db.run("UPDATE queries SET status = ? WHERE id = ?", [status, id]);
    }

    // Handle reply
    if (reply_message) {
      const query = await db.get("SELECT * FROM queries WHERE id = ?", [id]);
      if (!query) {
        return new Response(
          JSON.stringify({ success: false, error: "Query not found." }),
          { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
        );
      }

      // Get admin info
      let adminId = null;
      let adminName = 'Admin';
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;
        const admin = verifyToken(token);
        if (admin) {
          adminId = admin.id;
          adminName = admin.name || 'Admin';
        }
      } catch(e) {}

      // Save reply
      await db.run("INSERT INTO query_replies (query_id, sender_type, sender_id, message) VALUES (?, 'admin', ?, ?)", [id, adminId, reply_message]);

      // Update query status to replied
      await db.run("UPDATE queries SET status = 'replied' WHERE id = ?", [id]);

      // Send email to client
      await sendTemplateEmail('query_reply', {
        name: query.name,
        subject: query.subject,
        reply: reply_message
      }, query.email);

      // Create notification for the client
      if (query.user_id) {
        await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
          query.user_id,
          'Query Reply',
          `Admin replied to your query: "${query.subject}"`,
          'reply',
          '/portal/queries'
        ]);
      } else {
        // If no user_id, find by email
        const clientUser = await db.get("SELECT id FROM users WHERE email = ? AND role = 'user'", [query.email]);
        if (clientUser) {
          await db.run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
            clientUser.id,
            'Query Reply',
            `Admin replied to your query: "${query.subject}"`,
            'reply',
            '/portal/queries'
          ]);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required ID." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    // Delete replies first (or cascade)
    await db.run("DELETE FROM query_replies WHERE query_id = ?", [id]);
    await db.run("DELETE FROM queries WHERE id = ?", [id]);
    return new Response(JSON.stringify({ success: true }), {
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
