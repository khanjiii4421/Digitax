const rateLimitMap = new Map();

export function checkRateLimit(identifier, limit = 10, windowMs = 900000) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  record.count += 1;
  if (record.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

export function rateLimit(limit = 10, windowMs = 900000) {
  return async (req) => {
    const ip =
      req.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers?.get('x-real-ip') ||
      'unknown';
    const identifier = req.user?.id ? `user:${req.user.id}` : `ip:${ip}`;

    return checkRateLimit(identifier, limit, windowMs);
  };
}

export function clearRateLimit(identifier) {
  rateLimitMap.delete(identifier);
}
