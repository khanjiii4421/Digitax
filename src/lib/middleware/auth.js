import { verifyAccessToken } from '@/src/lib/auth/jwt';
import { getOne } from '@/src/lib/db/pool';
import { error } from '@/src/lib/utils/response';

export async function authenticate(req) {
  const token =
    req.cookies?.get('token')?.value ||
    req.headers?.get('authorization')?.replace('Bearer ', '');

  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  const user = await getOne('SELECT id, name, email, role, is_active FROM users WHERE id = ?', [
    payload.sub,
  ]);
  if (!user || !user.is_active) return null;

  return user;
}

export async function requireAuth(req) {
  const user = await authenticate(req);
  if (!user) {
    return {
      unauthorized: true,
      response: error('Authentication required', 401),
    };
  }
  return { unauthorized: false, user };
}

export async function requireAdmin(req) {
  const result = await requireAuth(req);
  if (result.unauthorized) return result;

  if (result.user.role !== 'admin' && result.user.role !== 'superadmin') {
    return {
      unauthorized: true,
      response: error('Admin access required', 403),
    };
  }
  return result;
}

export function withAuth(handler, roleRequired = false) {
  return async (req, ...args) => {
    const check = roleRequired ? await requireAdmin(req) : await requireAuth(req);
    if (check.unauthorized) return check.response;
    return handler(req, check.user, ...args);
  };
}

export async function getAuthUser(req) {
  try {
    const user = await authenticate(req);
    return user;
  } catch {
    return null;
  }
}
