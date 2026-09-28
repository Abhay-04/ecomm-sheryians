import bcrypt from 'bcrypt';
import { matchedData } from 'express-validator';
import { BCRYPT_SALT_ROUNDS } from '../config/constants.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  clearRefreshTokenCookie,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
  hashToken,
  setRefreshTokenCookie,
  verifyRefreshToken,
} from '../utils/tokens.js';

// Compared against when the email doesn't exist, so "unknown email" and
// "wrong password" take the same time and can't be told apart.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_SALT_ROUNDS);

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

// Creates a refresh token, stores its hash, and puts the raw token in the cookie.
async function issueRefreshToken(res, userId) {
  const refreshToken = generateRefreshToken(userId.toString());

  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshTokenExpiryDate(),
  });

  setRefreshTokenCookie(res, refreshToken);
}

export async function register(req, res) {
  const { name, email, password } = matchedData(req);

  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({
    message: 'Account created successfully. Please sign in.',
    user: toPublicUser(user),
  });
}

export async function login(req, res) {
  const { email, password } = matchedData(req);

  const user = await User.findOne({ email }).select('+password');
  const passwordMatches = await bcrypt.compare(
    password,
    user ? user.password : DUMMY_PASSWORD_HASH
  );

  if (!user || !passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = generateAccessToken(user._id.toString());
  await issueRefreshToken(res, user._id);

  res.json({
    message: 'Logged in successfully',
    accessToken,
    user: toPublicUser(user),
  });
}

export async function refreshAccessToken(req, res) {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is missing');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    clearRefreshTokenCookie(res);
    throw new ApiError(401, 'Refresh token is invalid or expired');
  }

  // Rotation: the token is deleted as it is used, so it works exactly once.
  // findOneAndDelete is atomic, so two simultaneous requests with the same
  // token can't both succeed. A token that was already used, or revoked by
  // logout, won't be found here.
  const storedToken = await RefreshToken.findOneAndDelete({
    tokenHash: hashToken(refreshToken),
    user: payload.sub,
  });

  if (!storedToken) {
    clearRefreshTokenCookie(res);
    throw new ApiError(401, 'Refresh token has been revoked');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    clearRefreshTokenCookie(res);
    throw new ApiError(401, 'User no longer exists');
  }

  const accessToken = generateAccessToken(user._id.toString());
  await issueRefreshToken(res, user._id);

  res.json({ accessToken, user: toPublicUser(user) });
}

export async function logout(req, res) {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (refreshToken) {
    await RefreshToken.deleteOne({
      tokenHash: hashToken(refreshToken),
      user: req.user._id,
    });
  }

  clearRefreshTokenCookie(res);
  res.json({ message: 'Logged out successfully' });
}

export async function getCurrentUser(req, res) {
  res.json({ user: toPublicUser(req.user) });
}
