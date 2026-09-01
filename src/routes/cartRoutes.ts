import { Router, Request, Response, NextFunction } from 'express';
import { CartController } from '../controllers/cartController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  cartAddItemSchema,
  cartUpdateItemSchema,
} from '../utils/validators';

const router = Router();
const cartController = new CartController();

/**
 * All cart routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /api/cart/items
 * Add product to cart
 * Body: { productId, quantity }
 */
router.post(
  '/items',
  validateRequest(cartAddItemSchema),
  (req: Request, res: Response, next: NextFunction) =>
    cartController.addToCart(req, res, next)
);

/**
 * GET /api/cart
 * Get user's cart with all items and totals
 */
router.get('/', (req: Request, res: Response, next: NextFunction) =>
  cartController.getCart(req, res, next)
);

/**
 * PUT /api/cart/items/:itemId
 * Update quantity of item in cart
 * Body: { quantity }
 */
router.put(
  '/items/:itemId',
  validateRequest(cartUpdateItemSchema),
  (req: Request, res: Response, next: NextFunction) =>
    cartController.updateCartItem(req, res, next)
);

/**
 * DELETE /api/cart/items/:itemId
 * Remove item from cart
 */
router.delete(
  '/items/:itemId',
  (req: Request, res: Response, next: NextFunction) =>
    cartController.removeFromCart(req, res, next)
);

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', (req: Request, res: Response, next: NextFunction) =>
  cartController.clearCart(req, res, next)
);

export default router;