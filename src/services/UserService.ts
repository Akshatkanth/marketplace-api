import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { User } from "../entities";
import { ApiError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import { hashPassword, comparePassword } from "../utils/auth";

export class UserService {
  private userRepository: Repository<User> = AppDataSource.getRepository(User);

  async registerUser(userData: {
    email: string;
    password: string;
    fullName: string;
    role: "BUYER" | "SELLER" | "ADMIN";
  }): Promise<User> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new ApiError(409, "Email already registered");
      }

      const hashedPassword = await hashPassword(userData.password);

      const user = this.userRepository.create({
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        role: userData.role,
        isActive: true,
      });

      const savedUser = await this.userRepository.save(user);
      logger.info(`User registered: ${savedUser.id}`);
      return this.sanitizeUser(savedUser);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error("Error registering user:", error);
      throw new ApiError(500, "Failed to register user");
    }
  }

  async authenticateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new ApiError(401, "Invalid email or password");
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
      }

      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error("Error authenticating user:", error);
      throw new ApiError(500, "Failed to authenticate user");
    }
  }

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
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new ApiError(409, "User with this email already exists", { email: userData.email });
      }

      const user = new User();
      user.id = uuidv4();
      user.email = userData.email;
      user.password = await hashPassword(userData.password);
      user.fullName = userData.fullName;
      user.role = userData.role;
      user.phone = userData.phone;
      user.address = userData.address;
      user.city = userData.city;
      user.state = userData.state;
      user.postalCode = userData.postalCode;
      user.isActive = true;

      const savedUser = await this.userRepository.save(user);
      logger.info(`User created: ${savedUser.id}`);
      return this.sanitizeUser(savedUser);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error("Error creating user:", error);
      throw new ApiError(500, "Failed to create user");
    }
  }

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

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      logger.error("Error fetching user by email:", error);
      throw new ApiError(500, "Failed to fetch user");
    }
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: User[]; total: number; page: number; pages: number }> {
    try {
      if (page < 1) page = 1;
      if (limit < 1 || limit > 100) limit = 10;

      const offset = (page - 1) * limit;
      const [users, total] = await this.userRepository.findAndCount({
        order: { createdAt: "DESC" },
        skip: offset,
        take: limit,
      });

      const pages = Math.ceil(total / limit);
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

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new ApiError(404, "User not found", { id });
      }

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

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new ApiError(404, "User not found", { id });
      }

      await this.userRepository.update(id, { isActive: false });
      logger.info(`User soft deleted: ${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error("Error deleting user:", error);
      throw new ApiError(500, "Failed to delete user");
    }
  }

  private sanitizeUser(user: User): User {
    const { password, ...sanitized } = user;
    return sanitized as User;
  }
}
