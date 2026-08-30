import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { User } from "../entities";
import { ApiError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import { hashPassword, comparePassword } from '../utils/auth';
import { ApiError } from '../middleware/errorHandler';

export class UserService {
  /**
   * Repository Pattern
   * 
   * TypeORM repository = database access object for a specific entity
   * Think of it as: "All database operations for User go here"
   * 
   * Methods: save(), find(), findOne(), delete(), update(), etc.
   */
  private userRepository: Repository<User> = AppDataSource.getRepository(User);


  async registerUser(userData: {
  email: string;
  password: string;
  fullName: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
}): Promise<User> {
  const userRepo = AppDataSource.getRepository(User);

  // Check if email already exists
  const existingUser = await userRepo.findOne({ where: { email: userData.email } });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create and save user
  const user = userRepo.create({
    email: userData.email,
    password: hashedPassword,
    fullName: userData.fullName,
    role: userData.role,
    isActive: true,
  });

  return userRepo.save(user);
}

/**
 * Authenticate user (verify email and password)
 */
async authenticateUser(
  email: string,
  password: string
): Promise<User> {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return user;
}

/**
 * Find user by ID
 */
async getUserById(userId: string): Promise<User> {
  const userRepo = AppDataSource.getRepository(User);
  
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
}


  /**
   * CREATE USER
   * 
   * @param userData - User data to create
   * @returns Created user (without password)
   */

    async createUser(userData: {
    email: string;
    password: string;
    fullName: string;
    role: "BUYER" | "SELLER" | "ADMIN";
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new ApiError(
          409, // 409 = Conflict
          "User with this email already exists",
          { email: userData.email }
        );
      }


            // Create new user entity
      const user = new User();
      user.id = uuidv4(); // Generate UUID
      user.email = userData.email;
      
      /**
       * PASSWORD HASHING
       * 
       * NEVER store plain passwords!
       * 
       * We'll use bcrypt in Phase 2 for this
       * For now, we'll hash it simply (not production ready)
       * 
       * In production:
       * - Hash password with bcrypt (slow, resistant to brute force)
       * - Never store plain password
       * - Compare hashed password during login
       */
      user.password = userData.password; // TODO: Hash with bcrypt in Phase 2
      user.fullName = userData.fullName;
      user.role = userData.role;
      user.phone = userData.phone;
      user.address = userData.address;
      user.city = userData.city;
      user.state = userData.state;
      user.postalCode = userData.postalCode;
      user.isActive = true;

      // Save to database
      const savedUser = await this.userRepository.save(user);

      logger.info(`User created: ${savedUser.id}`);

      // Return user WITHOUT password (security!)
      return this.sanitizeUser(savedUser);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error creating user:", error);
      throw new ApiError(500, "Failed to create user");
    }
  }


    /**
   * GET USER BY ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new ApiError(404, "User not found", { id });
      }

      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error fetching user:", error);
      throw new ApiError(500, "Failed to fetch user");
    }
  }

  /**
   * GET USER BY EMAIL
   * 
   * Used for login (we'll do this in Phase 2)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      return user;
    } catch (error) {
      logger.error("Error fetching user by email:", error);
      throw new ApiError(500, "Failed to fetch user");
    }
  }

  /**
   * GET ALL USERS (with pagination)
   * 
   * PAGINATION IS CRITICAL FOR PERFORMANCE
   * 
   * Problem: If you have 1 million users and do:
   * SELECT * FROM users
   * 
   * Database loads ALL 1 million rows into memory!
   * Server runs out of memory and crashes
   * 
   * Solution: Pagination
   * SELECT * FROM users LIMIT 10 OFFSET 20
   * Returns only 10 rows (items 20-30)
   * 
   * Client loads page by page:
   * Page 1: items 0-9
   * Page 2: items 10-19
   * Page 3: items 20-29
   */
  async getAllUsers(
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: User[]; total: number; page: number; pages: number }> {
    try {
      // Validate pagination
      if (page < 1) page = 1;
      if (limit < 1 || limit > 100) limit = 10; // Max 100 per page

      const offset = (page - 1) * limit;

      /**
       * QUERY STRUCTURE
       * 
       * skip(offset) = how many rows to skip
       * take(limit) = how many rows to return
       * orderBy = sort results (newest first)
       * where = filter (only active users)
       */
      const [users, total] = await this.userRepository.findAndCount({
        order: { createdAt: "DESC" }, // Newest first
        skip: offset,
        take: limit,
      });

      // Calculate total pages
      const pages = Math.ceil(total / limit);

      // Sanitize all users
      const sanitizedUsers = users.map((user) => this.sanitizeUser(user));

      return {
        data: sanitizedUsers,
        total,
        page,
        pages,
      };
    } catch (error) {
      logger.error("Error fetching users:", error);
      throw new ApiError(500, "Failed to fetch users");
    }
  }

  /**
   * UPDATE USER
   */
  async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new ApiError(404, "User not found", { id });
      }

      /**
       * SELECTIVE UPDATE
       * 
       * Only update fields that were provided
       * Don't overwrite other fields
       * 
       * Example:
       * User.fullName = "John"
       * Update { phone: "9876543210" }
       * Result: fullName still "John", phone updated
       */
      const updatedUser = this.userRepository.merge(user, updates);

      const savedUser = await this.userRepository.save(updatedUser);

      logger.info(`User updated: ${id}`);

      return this.sanitizeUser(savedUser);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error updating user:", error);
      throw new ApiError(500, "Failed to update user");
    }
  }

  /**
   * DELETE USER (Soft Delete)
   * 
   * SOFT DELETE = Mark as inactive instead of deleting
   * 
   * Why?
   * - User data is referenced in orders
   * - If we delete, orders become orphaned
   * - Legal/compliance: Audit trail
   * - Can restore later if needed
   * 
   * Hard delete would violate foreign key constraints
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new ApiError(404, "User not found", { id });
      }

      // Soft delete: set isActive to false
      await this.userRepository.update(id, { isActive: false });

      logger.info(`User soft deleted: ${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error deleting user:", error);
      throw new ApiError(500, "Failed to delete user");
    }
  }

  /**
   * HELPER: Remove password before returning
   * 
   * We NEVER send password to client
   */
  private sanitizeUser(user: User): User {
    const { password, ...sanitized } = user;
    return sanitized as User;
  }
}