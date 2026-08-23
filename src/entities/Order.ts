import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { OrderItem } from "./OrderItem";

/**
 * ORDER ENTITY
 * 
 * Represents a customer's order
 * An order can contain multiple products (via OrderItem)
 * 
 * Example:
 * Order #123 by John Doe:
 *   - iPhone 14 (qty: 1)
 *   - Apple AirPods (qty: 2)
 *   - USB Cable (qty: 3)
 */
@Entity("orders")
@Index(["userId"])
@Index(["status"])
@Index(["createdAt"])
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * ORDER NUMBER
   * 
   * Human-readable order number (e.g., "ORD-2024-001")
   * Used for customer reference, not database lookup
   */
  @Column({ type: "varchar", length: 50, unique: true })
  orderNumber!: string;

  /**
   * FOREIGN KEY: BUYER (User)
   * 
   * Which user placed this order
   * Many orders belong to one user
   */

  /**
   * FOREIGN KEY: BUYER (User)
   * 
   * Which user placed this order
   * Many orders belong to one user
   */
  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  /**
   * ORDER STATUS
   * 
   * Enum for status progression:
   * PENDING -> CONFIRMED -> SHIPPED -> DELIVERED -> COMPLETED
   * CANCELLED (can happen at any point)
   * 
   * Why enum?
   * - Only valid statuses allowed
   * - Prevents invalid status like "LOST" or "SHIPPED_LOST"
   * - Can write queries: WHERE status = 'SHIPPED'
   */
  @Column({
    type: "enum",
    enum: [
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
    default: "PENDING",
  })
  status!:
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELLED";

    /**
   * TOTAL AMOUNT
   * 
   * Sum of all items in the order
   * Calculated when order is created
   * decimal like price
   */
  @Column({ type: "decimal", precision: 12, scale: 2 })
  totalAmount!: number;

  /**
   * DISCOUNT AMOUNT
   * 
   * How much discount was applied
   */
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discountAmount!: number;

  /**
   * TAX AMOUNT
   * 
   * Tax/VAT applied to order
   */
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  taxAmount!: number;

  /**
   * SHIPPING COST
   */
  @Column({ type: "decimal", precision: 8, scale: 2, default: 0 })
  shippingCost!: number;

  /**
   * FINAL TOTAL
   * 
   * totalAmount - discount + tax + shipping
   */
  @Column({ type: "decimal", precision: 12, scale: 2 })
  finalTotal!: number;

  /**
   * PAYMENT STATUS
   * 
   * Has payment been received?
   * PENDING -> COMPLETED -> REFUNDED
   */
  @Column({
    type: "enum",
    enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
    default: "PENDING",
  })
  paymentStatus!: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

  /**
   * PAYMENT METHOD
   * 
   * How was it paid?
   * CREDIT_CARD, DEBIT_CARD, WALLET, UPI, NET_BANKING
   */
  @Column({
    type: "enum",
    enum: [
      "CREDIT_CARD",
      "DEBIT_CARD",
      "WALLET",
      "UPI",
      "NET_BANKING",
      "CASH_ON_DELIVERY",
    ],
    default: "CREDIT_CARD",
  })
  paymentMethod!:
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "WALLET"
    | "UPI"
    | "NET_BANKING"
    | "CASH_ON_DELIVERY";

  /**
   * SHIPPING ADDRESS
   */
  @Column({ type: "text" })
  shippingAddress!: string;

  /**
   * BILLING ADDRESS
   * 
   * nullable: true because might be same as shipping
   */
  @Column({ type: "text", nullable: true })
  billingAddress?: string | null;

  /**
   * NOTES/COMMENTS
   * 
   * Customer delivery instructions
   */
  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * ONE ORDER HAS MANY ITEMS
   * 
   * Through OrderItem table (junction table)
   * An order contains multiple products with quantities
   */
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    eager: true, // Load all items when fetching order
  })
  items!: OrderItem[];
}

