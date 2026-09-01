import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { logger } from '../utils/logger';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Create order from cart (checkout)
   * POST /api/orders
   * Body: { shippingAddress, billingAddress, paymentMethod, notes? }
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

      logger.info('Create order request', { userId });

      const order = await this.orderService.createOrder(userId, {
        shippingAddress,
        billingAddress,
        paymentMethod,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's orders
   * GET /api/orders?page=1&limit=10
   */
  async getUserOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      logger.info('Get user orders request', { userId, page, limit });

      const result = await this.orderService.getUserOrders(userId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Orders retrieved',
        data: {
          orders: result.data,
        },
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single order details
   * GET /api/orders/:orderId
   */
  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { orderId } = req.params;

      logger.info('Get order request', { userId, orderId });

      const order = await this.orderService.getOrderById(orderId, userId);

      res.status(200).json({
        success: true,
        message: 'Order retrieved',
        data: {
          order,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order items (admin + user can see own order items)
   * GET /api/orders/:orderId/items
   */
  async getOrderItems(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { orderId } = req.params;

      logger.info('Get order items request', { userId, orderId });

      const items = await this.orderService.getOrderItems(orderId, userId);

      res.status(200).json({
        success: true,
        message: 'Order items retrieved',
        data: {
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Get all orders
   * GET /api/admin/orders?page=1&limit=10
   */
  async getAllOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      logger.info('Get all orders request (admin)', { page, limit });

      const result = await this.orderService.getAllOrders(page, limit);

      res.status(200).json({
        success: true,
        message: 'All orders retrieved',
        data: {
          orders: result.data,
        },
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ADMIN: Update order status
   * PUT /api/admin/orders/:orderId/status
   * Body: { status }
   */
  async updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      logger.info('Update order status request (admin)', { orderId, status });

      const order = await this.orderService.updateOrderStatus(orderId, status);

      res.status(200).json({
        success: true,
        message: 'Order status updated',
        data: {
          order,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}