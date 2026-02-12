import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('JWT_SECRET must be set in production'); })()
    : 'dev-secret-not-for-production');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
    userId: string; // MongoDB ObjectId is a string
    mobile: string;
    role: string;
}

export interface TokenData {
    token: string;
    expiresIn: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): TokenData {
    const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    };
    const token = jwt.sign(payload, JWT_SECRET, options);

    return {
        token,
        expiresIn: JWT_EXPIRES_IN,
    };
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
