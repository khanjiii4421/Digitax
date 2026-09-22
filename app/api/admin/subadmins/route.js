import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import db, { hashPassword } from "@/lib/db";
import { securityHeaders, sanitizeObject } from "@/lib/security";

// Verify that requester is a Super Admin
async function getSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function GET(req) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, message: "Super Admin authorization required." }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const rows = await db.all(
      `SELECT id, name, email, number as phone, role, permissions, is_active, created_at 
       FROM users 
       WHERE role IN ('admin', 'subadmin') 
       ORDER BY id ASC`
    );

    const subadmins = (rows || []).map(r => {
      let perms = [];
      try {
        if (r.permissions) {
          perms = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions;
        }
      } catch (e) {
        perms = String(r.permissions || '').split(',').map(s => s.trim()).filter(Boolean);
      }
      return {
        ...r,
        permissions: perms,
        is_active: r.is_active === 1 || r.is_active === true
      };
    });

    return new Response(
      JSON.stringify({ success: true, subadmins }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    console.error("Subadmins GET error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function POST(req) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, message: "Super Admin authorization required." }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { name, email, phone, password, permissions } = sanitizeObject(body);

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: "Name, email, and password are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Check if email already exists
    const existing = await db.get("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "A user with this email already exists." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const passwordHash = hashPassword(password);
    const permsJson = JSON.stringify(Array.isArray(permissions) ? permissions : []);

    const result = await db.run(
      `INSERT INTO users (name, email, number, password_hash, role, permissions, is_active) 
       VALUES (?, ?, ?, ?, 'subadmin', ?, 1)`,
      [name.trim(), email.toLowerCase().trim(), phone || "", passwordHash, permsJson]
    );

    return new Response(
      JSON.stringify({ success: true, message: "Sub-Admin created successfully!", id: result.insertId }),
      { status: 201, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    console.error("Subadmins POST error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error creating sub-admin." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function PATCH(req) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, message: "Super Admin authorization required." }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { id, name, email, phone, permissions, is_active, password } = sanitizeObject(body);

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "Sub-Admin ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const target = await db.get("SELECT id, role FROM users WHERE id = ?", [id]);
    if (!target) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found." }),
        { status: 404, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const fields = [];
    const values = [];

    if (name) { fields.push("name = ?"); values.push(name.trim()); }
    if (email) { fields.push("email = ?"); values.push(email.toLowerCase().trim()); }
    if (phone !== undefined) { fields.push("number = ?"); values.push(phone); }
    if (permissions !== undefined) {
      fields.push("permissions = ?");
      values.push(JSON.stringify(Array.isArray(permissions) ? permissions : []));
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (password && password.length >= 6) {
      fields.push("password_hash = ?");
      values.push(hashPassword(password));
    }

    if (fields.length > 0) {
      values.push(id);
      await db.run(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Sub-Admin updated successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    console.error("Subadmins PATCH error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error updating sub-admin." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}

export async function DELETE(req) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, message: "Super Admin authorization required." }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "Sub-Admin ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    if (Number(id) === Number(admin.id)) {
      return new Response(
        JSON.stringify({ success: false, message: "You cannot delete your own Super Admin account." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    await db.run("DELETE FROM users WHERE id = ? AND role = 'subadmin'", [id]);

    return new Response(
      JSON.stringify({ success: true, message: "Sub-Admin removed successfully." }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    console.error("Subadmins DELETE error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error deleting sub-admin." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
