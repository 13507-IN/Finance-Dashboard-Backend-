import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

function buildRateLimitMessage(context: string) {
  return {
    success: false,
    message: 'Too many requests',
    error: `Rate limit exceeded for ${context}. Please try again later.`,
  };
}

export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(buildRateLimitMessage('API'));
  },
});

export const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(buildRateLimitMessage('authentication endpoints'));
  },
});
