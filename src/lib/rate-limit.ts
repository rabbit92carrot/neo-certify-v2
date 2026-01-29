/**
 * Rate Limiting — re-exports from security module
 * @deprecated 직접 import 대신 @/lib/security/rate-limit 사용 권장
 */

export {
  getApiLimiter,
  getAuthLimiter,
  getPublicLimiter,
  getClientIp,
  rateLimitHeaders,
  type RateLimitResult,
} from '@/lib/security/rate-limit';
