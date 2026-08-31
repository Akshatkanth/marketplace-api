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
import { Category } from "./Category";
import { OrderItem } from "./OrderItem";
import { CartItem } from "./CartItem";

@Entity("products")
@Index(["categoryId"])
@Index(["sellerId"])
@Index(["isActive"])

export class Product{
    @PrimaryGeneratedColumn("uuid")
    id!: string;


    //product name
    @Column({ type:"varchar", length:255})
    name!: string;

    //product slug
    @Column({ type: "varchar", length: 255, unique: true })
    slug!: string;

    //product description
    @Column({type:"text"})
    description!: string;

    //price
    @Column({ type: "decimal", precision: 10, scale: 2 })
    price!: number;

          /**
   * ORIGINAL PRICE (before discount)
   * 
   * Used for showing discount percentage
   * If originalPrice = 100, price = 80, then 20% discount
   */
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  originalPrice?: number | null;

  /**
   * INVENTORY/STOCK
   * 
   * How many units available
   * Decreases when order is placed
   */
  @Column({ type: "int", default: 0 })
  stock!: number;

  /**
   * PRODUCT RATING
   * 
   * Average rating (1-5 stars)
   * Calculated from reviews
   */
  @Column({ type: "decimal", precision: 2, scale: 1, default: 0 })
  rating!: number;


     /**
   * NUMBER OF REVIEWS
   * 
   * How many reviews this product has
   * Used to show credibility
   */
  @Column({ type: "int", default: 0 })
  reviewCount!: number;

  /**
   * PRODUCT IMAGE URL
   * 
   * Main image for product listing
   * In production, you'd use a proper image service (S3, Cloudinary)
   */
  @Column({ type: "varchar", length: 500 })
  image!: string;

  /**
   * GALLERY IMAGES
   * 
   * Multiple product images stored as JSON array
   * Example: ["img1.jpg", "img2.jpg", "img3.jpg"]
   * 
   * Why JSON in SQL?
   * Quick solution, but in a real system you'd have a separate images table
   * for better scalability
   */
  @Column({ type: "simple-array", nullable: true })
  images?: string[] | null;

  /**
   * IS PRODUCT ACTIVE?
   * 
   * Sellers can deactivate products without deleting them
   * This is called "soft delete" - data stays but hidden
   */
  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * FOREIGN KEY: CATEGORY
   * 
   * @ManyToOne means: Many products belong to one category
   * 
   * This creates a "categoryId" column in products table
   * pointing to the categories table
   */
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "SET NULL", // If category is deleted, set to NULL
    eager: true, // Always load category when fetching product
  })
  @JoinColumn({ name: "categoryId" })
  category!: Category;

  @Column()
  categoryId!: string;

  /**
   * FOREIGN KEY: SELLER (User)
   * 
   * @ManyToOne means: Many products belong to one seller
   * 
   * This creates a "sellerId" column pointing to users table
   * Only users with role="SELLER" should have products
   */
  @ManyToOne(() => User, (user) => user.products, {
    onDelete: "CASCADE", // If seller deleted, delete their products
    eager: true, // Always load seller info
  })
  @JoinColumn({ name: "sellerId" })
  seller!: User;

  @Column()
  sellerId!: string;

  /**
   * ONE PRODUCT CAN BE IN MANY ORDERS
   * 
   * Through OrderItem junction table
   * When a customer buys a product, OrderItem links the order to the product
   */
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems!: OrderItem[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems!: CartItem[];
}




