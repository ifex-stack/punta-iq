import { Request, Response, NextFunction } from 'express';

// Define role types for better TypeScript support
export type UserRole = 'user' | 'admin' | 'analyst';

/**
 * Middleware to check if a user is authenticated and has one of the specified roles
 * 
 * @param roles Array of allowed roles for the route
 * @returns Express middleware function
 */
export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ 
        message: 'You must be logged in to access this resource'
      });
    }

    // Then check if user has one of the required roles
    const userRole = req.user.role as UserRole;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'You do not have permission to access this resource'
      });
    }

    // User is authenticated and has a valid role
    next();
  };
}

/**
 * Middleware to check if a user is an admin
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to check if a user is an analyst (or admin)
 */
export const requireAnalyst = requireRole(['admin', 'analyst']);

/**
 * Middleware to check if a user is authenticated but allows any role
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ 
      message: 'You must be logged in to access this resource'
    });
  }
  next();
};