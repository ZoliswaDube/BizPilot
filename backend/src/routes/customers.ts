import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireBusinessAccess } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']).default('email'),
});

const updateCustomerSchema = createCustomerSchema.partial();

// GET /customers - List all customers for business
router.get('/', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const { 
    page = '1', 
    limit = '10', 
    search,
    tag,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {
    businessId,
    isActive: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { company: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (tag) {
    where.tags = {
      has: tag as string,
    };
  }

  const orderBy: any = {};
  orderBy[sortBy as string] = sortOrder;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            orderDate: true,
            status: true,
          },
          orderBy: {
            orderDate: 'desc',
          },
          take: 5, // Last 5 orders
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy,
      skip,
      take: parseInt(limit as string),
    }),
    prisma.customer.count({ where }),
  ]);

  // Calculate customer metrics
  const customersWithMetrics = customers.map(customer => ({
    ...customer,
    metrics: {
      totalOrders: customer._count.orders,
      totalSpent: customer.orders.reduce((sum, order) => sum + (order.totalAmount?.toNumber() || 0), 0),
      averageOrderValue: customer.orders.length > 0 
        ? customer.orders.reduce((sum, order) => sum + (order.totalAmount?.toNumber() || 0), 0) / customer.orders.length
        : 0,
      lastOrderDate: customer.orders[0]?.orderDate || null,
    },
  }));

  res.json({
    customers: customersWithMetrics,
    pagination: {
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

// GET /customers/:id - Get single customer
router.get('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      businessId,
    },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          orderDate: 'desc',
        },
      },
      communications: {
        include: {
          sender: {
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
        orderBy: {
          sentAt: 'desc',
        },
      },
      _count: {
        select: {
          orders: true,
          communications: true,
        },
      },
    },
  });

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Calculate metrics
  const totalSpent = customer.orders.reduce((sum, order) => sum + (order.totalAmount?.toNumber() || 0), 0);
  const averageOrderValue = customer.orders.length > 0 ? totalSpent / customer.orders.length : 0;
  const lastOrderDate = customer.orders[0]?.orderDate || null;

  res.json({
    ...customer,
    metrics: {
      totalOrders: customer._count.orders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      totalCommunications: customer._count.communications,
    },
  });
});

// POST /customers - Create new customer
router.post('/', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const userId = req.user!.id;
  
  const validatedData = createCustomerSchema.parse(req.body);

  // Check for duplicate email if provided
  if (validatedData.email) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        businessId,
        email: validatedData.email,
        isActive: true,
      },
    });

    if (existingCustomer) {
      return res.status(400).json({ 
        error: 'Customer with this email already exists' 
      });
    }
  }

  const customer = await prisma.customer.create({
    data: {
      businessId,
      createdBy: userId,
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      company: validatedData.company,
      address: validatedData.address as any,
      notes: validatedData.notes,
      tags: validatedData.tags,
      preferredContactMethod: validatedData.preferredContactMethod,
    },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  res.status(201).json({
    ...customer,
    metrics: {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
    },
  });
});

// PUT /customers/:id - Update customer
router.put('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;
  
  const validatedData = updateCustomerSchema.parse(req.body);

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      id,
      businessId,
    },
  });

  if (!existingCustomer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Check for duplicate email if changing email
  if (validatedData.email && validatedData.email !== existingCustomer.email) {
    const duplicateCustomer = await prisma.customer.findFirst({
      where: {
        businessId,
        email: validatedData.email,
        isActive: true,
        id: { not: id },
      },
    });

    if (duplicateCustomer) {
      return res.status(400).json({ 
        error: 'Customer with this email already exists' 
      });
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      company: validatedData.company,
      address: validatedData.address as any,
      notes: validatedData.notes,
      tags: validatedData.tags,
      preferredContactMethod: validatedData.preferredContactMethod,
    },
    include: {
      orders: {
        select: {
          totalAmount: true,
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  // Calculate metrics
  const totalSpent = customer.orders.reduce((sum, order) => sum + (order.totalAmount?.toNumber() || 0), 0);
  const averageOrderValue = customer.orders.length > 0 ? totalSpent / customer.orders.length : 0;

  res.json({
    ...customer,
    metrics: {
      totalOrders: customer._count.orders,
      totalSpent,
      averageOrderValue,
      lastOrderDate: null,
    },
  });
});

// DELETE /customers/:id - Soft delete customer
router.delete('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      businessId,
    },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Check if customer has orders
  if (customer._count.orders > 0) {
    // Soft delete instead of hard delete
    await prisma.customer.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  } else {
    // Hard delete if no orders
    await prisma.customer.delete({
      where: { id },
    });
  }

  res.status(204).send();
});

// GET /customers/stats - Get customer statistics
router.get('/stats/summary', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;

  const [
    totalCustomers,
    activeCustomers,
    customersWithOrders,
    recentCustomers,
    topCustomers,
  ] = await Promise.all([
    prisma.customer.count({
      where: { businessId },
    }),
    prisma.customer.count({
      where: { businessId, isActive: true },
    }),
    prisma.customer.count({
      where: {
        businessId,
        isActive: true,
        orders: {
          some: {},
        },
      },
    }),
    prisma.customer.count({
      where: {
        businessId,
        isActive: true,
        customerSince: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
    prisma.customer.findMany({
      where: {
        businessId,
        isActive: true,
        orders: {
          some: {},
        },
      },
      include: {
        orders: {
          select: {
            totalAmount: true,
          },
        },
      },
      take: 10,
    }),
  ]);

  // Calculate top customers by total spent
  const topCustomersBySpending = topCustomers
    .map(customer => ({
      ...customer,
      totalSpent: customer.orders.reduce((sum, order) => sum + (order.totalAmount?.toNumber() || 0), 0),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  res.json({
    totalCustomers,
    activeCustomers,
    customersWithOrders,
    recentCustomers,
    topCustomers: topCustomersBySpending,
    conversionRate: totalCustomers > 0 ? (customersWithOrders / totalCustomers) * 100 : 0,
  });
});

// POST /customers/:id/communications - Add communication record
router.post('/:id/communications', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;
  const userId = req.user!.id;

  const { type, subject, content, status = 'sent' } = req.body;

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      businessId,
    },
  });

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const communication = await prisma.customerCommunication.create({
    data: {
      customerId: id,
      businessId,
      sentBy: userId,
      type,
      subject,
      content,
      status,
    },
    include: {
      sender: {
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

  res.status(201).json(communication);
});

export { router as customerRoutes };