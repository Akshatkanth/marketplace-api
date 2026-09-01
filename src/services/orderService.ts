import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { CartItem } from '../entities/CartItem';
import { ApiError } from '../middleware/errorHandler';
import { Decimal } from 'decimal.js';
import { logger } from '../utils/logger';
import { CartService } from './cartService';

/**
 * Order creation request payload
 */
interface CreateOrderRequest {
  shippingAddress: string;
  billingAddress: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  notes?: string;
}

export class OrderService {
  private orderRepo = AppDataSource.getRepository(Order);
  private orderItemRepo = AppDataSource.getRepository(OrderItem);
  private cartItemRepo = AppDataSource.getRepository(CartItem);
  private productRepo = AppDataSource.getRepository(Product);
  private userRepo = AppDataSource.getRepository(User);
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  /**
   * Create order from user's cart
   * Flow:
   * 1. Get user's cart items
   * 2. Validate cart not empty
   * 3. Validate all products in stock
   * 4. Create Order with PENDING status
   * 5. Create OrderItems from CartItems (with price snapshot)
   * 6. Reduce product stock
   * 7. Mock payment (set paymentStatus to COMPLETED)
   * 8. Clear user's cart
   * 9. Return order with items
   *
   * @param userId - User ID placing order
   * @param orderData - Shipping address, billing address, payment method
   * @returns Created Order with OrderItems
   */
  async createOrder(
    userId: string,
    orderData: CreateOrderRequest
  ): Promise<Order> {
    // Get user's cart
    const cartSummary = await this.cartService.getCart(userId);

    // Validate cart not empty
    if (cartSummary.items.length === 0) {
      throw new ApiError(400, 'Cannot checkout with empty cart');
    }

    // Validate all products still in stock (double-check)
    for (const cartItem of cartSummary.items) {
      const product = await this.productRepo.findOne({
        where: { id: cartItem.productId },
      });

      if (!product) {
        throw new ApiError(404, `Product ${cartItem.productId} no longer exists`);
      }

      if (product.stock < cartItem.quantity) {
        throw new ApiError(
          400,
          `${product.name}: Only ${product.stock} in stock, you have ${cartItem.quantity} in cart`
        );
      }
    }

    // Start database transaction (all or nothing)
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create Order
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order = this.orderRepo.create({
        userId,
        orderNumber,
        status: 'PENDING',
        totalAmount: cartSummary.subtotal,
        discountAmount: new Decimal(0), // No discount in Phase 3
        taxAmount: cartSummary.tax,
        shippingCost: cartSummary.shipping,
        finalTotal: cartSummary.grandTotal,
        paymentStatus: 'PENDING',
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        notes: orderData.notes || '',
      });

      const savedOrder = await queryRunner.manager.save(order);

      logger.info('Order created', { orderId: savedOrder.id, userId });

      // Create OrderItems from CartItems
      const orderItems: OrderItem[] = [];

      for (const cartItem of cartSummary.items) {
        const orderItem = this.orderItemRepo.create({
          orderId: savedOrder.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          priceAtPurchase: cartItem.priceAtCartTime,
          subtotal: new Decimal(cartItem.quantity).times(cartItem.priceAtCartTime),
          discount: new Decimal(0), // No item-level discount in Phase 3
          finalPrice: new Decimal(cartItem.quantity).times(cartItem.priceAtCartTime),
        });

        const savedOrderItem = await queryRunner.manager.save(orderItem);
        orderItems.push(savedOrderItem);

        // Reduce product stock
        await queryRunner.manager.update(
          Product,
          { id: cartItem.productId },
          {
            stock: () => `stock - ${cartItem.quantity}`,
          }
        );

        logger.info('OrderItem created & stock reduced', {
          orderId: savedOrder.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
        });
      }

      // Mock payment: Set to COMPLETED
      savedOrder.paymentStatus = 'COMPLETED';
      savedOrder.status = 'CONFIRMED'; // Auto-confirm after payment
      const finalOrder = await queryRunner.manager.save(savedOrder);

      logger.info('Mock payment processed, order confirmed', {
        orderId: finalOrder.id,
      });

      // Clear user's cart
      await queryRunner.manager.delete(CartItem, { userId });

      logger.info('Cart cleared after checkout', { userId });

      // Commit transaction
      await queryRunner.commitTransaction();

      // Reload order with items and user
      const completeOrder = await this.orderRepo.findOne({
        where: { id: finalOrder.id },
        relations: ['user', 'orderItems', 'orderItems.product'],
      });

      return completeOrder!;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      logger.error('Order creation failed, rolled back', { userId, error });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get user's orders (paginated)
   *
   * @param userId - User ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Orders + pagination metadata
   */
  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Order[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepo.findAndCount({
      where: { userId },
      relations: ['orderItems', 'orderItems.product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: orders,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single order details
   * Authorization: User can only view their own order
   *
   * @param orderId - Order ID
   * @param userId - User ID (for authorization)
   * @returns Order with items
   */
  async getOrderById(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Authorize: User can only view their own order (unless admin)
    if (order.userId !== userId) {
      throw new ApiError(403, 'Cannot view another user\'s order');
    }

    return order;
  }

  /**
   * Admin: Get all orders (no user restriction)
   *
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Orders + pagination metadata
   */
  async getAllOrders(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Order[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepo.findAndCount({
      relations: ['user', 'orderItems', 'orderItems.product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: orders,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update order status (admin only)
   * Valid transitions:
   * PENDING → CONFIRMED → SHIPPED → DELIVERED → COMPLETED
   *
   * @param orderId - Order ID
   * @param newStatus - New status
   * @returns Updated Order
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Validate status transition (simple validation)
    const validTransitions: { [key: string]: string[] } = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status].includes(newStatus)) {
      throw new ApiError(
        400,
        `Cannot transition from ${order.status} to ${newStatus}`
      );
    }

    order.status = newStatus;
    const updated = await this.orderRepo.save(order);

    logger.info('Order status updated', { orderId, oldStatus: order.status, newStatus });

    return updated;
  }

  /**
   * Get order items for specific order
   *
   * @param orderId - Order ID
   * @param userId - User ID (for authorization)
   * @returns Array of OrderItems
   */
  async getOrderItems(orderId: string, userId: string): Promise<OrderItem[]> {
    // Verify user owns this order
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new ApiError(403, 'Cannot view another user\'s order');
    }

    // Get order items
    const items = await this.orderItemRepo.find({
      where: { orderId },
      relations: ['product'],
    });

    return items;
  }
}