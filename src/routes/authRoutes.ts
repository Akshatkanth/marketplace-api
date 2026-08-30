import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  authRegisterSchema,
  authLoginSchema,
  authRefreshSchema,
} from '../utils/validators';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, password, fullName, role? }
 */
router.post(
  '/register',
  validateRequest(authRegisterSchema),
  (req: Request, res: Response, next: NextFunction) =>
    authController.register(req, res, next)
);

/**
 * POST /api/auth/login
 * Login with email and password
 * Body: { email, password }
 */
router.post(
  '/login',
  validateRequest(authLoginSchema),
  (req: Request, res: Response, next: NextFunction) =>
    authController.login(req, res, next)
);

/**
 * POST /api/auth/refresh
 * Get new access token using refresh token
 * Body: { refreshToken }
 */
router.post(
  '/refresh',
  validateRequest(authRefreshSchema),
  (req: Request, res: Response, next: NextFunction) =>
    authController.refresh(req, res, next)
);

/**
 * POST /api/auth/logout
 * Invalidate refresh token
 * Body: { refreshToken }
 */
router.post(
  '/logout',
  validateRequest(authRefreshSchema),
  (req: Request, res: Response, next: NextFunction) =>
    authController.logout(req, res, next)
);

/**
 * GET /api/auth/me
 * Get current user profile (requires auth)
 * Headers: Authorization: Bearer <access_token>
 */
router.get(
  '/me',
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    authController.getCurrentUser(req, res, next)
);

export default router;