import { AppDataSource } from '../config/database';
import { CartItem } from '../entities/CartItem';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { ApiError } from '../middleware/errorHandler';
import { Decimal } from 'decimal.js';
import { logger } from '../utils/logger';

interface CartSummary {
  items: CartItem[];
  itemCount: number; // Total number of items
  subtotal: Decimal; // Sum of all item prices
  tax: Decimal; // 10% of subtotal
  shipping: Decimal; // Fixed $10 or free if > $50
  grandTotal: Decimal; // subtotal + tax + shipping
}


export class CartService {
  private cartRepo = AppDataSource.getRepository(CartItem);
  private productRepo = AppDataSource.getRepository(Product);
  private userRepo = AppDataSource.getRepository(User);
  async addToCart(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<CartItem> {
    // Validate quantity
    if (quantity <= 0) {
      throw new ApiError(400, 'Quantity must be at least 1');
    }

    // Check if product exists and is in stock
    const product = await this.productRepo.findOne({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found or is inactive');
    }

    if (product.stock < quantity) {
      throw new ApiError(
        400,
        `Only ${product.stock} item(s) in stock, requested ${quantity}`
      );
    }

    // Check if product already in user's cart
    let cartItem = await this.cartRepo.findOne({
      where: { userId, productId },
    });

    if (cartItem) {
      // Product already in cart: increment quantity
      const newQuantity = cartItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new ApiError(
          400,
          `Only ${product.stock} item(s) in stock, you already have ${cartItem.quantity}, requested to add ${quantity} more`
        );
      }

      cartItem.quantity = newQuantity;
      cartItem = await this.cartRepo.save(cartItem);

      logger.info('Cart item quantity updated', {
        userId,
        productId,
        newQuantity,
      });
    } else {
      // Product not in cart: create new CartItem
      cartItem = this.cartRepo.create({
        userId,
        productId,
        quantity,
        priceAtCartTime: product.price, // Snapshot price
        product, // Eager load product
      });

      cartItem = await this.cartRepo.save(cartItem);

      logger.info('Item added to cart', { userId, productId, quantity });
    }

    // Reload with product eager loaded
    return this.cartRepo.findOneOrFail({
      where: { id: cartItem.id },
      relations: ['product'],
    });
  }

  /**
   * Update quantity of item in cart
   *
   * @param userId - User ID (for authorization)
   * @param cartItemId - CartItem ID to update
   * @param newQuantity - New quantity
   * @returns Updated CartItem
   */
  async updateCartItemQuantity(
    userId: string,
    cartItemId: string,
    newQuantity: number
  ): Promise<CartItem> {
    // Validate quantity
    if (newQuantity <= 0) {
      throw new ApiError(400, 'Quantity must be at least 1');
    }

    // Find CartItem
    const cartItem = await this.cartRepo.findOne({
      where: { id: cartItemId },
      relations: ['product'],
    });

    if (!cartItem) {
      throw new ApiError(404, 'Cart item not found');
    }

    // Authorize: user can only update their own cart
    if (cartItem.userId !== userId) {
      throw new ApiError(403, 'Cannot modify another user\'s cart');
    }

    // Check stock
    if (cartItem.product.stock < newQuantity) {
      throw new ApiError(
        400,
        `Only ${cartItem.product.stock} item(s) in stock`
      );
    }

    // Update quantity
    cartItem.quantity = newQuantity;
    const updated = await this.cartRepo.save(cartItem);

    logger.info('Cart item quantity updated', {
      userId,
      cartItemId,
      newQuantity,
    });

    return updated;
  }

  /**
   * Remove item from cart
   *
   * @param userId - User ID (for authorization)
   * @param cartItemId - CartItem ID to remove
   */
  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    // Find CartItem
    const cartItem = await this.cartRepo.findOne({
      where: { id: cartItemId },
    });

    if (!cartItem) {
      throw new ApiError(404, 'Cart item not found');
    }

    // Authorize: user can only remove from their own cart
    if (cartItem.userId !== userId) {
      throw new ApiError(403, 'Cannot modify another user\'s cart');
    }

    // Delete
    await this.cartRepo.remove(cartItem);

    logger.info('Item removed from cart', { userId, cartItemId });
  }

  /**
   * Get user's cart with summary (items + totals)
   *
   * @param userId - User ID
   * @returns CartSummary with items and calculated totals
   */
  async getCart(userId: string): Promise<CartSummary> {
    // Get all cart items for user
    const items = await this.cartRepo.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'ASC' },
    });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = new Decimal(item.quantity).times(
        item.priceAtCartTime
      );
      return sum.plus(lineTotal);
    }, new Decimal(0));

    // Tax: 10% of subtotal
    const tax = subtotal.times(0.1);

    // Shipping: $10 flat, free if subtotal > $50
    const shipping = subtotal.greaterThan(50) ? new Decimal(0) : new Decimal(10);

    // Grand total
    const grandTotal = subtotal.plus(tax).plus(shipping);

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax,
      shipping,
      grandTotal,
    };
  }

  /**
   * Clear entire cart (delete all items for user)
   *
   * @param userId - User ID
   */
  async clearCart(userId: string): Promise<void> {
    await this.cartRepo.delete({ userId });

    logger.info('Cart cleared', { userId });
  }

  /**
   * Check if product exists in user's cart
   * (Useful for validating before checkout)
   *
   * @param userId - User ID
   * @param productId - Product ID
   * @returns true if in cart, false otherwise
   */
  async isProductInCart(userId: string, productId: string): Promise<boolean> {
    const count = await this.cartRepo.count({
      where: { userId, productId },
    });

    return count > 0;
  }
}