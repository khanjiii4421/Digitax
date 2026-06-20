import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "digitax-super-secret-key-1234567890";

function base64urlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function verifyJwt(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const messageText = `${headerB64}.${payloadB64}`;
  const encoder = new TextEncoder();
  const messageData = encoder.encode(messageText);

  let signatureBase64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
  while (signatureBase64.length % 4) {
    signatureBase64 += "=";
  }

  try {
    const signatureBinary = atob(signatureBase64);
    const signatureBytes = new Uint8Array(signatureBinary.length);
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureBytes[i] = signatureBinary.charCodeAt(i);
    }

    const keyData = encoder.encode(JWT_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      messageData
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/auth/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get("admin_token")?.value;
    const user = await verifyJwt(token);
    if (!user || user.role !== "admin") {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;
    const user = await verifyJwt(token);

    if (!user || user.role !== "admin") {
      if (pathname === "/admin" || pathname === "/admin/") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal")) {
    const token = request.cookies.get("token")?.value;
    const user = await verifyJwt(token);

    if (!user || user.role !== "user") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/api/admin/:path*"],
};
