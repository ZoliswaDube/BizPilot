import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireBusinessAccess } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Validation schemas
const reportPeriodSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
});

// GET /reports/dashboard - Get dashboard summary
router.get('/dashboard', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const { period = '30' } = req.query; // Days back

  const periodDays = parseInt(period as string);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const [orderStats, expenseStats, inventoryStats] = await Promise.all([
    prisma.order.aggregate({
      where: { businessId, orderDate: { gte: startDate } },
      _sum: { totalAmount: true },
      _count: true,
      _avg: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: { businessId, expenseDate: { gte: startDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.inventory.aggregate({
      where: { businessId },
      _sum: { currentQuantity: true },
      _count: true,
    }),
  ]);

  const totalRevenue = orderStats._sum.totalAmount?.toNumber() || 0;
  const totalExpenses = expenseStats._sum.amount?.toNumber() || 0;
  const netProfit = totalRevenue - totalExpenses;

  res.json({
    period: periodDays,
    revenue: { total: totalRevenue, orderCount: orderStats._count },
    expenses: { total: totalExpenses, expenseCount: expenseStats._count },
    profit: { net: netProfit, margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0 },
  });
});

export { router as reportRoutes };

