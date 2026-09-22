import db from "@/lib/db";
import { verifyPassword } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp, isAccountLocked, recordFailedAttempt, resetFailedAttempts, sanitizeObject, securityHeaders } from "@/lib/security";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateKey = `admin-signin:${ip}`;
    const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
    if (rate.limited) {
      return new Response(
        JSON.stringify({ success: false, message: "Too many attempts. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const body = await req.json();
    const { email, password, remember } = sanitizeObject(body);

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, message: "Email and password are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    if (isAccountLocked(email)) {
      return new Response(
        JSON.stringify({ success: false, message: "Account temporarily locked. Try again in 15 minutes." }),
        { status: 423, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    const user = await db.get(
      "SELECT id, name, email, password_hash, role, permissions, is_active, locked_until FROM users WHERE email = ? AND role IN ('admin', 'subadmin')", 
      [email]
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      if (user) recordFailedAttempt(email);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid admin or sub-admin credentials." }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    if (user.is_active === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Your account is currently disabled. Please contact the administrator." }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return new Response(
        JSON.stringify({ success: false, message: "Account temporarily locked." }),
        { status: 423, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    resetFailedAttempts(email);
    const token = signToken({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      permissions: user.permissions || ''
    });
    const refreshToken = signToken({ id: user.id, tokenType: 'refresh' });
    const cookieStore = await cookies();

    const isRemember = remember === true || remember === 'true';
    const tokenMaxAge = isRemember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokenMaxAge,
    });

    cookieStore.set("admin_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/admin/auth/refresh",
      maxAge: 30 * 24 * 60 * 60,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Signed in successfully!", 
        data: { 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            permissions: user.permissions || ''
          } 
        } 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json", ...securityHeaders } }
    );
  }
}
