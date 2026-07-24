import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@/src/lib/config/env';

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
};

export function signAccessToken(payload) {
  return jwt.sign(
    {
      sub: payload.id,
      role: payload.role,
      type: TOKEN_TYPES.ACCESS,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function signRefreshToken(payload) {
  return jwt.sign(
    {
      sub: payload.id,
      type: TOKEN_TYPES.REFRESH,
      jti: crypto.randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.type !== TOKEN_TYPES.ACCESS) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (decoded.type !== TOKEN_TYPES.REFRESH) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const TOKEN_COOKIE_CONFIG = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function getTokenExpiresIn(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
