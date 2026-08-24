import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Product, Category } from "../entities";
import { ApiError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

/**
 * PRODUCT SERVICE
 * 
 * Business logic for product operations
 * Remember: Services contain logic, not HTTP
 */
export class ProductService {
  private productRepository: Repository<Product> =
    AppDataSource.getRepository(Product);
  private categoryRepository: Repository<Category> =
    AppDataSource.getRepository(Category);

  /**
   * CREATE PRODUCT
   * 
   * @param sellerId - ID of the seller creating product
   * @param productData - Product details
   */
  async createProduct(
    sellerId: string,
    productData: {
      name: string;
      slug: string;
      description: string;
      price: number;
      originalPrice?: number;
      stock: number;
      categoryId: string;
      image: string;
      images?: string[];
    }
  ): Promise<Product> {
    try {
      // Verify category exists
      const category = await this.categoryRepository.findOne({
        where: { id: productData.categoryId },
      });

      if (!category) {
        throw new ApiError(404, "Category not found", {
          categoryId: productData.categoryId,
        });
      }

      // Check if slug already exists (must be unique)
      const existingProduct = await this.productRepository.findOne({
        where: { slug: productData.slug },
      });

      if (existingProduct) {
        throw new ApiError(409, "Product with this slug already exists", {
          slug: productData.slug,
        });
      }

      // Create product
      const product = new Product();
      product.id = uuidv4();
      product.name = productData.name;
      product.slug = productData.slug;
      product.description = productData.description;
      product.price = parseFloat(productData.price.toString());
      product.originalPrice = productData.originalPrice
        ? parseFloat(productData.originalPrice.toString())
        : null;
      product.stock = productData.stock;
      product.categoryId = productData.categoryId;
      product.category = category;
      product.image = productData.image;
      product.images = productData.images || null;
      product.sellerId = sellerId;
      product.isActive = true;
      product.rating = 0;
      product.reviewCount = 0;

      const savedProduct = await this.productRepository.save(product);

      logger.info(`Product created: ${savedProduct.id} by seller ${sellerId}`);

      return savedProduct;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error creating product:", error);
      throw new ApiError(500, "Failed to create product");
    }
  }

  /**
   * GET PRODUCT BY ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: { id, isActive: true },
        relations: ["category", "seller"], // Load related entities
      });

      if (!product) {
        throw new ApiError(404, "Product not found", { id });
      }

      return product;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error fetching product:", error);
      throw new ApiError(500, "Failed to fetch product");
    }
  }

  /**
   * GET ALL PRODUCTS (with pagination)
   * 
   * IMPORTANT CONCEPT: EAGER LOADING vs LAZY LOADING
   * 
   * Eager Loading (relations: ["category", "seller"]):
   * SELECT * FROM products
   * JOIN categories ON ...
   * JOIN users ON ...
   * 
   * Returns everything at once
   * Pro: 1 query, all data ready
   * Con: Loads category/seller even if not needed
   * 
   * Lazy Loading (no relations):
   * SELECT * FROM products
   * Then when you access product.category, it queries again
   * 
   * Pro: Only loads what you need
   * Con: Multiple queries (N+1 problem)
   * 
   * For list endpoints, we use eager loading (predictable)
   */
  async getAllProducts(
    page: number = 1,
    limit: number = 10,
    categoryId?: string
  ): Promise<{ data: Product[]; total: number; page: number; pages: number }> {
    try {
      if (page < 1) page = 1;
      if (limit < 1 || limit > 100) limit = 10;

      const offset = (page - 1) * limit;

      /**
       * BUILD WHERE CLAUSE DYNAMICALLY
       * 
       * Always filter by isActive = true (don't show deleted products)
       * Optionally filter by categoryId if provided
       */
      const where: any = { isActive: true };
      if (categoryId) {
        where.categoryId = categoryId;
      }

      const [products, total] = await this.productRepository.findAndCount({
        where,
        relations: ["category", "seller"],
        order: { createdAt: "DESC" },
        skip: offset,
        take: limit,
      });

      const pages = Math.ceil(total / limit);

      return {
        data: products,
        total,
        page,
        pages,
      };
    } catch (error) {
      logger.error("Error fetching products:", error);
      throw new ApiError(500, "Failed to fetch products");
    }
  }

  /**
   * GET PRODUCTS BY SELLER
   * 
   * Useful for seller dashboard
   */
  async getProductsBySeller(
    sellerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Product[]; total: number; page: number; pages: number }> {
    try {
      if (page < 1) page = 1;
      if (limit < 1 || limit > 100) limit = 10;

      const offset = (page - 1) * limit;

      const [products, total] = await this.productRepository.findAndCount({
        where: { sellerId },
        relations: ["category"],
        order: { createdAt: "DESC" },
        skip: offset,
        take: limit,
      });

      const pages = Math.ceil(total / limit);

      return {
        data: products,
        total,
        page,
        pages,
      };
    } catch (error) {
      logger.error("Error fetching seller products:", error);
      throw new ApiError(500, "Failed to fetch products");
    }
  }

  /**
   * UPDATE PRODUCT
   */
  async updateProduct(
    id: string,
    sellerId: string,
    updates: Partial<Product>
  ): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: { id },
      });

      if (!product) {
        throw new ApiError(404, "Product not found", { id });
      }

      /**
       * AUTHORIZATION CHECK
       * 
       * Only the seller who created the product can update it
       * (We'll enhance this in Phase 2 with proper auth)
       */
      if (product.sellerId !== sellerId) {
        throw new ApiError(
          403, // Forbidden
          "You can only update your own products"
        );
      }

      // If categoryId is being updated, verify it exists
      if (updates.categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: updates.categoryId },
        });

        if (!category) {
          throw new ApiError(404, "Category not found");
        }
      }

      const updatedProduct = this.productRepository.merge(product, updates);
      const savedProduct = await this.productRepository.save(updatedProduct);

      logger.info(`Product updated: ${id}`);

      return savedProduct;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error updating product:", error);
      throw new ApiError(500, "Failed to update product");
    }
  }

  /**
   * DELETE PRODUCT (Soft Delete)
   */
  async deleteProduct(id: string, sellerId: string): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id },
      });

      if (!product) {
        throw new ApiError(404, "Product not found", { id });
      }

      // Check ownership
      if (product.sellerId !== sellerId) {
        throw new ApiError(403, "You can only delete your own products");
      }

      // Soft delete
      await this.productRepository.update(id, { isActive: false });

      logger.info(`Product soft deleted: ${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error deleting product:", error);
      throw new ApiError(500, "Failed to delete product");
    }
  }

  /**
   * UPDATE STOCK
   * 
   * When an order is placed, decrease stock
   * Called from OrderService
   */
  async decreaseStock(productId: string, quantity: number): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      if (product.stock < quantity) {
        throw new ApiError(
          400,
          "Insufficient stock",
          { available: product.stock, requested: quantity }
        );
      }

      product.stock -= quantity;
      await this.productRepository.save(product);

      logger.info(`Stock decreased for product ${productId}: -${quantity}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error decreasing stock:", error);
      throw new ApiError(500, "Failed to update stock");
    }
  }
}

