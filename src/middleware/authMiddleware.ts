import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';
import { ApiError } from './errorHandler';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email: string;
      };
    }
  }
}

/**
 * Verify JWT token and attach user to request
 * Expects: Authorization: Bearer <token>
 */
export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    // Check if header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header');
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.slice(7);

    // Verify and decode token
    const decoded = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    // JWT errors (expired, invalid signature, etc.)
    if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

/**
 * Check if user has required role
 * Usage: app.post('/admin', requireRole('ADMIN'), controller)
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (req.user.role !== requiredRole) {
      return next(
        new ApiError(403, `This action requires ${requiredRole} role`)
      );
    }

    next();
  };
};