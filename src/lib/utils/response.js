import { env } from '@/src/lib/config/env';

export function success(data = null, message = 'Success', status = 200) {
  return Response.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: securityHeaders(),
    }
  );
}

export function error(message = 'Server error', status = 500, details = null) {
  return Response.json(
    {
      success: false,
      message,
      ...(details && env.NODE_ENV === 'development' ? { details } : {}),
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: securityHeaders(),
    }
  );
}

export function paginated(data, total, page, limit) {
  return Response.json(
    {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: securityHeaders(),
    }
  );
}

export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store',
  };
}

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0] || 'Validation failed';
    return { valid: false, error: firstError, fieldErrors };
  }
  return { valid: true, data: result.data };
}
