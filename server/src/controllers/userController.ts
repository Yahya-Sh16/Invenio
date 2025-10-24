import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const prisma = new PrismaClient();

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "VIEWER"]).optional(),
  isActive: z.string().transform(val => val === "true").optional(),
});

export const getUsers = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  const validatedQuery = querySchema.parse(req.query);
  const { search, page = 1, limit = 10, role, isActive } = validatedQuery;

  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (role) {
    where.role = role;
  }
  
  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      skip,
      take: limit,
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.users.count({ where }),
  ]);

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getUser = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  
  const user = await prisma.users.findUnique({
    where: { userId: id },
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
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

export const updateUser = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateUserSchema.parse(req.body);

  // Check if user exists
  const existingUser = await prisma.users.findUnique({
    where: { userId: id },
  });

  if (!existingUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // If email is being updated, check for duplicates
  if (validatedData.email && validatedData.email !== existingUser.email) {
    const emailExists = await prisma.users.findUnique({
      where: { email: validatedData.email },
    });

    if (emailExists) {
      res.status(409).json({ message: "Email already exists" });
      return;
    }
  }

  const user = await prisma.users.update({
    where: { userId: id },
    data: validatedData,
    select: {
      userId: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  res.json(user);
});

export const deleteUser = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  // Prevent self-deletion
  if (req.user?.userId === id) {
    res.status(400).json({ message: "Cannot delete your own account" });
    return;
  }

  await prisma.users.delete({
    where: { userId: id },
  });

  res.status(204).send();
});