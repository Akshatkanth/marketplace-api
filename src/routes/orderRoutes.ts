import { Router, Request, Response, NextFunction } from 'express';
import { OrderController } from '../controllers/orderController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  orderCreateSchema,
  orderUpdateStatusSchema,
} from '../utils/validators';

const router = Router();
const orderController = new OrderController();

/**
 * All order routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /api/orders
 * Create order from cart (checkout)
 * Body: { shippingAddress, billingAddress, paymentMethod, notes? }
 */
router.post(
  '/',
  validateRequest(orderCreateSchema),
  (req: Request, res: Response, next: NextFunction) =>
    orderController.createOrder(req, res, next)
);

/**
 * GET /api/orders
 * Get user's orders (paginated)
 */
router.get('/', (req: Request, res: Response, next: NextFunction) =>
  orderController.getUserOrders(req, res, next)
);

/**
 * GET /api/orders/:orderId
 * Get single order details
 */
router.get('/:orderId', (req: Request, res: Response, next: NextFunction) =>
  orderController.getOrder(req, res, next)
);

/**
 * GET /api/orders/:orderId/items
 * Get items in specific order
 */
router.get(
  '/:orderId/items',
  (req: Request, res: Response, next: NextFunction) =>
    orderController.getOrderItems(req, res, next)
);

/**
 * ADMIN ROUTES
 */

/**
 * GET /api/admin/orders
 * Get all orders (admin only)
 */
router.get(
  '/admin/all',
  requireRole('ADMIN'),
  (req: Request, res: Response, next: NextFunction) =>
    orderController.getAllOrders(req, res, next)
);

/**
 * PUT /api/admin/orders/:orderId/status
 * Update order status (admin only)
 * Body: { status }
 */
router.put(
  '/admin/:orderId/status',
  requireRole('ADMIN'),
  validateRequest(orderUpdateStatusSchema),
  (req: Request, res: Response, next: NextFunction) =>
    orderController.updateOrderStatus(req, res, next)
);

export default router;