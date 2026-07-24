import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '@/src/lib/repositories/user-repo';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  TOKEN_COOKIE_CONFIG,
  getTokenExpiresIn,
} from '@/src/lib/auth/jwt';
import { hashOtp, verifyOtp, generateOtp } from '@/src/lib/security/utils';
import { checkRateLimit, clearRateLimit } from '@/src/lib/security/rate-limiter';
import { sendEmail } from '@/src/lib/email/send';
import { getOne, transaction } from '@/src/lib/db/pool';
import { env } from '@/src/lib/config/env';

const SALT_ROUNDS = 12;

export const AuthService = {
  async signup({ name, email, number, password }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return { error: 'Email already registered' };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userId = await transaction(async (conn) => {
      const [result] = await conn.execute(
        `INSERT INTO users (name, email, number, password_hash, role) VALUES (?, ?, ?, ?, 'user')`,
        [name, email, number || null, passwordHash]
      );
      return result.insertId;
    });

    const tokens = await this._generateTokens(userId, 'user');
    await UserRepository.recordLogin(userId);

    sendEmail({
      to: email,
      subject: 'Welcome to Digitax',
      html: `<h2>Welcome ${name}!</h2><p>Your account has been created successfully.</p>`,
    }).catch(() => {});

    return { user: { id: userId, name, email, role: 'user' }, ...tokens };
  },

  async signin({ email, password, remember }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    if (!user.is_active) {
      return { error: 'Account is deactivated' };
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil(
        (new Date(user.locked_until) - new Date()) / 60000
      );
      return { error: `Account locked. Try again in ${minutes} minutes.` };
    }

    const isValid = await this._verifyPassword(password, user.password_hash);
    if (!isValid) {
      await UserRepository.incrementFailedAttempts(user.id);
      return { error: 'Invalid email or password' };
    }

    const tokens = await this._generateTokens(user.id, user.role);
    await UserRepository.recordLogin(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
      remember: !!remember,
    };
  },

  async googleAuth({ credential, cnic }) {
    let email, name, oauthId;

    if (env.GOOGLE_CLIENT_ID) {
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name || payload.given_name || 'User';
      oauthId = payload.sub;
    } else {
      return { error: 'Google authentication is not configured' };
    }

    let user = await UserRepository.findByEmail(email);

    if (user) {
      if (!user.oauth_provider) {
        await UserRepository.linkGoogleAccount(user.id, oauthId);
      }
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

      const userId = await UserRepository.create({
        name,
        email,
        password_hash: passwordHash,
        cnic: cnic || null,
      });

      await UserRepository.linkGoogleAccount(userId, oauthId);

      user = await UserRepository.findById(userId);

      sendEmail({
        to: email,
        subject: 'Welcome to Digitax',
        html: `<h2>Welcome ${name}!</h2><p>Your account has been created via Google.</p>`,
      }).catch(() => {});
    }

    const tokens = await this._generateTokens(user.id, user.role);
    await UserRepository.recordLogin(user.id);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, cnic: user.cnic },
      ...tokens,
      cnicRequired: !user.cnic && !cnic,
    };
  },

  async refreshToken(token) {
    if (!token) return { error: 'Refresh token required' };

    const payload = verifyRefreshToken(token);
    if (!payload) return { error: 'Invalid refresh token' };

    const tokenHash = hashToken(token);
    const user = await getOne(
      'SELECT id, role FROM users WHERE id = ? AND refresh_token_hash = ?',
      [payload.sub, tokenHash]
    );
    if (!user) return { error: 'Refresh token has been revoked' };

    const tokens = await this._generateTokens(user.id, user.role);
    return tokens;
  },

  async logout(userId) {
    await UserRepository.updateRefreshToken(userId, null);
  },

  async forgotPassword({ email }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return { success: true };
    }

    const otp = generateOtp(6);
    const otpHash = hashOtp(otp);

    await UserRepository.update(user.id, {
      otp_code_hash: otpHash,
      otp_expires: new Date(Date.now() + 15 * 60 * 1000),
    });

    sendEmail({
      to: email,
      subject: 'Password Reset OTP',
      html: `<h2>Your OTP Code</h2><p>Your OTP is: <strong>${otp}</strong></p><p>This code expires in 15 minutes.</p>`,
    }).catch(() => {});

    return { success: true };
  },

  async verifyOtp({ email, otp }) {
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.otp_code_hash) {
      return { error: 'No OTP request found' };
    }

    if (user.otp_expires && new Date(user.otp_expires) < new Date()) {
      return { error: 'OTP has expired' };
    }

    if (!verifyOtp(otp, user.otp_code_hash)) {
      return { error: 'Invalid OTP' };
    }

    return { success: true };
  },

  async resetPassword({ email, otp, password }) {
    const otpResult = await this.verifyOtp({ email, otp });
    if (otpResult.error) return otpResult;

    const user = await UserRepository.findByEmail(email);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await UserRepository.update(user.id, {
      password_hash: passwordHash,
      otp_code_hash: null,
      otp_expires: null,
    });

    clearRateLimit(`user:${user.id}`);

    return { success: true };
  },

  async _generateTokens(userId, role) {
    const accessToken = signAccessToken({ id: userId, role });
    const refreshToken = signRefreshToken({ id: userId });

    const tokenHash = hashToken(refreshToken);
    await UserRepository.updateRefreshToken(userId, tokenHash);

    return { accessToken, refreshToken };
  },

  async _verifyPassword(password, hash) {
    if (!hash) return false;

    if (hash.length === 64) {
      const sha256 = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(sha256), Buffer.from(hash));
    }

    return bcrypt.compare(password, hash);
  },
};
