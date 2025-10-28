import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma } from './database';

const JWT_SECRET = process.env.JWT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

// JWT Strategy
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
  issuer: 'bizpilot-api',
  audience: 'bizpilot-app',
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        settings: true,
      },
    });

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/v1/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: profile.emails?.[0]?.value },
            { 
              provider: 'google',
              providerId: profile.id 
            }
          ]
        },
        include: {
          profile: true,
          settings: true,
        },
      });

      if (user) {
        // Update provider info if needed
        if (user.provider !== 'google' || user.providerId !== profile.id) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              provider: 'google',
              providerId: profile.id,
              emailVerified: true,
            },
            include: {
              profile: true,
              settings: true,
            },
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: profile.emails?.[0]?.value || '',
            provider: 'google',
            providerId: profile.id,
            emailVerified: true,
            profile: {
              create: {
                email: profile.emails?.[0]?.value || '',
                fullName: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value,
                provider: 'google',
                emailVerified: true,
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
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// GitHub OAuth Strategy
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: '/api/v1/auth/github/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: profile.emails?.[0]?.value },
            { 
              provider: 'github',
              providerId: profile.id 
            }
          ]
        },
        include: {
          profile: true,
          settings: true,
        },
      });

      if (user) {
        // Update provider info if needed
        if (user.provider !== 'github' || user.providerId !== profile.id) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              provider: 'github',
              providerId: profile.id,
              emailVerified: true,
            },
            include: {
              profile: true,
              settings: true,
            },
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: profile.emails?.[0]?.value || '',
            provider: 'github',
            providerId: profile.id,
            emailVerified: true,
            profile: {
              create: {
                email: profile.emails?.[0]?.value || '',
                fullName: profile.displayName || profile.username,
                avatarUrl: profile.photos?.[0]?.value,
                provider: 'github',
                emailVerified: true,
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
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

export default passport;

