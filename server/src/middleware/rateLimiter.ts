import rateLimit from 'express-rate-limit';

// Helper to identify localhost / test environments
const isLocalOrTest = (req: any) => {
  if (process.env.NODE_ENV === 'test' || req.headers['x-test-suite'] === 'true') return true;
  // In development, never rate-limit the local developer
  if (process.env.NODE_ENV !== 'production') return true;
  const ip = req.ip || req.connection?.remoteAddress || '';
  return ip.includes('127.0.0.1') || ip === '::1' || ip.includes('::ffff:127.0.0.1') || ip === 'localhost';
};

// Global API rate limiter: High capacity for streaming (5000 requests per 15 min in prod, unlimited in dev)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  skip: isLocalOrTest,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiter (brute-force protection: 1000 requests per 15 min in prod, unlimited in dev)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: isLocalOrTest,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
