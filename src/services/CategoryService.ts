import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Category } from "../entities";
import { ApiError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

/**
 * CATEGORY SERVICE
 * 
 * Handles all category-related business logic
 * 
 * Categories are simpler than products/users
 * But follow the same pattern
 */
export class CategoryService {
  private categoryRepository: Repository<Category> =
    AppDataSource.getRepository(Category);

  /**
   * CREATE CATEGORY
   * 
   * Only admins should create categories (we'll enforce in Phase 2)
   */
  async createCategory(categoryData: {
    name: string;
    slug: string;
    description?: string;
    image?: string;
  }): Promise<Category> {
    try {
      // Check if category already exists
      const existing = await this.categoryRepository.findOne({
        where: [
          { name: categoryData.name },
          { slug: categoryData.slug },
        ],
      });

      if (existing) {
        throw new ApiError(
          409,
          "Category with this name or slug already exists"
        );
      }

      const category = new Category();
      category.id = uuidv4();
      category.name = categoryData.name;
      category.slug = categoryData.slug;
      category.description = categoryData.description || null;
      category.image = categoryData.image || null;
      category.isActive = true;

      const saved = await this.categoryRepository.save(category);

      logger.info(`Category created: ${saved.id}`);

      return saved;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error creating category:", error);
      throw new ApiError(500, "Failed to create category");
    }
  }

  /**
   * GET CATEGORY BY ID
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id, isActive: true },
      });

      if (!category) {
        throw new ApiError(404, "Category not found", { id });
      }

      return category;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error fetching category:", error);
      throw new ApiError(500, "Failed to fetch category");
    }
  }

  /**
   * GET CATEGORY BY SLUG
   * 
   * Useful for URL-based lookups
   * Example: /categories/electronics
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { slug, isActive: true },
      });

      if (!category) {
        throw new ApiError(404, "Category not found", { slug });
      }

      return category;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error fetching category by slug:", error);
      throw new ApiError(500, "Failed to fetch category");
    }
  }

  /**
   * GET ALL CATEGORIES
   * 
   * No pagination needed - categories are usually small list
   * (10-100 categories typical, not millions)
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.find({
        where: { isActive: true },
        order: { name: "ASC" }, // Alphabetical order
      });

      return categories;
    } catch (error) {
      logger.error("Error fetching categories:", error);
      throw new ApiError(500, "Failed to fetch categories");
    }
  }

  /**
   * GET ALL CATEGORIES WITH PRODUCT COUNT
   * 
   * Shows how many products in each category
   * Useful for category listing with count
   * 
   * This is a more complex query using SQL aggregation
   */
  async getCategoriesWithProductCount(): Promise
    Array<{ id: string; name: string; slug: string; productCount: number }>
  > {
    try {
      /**
       * RAW SQL QUERY EXAMPLE
       * 
       * While TypeORM is great for simple queries,
       * complex queries sometimes require raw SQL
       * 
       * This query:
       * 1. Gets all active categories
       * 2. Counts products in each category
       * 3. Returns with product count
       * 
       * SQL aggregation is important for:
       * - Reporting
       * - Dashboard stats
       * - Category listings with counts
       */
      const result = await this.categoryRepository.query(`
        SELECT 
          c.id,
          c.name,
          c.slug,
          COUNT(p.id) as "productCount"
        FROM categories c
        LEFT JOIN products p ON c.id = p."categoryId" AND p."isActive" = true
        WHERE c."isActive" = true
        GROUP BY c.id, c.name, c.slug
        ORDER BY c.name ASC
      `);

      return result;
    } catch (error) {
      logger.error("Error fetching categories with count:", error);
      throw new ApiError(500, "Failed to fetch categories");
    }
  }

  /**
   * UPDATE CATEGORY
   */
  async updateCategory(
    id: string,
    updates: Partial<Category>
  ): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new ApiError(404, "Category not found", { id });
      }

      // Check if new slug is unique (if being updated)
      if (updates.slug && updates.slug !== category.slug) {
        const existing = await this.categoryRepository.findOne({
          where: { slug: updates.slug },
        });

        if (existing) {
          throw new ApiError(409, "This slug is already taken");
        }
      }

      const updated = this.categoryRepository.merge(category, updates);
      const saved = await this.categoryRepository.save(updated);

      logger.info(`Category updated: ${id}`);

      return saved;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error updating category:", error);
      throw new ApiError(500, "Failed to update category");
    }
  }

  /**
   * DELETE CATEGORY (Soft Delete)
   * 
   * Mark as inactive instead of deleting
   * Products in this category are not deleted
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new ApiError(404, "Category not found", { id });
      }

      await this.categoryRepository.update(id, { isActive: false });

      logger.info(`Category soft deleted: ${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      logger.error("Error deleting category:", error);
      throw new ApiError(500, "Failed to delete category");
    }
  }
}

