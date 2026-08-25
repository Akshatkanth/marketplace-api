import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/CategoryService";
import { ApiError } from "../middleware/errorHandler";
import { categoryCreateSchema, categoryUpdateSchema } from "../utils/validators";

/**
 * CATEGORY CONTROLLER
 * 
 * Handles HTTP requests/responses for categories
 */
export class CategoryController {
  private categoryService = new CategoryService();

  /**
   * CREATE CATEGORY - POST /api/categories
   */
  async createCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { error, value } = categoryCreateSchema.validate(req.body);

      if (error) {
        throw new ApiError(400, "Validation error", {
          details: error.details,
        });
      }

      const category = await this.categoryService.createCategory(value);

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET CATEGORY BY ID - GET /api/categories/:id
   */
  async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const category = await this.categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET CATEGORY BY SLUG - GET /api/categories/slug/:slug
   * 
   * Example: /api/categories/slug/electronics
   */
  async getCategoryBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { slug } = req.params;

      const category = await this.categoryService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL CATEGORIES - GET /api/categories
   */
  async getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = await this.categoryService.getAllCategories();

      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET CATEGORIES WITH PRODUCT COUNT - GET /api/categories/stats
   * 
   * More detailed view with product counts
   */
  async getCategoriesWithStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories =
        await this.categoryService.getCategoriesWithProductCount();

      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE CATEGORY - PUT /api/categories/:id
   */
  async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const { error, value } = categoryUpdateSchema.validate(req.body);

      if (error) {
        throw new ApiError(400, "Validation error", {
          details: error.details,
        });
      }

      const category = await this.categoryService.updateCategory(id, value);

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE CATEGORY - DELETE /api/categories/:id
   */
  async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      await this.categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}