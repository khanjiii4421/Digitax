import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const user = verifyToken(token);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Not authenticated', data: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Authenticated', data: { user } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server error', data: null }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
