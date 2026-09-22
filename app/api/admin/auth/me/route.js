import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== "admin" && decoded.role !== "subadmin" && decoded.role !== "superadmin")) {
      return new Response(
        JSON.stringify({ success: false, message: "Not authenticated" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch fresh user details & permissions from database
    const freshUser = await db.get(
      "SELECT id, name, email, number, role, permissions, is_active FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!freshUser || freshUser.is_active === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Account inactive or not found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let parsedPermissions = [];
    try {
      if (freshUser.permissions) {
        parsedPermissions = typeof freshUser.permissions === 'string' 
          ? JSON.parse(freshUser.permissions) 
          : freshUser.permissions;
      }
    } catch(e) {
      parsedPermissions = String(freshUser.permissions || '').split(',').map(s => s.trim()).filter(Boolean);
    }

    const userData = {
      id: freshUser.id,
      name: freshUser.name,
      email: freshUser.email,
      number: freshUser.number,
      role: freshUser.role,
      isSuperAdmin: freshUser.role === 'admin' || freshUser.role === 'superadmin',
      permissions: parsedPermissions
    };

    return new Response(
      JSON.stringify({ success: true, message: "Authenticated", data: { user: userData } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
