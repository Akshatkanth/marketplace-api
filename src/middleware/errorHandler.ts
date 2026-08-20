import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Error:", error);

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        details: error.details,
        statusCode: error.statusCode,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
      statusCode: 500,
    },
  });
};