import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { securityHeaders } from "@/lib/security";

// Known payment method logos - auto-detected when admin adds a method
const KNOWN_LOGOS = {
  'easypaisa': '/uploads/payment-logos/easypaisa.svg',
  'easypaisa bank': '/uploads/payment-logos/easypaisa.svg',
  'jazzcash': '/uploads/payment-logos/jazzcash.svg',
  'jazz cash': '/uploads/payment-logos/jazzcash.svg',
  'bank transfer': '/uploads/payment-logos/bank-transfer.svg',
  'bank': '/uploads/payment-logos/bank-transfer.svg',
  'ubl': '/uploads/payment-logos/bank-transfer.svg',
  'hbl': '/uploads/payment-logos/bank-transfer.svg',
  'meezan': '/uploads/payment-logos/bank-transfer.svg',
  'allied bank': '/uploads/payment-logos/bank-transfer.svg',
  'mcbl': '/uploads/payment-logos/bank-transfer.svg',
  'sada pay': '/uploads/payment-logos/easypaisa.svg',
  'nayapay': '/uploads/payment-logos/jazzcash.svg',
};

function detectLogo(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return KNOWN_LOGOS[key] || null;
}

export async function GET(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const methods = await db.all("SELECT * FROM payment_methods ORDER BY display_order ASC");
    return new Response(JSON.stringify({ success: true, methods }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders }
    });
  } catch (error) {
    console.error("Payment methods GET error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...securityHeaders }
    });
  }
}

export async function POST(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { name, account_number, account_title, is_active, logo_url } = body;

    if (!name || !account_number || !account_title) {
      return new Response(JSON.stringify({ success: false, error: "All fields are required." }), { status: 400 });
    }

    const maxOrder = await db.get("SELECT MAX(display_order) as max_order FROM payment_methods");
    const nextOrder = (maxOrder?.max_order || 0) + 1;

    // Auto-detect logo if not manually provided
    const finalLogo = logo_url || detectLogo(name);

    const result = await db.run(
      "INSERT INTO payment_methods (name, account_number, account_title, logo_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)",
      [name, account_number, account_title, finalLogo, is_active !== undefined ? (is_active ? 1 : 0) : 1, nextOrder]
    );

    return new Response(JSON.stringify({ success: true, id: result.insertId }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...securityHeaders }
    });
  } catch (error) {
    console.error("Payment methods POST error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...securityHeaders }
    });
  }
}

export async function PUT(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { id, name, account_number, account_title, is_active, logo_url } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "ID is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...securityHeaders }
      });
    }

    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (account_number !== undefined) { fields.push("account_number = ?"); values.push(account_number); }
    if (account_title !== undefined) { fields.push("account_title = ?"); values.push(account_title); }
    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active ? 1 : 0); }
    if (logo_url !== undefined) {
      fields.push("logo_url = ?");
      values.push(logo_url);
    } else if (name !== undefined) {
      // Auto-detect logo when name changes and no manual logo provided
      const autoLogo = detectLogo(name);
      if (autoLogo) { fields.push("logo_url = ?"); values.push(autoLogo); }
    }

    if (fields.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No fields to update." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...securityHeaders }
      });
    }

    values.push(id);
    await db.run(`UPDATE payment_methods SET ${fields.join(", ")} WHERE id = ?`, values);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders }
    });
  } catch (error) {
    console.error("Payment methods PUT error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...securityHeaders }
    });
  }
}

export async function DELETE(req) {
  const auth = requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "ID is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...securityHeaders }
      });
    }
    await db.run("DELETE FROM payment_methods WHERE id = ?", [id]);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...securityHeaders }
    });
  } catch (error) {
    console.error("Payment methods DELETE error:", error);
    return new Response(JSON.stringify({ success: false, error: "Server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...securityHeaders }
    });
  }
}
