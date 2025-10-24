import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const prisma = new PrismaClient();

export const getDashboardMetrics = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // Get date range for metrics (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    popularProducts,
    salesSummary,
    purchaseSummary,
    expenseSummary,
    expenseByCategorySummaryRaw,
    totalProducts,
    lowStockProducts,
    totalSales,
    totalPurchases,
    totalExpenses
  ] = await Promise.all([
    // Popular products (by stock quantity)
    prisma.products.findMany({
      take: 15,
      orderBy: {
        stockQuantity: "desc",
      },
      select: {
        productId: true,
        name: true,
        price: true,
        stockQuantity: true,
        rating: true,
      },
    }),
    
    // Sales summary
    prisma.salesSummary.findMany({
      take: 5,
      orderBy: {
        date: "desc",
      },
    }),
    
    // Purchase summary
    prisma.purchaseSummary.findMany({
      take: 5,
      orderBy: {
        date: "desc",
      },
    }),
    
    // Expense summary
    prisma.expenseSummary.findMany({
      take: 5,
      orderBy: {
        date: "desc",
      },
    }),
    
    // Expense by category
    prisma.expenseByCategory.findMany({
      take: 5,
      orderBy: {
        date: "desc",
      },
    }),

    // Total products count
    prisma.products.count(),

    // Low stock products (less than 10 items)
    prisma.products.count({
      where: {
        stockQuantity: {
          lt: 10,
        },
      },
    }),

    // Total sales amount
    prisma.sales.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    }),

    // Total purchases amount
    prisma.purchases.aggregate({
      _sum: {
        totalCost: true,
      },
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    }),

    // Total expenses amount
    prisma.expenses.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    }),
  ]);

  const expenseByCategorySummary = expenseByCategorySummaryRaw.map(
    (item: typeof expenseByCategorySummaryRaw[number]) => ({
      ...item,
      amount: item.amount.toString(),
    })
  );

  res.json({
    popularProducts,
    salesSummary,
    purchaseSummary,
    expenseSummary,
    expenseByCategorySummary,
    metrics: {
      totalProducts,
      lowStockProducts,
      totalSales: totalSales._sum.totalAmount || 0,
      totalPurchases: totalPurchases._sum.totalCost || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      netProfit: (totalSales._sum.totalAmount || 0) - (totalPurchases._sum.totalCost || 0) - (totalExpenses._sum.amount || 0),
    },
  });
});