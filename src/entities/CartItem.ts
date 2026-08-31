import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Product } from './Product';

/**
 * CartItem: Junction table for User + Product shopping cart
 *
 * Represents a single item (product + quantity) in a user's shopping cart.
 * Stores a price snapshot so if product price changes, cart keeps the old price.
 */
@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Product, (product) => product.cartItems, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column()
  productId!: string;

  @Column('int', { default: 1 })
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceAtCartTime!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}