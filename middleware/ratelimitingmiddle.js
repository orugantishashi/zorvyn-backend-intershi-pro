/**
 * Rate Limiting Middleware
 * - Protects APIs from abuse using `express-rate-limit`
 */
const  rateLimit  = require ('express-rate-limit');

/**
 * Default limiter (10 requests / 10 minutes per IP).
 */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
module.exports = limiter;
