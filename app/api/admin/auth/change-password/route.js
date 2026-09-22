import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import db, { hashPassword, verifyPassword } from "@/lib/db";
import { securityHeaders, sanitizeObject } from "@/lib/security";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== "admin" && decoded.role !== "subadmin" && decoded.role !== "superadmin")) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized." }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = sanitizeObject(body);

    if (!newPassword || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, message: "New password must be at least 6 characters long." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const user = await db.get("SELECT id, password_hash FROM users WHERE id = ?", [decoded.id]);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found." }),
        { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Verify current password if provided
    if (currentPassword && !verifyPassword(currentPassword, user.password_hash)) {
      return new Response(
        JSON.stringify({ success: false, message: "Current password is incorrect." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const newHash = hashPassword(newPassword);
    await db.run("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, decoded.id]);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
