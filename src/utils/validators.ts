import Joi from "joi" //for schema validation

export const categoryCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Category name must be at least 2 characters",
    "any.required": "Category name is required",
  }),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).required().messages({
    "string.pattern.base": "Slug must contain only lowercase letters, numbers, and hyphens",
    "any.required": "Slug is required",
  }),
  description: Joi.string().max(500).optional(),
  image: Joi.string().uri().optional(),
}).unknown(false);

export const categoryUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().max(500).optional(),
  image: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
}).unknown(false);

export const userCreateSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.email": "Email must be valid",
            "any.required": "Email is required"
        }),

    password: Joi.string()
        .min(8)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
            "string.min": "Password must be at least 8 characters",
            "string.pattern.base": "Password must contain uppercase, lowercase, and numbers",
            "any.required": "Password is required",
        }),

    fullName: Joi.string()
        .min(2)
        .max(255)
        .required()
        .messages({
        "string.min": "Full name must be at least 2 characters",
        "any.required": "Full name is required",
    }),

    role: Joi.string()
        .valid("BUYER", "SELLER", "ADMIN")
        .default("BUYER")
        .messages({
        "any.only": "Role must be BUYER, SELLER, or ADMIN",
    }),

    phone: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .optional()
        .messages({
      "string.pattern.base": "Phone must be 10 digits",
    }),

    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    postalCode: Joi.string().optional(),
});
 
export const userUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  postalCode: Joi.string().optional(),
  profilePicture: Joi.string().uri().optional(),
  storeName: Joi.string().max(255).optional(),
}).unknown(false); // Reject unknown fields

// ========== PRODUCT VALIDATION SCHEMAS ==========

export const productCreateSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      "string.min": "Product name must be at least 3 characters",
      "any.required": "Product name is required",
    }),

  slug: Joi.string()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .required()
    .messages({
      "string.pattern.base": "Slug must contain only lowercase letters, numbers, and hyphens",
      "any.required": "Slug is required",
    }),

  description: Joi.string()
    .min(10)
    .required()
    .messages({
      "string.min": "Description must be at least 10 characters",
      "any.required": "Description is required",
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      "number.positive": "Price must be positive",
      "any.required": "Price is required",
    }),

  originalPrice: Joi.number()
    .positive()
    .precision(2)
    .optional(),

  stock: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      "number.min": "Stock cannot be negative",
    }),

  categoryId: Joi.string()
    .uuid()
    .required()
    .messages({
      "string.guid": "Category ID must be a valid UUID",
      "any.required": "Category ID is required",
    }),

  image: Joi.string()
    .uri()
    .required()
    .messages({
      "string.uri": "Image must be a valid URL",
      "any.required": "Image is required",
    }),

  images: Joi.array()
    .items(Joi.string().uri())
    .optional(),
});

export const productUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().min(10).optional(),
  price: Joi.number().positive().precision(2).optional(),
  originalPrice: Joi.number().positive().precision(2).optional(),
  stock: Joi.number().integer().min(0).optional(),
  categoryId: Joi.string().uuid().optional(),
  image: Joi.string().uri().optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(false);
