import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";
import { ApiError } from "../middleware/errorHandler";
import { userCreateSchema, userUpdateSchema } from "../utils/validators";

const getRouteValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

/**
 * USER CONTROLLER
 * 
 * Controllers are thin wrappers around services
 * They:
 * 1. Extract data from HTTP request
 * 2. Validate input
 * 3. Call service
 * 4. Return HTTP response
 * 
 * Controllers should NOT contain business logic
 * That's the service's job
 */
export class UserController {
  private userService = new UserService();

  /**
   * CREATE USER - POST /api/users
   * 
   * @param req - Express request object (contains body, params, query)
   * @param res - Express response object (send response)
   * @param next - Express next middleware
   */
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body against schema
      const { error, value } = userCreateSchema.validate(req.body);

      if (error) {
        throw new ApiError(
          400, // Bad Request
          "Validation error",
          { details: error.details }
        );
      }

      // Call service to create user
      const user = await this.userService.createUser(value);

      // Return 201 Created with user data
      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * GET USER BY ID - GET /api/users/:id
   */
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getRouteValue(req.params.id);

      const user = await this.userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL USERS - GET /api/users?page=1&limit=10
   * 
   * Query parameters:
   * - page: which page (default 1)
   * - limit: how many per page (default 10)
   */
  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get pagination from query string
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.userService.getAllUsers(page, limit);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE USER - PUT /api/users/:id
   * 
   * Can update partial fields
   */
  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getRouteValue(req.params.id);

      // Validate update payload
      const { error, value } = userUpdateSchema.validate(req.body);

      if (error) {
        throw new ApiError(400, "Validation error", {
          details: error.details,
        });
      }

      const user = await this.userService.updateUser(id, value);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE USER - DELETE /api/users/:id
   */
  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getRouteValue(req.params.id);

      await this.userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

