import { Request, Response, NextFunction } from 'express';
import { generateAccessToken, generateRefreshToken } from '../utils/auth';
import { UserService } from '../services/userService';
import { logger } from '../utils/logger';

/**
 * Simple in-memory token blacklist for logout
 * In production: Use Redis
 * Format: Set of refresh tokens that are invalidated
 */
const tokenBlacklist = new Set<string>();

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Register: Create user + return access & refresh tokens
   * POST /api/auth/register
   * Body: { email, password, fullName, role }
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName, role } = req.body;

      logger.info('User registration attempt', { email });

      // Register user (service handles hashing)
      const user = await this.userService.registerUser({
        email,
        password,
        fullName,
        role: role || 'BUYER',
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.role, user.email);
      const refreshToken = generateRefreshToken(user.id);

      logger.info('User registered successfully', { userId: user.id, email });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login: Verify credentials + return access & refresh tokens
   * POST /api/auth/login
   * Body: { email, password }
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      logger.info('User login attempt', { email });

      // Authenticate user (service compares passwords)
      const user = await this.userService.authenticateUser(email, password);

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.role, user.email);
      const refreshToken = generateRefreshToken(user.id);

      logger.info('User logged in successfully', { userId: user.id, email });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh: Get new access token using refresh token
   * POST /api/auth/refresh
   * Body: { refreshToken }
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Check if token is blacklisted
      if (tokenBlacklist.has(refreshToken)) {
        logger.warn('Attempt to use blacklisted refresh token');
        throw new Error('Refresh token is invalid or expired');
      }

      logger.info('Token refresh attempt');

      // Verify refresh token (throws if invalid/expired)
      const decoded = require('../utils/auth').verifyRefreshToken(refreshToken);

      // Get user to fetch current data
      const user = await this.userService.getUserById(decoded.userId);

      // Generate new access token
      const newAccessToken = generateAccessToken(user.id, user.role, user.email);

      logger.info('Token refreshed successfully', { userId: user.id });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return next(new (require('../middleware/errorHandler').ApiError)(401, 'Refresh token expired'));
      }
      next(error);
    }
  }

  /**
   * Logout: Invalidate refresh token
   * POST /api/auth/logout
   * Body: { refreshToken }
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new (require('../middleware/errorHandler').ApiError)(400, 'Refresh token required');
      }

      // Add token to blacklist
      tokenBlacklist.add(refreshToken);

      logger.info('User logged out', { userId: req.user?.userId });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile (requires auth)
   * GET /api/auth/me
   * Headers: Authorization: Bearer <token>
   */
  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new (require('../middleware/errorHandler').ApiError)(401, 'Not authenticated');
      }

      const user = await this.userService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Current user fetched',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            phone: user.phone,
            address: user.address,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}