import { rateLimit } from 'express-rate-limit';

// Slows down password-guessing attempts against login and register.
// Only failed requests count, so normal users are never locked out.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});
