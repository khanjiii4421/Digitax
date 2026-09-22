import crypto from 'crypto';

function getJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'digitax-super-secret-key-1234567890' && !process.env.JWT_SECRET.includes('change-this')) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET must be set to a strong random value in production');
  }
  return '0686e56abdb4cf89c38684b8bc83d21acd561d118b9e4a47e90b6b84cddd033eb77810d70dea386b3c6c6604c484cf04280b5452d65f42abe9f990fec6912050';
}
const JWT_SECRET = getJwtSecret();

function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
    
  if (signature !== expectedSignature) return null;
  
  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Server-side route handler authorization check for admin routes
 * @param {Request|NextRequest} req
 * @returns {{ authorized: boolean, user?: object, response?: Response }}
 */
export function requireAdmin(req) {
  let token = null;

  if (req?.cookies?.get) {
    token = req.cookies.get('admin_token')?.value;
  } else if (req?.headers?.get) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_token=([^;]+)/);
    if (match) token = match[1];
    if (!token) {
      const authHeader = req.headers.get('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  }

  const user = verifyToken(token);
  if (!user || user.role !== 'admin') {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Admin access required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { authorized: true, user };
}
