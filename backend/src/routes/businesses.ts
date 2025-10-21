import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, requireBusinessAccess, requireAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

const updateBusinessSchema = createBusinessSchema.partial();

// Create business
router.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const data = createBusinessSchema.parse(req.body);

    // Create business with the user as admin
    const business = await prisma.business.create({
      data: {
        ...data,
        createdBy: userId,
        users: {
          create: {
            userId,
            role: 'admin',
            isActive: true,
            acceptedAt: new Date(),
          }
        }
      },
      include: {
        users: {
          include: {
            user: {
              include: {
                profile: true,
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Business created successfully',
      business,
    });
  } catch (error) {
    next(error);
  }
});

// Get business details
router.get('/:businessId', requireBusinessAccess(), async (req, res, next) => {
  try {
    const { businessId } = req.params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { isActive: true },
          include: {
            user: {
              include: {
                profile: true,
              }
            }
          }
        },
        _count: {
          select: {
            products: true,
            inventory: true,
            customers: true,
            orders: true,
          }
        }
      },
    });

    if (!business) {
      throw createError('Business not found', 404, 'BUSINESS_NOT_FOUND');
    }

    res.json({ business });
  } catch (error) {
    next(error);
  }
});

// Update business
router.put('/:businessId', requireAdmin, async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const data = updateBusinessSchema.parse(req.body);

    const business = await prisma.business.update({
      where: { id: businessId },
      data,
    });

    res.json({
      message: 'Business updated successfully',
      business,
    });
  } catch (error) {
    next(error);
  }
});

// Get business users
router.get('/:businessId/users', requireBusinessAccess(), async (req, res, next) => {
  try {
    const { businessId } = req.params;

    const users = await prisma.businessUser.findMany({
      where: { businessId },
      include: {
        user: {
          include: {
            profile: true,
          }
        },
        inviter: {
          include: {
            profile: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Invite user to business
router.post('/:businessId/users/invite', requireAdmin, async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const userId = (req as any).user.id;
    const { email, roleId } = z.object({
      email: z.string().email(),
      roleId: z.string().uuid().optional(),
    }).parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Check if already a member
    if (existingUser) {
      const existingMember = await prisma.businessUser.findFirst({
        where: {
          businessId,
          userId: existingUser.id,
        },
      });

      if (existingMember) {
        throw createError('User is already a member of this business', 409, 'USER_ALREADY_MEMBER');
      }
    }

    // Create invitation
    const invitation = await prisma.userInvitation.create({
      data: {
        businessId,
        email,
        roleId,
        invitedBy: userId,
        invitationToken: require('crypto').randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        business: true,
        role: true,
        inviter: {
          include: {
            profile: true,
          }
        }
      }
    });

    // TODO: Send invitation email

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation,
    });
  } catch (error) {
    next(error);
  }
});

// Update user role
router.put('/:businessId/users/:userId', requireAdmin, async (req, res, next) => {
  try {
    const { businessId, userId: targetUserId } = req.params;
    const { role, isActive } = z.object({
      role: z.string().optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);

    const businessUser = await prisma.businessUser.update({
      where: {
        businessId_userId: {
          businessId,
          userId: targetUserId,
        }
      },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: {
          include: {
            profile: true,
          }
        }
      }
    });

    res.json({
      message: 'User updated successfully',
      businessUser,
    });
  } catch (error) {
    next(error);
  }
});

// Remove user from business
router.delete('/:businessId/users/:userId', requireAdmin, async (req, res, next) => {
  try {
    const { businessId, userId: targetUserId } = req.params;
    const currentUserId = (req as any).user.id;

    // Prevent self-removal
    if (currentUserId === targetUserId) {
      throw createError('You cannot remove yourself from the business', 400, 'SELF_REMOVAL_NOT_ALLOWED');
    }

    await prisma.businessUser.delete({
      where: {
        businessId_userId: {
          businessId,
          userId: targetUserId,
        }
      }
    });

    res.json({
      message: 'User removed from business successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as businessRoutes };



