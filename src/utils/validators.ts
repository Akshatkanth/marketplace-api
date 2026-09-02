import Joi from "joi" 

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

export const authRegisterSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Must be a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/) // At least one uppercase
    .pattern(/[a-z]/) // At least one lowercase
    .pattern(/\d/) // At least one number
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
      'any.required': 'Password is required',
    }),
  fullName: Joi.string().min(2).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'any.required': 'Full name is required',
  }),
  role: Joi.string()
    .valid('BUYER', 'SELLER', 'ADMIN')
    .default('BUYER'),
});

/**
 * Validation schema for user login
 */
export const authLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Must be a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Validation schema for token refresh
 */
export const authRefreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

/**
 * Validation schema for adding item to cart
 */
export const cartAddItemSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.guid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
});

/**
 * Validation schema for updating cart item quantity
 */
export const cartUpdateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
});

/**
 * Validation schema for creating an order
 */
export const orderCreateSchema = Joi.object({
  shippingAddress: Joi.string().min(5).required().messages({
    'string.min': 'Shipping address must be at least 5 characters',
    'any.required': 'Shipping address is required',
  }),
  billingAddress: Joi.string().min(5).required().messages({
    'string.min': 'Billing address must be at least 5 characters',
    'any.required': 'Billing address is required',
  }),
  paymentMethod: Joi.string()
    .valid('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER')
    .required()
    .messages({
      'any.only': 'Payment method must be CREDIT_CARD, DEBIT_CARD, PAYPAL, or BANK_TRANSFER',
      'any.required': 'Payment method is required',
    }),
  notes: Joi.string().optional(),
});

/**
 * Validation schema for updating order status
 */
export const orderUpdateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED')
    .required()
    .messages({
      'any.only': 'Status must be PENDING, CONFIRMED, SHIPPED, DELIVERED, COMPLETED, or CANCELLED',
      'any.required': 'Status is required',
    }),
});