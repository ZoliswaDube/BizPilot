import { Router } from 'express';
import bcrypt from 'bcryptjs';
import passport from '../config/auth';
import { prisma } from '../config/database';
import { generateTokens, verifyToken, authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Register endpoint
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password, fullName } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with profile and settings
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        provider: 'email',
        profile: {
          create: {
            email,
            fullName,
            provider: 'email',
            emailVerified: false,
          }
        },
        settings: {
          create: {
            hourlyRate: 15.00,
            defaultMargin: 40.00,
          }
        }
      },
      include: {
        profile: true,
        settings: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
        emailVerified: user.emailVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login endpoint
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        settings: true,
      },
    });

    if (!user || !user.password) {
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        settings: user.settings,
        emailVerified: user.emailVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        settings: true,
      },
    });

    if (!user) {
      throw createError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    res.json({
      message: 'Tokens refreshed successfully',
      tokens,
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            business: true,
          }
        },
        settings: {
          include: {
            business: true,
          }
        },
        businessUsers: {
          where: { isActive: true },
          include: {
            business: true,
          }
        }
      },
    });

    if (!user) {
      throw createError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        provider: user.provider,
        emailVerified: user.emailVerified,
        profile: user.profile,
        settings: user.settings,
        businesses: user.businessUsers.map(bu => ({
          id: bu.business.id,
          name: bu.business.name,
          role: bu.role,
          isActive: bu.isActive,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const user = req.user as any;
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.WEB_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
  }
);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'],
    session: false 
  })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  (req, res) => {
    const user = req.user as any;
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.WEB_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
  }
);

// Logout endpoint (client-side token invalidation)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    message: 'Logout successful. Please remove tokens from client storage.',
  });
});

// Password reset request
router.post('/forgot-password', authRateLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

    // TODO: Implement email service for password reset
    // For now, just log the reset token
    if (user && user.password) { // Only for email users
      const resetToken = generateTokens(user.id).accessToken;
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };

