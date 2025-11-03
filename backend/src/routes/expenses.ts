import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireBusinessAccess } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Validation schemas
const createExpenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  amount: z.number().positive(),
  description: z.string().min(1, 'Description is required'),
  expenseDate: z.string().datetime().optional(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'cheque', 'other']).default('cash'),
  supplierName: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
  taxDeductible: z.boolean().default(true),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  tags: z.array(z.string()).default([]),
});

const updateExpenseSchema = createExpenseSchema.partial();

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Generate expense number
async function generateExpenseNumber(businessId: string): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const prefix = `EXP-${year}${month}`;
  
  const lastExpense = await prisma.expense.findFirst({
    where: {
      businessId,
      id: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let sequence = 1;
  if (lastExpense) {
    const lastSequence = parseInt(lastExpense.id.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

// EXPENSE CATEGORIES

// GET /expenses/categories - List expense categories
router.get('/categories', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;

  const categories = await prisma.expenseCategory.findMany({
    where: {
      businessId,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          expenses: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  res.json(categories);
});

// POST /expenses/categories - Create expense category
router.post('/categories', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const validatedData = createCategorySchema.parse(req.body);

  // Check for duplicate category name
  const existingCategory = await prisma.expenseCategory.findFirst({
    where: {
      businessId,
      name: validatedData.name,
      isActive: true,
    },
  });

  if (existingCategory) {
    return res.status(400).json({ 
      error: 'Category with this name already exists' 
    });
  }

  const category = await prisma.expenseCategory.create({
    data: {
      businessId,
      name: validatedData.name,
      description: validatedData.description,
      isActive: validatedData.isActive,
    },
  });

  res.status(201).json(category);
});

// EXPENSES

// GET /expenses - List expenses
router.get('/', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const { 
    page = '1', 
    limit = '10', 
    categoryId,
    startDate,
    endDate,
    search,
    paymentMethod,
    taxDeductible,
    sortBy = 'expenseDate',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {
    businessId,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate as string);
    if (endDate) where.expenseDate.lte = new Date(endDate as string);
  }

  if (search) {
    where.OR = [
      { description: { contains: search as string, mode: 'insensitive' } },
      { supplierName: { contains: search as string, mode: 'insensitive' } },
      { notes: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  if (taxDeductible !== undefined) {
    where.taxDeductible = taxDeductible === 'true';
  }

  const orderBy: any = {};
  orderBy[sortBy as string] = sortOrder;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: parseInt(limit as string),
    }),
    prisma.expense.count({ where }),
  ]);

  res.json({
    expenses,
    pagination: {
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

// GET /expenses/:id - Get single expense
router.get('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;

  const expense = await prisma.expense.findFirst({
    where: {
      id,
      businessId,
    },
    include: {
      category: true,
      creator: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json(expense);
});

// POST /expenses - Create expense
router.post('/', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const userId = req.user!.id;
  
  const validatedData = createExpenseSchema.parse(req.body);

  // Validate category exists if provided
  if (validatedData.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: {
        id: validatedData.categoryId,
        businessId,
        isActive: true,
      },
    });

    if (!category) {
      return res.status(400).json({ error: 'Invalid expense category' });
    }
  }

  const expense = await prisma.expense.create({
    data: {
      businessId,
      createdBy: userId,
      categoryId: validatedData.categoryId,
      amount: validatedData.amount,
      description: validatedData.description,
      expenseDate: validatedData.expenseDate ? new Date(validatedData.expenseDate) : new Date(),
      paymentMethod: validatedData.paymentMethod,
      supplierName: validatedData.supplierName,
      receiptUrl: validatedData.receiptUrl,
      notes: validatedData.notes,
      taxDeductible: validatedData.taxDeductible,
      isRecurring: validatedData.isRecurring,
      recurringFrequency: validatedData.recurringFrequency,
      tags: validatedData.tags,
    },
    include: {
      category: true,
      creator: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json(expense);
});

// PUT /expenses/:id - Update expense
router.put('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;
  
  const validatedData = updateExpenseSchema.parse(req.body);

  const existingExpense = await prisma.expense.findFirst({
    where: {
      id,
      businessId,
    },
  });

  if (!existingExpense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  // Validate category exists if provided
  if (validatedData.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: {
        id: validatedData.categoryId,
        businessId,
        isActive: true,
      },
    });

    if (!category) {
      return res.status(400).json({ error: 'Invalid expense category' });
    }
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      categoryId: validatedData.categoryId,
      amount: validatedData.amount,
      description: validatedData.description,
      expenseDate: validatedData.expenseDate ? new Date(validatedData.expenseDate) : undefined,
      paymentMethod: validatedData.paymentMethod,
      supplierName: validatedData.supplierName,
      receiptUrl: validatedData.receiptUrl,
      notes: validatedData.notes,
      taxDeductible: validatedData.taxDeductible,
      isRecurring: validatedData.isRecurring,
      recurringFrequency: validatedData.recurringFrequency,
      tags: validatedData.tags,
    },
    include: {
      category: true,
      creator: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  res.json(expense);
});

// DELETE /expenses/:id - Delete expense
router.delete('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;

  const expense = await prisma.expense.findFirst({
    where: {
      id,
      businessId,
    },
  });

  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  await prisma.expense.delete({
    where: { id },
  });

  res.status(204).send();
});

// GET /expenses/stats - Get expense statistics
router.get('/stats/summary', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const { startDate, endDate, period = 'month' } = req.query;

  const where: any = { businessId };
  
  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate as string);
    if (endDate) where.expenseDate.lte = new Date(endDate as string);
  }

  const [
    totalExpenses,
    expenseCount,
    categoryBreakdown,
    paymentMethodBreakdown,
    monthlyTrend,
  ] = await Promise.all([
    prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
    }),
    prisma.expense.count({ where }),
    prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        categoryId: true,
      },
    }),
    prisma.expense.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        paymentMethod: true,
      },
    }),
    // Monthly trend for the last 12 months
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', expense_date) as month,
        SUM(amount) as total_amount,
        COUNT(*) as expense_count
      FROM expenses 
      WHERE business_id = ${businessId}
        AND expense_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', expense_date)
      ORDER BY month ASC
    `,
  ]);

  // Get category names for breakdown
  const categoryIds = categoryBreakdown.map(item => item.categoryId).filter(Boolean);
  const categories = await prisma.expenseCategory.findMany({
    where: {
      id: { in: categoryIds as string[] },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);

  const categoryBreakdownWithNames = categoryBreakdown.map(item => ({
    categoryId: item.categoryId,
    categoryName: item.categoryId ? categoryMap[item.categoryId] || 'Unknown' : 'Uncategorized',
    totalAmount: item._sum.amount || 0,
    count: item._count.categoryId,
  }));

  res.json({
    totalExpenses: totalExpenses._sum.amount || 0,
    expenseCount,
    averageExpense: expenseCount > 0 ? (totalExpenses._sum.amount || 0) / expenseCount : 0,
    categoryBreakdown: categoryBreakdownWithNames,
    paymentMethodBreakdown: paymentMethodBreakdown.map(item => ({
      paymentMethod: item.paymentMethod,
      totalAmount: item._sum.amount || 0,
      count: item._count.paymentMethod,
    })),
    monthlyTrend,
  });
});

export { router as expenseRoutes };