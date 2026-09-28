import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

const REFRESH_TOKEN_MAX_AGE_MS = env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000;

export function generateAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiresIn,
  });
}

export function generateRefreshToken(userId) {
  // jwtid makes every refresh token unique, even two issued in the same second.
  return jwt.sign({ sub: userId }, env.refreshTokenSecret, {
    expiresIn: `${env.refreshTokenExpiresInDays}d`,
    jwtid: crypto.randomUUID(),
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.accessTokenSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshTokenSecret);
}

// SHA-256 (not bcrypt) because refresh tokens are long random values and we
// need a deterministic hash to look the token up in the database.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiryDate() {
  return new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
}

// The cookie is only sent to /api/auth routes, so product requests never carry it.
// In production the frontend and API are usually on different domains, which
// requires SameSite=None (and therefore Secure) for the browser to send it.
const baseCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  path: '/api/auth',
};

export function setRefreshTokenCookie(res, token) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, baseCookieOptions);
}
