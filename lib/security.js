import crypto from 'crypto';

// ── Rate Limiter (in-memory, per IP) ──
const rateLimitMap = new Map();

/**
 * Check if an IP is rate-limited.
 * @param {string} key - unique key (e.g. IP + route)
 * @param {number} maxAttempts - max requests in the window
 * @param {number} windowMs - time window in ms (default 15 min)
 * @returns {{ limited: boolean, remaining: number, resetIn: number }}
 */
export function checkRateLimit(key, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { attempts: [], firstAttempt: now });
  }
  const entry = rateLimitMap.get(key);
  // Clean old attempts
  entry.attempts = entry.attempts.filter(t => now - t < windowMs);
  if (entry.attempts.length >= maxAttempts) {
    const oldest = entry.attempts[0];
    return { limited: true, remaining: 0, resetIn: windowMs - (now - oldest) };
  }
  entry.attempts.push(now);
  return { limited: false, remaining: maxAttempts - entry.attempts.length, resetIn: 0 };
}

/**
 * Reset rate limit for a key (e.g. after successful login)
 */
export function resetRateLimit(key) {
  rateLimitMap.delete(key);
}

// Periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    entry.attempts = entry.attempts.filter(t => now - t < 15 * 60 * 1000);
    if (entry.attempts.length === 0) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

// ── Input Sanitization ──
/**
 * Sanitize a string to prevent XSS.
 */
export function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize all string values in an object (shallow).
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    cleaned[key] = typeof val === 'string' ? sanitize(val) : val;
  }
  return cleaned;
}

// ── CSRF Token ──
const csrfTokens = new Map();

/**
 * Generate a CSRF token for a session.
 */
export function generateCsrfToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, { token, created: Date.now() });
  return token;
}

/**
 * Validate a CSRF token.
 */
export function validateCsrfToken(sessionId, token) {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  // Expire after 1 hour
  if (Date.now() - stored.created > 60 * 60 * 1000) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(stored.token), Buffer.from(token));
}

// ── Account Lockout ──
const lockoutMap = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an account is locked.
 */
export function isAccountLocked(email) {
  const entry = lockoutMap.get(email.toLowerCase());
  if (!entry) return false;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) return true;
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    lockoutMap.delete(email.toLowerCase());
    return false;
  }
  return false;
}

/**
 * Record a failed login attempt. Locks account after MAX_FAILED_ATTEMPTS.
 */
export function recordFailedAttempt(email) {
  const key = email.toLowerCase();
  if (!lockoutMap.has(key)) {
    lockoutMap.set(key, { attempts: 0, lockedUntil: null });
  }
  const entry = lockoutMap.get(key);
  entry.attempts += 1;
  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
}

/**
 * Reset failed attempts after successful login.
 */
export function resetFailedAttempts(email) {
  lockoutMap.delete(email.toLowerCase());
}

// ── Helper: get client IP ──
export function getClientIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// ── Security Headers ──
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};
