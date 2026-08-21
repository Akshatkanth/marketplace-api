import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Product } from "./Product";


/**
 * CATEGORY ENTITY
 * 
 * Product categories (Electronics, Clothing, Books, etc.)
 * 
 * This is a simple lookup table
 */
@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * CATEGORY NAME
   * 
   * unique: true = no duplicate categories
   * Example: "Electronics", "Clothing", "Books"
   */
  @Column({ type: "varchar", length: 100, unique: true })
  name!: string;

  /**
   * SLUG FOR URLs
   * 
   * Human-readable URL format
   * "Electronics" -> "electronics"
   * Used in URLs like /categories/electronics
   */
  @Column({ type: "varchar", length: 100, unique: true })
  slug!: string;

  /**
   * CATEGORY DESCRIPTION
   */
  @Column({ type: "text", nullable: true })
  description?: string | null;

  /**
   * DISPLAY IMAGE
   */
  @Column({ type: "varchar", length: 500, nullable: true })
  image?: string | null;

  /**
   * IS CATEGORY ACTIVE?
   */
  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * ONE CATEGORY HAS MANY PRODUCTS
   * 
   * Example: "Electronics" category has iPhone, Laptop, Headphones
   * 
   * This means products table will have a "categoryId" foreign key
   */
  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}