import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { usersRepository } from '../users/users.repository';
import { RefreshTokenModel } from './auth.schema';
import { signAccessToken } from '../../common/middleware/auth.middleware';
import { AppError } from '../../common/middleware/errorHandler.middleware';
import { Types } from 'mongoose';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 7;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth service — all auth business logic lives here.
 *
 * Key design decisions:
 * 1. bcrypt cost 12 → ~250ms hash time (brute-force resistant, acceptable UX latency)
 * 2. Access tokens: short-lived JWT (15min), stateless
 * 3. Refresh tokens: opaque UUID, stored in MongoDB with TTL index, rotated on use
 * 4. Refresh token rotation: old token deleted + new token issued on every refresh
 *    → If attacker steals a token and uses it first, the next legit use fails,
 *      triggering a re-login requirement (rather than silent continued access)
 */
export const authService = {
  async register(email: string, password: string): Promise<AuthTokens> {
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await usersRepository.create({ email, passwordHash });

    return authService._issueTokens(user._id.toString(), user.email);
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await usersRepository.findByEmail(email);
    // Timing-safe: run bcrypt even on missing user to prevent user enumeration via timing
    const dummyHash = '$2b$12$invalidhashfortimingreasonXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const passwordHash = user?.passwordHash ?? dummyHash;

    const valid = await bcrypt.compare(password, passwordHash);
    if (!user || !valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    return authService._issueTokens(user._id.toString(), user.email);
  },

  async refresh(oldRefreshToken: string): Promise<AuthTokens> {
    const tokenDoc = await RefreshTokenModel.findOne({ token: oldRefreshToken });

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
    }

    const user = await usersRepository.findById(tokenDoc.userId.toString());
    if (!user) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'User no longer exists');
    }

    // Rotate: delete the used token before issuing new one
    await RefreshTokenModel.deleteOne({ _id: tokenDoc._id });

    return authService._issueTokens(user._id.toString(), user.email);
  },

  async logout(refreshToken: string): Promise<void> {
    await RefreshTokenModel.deleteOne({ token: refreshToken });
  },

  async _issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessToken = signAccessToken(userId, email);

    const refreshTokenValue = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await RefreshTokenModel.create({
      token: refreshTokenValue,
      userId: new Types.ObjectId(userId),
      expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenValue };
  },
};
