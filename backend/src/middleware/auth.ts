import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { createError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface AuthenticatedRequest extends Request {
  user?: any;
}

// JWT token generation
export const generateTokens = (userId: string) => {
  const payload = {
    sub: userId,
    iss: 'bizpilot-api',
    aud: 'bizpilot-app',
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

// Verify JWT token
export const verifyToken = (token: string, secret: string = JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw createError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }
};

// Authentication middleware
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      return next(createError('Authentication failed', 401, 'AUTH_FAILED'));
    }

    if (!user) {
      return next(createError('Access denied. Please log in.', 401, 'UNAUTHORIZED'));
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (!err && user) {
      req.user = user;
    }
    next(); // Continue regardless of authentication result
  })(req, res, next);
};

// Business membership check
export const requireBusinessAccess = (requiredRole?: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { businessId } = req.params;
      const userId = req.user?.id;

      if (!businessId) {
        return next(createError('Business ID is required', 400, 'MISSING_BUSINESS_ID'));
      }

      if (!userId) {
        return next(createError('User not authenticated', 401, 'UNAUTHORIZED'));
      }

      // Check if user has access to this business
      const businessUser = await prisma.businessUser.findFirst({
        where: {
          businessId,
          userId,
          isActive: true,
        },
        include: {
          business: true,
        },
      });

      if (!businessUser) {
        return next(createError('Access denied. You are not a member of this business.', 403, 'BUSINESS_ACCESS_DENIED'));
      }

      // Check role requirements if specified
      if (requiredRole && requiredRole.length > 0) {
        if (!requiredRole.includes(businessUser.role)) {
          return next(createError(`Access denied. Required role: ${requiredRole.join(' or ')}`, 403, 'INSUFFICIENT_PERMISSIONS'));
        }
      }

      // Add business context to request
      (req as any).business = businessUser.business;
      (req as any).userRole = businessUser.role;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Admin-only access
export const requireAdmin = requireBusinessAccess(['admin']);

// Admin or Manager access
export const requireManagerAccess = requireBusinessAccess(['admin', 'manager']);

// Permission-based access control
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { businessId } = req.params;
      const userId = req.user?.id;

      if (!businessId || !userId) {
        return next(createError('Business ID and user authentication required', 400, 'MISSING_REQUIREMENTS'));
      }

      // Get user's role in the business
      const businessUser = await prisma.businessUser.findFirst({
        where: {
          businessId,
          userId,
          isActive: true,
        },
      });

      if (!businessUser) {
        return next(createError('Access denied. You are not a member of this business.', 403, 'BUSINESS_ACCESS_DENIED'));
      }

      // Get user's role and permissions
      const userRole = await prisma.userRole.findFirst({
        where: {
          businessId,
          name: businessUser.role,
        },
        include: {
          permissions: {
            where: {
              resource,
              action,
            },
          },
        },
      });

      const hasPermission = userRole?.permissions.length > 0;

      if (!hasPermission) {
        return next(createError(`Access denied. Permission required: ${action} on ${resource}`, 403, 'INSUFFICIENT_PERMISSIONS'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Resource ownership check (for user-owned resources)
export const requireOwnership = (resourceModel: string, resourceIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user?.id;

      if (!resourceId || !userId) {
        return next(createError('Resource ID and user authentication required', 400, 'MISSING_REQUIREMENTS'));
      }

      // Use Prisma's dynamic model access
      const resource = await (prisma as any)[resourceModel].findUnique({
        where: { id: resourceId },
      });

      if (!resource) {
        return next(createError('Resource not found', 404, 'RESOURCE_NOT_FOUND'));
      }

      if (resource.userId !== userId) {
        return next(createError('Access denied. You can only access your own resources.', 403, 'OWNERSHIP_REQUIRED'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

