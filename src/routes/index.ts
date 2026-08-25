import { Router } from "express";
import { UserController, UserController } from "../controllers/UserController";
import { ProductController, ProductController } from "../controllers/ProductController";

//routes file
//maps url to controllers
//pattern: Method (/path) -> Controller method

const router = Router()

//intialising controller
const UserController = new UserController();
const ProductController = new ProductController();


//user routes

//create a new user
router.post("/users", (req, res, next) => 
    UserController.createUser(req, res, next);
);

//get route
router.get("/users", (req, res, next) =>
  userController.getAllUsers(req, res, next)
);

//get user by id
router.get("/users/:id", (req, res, next) =>
  userController.getUserById(req, res, next)
);

//update user
router.put("/users/:id", (req, res, next) =>
  userController.updateUser(req, res, next)
);

//delete user
router.delete("/users/:id", (req, res, next) =>
  userController.deleteUser(req, res, next)
);


// ========== PRODUCT ROUTES ==========

/**
 * POST /api/products
 * Create a new product
 */
router.post("/products", (req, res, next) =>
  productController.createProduct(req, res, next)
);

/**
 * GET /api/products
 * Get all products (paginated, optionally filtered by category)
 */
router.get("/products", (req, res, next) =>
  productController.getAllProducts(req, res, next)
);

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get("/products/:id", (req, res, next) =>
  productController.getProductById(req, res, next)
);

router.get("/products/seller/:sellerId", (req, res, next) =>
  productController.getProductsBySeller(req, res, next)
);

/**
 * PUT /api/products/:id
 * Update product
 */
router.put("/products/:id", (req, res, next) =>
  productController.updateProduct(req, res, next)
);

/**
 * DELETE /api/products/:id
 * Delete product
 */
router.delete("/products/:id", (req, res, next) =>
  productController.deleteProduct(req, res, next)
);

export default router;