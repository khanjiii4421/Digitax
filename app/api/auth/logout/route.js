import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    return new Response(
      JSON.stringify({ success: true, message: 'Logged out successfully!', data: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server error.', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
