/**
 * In-memory rate limiter for API routes.
 * 
 * PRODUCTION NOTE: In serverless deployments (e.g., Vercel), each function
 * instance has its own memory — this provides per-instance protection only.
 * For strict rate limiting across all instances, migrate to a Redis-backed
 * solution (e.g., @upstash/ratelimit with Upstash Redis).
 * 
 * This still provides meaningful protection:
 * - Warm instances retain state across requests
 * - Limits abuse per function invocation chain
 * - Better than no rate limiting at all
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes.
// Store the timer reference so it can be cleared in tests or on shutdown.
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    });
}, 5 * 60 * 1000);

// Prevent Node.js from keeping the process alive solely for this timer.
if (cleanupInterval.unref) cleanupInterval.unref();

interface RateLimitOptions {
    /** Maximum number of requests in the window */
    maxRequests: number;
    /** Window size in seconds */
    windowSeconds: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Check if a request is rate limited.
 * @param key - Unique identifier (e.g., IP + route)
 * @param options - Rate limit configuration
 * @returns Whether the request is allowed and metadata
 */
export function checkRateLimit(
    key: string,
    options: RateLimitOptions
): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
        // New window
        const resetAt = now + options.windowSeconds * 1000;
        rateLimitStore.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: options.maxRequests - 1, resetAt };
    }

    if (entry.count >= options.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Get the client IP from a Next.js request.
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
}

// Pre-configured rate limiters for common use cases
export const RATE_LIMITS = {
    /** Auth endpoints: 10 attempts per 15 minutes */
    auth: { maxRequests: 10, windowSeconds: 15 * 60 },
    /** Admin login: 5 attempts per 15 minutes */
    adminAuth: { maxRequests: 5, windowSeconds: 15 * 60 },
    /** General API: 100 requests per minute */
    api: { maxRequests: 100, windowSeconds: 60 },
    /** Upload: 20 uploads per hour */
    upload: { maxRequests: 20, windowSeconds: 60 * 60 },
} as const;
