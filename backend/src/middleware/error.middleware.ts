import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, HttpStatus } from '../utils/errors';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(HttpStatus.CONFLICT).json({
        success: false,
        message: 'A record with this data already exists',
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Record not found',
      });
      return;
    }

    if (err.code === 'P2003') {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Referenced record does not exist',
      });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid data provided',
    });
    return;
  }

  // JWT errors handled in middleware, this is fallback
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // Unknown errors
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal server error',
  });
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.method} ${req.url} not found`, HttpStatus.NOT_FOUND);
  next(error);
};
