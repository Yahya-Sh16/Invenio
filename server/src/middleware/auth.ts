import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, secret) as any;
    // Debug log: show decoded token during development to help diagnose 401/403 issues
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[auth] Decoded token payload:', decoded);
    }
    
    // Verify user still exists and is active
    const user = await prisma.users.findUnique({
      where: { userId: decoded.userId },
      select: { userId: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid or inactive user' });
      return;
    }

    req.user = {
      userId: user.userId,
      email: user.email,
      role: user.role
    };

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[auth] Resolved user:', { userId: req.user.userId, role: req.user.role, email: req.user.email });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      res.status(500).json({ message: 'Authentication error' });
    }
  }
};

export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Role-based middleware shortcuts
export const requireAdmin = authorizeRoles(['ADMIN']);
export const requireManager = authorizeRoles(['ADMIN', 'MANAGER']);
export const requireStaff = authorizeRoles(['ADMIN', 'MANAGER', 'STAFF']);
