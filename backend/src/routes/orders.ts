import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireBusinessAccess } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Validation schemas
const createOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    inventoryId: z.string().uuid().optional(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().positive(),
  discountAmount: z.number().nonnegative().default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  deliveryDate: z.string().datetime().optional(),
  shippingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'refunded']).optional(),
  notes: z.string().optional(),
  deliveryDate: z.string().datetime().optional(),
  actualDeliveryDate: z.string().datetime().optional(),
});

// Generate order number
async function generateOrderNumber(businessId: string): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `ORD-${year}${month}${day}`;
  
  const lastOrder = await prisma.order.findFirst({
    where: {
      businessId,
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

// GET /orders - List all orders for business
router.get('/', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const { 
    page = '1', 
    limit = '10', 
    status, 
    paymentStatus, 
    customerId,
    startDate,
    endDate,
    search 
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {
    businessId,
  };

  if (status) {
    where.status = status;
  }
  
  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }
  
  if (customerId) {
    where.customerId = customerId;
  }
  
  if (startDate || endDate) {
    where.orderDate = {};
    if (startDate) where.orderDate.gte = new Date(startDate as string);
    if (endDate) where.orderDate.lte = new Date(endDate as string);
  }
  
  if (search) {
    where.OR = [
      { orderNumber: { contains: search as string, mode: 'insensitive' } },
      { customer: { name: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            inventory: true,
          },
        },
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
      orderBy: {
        orderDate: 'desc',
      },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders,
    pagination: {
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

// GET /orders/:id - Get single order
router.get('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;

  const order = await prisma.order.findFirst({
    where: {
      id,
      businessId,
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          inventory: true,
        },
      },
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
      statusHistory: {
        include: {
          changer: {
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
          changedAt: 'asc',
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

// POST /orders - Create new order
router.post('/', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const userId = req.user!.id;
  
  const validatedData = createOrderSchema.parse(req.body);
  const orderNumber = await generateOrderNumber(businessId);

  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        businessId,
        customerId: validatedData.customerId,
        orderNumber,
        subtotal: validatedData.subtotal,
        taxAmount: validatedData.taxAmount,
        totalAmount: validatedData.totalAmount,
        discountAmount: validatedData.discountAmount,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes,
        deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : null,
        shippingAddress: validatedData.shippingAddress as any,
        billingAddress: validatedData.billingAddress as any,
        createdBy: userId,
      },
    });

    // Create order items
    for (const item of validatedData.items) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          inventoryId: item.inventoryId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        },
      });

      // Update inventory if inventoryId is provided
      if (item.inventoryId) {
        const inventory = await tx.inventory.findUnique({
          where: { id: item.inventoryId },
        });

        if (inventory && inventory.currentQuantity >= item.quantity) {
          await tx.inventory.update({
            where: { id: item.inventoryId },
            data: {
              currentQuantity: {
                decrement: item.quantity,
              },
            },
          });

          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              userId,
              businessId,
              inventoryId: item.inventoryId,
              type: 'sale',
              quantityChange: -item.quantity,
              newQuantity: inventory.currentQuantity - item.quantity,
              notes: `Sale - Order ${orderNumber}`,
            },
          });
        }
      }
    }

    // Create initial status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        status: 'pending',
        changedBy: userId,
        notes: 'Order created',
      },
    });

    return newOrder;
  });

  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          inventory: true,
        },
      },
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

  res.status(201).json(fullOrder);
});

// PUT /orders/:id - Update order
router.put('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;
  const userId = req.user!.id;
  
  const validatedData = updateOrderSchema.parse(req.body);

  const existingOrder = await prisma.order.findFirst({
    where: {
      id,
      businessId,
    },
  });

  if (!existingOrder) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    // Update order
    const order = await tx.order.update({
      where: { id },
      data: {
        status: validatedData.status,
        paymentStatus: validatedData.paymentStatus,
        notes: validatedData.notes,
        deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : undefined,
        actualDeliveryDate: validatedData.actualDeliveryDate ? new Date(validatedData.actualDeliveryDate) : undefined,
      },
    });

    // Create status history if status changed
    if (validatedData.status && validatedData.status !== existingOrder.status) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: validatedData.status,
          changedBy: userId,
          notes: `Status changed to ${validatedData.status}`,
        },
      });
    }

    return order;
  });

  const fullOrder = await prisma.order.findUnique({
    where: { id: updatedOrder.id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          inventory: true,
        },
      },
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
      statusHistory: {
        include: {
          changer: {
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
          changedAt: 'asc',
        },
      },
    },
  });

  res.json(fullOrder);
});

// DELETE /orders/:id - Delete order
router.delete('/:id', requireBusinessAccess(), async (req, res) => {
  const { id } = req.params;
  const businessId = req.user!.businessId!;

  const order = await prisma.order.findFirst({
    where: {
      id,
      businessId,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Only allow deletion of pending or cancelled orders
  if (!['pending', 'cancelled'].includes(order.status || '')) {
    return res.status(400).json({ 
      error: 'Can only delete pending or cancelled orders' 
    });
  }

  await prisma.$transaction(async (tx) => {
    // Restore inventory for cancelled orders
    if (order.status === 'pending') {
      for (const item of order.items) {
        if (item.inventoryId) {
          await tx.inventory.update({
            where: { id: item.inventoryId },
            data: {
              currentQuantity: {
                increment: item.quantity,
              },
            },
          });

          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              userId: req.user!.id,
              businessId,
              inventoryId: item.inventoryId,
              type: 'adjustment',
              quantityChange: item.quantity,
              newQuantity: 0, // Will be updated by trigger
              notes: `Order deletion - Inventory restored`,
            },
          });
        }
      }
    }

    // Delete order (cascade will handle items and status history)
    await tx.order.delete({
      where: { id },
    });
  });

  res.status(204).send();
});

// GET /orders/stats - Get order statistics
router.get('/stats/summary', requireBusinessAccess(), async (req, res) => {
  const businessId = req.user!.businessId!;
  const { startDate, endDate } = req.query;

  const where: any = { businessId };
  
  if (startDate || endDate) {
    where.orderDate = {};
    if (startDate) where.orderDate.gte = new Date(startDate as string);
    if (endDate) where.orderDate.lte = new Date(endDate as string);
  }

  const [
    totalOrders,
    totalRevenue,
    averageOrderValue,
    statusBreakdown,
    paymentStatusBreakdown,
  ] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.order.aggregate({
      where,
      _avg: {
        totalAmount: true,
      },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    }),
    prisma.order.groupBy({
      by: ['paymentStatus'],
      where,
      _count: {
        paymentStatus: true,
      },
    }),
  ]);

  res.json({
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    averageOrderValue: averageOrderValue._avg.totalAmount || 0,
    statusBreakdown: statusBreakdown.reduce((acc, item) => {
      acc[item.status || 'unknown'] = item._count.status;
      return acc;
    }, {} as Record<string, number>),
    paymentStatusBreakdown: paymentStatusBreakdown.reduce((acc, item) => {
      acc[item.paymentStatus || 'unknown'] = item._count.paymentStatus;
      return acc;
    }, {} as Record<string, number>),
  });
});

export { router as orderRoutes };