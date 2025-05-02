/**
 * Role-based authentication middleware for PuntaIQ
 * Used to restrict access to certain routes based on user role
 */
import { Request, Response, NextFunction } from 'express';
import { createContextLogger } from '../logger';

const logger = createContextLogger('RoleAuthMiddleware');

// Type for allowed roles
type AllowedRoles = 'admin' | 'analyst' | 'user';

/**
 * Middleware to check if user has required role
 * @param roles Array of allowed roles
 * @returns Express middleware function
 */
export function requireRole(roles: AllowedRoles[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated
    if (!req.isAuthenticated()) {
      logger.warn('Unauthenticated user tried to access protected route');
      return res.status(401).json({
        message: 'Authentication required',
        detail: 'You must be logged in to access this resource'
      });
    }

    // Check if user has one of the required roles
    if (!req.user.role || !roles.includes(req.user.role as AllowedRoles)) {
      logger.warn(`User with role ${req.user.role} tried to access route requiring ${roles.join(', ')}`);
      return res.status(403).json({
        message: 'Permission denied',
        detail: 'You do not have the required permissions to access this resource'
      });
    }

    // User is authenticated and has required role
    logger.debug(`User with role ${req.user.role} granted access`);
    next();
  };
}

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to check if user is an analyst or admin
 */
export const requireAnalyst = requireRole(['admin', 'analyst']);

/**
 * Middleware to add role information to responses
 */
export function addRoleInfo(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user) {
    // Add user role to a custom header
    res.setHeader('X-User-Role', req.user.role || 'user');
  }
  next();
}