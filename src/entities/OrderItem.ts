import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

/**
 * ORDERITEM ENTITY
 * 
 * JUNCTION TABLE - Connects Orders to Products
 * 
 * Example:
 * Order #123 contains:
 *   OrderItem #1: iPhone 14 (qty: 1, price: 100000)
 *   OrderItem #2: AirPods (qty: 2, price: 20000 each)
 *   OrderItem #3: USB Cable (qty: 3, price: 500 each)
 * 
 * Why junction table?
 * - One order has many products
 * - One product appears in many orders
 * - This is Many-to-Many relationship (solved with junction table)
 */
@Entity("order_items")
@Index(["orderId"])
@Index(["productId"])
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * FOREIGN KEY: ORDER
   * 
   * Which order does this item belong to?
   * Many items belong to one order
   */
  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: "CASCADE", // If order deleted, delete items too
  })
  @JoinColumn({ name: "orderId" })
  order!: Order;

  @Column()
  orderId!: string;

  /**
   * FOREIGN KEY: PRODUCT
   * 
   * Which product is being ordered?
   * Many order items can reference same product (different orders)
   */
  @ManyToOne(() => Product, (product) => product.orderItems, {
    onDelete: "SET NULL", // If product deleted, item still has record
    eager: true, // Load product info when fetching item
  })
  @JoinColumn({ name: "productId" })
  product!: Product;

  @Column({ nullable: true })
  productId?: string | null;

  /**
   * QUANTITY
   * 
   * How many units of this product in this order?
   * Example: 2 iPhones, 3 cables
   */
  @Column({ type: "int", default: 1 })
  quantity!: number;

  /**
   * PRICE AT TIME OF PURCHASE
   * 
   * IMPORTANT: Store the price here, not reference Product.price
   * 
   * Why?
   * Product price might change later (50 -> 60)
   * But this order was placed when price was 50
   * If we only store productId, historical data is wrong
   * 
   * Example:
   * - Oct 2024: iPhone costs $100, customer buys, we save 100 in OrderItem
   * - Nov 2024: iPhone costs $120
   * - Still, customer paid $100 (correct!)
   * 
   * This is called "denormalization" - copying data for performance/accuracy
   */
  @Column({ type: "decimal", precision: 10, scale: 2 })
  priceAtPurchase!: number;

  /**
   * SUBTOTAL FOR THIS ITEM
   * 
   * quantity × priceAtPurchase
   * Example: 2 iPhones × $100 = $200
   * 
   * Stored separately for quick calculations
   * Could be calculated, but storing improves query performance
   */
  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal!: number;

  /**
   * DISCOUNT ON THIS ITEM
   * 
   * Item-specific discount
   */
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discount!: number;

  /**
   * FINAL PRICE FOR THIS ITEM
   * 
   * subtotal - discount
   */
  @Column({ type: "decimal", precision: 12, scale: 2 })
  finalPrice!: number;

  @CreateDateColumn()
  createdAt!: Date;
}

