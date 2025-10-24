import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const prisma = new PrismaClient();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be positive"),
  rating: z.number().min(0).max(5).optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity must be non-negative"),
});

const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  price: z.number().positive("Price must be positive").optional(),
  rating: z.number().min(0).max(5).optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity must be non-negative").optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  sortBy: z.enum(["name", "price", "stockQuantity", "rating", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const getProducts = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  const validatedQuery = querySchema.parse(req.query);
  const { search, page = 1, limit = 10, sortBy = "name", sortOrder = "asc" } = validatedQuery;

  const skip = (page - 1) * limit;
  
  const where = search ? {
    name: {
      contains: search,
      mode: "insensitive" as const,
    },
  } : {};

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.products.count({ where }),
  ]);

  res.json({
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getProduct = asyncHandler(async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  
  const product = await prisma.products.findUnique({
    where: { productId: id },
  });

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.json(product);
});

export const createProduct = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const validatedData = createProductSchema.parse(req.body);
  
  // Generate unique product ID
  const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const product = await prisma.products.create({
    data: {
      productId,
      ...validatedData,
    },
  });

  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateProductSchema.parse(req.body);

  const product = await prisma.products.update({
    where: { productId: id },
    data: validatedData,
  });

  res.json(product);
});

export const deleteProduct = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  await prisma.products.delete({
    where: { productId: id },
  });

  res.status(204).send();
});