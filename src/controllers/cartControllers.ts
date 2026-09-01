import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService';
import { logger } from '../utils/logger';

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  /**
   * Add product to cart (or increment quantity if already there)
   * POST /api/cart/items
   * Body: { productId, quantity }
   */
  async addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { productId, quantity } = req.body;

      logger.info('Add to cart request', { userId, productId, quantity });

      const cartItem = await this.cartService.addToCart(
        userId,
        productId,
        quantity
      );

      res.status(201).json({
        success: true,
        message: 'Product added to cart',
        data: {
          cartItem,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's cart with all items and totals
   * GET /api/cart
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      logger.info('Get cart request', { userId });

      const cartSummary = await this.cartService.getCart(userId);

      res.status(200).json({
        success: true,
        message: 'Cart retrieved',
        data: {
          cart: cartSummary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update quantity of item in cart
   * PUT /api/cart/items/:itemId
   * Body: { quantity }
   */
  async updateCartItem(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { itemId } = req.params;
      const { quantity } = req.body;

      logger.info('Update cart item request', { userId, itemId, quantity });

      const cartItem = await this.cartService.updateCartItemQuantity(
        userId,
        itemId,
        quantity
      );

      res.status(200).json({
        success: true,
        message: 'Cart item updated',
        data: {
          cartItem,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove item from cart
   * DELETE /api/cart/items/:itemId
   */
  async removeFromCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { itemId } = req.params;

      logger.info('Remove from cart request', { userId, itemId });

      await this.cartService.removeFromCart(userId, itemId);

      res.status(200).json({
        success: true,
        message: 'Item removed from cart',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear entire cart
   * DELETE /api/cart
   */
  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      logger.info('Clear cart request', { userId });

      await this.cartService.clearCart(userId);

      res.status(200).json({
        success: true,
        message: 'Cart cleared',
      });
    } catch (error) {
      next(error);
    }
  }
}