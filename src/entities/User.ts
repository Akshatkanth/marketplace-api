import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";


@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid") //user id -> unique, primary key
    id!: string;

    @Column({type: "varchar", length:255, unique:true}) //user email
    email!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    fullName?: string | null;

    @Column({type: "varchar", length: 255}) //user password -> will be hashed by bcrypt - 2rounds
    password!: string; 

    //user role -> enum[means only specific values allowed]

    @Column({
    type: "enum",
    enum: ["BUYER", "SELLER", "ADMIN"],
    default: "BUYER",
    })
    role!: "BUYER" | "SELLER" | "ADMIN";

    //seller details :
    @Column({ type: "varchar", length: 255, nullable: true })
    storeName?: string | null;

    //account status : 
    @Column({ type: "boolean", default: true })
    isActive!: boolean;

    
    // PROFILE PICTURE URL :
    @Column({ type: "varchar", length: 500, nullable: true })
    profilePicture?: string | null;

    // phone number
    @Column({ type: "varchar", length: 20, nullable: true })
    phone?: string | null;


    //address
    @Column({ type: "text", nullable: true })
    address?: string | null;


    /**
   * CITY
   */
    @Column({ type: "varchar", length: 100, nullable: true })
    city?: string | null;

  /**
   * STATE
   */
    @Column({ type: "varchar", length: 100, nullable: true })
    state?: string | null;

  /**
   * POSTAL CODE
   */
    @Column({ type: "varchar", length: 20, nullable: true })
    postalCode?: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    /**
   * RELATIONSHIPS
   * 
   * @OneToMany means: One user can have many orders
   * orders: Order[] = a user has multiple orders
   * (order) => order.user = back-reference (Order entity has a 'user' field)
   * 
   * This creates a relationship in the database through foreign keys
   */
  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  /**
   * ONE USER CAN SELL MULTIPLE PRODUCTS
   * 
   * If user is a SELLER, they have multiple products
   */
  @OneToMany(() => Product, (product) => product.seller)
  products!: Product[];
}


