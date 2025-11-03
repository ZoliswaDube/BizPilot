import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
});

const updateSettingsSchema = z.object({
  businessName: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  defaultMargin: z.number().min(0).max(100).optional(),
});

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        business: true,
      },
    });

    if (!profile) {
      throw createError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const data = updateProfileSchema.parse(req.body);

    const profile = await prisma.userProfile.update({
      where: { userId },
      data,
      include: {
        business: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
});

// Get user settings
router.get('/settings', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      include: {
        business: true,
      },
    });

    if (!settings) {
      throw createError('Settings not found', 404, 'SETTINGS_NOT_FOUND');
    }

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

// Update user settings
router.put('/settings', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const data = updateSettingsSchema.parse(req.body);

    const settings = await prisma.userSettings.update({
      where: { userId },
      data,
      include: {
        business: true,
      },
    });

    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's businesses
router.get('/businesses', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const businessUsers = await prisma.businessUser.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        business: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const businesses = businessUsers.map(bu => ({
      id: bu.business.id,
      name: bu.business.name,
      description: bu.business.description,
      role: bu.role,
      joinedAt: bu.createdAt,
      logoUrl: bu.business.logoUrl,
    }));

    res.json({ businesses });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };



