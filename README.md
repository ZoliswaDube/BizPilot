# BizPilot - Comprehensive Business Management Platform

A scalable, full-stack business management platform built with modern technologies and a microservices-oriented architecture.

## 🏗️ Architecture Overview

BizPilot has been refactored into a modern, scalable monorepo architecture:

```
BizPilot/
├── backend/           # Node.js/TypeScript API
├── web/              # Next.js/TypeScript Frontend
├── mobile/           # React Native App
├── shared/           # Shared types and utilities
├── docker-compose.yml # Development environment
└── DEPLOYMENT.md     # Deployment guide
```

## 🚀 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with OAuth2 (Google, GitHub)
- **Authorization**: Role-based access control (RBAC)
- **Validation**: Zod schemas
- **Caching**: Redis (optional)
- **Rate Limiting**: Express rate limiter

### Frontend (Web)
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Form Handling**: React Hook Form + Zod
- **Charts**: Chart.js + React Chart.js 2
- **Animations**: Framer Motion

### Mobile
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Styling**: StyleSheet + Expo LinearGradient
- **Icons**: Lucide React Native

### Shared
- **Types**: TypeScript interfaces and types
- **API Client**: Axios-based client with token refresh
- **Validation**: Zod schemas
- **Utilities**: Common functions and constants

### Database
- **Primary**: PostgreSQL
- **ORM**: Prisma
- **Migrations**: Prisma Migrate
- **Schema**: Auto-generated from Supabase introspection

## 🎯 Key Features

### Business Management
- Multi-business support with role-based access
- Business profiles and settings
- User invitation system
- Team collaboration tools

### Product & Inventory Management
- Product catalog with SKU/barcode tracking
- Ingredient-based cost calculations
- Real-time inventory tracking
- Low stock alerts and reorder points
- Batch/lot number tracking with expiration dates

### Order & Customer Management
- Order processing and tracking
- Customer database with history
- Order status management
- Customer communication tools

### Financial Management
- Expense tracking and categorization
- Financial reporting and analytics
- Profit margin analysis
- Tax-deductible expense tracking

### AI-Powered Features
- Business insights and recommendations
- Conversation-based assistance
- Data-driven decision support

### QR Code Generation
- Custom QR codes for products
- Tip collection systems
- Digital business cards

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone and install:**
   ```bash
   git clone <repository>
   cd BizPilot
   npm run install:all
   ```

2. **Setup environment:**
   ```bash
   # Copy environment files
   cp backend/env.example backend/.env
   cp web/.env.example web/.env.local
   
   # Edit the .env files with your configuration
   ```

3. **Start development environment:**
   ```bash
   # Start with Docker (recommended)
   npm run docker:up
   
   # Or start services individually
   npm run dev
   ```

4. **Setup database:**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

### Development Commands

```bash
# Install dependencies for all packages
npm run install:all

# Start all development servers
npm run dev

# Start individual services
npm run dev:backend    # Backend API
npm run dev:web        # Next.js frontend
npm run dev:mobile     # React Native mobile

# Build all packages
npm run build

# Run tests
npm run test

# Database operations
npm run db:migrate     # Run migrations
npm run db:generate    # Generate Prisma client
npm run db:studio      # Open Prisma Studio

# Docker operations
npm run docker:up      # Start containers
npm run docker:down    # Stop containers
npm run docker:build   # Rebuild containers
```

## 🔐 Authentication & Authorization

### Authentication Methods
- **Email/Password**: Traditional login with bcrypt hashing
- **Google OAuth**: Sign in with Google
- **GitHub OAuth**: Sign in with GitHub
- **JWT Tokens**: Access and refresh token system

### Authorization
- **Role-Based Access Control (RBAC)**
- **Business-Level Permissions**
- **Resource Ownership Checks**
- **Permission-Based Access Control**

### Roles
- **Admin**: Full access to all features
- **Manager**: Product, inventory, and report management
- **Employee**: Basic inventory and product access

## 🗄️ Database Schema

The database has been migrated from Supabase with the following key entities:

### Core Entities
- **Users**: Authentication and profile information
- **Businesses**: Multi-tenant business management
- **BusinessUsers**: User-business relationships with roles

### Business Data
- **Products**: Product catalog with pricing and costs
- **Inventory**: Stock tracking with batch/lot management
- **Categories**: Product categorization system
- **Suppliers**: Vendor management

### Financial
- **Orders**: Order processing and tracking
- **OrderItems**: Individual order line items
- **Customers**: Customer database
- **Expenses**: Expense tracking and categorization
- **FinancialReports**: Automated financial reporting

### Features
- **AiConversations**: AI chat history
- **QrCodes**: Generated QR codes for various purposes

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

#### Render.com (Recommended)
- **Backend**: Web Service with PostgreSQL addon
- **Frontend**: Static Site
- **Database**: Managed PostgreSQL

#### Railway + Vercel
- **Backend**: Railway deployment
- **Frontend**: Vercel deployment
- **Database**: Railway PostgreSQL

#### Docker Deployment
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d
```

## 📱 Mobile App

The React Native mobile app has been updated to use the new backend APIs:

### Features
- Native authentication with OAuth support
- Business management on mobile
- Inventory tracking with barcode scanning
- Order management
- Real-time synchronization

### Development
```bash
cd mobile

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test
```

### Frontend Testing
```bash
cd web
npm run test
```

### Mobile Testing
```bash
cd mobile
npm run test
```

## 📊 API Documentation

### Base URL
- **Development**: `http://localhost:5000/api/v1`
- **Production**: `https://your-backend-domain.com/api/v1`

### Authentication
All API endpoints (except auth) require a Bearer token:
```
Authorization: Bearer <access_token>
```

### Key Endpoints

#### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Register new user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `GET /auth/google` - Google OAuth login
- `GET /auth/github` - GitHub OAuth login

#### Business Management
- `POST /businesses` - Create business
- `GET /businesses/:id` - Get business details
- `PUT /businesses/:id` - Update business
- `GET /businesses/:id/users` - Get business users

#### Products & Inventory
- `GET /products` - List products
- `POST /products` - Create product
- `GET /inventory` - List inventory items
- `POST /inventory` - Add inventory item

## 🔧 Configuration

### Environment Variables

#### Backend
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...
```

#### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_WEB_URL=http://localhost:3000
```

#### Mobile
Configure API base URL in `mobile/src/config/api.ts`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Create a Pull Request

### Code Standards
- TypeScript for all new code
- ESLint and Prettier for formatting
- Conventional commit messages
- Comprehensive tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for common issues
- Review API documentation for endpoint details

## 🗺️ Roadmap

### Phase 1: Core Platform (Completed)
- ✅ Monorepo architecture
- ✅ Backend API with authentication
- ✅ Database migration from Supabase
- ✅ Basic web frontend
- ✅ Mobile app updates

### Phase 2: Enhanced Features (In Progress)
- 🔄 Advanced reporting and analytics
- 🔄 Real-time notifications
- 🔄 Advanced inventory management
- 🔄 E-commerce integration

### Phase 3: Scale & Polish
- ⏳ Performance optimization
- ⏳ Advanced AI features
- ⏳ Third-party integrations
- ⏳ Mobile app store deployment

---

**BizPilot** - Empowering businesses with intelligent management tools.