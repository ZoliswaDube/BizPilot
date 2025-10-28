import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Log error for debugging
  console.error('API Error:', {
    url: req.url,
    method: req.method,
    error: error.message,
    stack: error.stack,
    body: req.body,
    user: (req as any).user?.id,
  });

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists. Please check for duplicates.';
        code = 'DUPLICATE_RESOURCE';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found.';
        code = 'RESOURCE_NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference. Related resource does not exist.';
        code = 'INVALID_REFERENCE';
        break;
      case 'P2004':
        statusCode = 400;
        message = 'Constraint violation.';
        code = 'CONSTRAINT_VIOLATION';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed.';
        code = 'DATABASE_ERROR';
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided.';
    code = 'VALIDATION_ERROR';
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(statusCode).json({
      error: {
        code,
        message,
        details: validationErrors,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
    code = 'INVALID_TOKEN';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
    code = 'TOKEN_EXPIRED';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error,
      }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

export const createError = (message: string, statusCode: number = 500, code?: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

