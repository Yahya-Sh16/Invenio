import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const DEFAULT_ACCESS_TOKEN_EXPIRES = '1h';
const DEFAULT_REFRESH_TOKEN_EXPIRES = '30d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

const getJWTSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
};

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = getJWTSecret();
  const options: SignOptions = {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || DEFAULT_ACCESS_TOKEN_EXPIRES
  } as SignOptions;
  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = getJWTSecret();
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const generateRefreshToken = (): string => {
  return randomBytes(64).toString('hex');
};

export const saveRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN || DEFAULT_REFRESH_TOKEN_EXPIRES;
  const expiresAt = new Date();
  
  // Parse the expiry string (e.g., "30d", "24h")
  const match = refreshExpiry.match(/^(\d+)([dh])$/);
  if (!match) {
    throw new Error('Invalid refresh token expiry format');
  }

  const [, value, unit] = match;
  if (unit === 'd') {
    expiresAt.setDate(expiresAt.getDate() + parseInt(value));
  } else if (unit === 'h') {
    expiresAt.setHours(expiresAt.getHours() + parseInt(value));
  }

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
    },
  });
};

export const verifyRefreshToken = async (refreshToken: string): Promise<TokenPayload | null> => {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    return null;
  }

  // Check if user account is active and not deleted
  const user = await prisma.users.findUnique({
    where: { userId: tokenRecord.userId },
    select: {
      userId: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    await revokeRefreshToken(refreshToken); // Revoke token if user is inactive
    return null;
  }

  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };
};

export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  await prisma.refreshToken.delete({
    where: { token: refreshToken },
  });
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

export const generateTokens = async (user: { userId: string; email: string; role: string }): Promise<AuthTokens> => {
  const payload: TokenPayload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();

  await saveRefreshToken(user.userId, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
};
