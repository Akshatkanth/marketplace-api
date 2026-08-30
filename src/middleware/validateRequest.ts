import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from './errorHandler';

/**
 * Validate request body against Joi schema
 * Usage: router.post('/users', validateRequest(userCreateSchema), controller)
 */
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Collect all errors, not just first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const details = error.details.reduce((acc: any, err) => {
        acc[err.path.join('.')] = err.message;
        return acc;
      }, {});

      return next(
        new ApiError(400, 'Validation error', details)
      );
    }

    // Replace req.body with validated (and cleaned) data
    req.body = value;
    next();
  };
};