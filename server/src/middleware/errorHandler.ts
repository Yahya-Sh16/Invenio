import { Prisma } from "@prisma/client"; import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle different types of errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    res.status(statusCode).json({
      message,
      errors: error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }

  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Duplicate entry. This record already exists.';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found.';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference. Related record does not exist.';
        break;
      default:
        statusCode = 500;
        message = 'Database error occurred.';
    }
  }

  if (error instanceof PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided.';
  }

  if ('statusCode' in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  // Send error response
  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
