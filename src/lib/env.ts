/**
 * Environment variable validation.
 * Imported at app startup to fail fast if critical config is missing.
 */

const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
] as const;

const optionalVars = [
    'JWT_EXPIRES_IN',
    'RAZORPAY_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_WHATSAPP_NUMBER',
] as const;

export function validateEnv(): void {
    const missing: string[] = [];

    for (const key of requiredVars) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nSee .env.example for the full list.`
        );
    }

    // Warn about insecure JWT secret in production
    if (
        process.env.NODE_ENV === 'production' &&
        process.env.JWT_SECRET &&
        process.env.JWT_SECRET.length < 32
    ) {
        console.warn(
            '⚠️  JWT_SECRET is too short for production. Use at least 32 characters.'
        );
    }

    // Warn if webhook secret is missing/placeholder in production
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (
        process.env.NODE_ENV === 'production' &&
        (!webhookSecret || webhookSecret.startsWith('your_'))
    ) {
        console.warn(
            '⚠️  RAZORPAY_WEBHOOK_SECRET is not configured! Payment recovery (when users close browser mid-payment) will NOT work. Set up webhooks at https://dashboard.razorpay.com/app/webhooks'
        );
    }

    // Log optional vars status (non-sensitive)
    const missingOptional = optionalVars.filter(k => !process.env[k]);
    if (missingOptional.length > 0) {
        console.info(
            `ℹ️  Optional env vars not set: ${missingOptional.join(', ')}`
        );
    }
}
