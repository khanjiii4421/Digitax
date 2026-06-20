import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    return new Response(
      JSON.stringify({ success: true, message: "Logged out successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
