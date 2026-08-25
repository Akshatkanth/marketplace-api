import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { ProductController } from "../controllers/ProductController";
import { CategoryController } from "../controllers/CategoryController";

const router = Router();

const userController = new UserController();
const productController = new ProductController();
const categoryController = new CategoryController();

// ========== CATEGORY ROUTES ==========
// These should come first (more specific routes first)

/**
 * POST /api/categories
 * Create a new category
 */
router.post("/categories", (req, res, next) =>
  categoryController.createCategory(req, res, next)
);

/**
 * GET /api/categories
 * Get all categories
 */
router.get("/categories", (req, res, next) =>
  categoryController.getAllCategories(req, res, next)
);

/**
 * GET /api/categories/stats
 * Get categories with product count stats
 * 
 * Must come BEFORE /:id route
 */
router.get("/categories/stats", (req, res, next) =>
  categoryController.getCategoriesWithStats(req, res, next)
);

/**
 * GET /api/categories/slug/:slug
 * Get category by slug
 * 
 * Must come BEFORE /:id route
 */
router.get("/categories/slug/:slug", (req, res, next) =>
  categoryController.getCategoryBySlug(req, res, next)
);

/**
 * GET /api/categories/:id
 * Get category by ID
 */
router.get("/categories/:id", (req, res, next) =>
  categoryController.getCategoryById(req, res, next)
);

/**
 * PUT /api/categories/:id
 * Update category
 */
router.put("/categories/:id", (req, res, next) =>
  categoryController.updateCategory(req, res, next)
);

/**
 * DELETE /api/categories/:id
 * Delete category
 */
router.delete("/categories/:id", (req, res, next) =>
  categoryController.deleteCategory(req, res, next)
);

// ========== USER ROUTES ==========

router.post("/users", (req, res, next) =>
  userController.createUser(req, res, next)
);

router.get("/users", (req, res, next) =>
  userController.getAllUsers(req, res, next)
);

router.get("/users/:id", (req, res, next) =>
  userController.getUserById(req, res, next)
);

router.put("/users/:id", (req, res, next) =>
  userController.updateUser(req, res, next)
);

router.delete("/users/:id", (req, res, next) =>
  userController.deleteUser(req, res, next)
);

// ========== PRODUCT ROUTES ==========

router.post("/products", (req, res, next) =>
  productController.createProduct(req, res, next)
);

router.get("/products", (req, res, next) =>
  productController.getAllProducts(req, res, next)
);

router.get("/products/seller/:sellerId", (req, res, next) =>
  productController.getProductsBySeller(req, res, next)
);

router.get("/products/:id", (req, res, next) =>
  productController.getProductById(req, res, next)
);

router.put("/products/:id", (req, res, next) =>
  productController.updateProduct(req, res, next)
);

router.delete("/products/:id", (req, res, next) =>
  productController.deleteProduct(req, res, next)
);

export default router;