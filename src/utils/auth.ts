import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  return bcrypt.hash(password, rounds);
};

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns true if match, false otherwise
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT access token
 * @param userId - User ID
 * @param role - User role
 * @param email - User email
 * @returns JWT token
 */
export const generateAccessToken = (
  userId: string,
  role: string,
  email: string
): string => {
  return jwt.sign(
    { userId, role, email },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

/**
 * Generate JWT refresh token
 * @param userId - User ID
 * @returns JWT token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

/**
 * Verify and decode access token
 * @param token - JWT token
 * @returns Decoded payload { userId, role, email, iat, exp }
 * @throws Error if token invalid or expired
 */
export const verifyAccessToken = (
  token: string
): { userId: string; role: string; email: string; iat: number; exp: number } => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
};

/**
 * Verify and decode refresh token
 * @param token - JWT token
 * @returns Decoded payload { userId, iat, exp }
 * @throws Error if token invalid or expired
 */
export const verifyRefreshToken = (
  token: string
): { userId: string; iat: number; exp: number } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
};