# BizPilot Deployment Guide

This guide covers deployment options for the BizPilot monorepo architecture.

## Architecture Overview

The new BizPilot architecture consists of:

- **Backend**: Node.js/TypeScript API with Express, Prisma, JWT auth
- **Web**: Next.js/TypeScript frontend
- **Mobile**: React Native app (updated to use new backend)
- **Shared**: Common types and API client
- **Database**: PostgreSQL (migrated from Supabase)

## Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Local Development

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd BizPilot
   ```

2. **Install dependencies:**
   ```bash
   # Backend
   cd backend && npm install
   
   # Web
   cd ../web && npm install
   
   # Mobile
   cd ../mobile && npm install
   
   # Shared
   cd ../shared && npm install
   ```

3. **Setup environment variables:**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Edit backend/.env with your values
   
   # Web
   cp web/.env.example web/.env.local
   # Edit web/.env.local with your values
   ```

4. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Development servers:**
   ```bash
   # Backend (if not using Docker)
   cd backend && npm run dev
   
   # Web (if not using Docker)
   cd web && npm run dev
   
   # Mobile
   cd mobile && npm start
   ```

## Production Deployment

### Render.com Deployment

#### 1. Database Setup

1. **Create PostgreSQL database on Render:**
   - Go to Render Dashboard
   - Create new PostgreSQL database
   - Note the connection string

#### 2. Backend Deployment

1. **Create new Web Service on Render:**
   - Connect your GitHub repository
   - Set build command: `cd backend && npm install && npm run build`
   - Set start command: `cd backend && npm start`
   - Set environment variables:
     ```
     NODE_ENV=production
     DATABASE_URL=<your-render-postgres-url>
     JWT_SECRET=<generate-strong-secret>
     JWT_REFRESH_SECRET=<generate-strong-secret>
     GOOGLE_CLIENT_ID=<your-google-oauth-id>
     GOOGLE_CLIENT_SECRET=<your-google-oauth-secret>
     GITHUB_CLIENT_ID=<your-github-oauth-id>
     GITHUB_CLIENT_SECRET=<your-github-oauth-secret>
     CORS_ORIGIN=<your-frontend-url>
     ```

2. **Configure build settings:**
   - Root directory: `backend`
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && npm start`

#### 3. Web Frontend Deployment

1. **Create new Static Site on Render:**
   - Connect your GitHub repository
   - Set build command: `cd web && npm install && npm run build`
   - Set publish directory: `web/out` or `web/.next`
   - Set environment variables:
     ```
     NEXT_PUBLIC_API_URL=<your-backend-url>/api/v1
     NEXT_PUBLIC_WEB_URL=<your-frontend-url>
     ```

#### 4. Mobile App Updates

1. **Update API configuration:**
   ```typescript
   // mobile/src/config/api.ts
   export const API_BASE_URL = 'https://your-backend-url.onrender.com/api/v1';
   ```

2. **Build and deploy:**
   ```bash
   cd mobile
   # For iOS
   npx expo build:ios
   
   # For Android
   npx expo build:android
   ```

### Alternative: Railway Deployment

#### Backend on Railway

1. **Connect GitHub repository**
2. **Set environment variables** (same as Render)
3. **Configure build:**
   - Root directory: `backend`
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && npm start`

#### Frontend on Vercel

1. **Connect GitHub repository**
2. **Set build settings:**
   - Framework: Next.js
   - Root directory: `web`
   - Build command: `npm run build`
   - Output directory: `.next`

### Environment Variables Reference

#### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# OAuth2 Configuration
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

# Server Configuration
PORT=5000
NODE_ENV="production"
CORS_ORIGIN="https://your-frontend-domain.com"

# Optional: Redis for caching
REDIS_URL="redis://localhost:6379"
```

#### Web (.env.local)
```bash
NEXT_PUBLIC_API_URL="https://your-backend-domain.com/api/v1"
NEXT_PUBLIC_WEB_URL="https://your-frontend-domain.com"
```

#### Mobile (config/api.ts)
```typescript
export const API_BASE_URL = 'https://your-backend-domain.com/api/v1';
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy BizPilot

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      # Test backend
      - name: Test Backend
        run: |
          cd backend
          npm install
          npm run test
      
      # Test web
      - name: Test Web
        run: |
          cd web
          npm install
          npm run test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        # Add your deployment steps here
        run: echo "Deploy backend to Render"

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        # Add your deployment steps here
        run: echo "Deploy web to Vercel"
```

## Database Migration from Supabase

### Export Data from Supabase

1. **Using pg_dump:**
   ```bash
   pg_dump "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
     --data-only --inserts --table=public.* > supabase_data.sql
   ```

2. **Using Supabase CLI:**
   ```bash
   supabase db dump --data-only > supabase_data.sql
   ```

### Import to New Database

1. **Run Prisma migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. **Import data:**
   ```bash
   psql "postgresql://user:password@host:port/database" < supabase_data.sql
   ```

## Monitoring and Logging

### Error Tracking
- **Sentry**: Add Sentry for error tracking in production
- **LogRocket**: For session replay and debugging

### Performance Monitoring
- **New Relic** or **DataDog**: For application performance monitoring
- **Render Metrics**: Built-in monitoring on Render

### Health Checks
- Backend: `GET /health`
- Web: `GET /api/health`

## Security Checklist

- [ ] JWT secrets are strong and secure
- [ ] OAuth2 credentials are properly configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Database connections are encrypted
- [ ] Sensitive data is properly sanitized
- [ ] Input validation is implemented
- [ ] Error messages don't leak sensitive information

## Scaling Considerations

### Horizontal Scaling
- Backend: Deploy multiple instances behind a load balancer
- Database: Use read replicas for read-heavy workloads
- Redis: Use Redis Cluster for caching

### Performance Optimization
- Enable compression and caching
- Use CDN for static assets
- Optimize database queries
- Implement proper indexing
- Use connection pooling

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check DATABASE_URL format
   - Verify network connectivity
   - Check database credentials

2. **CORS Errors**
   - Verify CORS_ORIGIN environment variable
   - Check frontend URL configuration

3. **JWT Token Issues**
   - Verify JWT secrets are consistent
   - Check token expiration settings
   - Validate token refresh logic

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

### Logs and Debugging

- Backend logs: Check application logs for API errors
- Database logs: Monitor database performance and errors
- Frontend logs: Use browser dev tools and error tracking
- Mobile logs: Use React Native debugging tools



