import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { 
  hashPassword, 
  comparePassword, 
  generateTokens, 
  verifyRefreshToken, 
  revokeRefreshToken,
  revokeAllUserTokens 
} from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password, role = 'VIEWER' } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await generateTokens({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.issues,
      });
      return;
    }

    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Update last login
    await prisma.users.update({
      where: { userId: user.userId },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = await generateTokens({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.issues,
      });
      return;
    }

    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const { refreshToken } = validatedData;

    // Verify refresh token
    const tokenPayload = await verifyRefreshToken(refreshToken);
    if (!tokenPayload) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = await generateTokens(tokenPayload);

    res.json({
      message: 'Token refreshed successfully',
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.issues,
      });
      return;
    }

    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const { refreshToken } = validatedData;

    await revokeRefreshToken(refreshToken);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.issues,
      });
      return;
    }

    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logoutAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    await revokeAllUserTokens(req.user.userId);

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const validatedData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;

    // Get user with password
    const user = await prisma.users.findUnique({
      where: { userId: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.users.update({
      where: { userId: req.user.userId },
      data: { password: hashedNewPassword },
    });

    // Revoke all refresh tokens for security
    await revokeAllUserTokens(req.user.userId);

    res.json({ message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.issues,
      });
      return;
    }

    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await prisma.users.findUnique({
      where: { userId: req.user.userId },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
