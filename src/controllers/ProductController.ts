import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/ProductService";
import { ApiError } from "../middleware/errorHandler";
import { productCreateSchema, productUpdateSchema } from "../utils/validators";

/**
 * PRODUCT CONTROLLER
 * 
 * Thin wrapper around ProductService
 * Handles HTTP request/response
 */
export class ProductController {
  private productService = new ProductService();

  /**
   * CREATE PRODUCT - POST /api/products
   * 
   * TODO: In Phase 2, we'll extract sellerId from JWT token
   * For now, it comes from request body (not secure!)
   */
  async createProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { error, value } = productCreateSchema.validate(req.body);

      if (error) {
        throw new ApiError(400, "Validation error", {
          details: error.details,
        });
      }

      // TODO: Replace with JWT token in Phase 2
      const sellerId = req.body.sellerId;
      if (!sellerId) {
        throw new ApiError(400, "Seller ID is required");
      }

      const product = await this.productService.createProduct(sellerId, value);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET PRODUCT BY ID - GET /api/products/:id
   */
  async getProductById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const product = await this.productService.getProductById(id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL PRODUCTS - GET /api/products?page=1&limit=10&categoryId=xyz
   */
  async getAllProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const categoryId = req.query.categoryId as string | undefined;

      const result = await this.productService.getAllProducts(
        page,
        limit,
        categoryId
      );

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
   * GET PRODUCTS BY SELLER - GET /api/products/seller/:sellerId
   */
  async getProductsBySeller(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sellerId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.productService.getProductsBySeller(
        sellerId,
        page,
        limit
      );

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
   * UPDATE PRODUCT - PUT /api/products/:id
   */
  async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const { error, value } = productUpdateSchema.validate(req.body);

      if (error) {
        throw new ApiError(400, "Validation error", {
          details: error.details,
        });
      }

      // TODO: Get from JWT in Phase 2
      const sellerId = req.body.sellerId;
      if (!sellerId) {
        throw new ApiError(400, "Seller ID is required");
      }

      const product = await this.productService.updateProduct(
        id,
        sellerId,
        value
      );

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE PRODUCT - DELETE /api/products/:id
   */
  async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // TODO: Get from JWT in Phase 2
      const sellerId = req.body.sellerId;
      if (!sellerId) {
        throw new ApiError(400, "Seller ID is required");
      }

      await this.productService.deleteProduct(id, sellerId);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}