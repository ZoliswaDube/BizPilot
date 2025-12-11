# BizPilot v2.0 - Beads PRD for Issue-Driven Development

> **Purpose:** This document contains feature prompts designed to be converted into GitHub issues using [Beads](https://github.com/steveyegge/beads). Each section represents a feature that will become an issue for implementation.
>
> **Target Stack:** Python (FastAPI + Next.js 14) - See `PRP_Application_Rewrite.md` for full architecture details.

---

## 🚀 How to Use This Document with Beads

### Step 1: Install Beads
```bash
npm install -g @anthropic-ai/beads
# or
npx @anthropic-ai/beads
```

### Step 2: Create a New Repository
```bash
# Create new repo on GitHub: BizPilot-v2
git clone https://github.com/YOUR_USERNAME/BizPilot-v2.git
cd BizPilot-v2
```

### Step 3: Initialize Beads
```bash
beads init
```

### Step 4: Generate Issues from This PRD
```bash
# Copy this file to the new repo
cp path/to/BEADS_PRD.md ./prd.md

# Generate issues using beads
beads plan
```

### Step 5: Implement Issues
```bash
# Work through issues one by one
beads work <issue-number>
```

### Step 6: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 📋 PHASE 1: PROJECT FOUNDATION

### Issue: Project Repository Setup

Set up the monorepo structure for BizPilot v2.0 using the recommended Python + Next.js stack.

**Requirements:**
- Create a monorepo structure with the following directories:
  - `backend/` - FastAPI application
  - `frontend/` - Next.js 14 application  
  - `shared/` - Shared types and contracts
  - `infrastructure/` - Docker and deployment configs
- Initialize Python virtual environment with Poetry or pip
- Initialize Next.js 14 with App Router, TypeScript, and Tailwind CSS
- Set up pnpm workspaces for the frontend
- Create `.env.example` files for both backend and frontend
- Add comprehensive `.gitignore` for Python and Node.js

**Acceptance Criteria:**
- [ ] Monorepo structure created
- [ ] Backend runs with `uvicorn app.main:app --reload`
- [ ] Frontend runs with `pnpm dev`
- [ ] Both can be started with a single command via Docker Compose

---

### Issue: Docker Development Environment

Create a complete Docker-based development environment for local development.

**Requirements:**
- Create `docker-compose.yml` with services:
  - `api` - FastAPI backend
  - `web` - Next.js frontend
  - `db` - PostgreSQL 16
  - `redis` - Redis 7 for caching
  - `mailhog` - Local email testing
- Create Dockerfiles for backend and frontend
- Set up hot-reload for both services
- Configure networking between services
- Add health checks for all services

**Acceptance Criteria:**
- [ ] `docker-compose up` starts all services
- [ ] Hot reload works for both backend and frontend
- [ ] Database is accessible from backend
- [ ] Environment variables are properly configured

---

### Issue: CI/CD Pipeline Setup

Configure GitHub Actions for continuous integration and deployment to Vercel.

**Requirements:**
- Create `.github/workflows/ci.yml` with:
  - Linting (ruff for Python, ESLint for TypeScript)
  - Type checking (mypy, tsc)
  - Unit tests (pytest, vitest)
  - Build verification
- Create `.github/workflows/deploy.yml` for Vercel deployment
- Add branch protection rules configuration
- Set up Dependabot for dependency updates
- Create PR template with checklist

**Acceptance Criteria:**
- [ ] CI runs on all PRs
- [ ] Deployment triggers on main branch merge
- [ ] All checks must pass before merge
- [ ] Build artifacts are cached

---

### Issue: Database Schema and Migrations

Design and implement the core database schema using SQLAlchemy and Alembic.

**Requirements:**
- Create SQLAlchemy models for core entities:
  - `User` - Authentication and profile
  - `Organization` - Parent organization
  - `Business` - Individual business units
  - `BusinessUser` - User-business relationship with roles
  - `Role` - Permission roles
  - `Permission` - Granular permissions
- Set up Alembic for migrations
- Create initial migration with all base tables
- Add database seeding script for development data
- Implement soft delete pattern for all entities

**Database Schema:**
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses table
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    tax_rate DECIMAL(5,2) DEFAULT 15.00,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Acceptance Criteria:**
- [ ] All core tables created
- [ ] Migrations run successfully
- [ ] Seed data populates test database
- [ ] Foreign key relationships are correct

---

## 📋 PHASE 1: AUTHENTICATION & AUTHORIZATION

### Issue: FastAPI Authentication System

Implement a complete authentication system with JWT tokens and OAuth2.

**Requirements:**
- Set up FastAPI-Users or custom auth with:
  - Email/password registration
  - Email verification flow
  - Password reset functionality
  - JWT access and refresh tokens
- Create auth endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
  - `GET /api/v1/auth/me`
- Implement password hashing with bcrypt
- Add rate limiting for auth endpoints
- Create auth middleware for protected routes

**Acceptance Criteria:**
- [ ] Users can register with email/password
- [ ] Users can login and receive JWT tokens
- [ ] Refresh token rotation works correctly
- [ ] Password reset flow is functional
- [ ] Rate limiting prevents brute force attacks

---

### Issue: Google OAuth Integration

Add Google OAuth2 authentication as an alternative login method.

**Requirements:**
- Register OAuth2 application with Google
- Create OAuth2 flow endpoints:
  - `GET /api/v1/auth/google` - Initiate OAuth flow
  - `GET /api/v1/auth/google/callback` - Handle callback
- Link OAuth accounts to existing users by email
- Handle new user creation from OAuth
- Store OAuth tokens securely
- Support account linking for existing users

**Acceptance Criteria:**
- [ ] Users can sign in with Google
- [ ] New users are created from Google profile
- [ ] Existing users can link Google account
- [ ] OAuth tokens are stored securely
- [ ] Frontend redirects work correctly

---

### Issue: Role-Based Access Control (RBAC)

Implement a flexible permission system with role-based access control.

**Requirements:**
- Create Permission enum with all granular permissions:
  ```python
  class Permission(str, Enum):
      # Products
      PRODUCTS_VIEW = "products:view"
      PRODUCTS_CREATE = "products:create"
      PRODUCTS_UPDATE = "products:update"
      PRODUCTS_DELETE = "products:delete"
      # Inventory
      INVENTORY_VIEW = "inventory:view"
      INVENTORY_ADJUST = "inventory:adjust"
      # Orders
      ORDERS_VIEW = "orders:view"
      ORDERS_CREATE = "orders:create"
      ORDERS_FULFILL = "orders:fulfill"
      # ... etc
  ```
- Create default roles (Admin, Manager, Employee)
- Implement custom role creation
- Create permission checking decorator
- Add business-scoped permissions
- Implement permission inheritance

**Acceptance Criteria:**
- [ ] Users can be assigned roles
- [ ] Permissions are enforced on all endpoints
- [ ] Custom roles can be created
- [ ] Admin can manage roles for their business
- [ ] Permission checks include business context

---

### Issue: Next.js Authentication UI

Create the authentication pages and components in Next.js.

**Requirements:**
- Create auth pages with the existing BizPilot UI design:
  - `/auth/login` - Login page
  - `/auth/register` - Registration page
  - `/auth/forgot-password` - Password reset request
  - `/auth/reset-password` - Password reset form
  - `/auth/verify-email` - Email verification
- Implement auth context with Zustand
- Add protected route middleware
- Create useAuth hook for auth state
- Match the current BizPilot dark theme design

**UI Components:**
- AuthLayout with gradient background
- LoginForm with email/password and Google OAuth
- RegisterForm with validation
- PasswordResetForm
- LoadingSpinner during auth checks

**Acceptance Criteria:**
- [ ] All auth pages match current BizPilot design
- [ ] Forms have proper validation
- [ ] Error messages are user-friendly
- [ ] Loading states are smooth
- [ ] OAuth buttons work correctly

---

## 📋 PHASE 1: CORE UI FRAMEWORK

### Issue: Design System Setup

Set up the design system with shadcn/ui components matching the current BizPilot theme.

**Requirements:**
- Install and configure shadcn/ui
- Create custom theme matching BizPilot colors:
  ```css
  :root {
    --primary: 220 90% 56%;      /* Blue */
    --accent: 280 80% 60%;       /* Purple */
    --background: 220 20% 10%;   /* Dark background */
    --card: 220 20% 14%;         /* Card background */
    --border: 220 20% 20%;       /* Borders */
  }
  ```
- Add all required shadcn components:
  - Button, Input, Label, Form
  - Card, Dialog, Sheet
  - Table, DataTable
  - Select, Dropdown, Command
  - Toast, Alert
  - Tabs, Accordion
- Create custom BizPilot components:
  - GradientButton
  - StatCard
  - PageHeader
  - EmptyState

**Acceptance Criteria:**
- [ ] All components use consistent theming
- [ ] Dark mode is the default
- [ ] Components are responsive
- [ ] Animations are smooth (Framer Motion)

---

### Issue: Application Layout and Navigation

Create the main application layout with sidebar navigation.

**Requirements:**
- Create responsive sidebar layout:
  - Collapsible sidebar on desktop
  - Bottom navigation on mobile
  - Slide-out menu for tablet
- Navigation items matching current BizPilot:
  - Dashboard
  - Products
  - Inventory
  - Orders
  - Customers
  - Invoices
  - Payments
  - Reports
  - AI Assistant
  - Settings
- Add business switcher dropdown
- Create user menu with profile/logout
- Add breadcrumb navigation
- Implement keyboard shortcuts

**Acceptance Criteria:**
- [ ] Layout matches current BizPilot design
- [ ] Sidebar collapses correctly
- [ ] Mobile navigation works smoothly
- [ ] Active states are visible
- [ ] Business switcher works

---

### Issue: Dashboard Page

Create the main dashboard with business overview metrics.

**Requirements:**
- Create dashboard with stat cards:
  - Total Revenue (today/week/month)
  - Orders Count
  - Products Count
  - Low Stock Alerts
  - Pending Invoices
  - Active Customers
- Add charts using Recharts:
  - Revenue trend (line chart)
  - Orders by status (pie chart)
  - Top products (bar chart)
  - Inventory levels (horizontal bar)
- Create recent activity feed
- Add quick action buttons
- Implement data refresh

**Acceptance Criteria:**
- [ ] All metrics load correctly
- [ ] Charts are interactive
- [ ] Data refreshes on interval
- [ ] Mobile layout is optimized
- [ ] Loading skeletons show during fetch

---

## 📋 PHASE 2: PRODUCT MANAGEMENT

### Issue: Product API Endpoints

Create the FastAPI endpoints for product management.

**Requirements:**
- Create Product models and schemas:
  ```python
  class Product(BaseModel):
      id: UUID
      business_id: UUID
      sku: str
      name: str
      description: Optional[str]
      category_id: Optional[UUID]
      base_price: Decimal
      cost_price: Decimal
      tax_rate: Decimal
      status: ProductStatus
      images: List[str]
      created_at: datetime
  ```
- Implement CRUD endpoints:
  - `GET /api/v1/products` - List with pagination, filtering, search
  - `GET /api/v1/products/{id}` - Get single product
  - `POST /api/v1/products` - Create product
  - `PUT /api/v1/products/{id}` - Update product
  - `DELETE /api/v1/products/{id}` - Soft delete
- Add bulk operations:
  - `POST /api/v1/products/bulk` - Bulk create
  - `DELETE /api/v1/products/bulk` - Bulk delete
- Implement filtering by category, status, price range
- Add sorting and pagination

**Acceptance Criteria:**
- [ ] All CRUD operations work
- [ ] Pagination returns correct results
- [ ] Filtering works correctly
- [ ] Permissions are enforced
- [ ] Validation errors are clear

---

### Issue: Product Management UI

Create the product management pages in Next.js.

**Requirements:**
- Create product pages:
  - `/products` - Product list with DataTable
  - `/products/new` - Create product form
  - `/products/[id]` - Product detail view
  - `/products/[id]/edit` - Edit product form
- Product list features:
  - Search by name/SKU
  - Filter by category, status
  - Sort by name, price, date
  - Bulk actions (delete, update status)
- Product form features:
  - Dynamic ingredient management
  - Cost calculation
  - Margin calculator
  - Image upload
  - Category selection
- Match current BizPilot product UI design

**Acceptance Criteria:**
- [ ] Products can be created/edited/deleted
- [ ] Search and filtering work
- [ ] Cost calculations are accurate
- [ ] Image upload works
- [ ] UI matches current design

---

### Issue: Product Categories API and UI

Implement product categories with hierarchical support.

**Requirements:**
- Create Category model:
  ```python
  class Category(BaseModel):
      id: UUID
      business_id: UUID
      name: str
      parent_id: Optional[UUID]
      description: Optional[str]
      image_url: Optional[str]
      sort_order: int
  ```
- API endpoints:
  - `GET /api/v1/categories` - List all (tree structure)
  - `POST /api/v1/categories` - Create
  - `PUT /api/v1/categories/{id}` - Update
  - `DELETE /api/v1/categories/{id}` - Delete
  - `PUT /api/v1/categories/reorder` - Reorder
- UI components:
  - Category tree view
  - Category management modal
  - Category selector dropdown
  - Drag-and-drop reordering

**Acceptance Criteria:**
- [ ] Categories support hierarchy
- [ ] Reordering works
- [ ] Products can be assigned categories
- [ ] UI shows tree structure

---

## 📋 PHASE 2: INVENTORY MANAGEMENT

### Issue: Inventory API Endpoints

Create the inventory management API.

**Requirements:**
- Create Inventory models:
  ```python
  class InventoryItem(BaseModel):
      id: UUID
      product_id: UUID
      location_id: UUID
      quantity: Decimal
      reserved_quantity: Decimal
      lot_number: Optional[str]
      expiration_date: Optional[date]
      
  class InventoryTransaction(BaseModel):
      id: UUID
      product_id: UUID
      transaction_type: TransactionType
      quantity: Decimal
      reference_type: str
      reference_id: UUID
      created_by: UUID
  ```
- Implement endpoints:
  - `GET /api/v1/inventory` - List inventory
  - `GET /api/v1/inventory/{product_id}` - Product inventory
  - `POST /api/v1/inventory/adjust` - Adjust quantity
  - `POST /api/v1/inventory/transfer` - Transfer between locations
  - `GET /api/v1/inventory/low-stock` - Low stock alerts
  - `GET /api/v1/inventory/transactions` - Transaction history
- Implement automatic stock updates from orders
- Add low stock threshold calculations

**Acceptance Criteria:**
- [ ] Inventory quantities are accurate
- [ ] Adjustments create transactions
- [ ] Low stock alerts work
- [ ] History is maintained
- [ ] Order integration updates stock

---

### Issue: Inventory Management UI

Create the inventory management interface.

**Requirements:**
- Create inventory pages:
  - `/inventory` - Inventory list
  - `/inventory/adjust` - Adjustment form
  - `/inventory/transactions` - Transaction history
  - `/inventory/low-stock` - Low stock alerts
- Features:
  - Quick quantity adjustment (+/-)
  - Bulk import from CSV
  - Export to CSV/Excel
  - Stock value calculations
  - Reorder point settings
- Match current BizPilot inventory design

**Acceptance Criteria:**
- [ ] Inventory displays correctly
- [ ] Adjustments work
- [ ] Import/export functional
- [ ] Low stock alerts visible
- [ ] Mobile-friendly

---

## 📋 PHASE 2: ORDER MANAGEMENT

### Issue: Order API Endpoints

Create the order management API.

**Requirements:**
- Create Order models:
  ```python
  class Order(BaseModel):
      id: UUID
      business_id: UUID
      customer_id: Optional[UUID]
      order_number: str
      status: OrderStatus
      items: List[OrderItem]
      subtotal: Decimal
      tax_amount: Decimal
      discount_amount: Decimal
      total: Decimal
      notes: Optional[str]
      
  class OrderStatus(str, Enum):
      DRAFT = "draft"
      PENDING = "pending"
      CONFIRMED = "confirmed"
      PROCESSING = "processing"
      SHIPPED = "shipped"
      DELIVERED = "delivered"
      CANCELLED = "cancelled"
  ```
- Implement endpoints:
  - `GET /api/v1/orders` - List orders
  - `GET /api/v1/orders/{id}` - Get order details
  - `POST /api/v1/orders` - Create order
  - `PUT /api/v1/orders/{id}` - Update order
  - `PUT /api/v1/orders/{id}/status` - Update status
  - `POST /api/v1/orders/{id}/cancel` - Cancel order
- Implement order number generation
- Add inventory deduction on order confirmation
- Create order status workflow

**Acceptance Criteria:**
- [ ] Orders can be created and managed
- [ ] Status transitions are validated
- [ ] Inventory updates automatically
- [ ] Order numbers are unique
- [ ] Customer association works

---

### Issue: Order Management UI

Create the order management interface.

**Requirements:**
- Create order pages:
  - `/orders` - Order list with filters
  - `/orders/new` - Create order form
  - `/orders/[id]` - Order detail view
- Features:
  - Product search and add to order
  - Customer selection/creation
  - Discount application
  - Tax calculation
  - Order status timeline
  - Print order/packing slip
- Quick actions:
  - Confirm order
  - Mark as shipped
  - Mark as delivered
  - Cancel order
- Match current BizPilot order design

**Acceptance Criteria:**
- [ ] Orders can be created easily
- [ ] Status updates work
- [ ] Calculations are correct
- [ ] Print functionality works
- [ ] Mobile order creation works

---

## 📋 PHASE 2: CUSTOMER MANAGEMENT

### Issue: Customer API Endpoints

Create the customer management API.

**Requirements:**
- Create Customer models:
  ```python
  class Customer(BaseModel):
      id: UUID
      business_id: UUID
      name: str
      email: Optional[str]
      phone: Optional[str]
      address: Optional[Address]
      company: Optional[str]
      tax_number: Optional[str]
      notes: Optional[str]
      tags: List[str]
      total_orders: int
      total_spent: Decimal
  ```
- Implement endpoints:
  - `GET /api/v1/customers` - List with search
  - `GET /api/v1/customers/{id}` - Get customer with history
  - `POST /api/v1/customers` - Create customer
  - `PUT /api/v1/customers/{id}` - Update customer
  - `DELETE /api/v1/customers/{id}` - Soft delete
  - `GET /api/v1/customers/{id}/orders` - Customer orders
  - `GET /api/v1/customers/{id}/invoices` - Customer invoices
- Add customer metrics calculation
- Implement customer search

**Acceptance Criteria:**
- [ ] Customer CRUD works
- [ ] Search finds customers
- [ ] Order history is accessible
- [ ] Metrics are calculated
- [ ] Tags can be managed

---

### Issue: Customer Management UI

Create the customer management interface.

**Requirements:**
- Create customer pages:
  - `/customers` - Customer list
  - `/customers/new` - Create customer
  - `/customers/[id]` - Customer 360 view
  - `/customers/[id]/edit` - Edit customer
- Customer 360 view includes:
  - Contact information
  - Order history
  - Invoice history
  - Total spent metrics
  - Communication log
  - Notes
- Features:
  - Quick search
  - Tag filtering
  - Bulk import
  - Export to CSV

**Acceptance Criteria:**
- [ ] Customer management works
- [ ] 360 view shows all data
- [ ] Import/export works
- [ ] Search is fast
- [ ] Mobile-friendly

---

## 📋 PHASE 2: INVOICING & PAYMENTS

### Issue: Invoice API Endpoints

Create the invoicing system API.

**Requirements:**
- Create Invoice models:
  ```python
  class Invoice(BaseModel):
      id: UUID
      business_id: UUID
      customer_id: UUID
      order_id: Optional[UUID]
      invoice_number: str
      status: InvoiceStatus
      line_items: List[InvoiceLineItem]
      subtotal: Decimal
      tax_amount: Decimal
      total: Decimal
      due_date: date
      paid_amount: Decimal
      currency: str
  ```
- Implement endpoints:
  - `GET /api/v1/invoices` - List invoices
  - `GET /api/v1/invoices/{id}` - Get invoice
  - `POST /api/v1/invoices` - Create invoice
  - `PUT /api/v1/invoices/{id}` - Update invoice
  - `POST /api/v1/invoices/{id}/send` - Send to customer
  - `GET /api/v1/invoices/{id}/pdf` - Generate PDF
- Implement invoice number generation
- Add VAT/tax calculations (15% for South Africa)
- Create payment recording

**Acceptance Criteria:**
- [ ] Invoices can be created
- [ ] PDF generation works
- [ ] Tax calculations are correct
- [ ] Invoice numbers are sequential
- [ ] Payments can be recorded

---

### Issue: Invoice UI and PDF Generation

Create the invoicing interface and PDF templates.

**Requirements:**
- Create invoice pages:
  - `/invoices` - Invoice list
  - `/invoices/new` - Create invoice
  - `/invoices/[id]` - Invoice detail/preview
  - `/invoices/[id]/edit` - Edit invoice
- PDF template features:
  - Business logo and details
  - Customer details
  - Line items with totals
  - VAT breakdown
  - Bank details for payment
  - QR code for payment
- Invoice actions:
  - Send via email
  - Download PDF
  - Record payment
  - Mark as paid

**Acceptance Criteria:**
- [ ] Invoice creation works
- [ ] PDF looks professional
- [ ] Email sending works
- [ ] Payment recording works
- [ ] VAT-compliant format

---

### Issue: Payment Management

Create the payment tracking system.

**Requirements:**
- Create Payment models:
  ```python
  class Payment(BaseModel):
      id: UUID
      business_id: UUID
      invoice_id: UUID
      amount: Decimal
      method: PaymentMethod
      reference: Optional[str]
      status: PaymentStatus
      paid_at: datetime
  ```
- Implement endpoints:
  - `GET /api/v1/payments` - List payments
  - `POST /api/v1/payments` - Record payment
  - `GET /api/v1/payments/methods` - Payment methods
- Payment methods:
  - Cash
  - Bank Transfer (EFT)
  - Credit Card
  - PayFast
  - Yoco
  - SnapScan
- Auto-update invoice status on payment

**Acceptance Criteria:**
- [ ] Payments can be recorded
- [ ] Invoice status updates
- [ ] Multiple payment methods work
- [ ] Payment history is tracked

---

## 📋 PHASE 3: AI ASSISTANT

### Issue: AI Assistant Backend

Implement the AI business assistant using LangChain.

**Requirements:**
- Set up LangChain with OpenAI/Groq:
  ```python
  class AIBusinessAssistant:
      def __init__(self):
          self.llm = ChatOpenAI(model="gpt-4-turbo-preview")
          self.tools = [
              get_sales_data_tool,
              get_inventory_status_tool,
              get_customer_insights_tool,
              generate_report_tool,
          ]
  ```
- Create AI endpoints:
  - `POST /api/v1/ai/chat` - Send message
  - `GET /api/v1/ai/conversations` - List conversations
  - `GET /api/v1/ai/suggestions` - Get suggestions
- Implement business context loading
- Add conversation memory
- Create predefined question templates

**Acceptance Criteria:**
- [ ] AI responds to business questions
- [ ] Context includes business data
- [ ] Conversations are persisted
- [ ] Suggestions are relevant

---

### Issue: AI Chat Interface

Create the AI assistant chat interface.

**Requirements:**
- Create chat page `/ai`:
  - Chat message list
  - Message input with send
  - Quick question buttons
  - Conversation history sidebar
- Features:
  - Streaming responses
  - Markdown rendering
  - Code syntax highlighting
  - Chart rendering for data
  - Action buttons from AI
- Quick questions:
  - "What's my most profitable product?"
  - "Which items need restocking?"
  - "How are sales this month?"
  - "Who are my top customers?"
- Match current BizPilot AI chat design

**Acceptance Criteria:**
- [ ] Chat interface works smoothly
- [ ] Responses stream in real-time
- [ ] Quick questions work
- [ ] History is accessible
- [ ] Mobile-friendly

---

## 📋 PHASE 3: REPORTING & ANALYTICS

### Issue: Financial Reports API

Create the financial reporting system.

**Requirements:**
- Implement report endpoints:
  - `GET /api/v1/reports/revenue` - Revenue report
  - `GET /api/v1/reports/profit-loss` - P&L statement
  - `GET /api/v1/reports/expenses` - Expense report
  - `GET /api/v1/reports/tax` - Tax report (VAT)
  - `GET /api/v1/reports/cash-flow` - Cash flow
- Support date range filtering
- Add comparison periods
- Implement export to PDF/Excel
- Create scheduled report generation

**Acceptance Criteria:**
- [ ] All reports generate correctly
- [ ] Date filtering works
- [ ] Exports work
- [ ] Data is accurate

---

### Issue: Reports Dashboard UI

Create the reporting interface.

**Requirements:**
- Create reports page `/reports`:
  - Report type selector
  - Date range picker
  - Interactive charts
  - Drill-down capability
- Report types:
  - Revenue Overview
  - Profit & Loss
  - Top Products
  - Customer Analytics
  - Inventory Valuation
  - Tax Summary
- Export options:
  - PDF download
  - Excel download
  - Email schedule
- Match current BizPilot report design

**Acceptance Criteria:**
- [ ] All reports display correctly
- [ ] Charts are interactive
- [ ] Exports work
- [ ] Mobile layout works

---

## 📋 PHASE 3: QR CODE GENERATION

### Issue: QR Code Generator

Implement QR code generation for various purposes.

**Requirements:**
- Create QR endpoints:
  - `POST /api/v1/qr/generate` - Generate QR code
  - `GET /api/v1/qr/codes` - List generated codes
- QR code types:
  - Tip page QR
  - Product QR
  - Payment QR
  - Digital business card
- Features:
  - Customizable colors
  - Logo embedding
  - Download in PNG/SVG
- Match current BizPilot QR generator

**Acceptance Criteria:**
- [ ] QR codes generate correctly
- [ ] Customization works
- [ ] Downloads work
- [ ] Tip page links work

---

## 📋 PHASE 4: SETTINGS & CONFIGURATION

### Issue: Business Settings

Create the business settings management.

**Requirements:**
- Settings categories:
  - Business profile (name, logo, address)
  - Tax settings (VAT rate, tax number)
  - Currency and locale
  - Invoice settings (prefix, terms)
  - Email templates
  - Notification preferences
- Create settings pages:
  - `/settings` - Settings overview
  - `/settings/business` - Business profile
  - `/settings/users` - Team management
  - `/settings/billing` - Subscription

**Acceptance Criteria:**
- [ ] All settings are editable
- [ ] Changes persist
- [ ] Logo upload works
- [ ] Team management works

---

### Issue: User Team Management

Create team and user management for businesses.

**Requirements:**
- Team management features:
  - Invite users by email
  - Assign roles
  - Remove team members
  - View activity logs
- Invitation flow:
  - Send invitation email
  - Accept/decline invitation
  - Set password on first login
- Role management:
  - View role permissions
  - Create custom roles
  - Assign permissions

**Acceptance Criteria:**
- [ ] Invitations work
- [ ] Role assignment works
- [ ] User removal works
- [ ] Activity is logged

---

## 📋 PHASE 4: MOBILE OPTIMIZATION

### Issue: Progressive Web App (PWA)

Convert the Next.js app to a PWA for mobile use.

**Requirements:**
- Add PWA manifest
- Implement service worker
- Enable offline support for:
  - Product viewing
  - Order creation (queue)
  - Inventory adjustment (queue)
- Add install prompt
- Implement push notifications
- Optimize for mobile performance

**Acceptance Criteria:**
- [ ] App installable on mobile
- [ ] Offline mode works
- [ ] Push notifications work
- [ ] Performance is good

---

## 📋 DEPLOYMENT & INFRASTRUCTURE

### Issue: Vercel Deployment Configuration

Configure the application for Vercel deployment.

**Requirements:**
- Create `vercel.json` configuration
- Set up environment variables:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`
  - `OPENAI_API_KEY`
  - `NEXTAUTH_SECRET`
- Configure build settings
- Set up preview deployments
- Add domain configuration
- Create deployment documentation

**Acceptance Criteria:**
- [ ] App deploys successfully
- [ ] Environment variables work
- [ ] Preview deployments work
- [ ] Custom domain works

---

### Issue: Production Database Setup

Set up production database with proper configuration.

**Requirements:**
- Choose database provider:
  - Supabase (recommended)
  - Railway PostgreSQL
  - Neon
- Configure:
  - Connection pooling
  - SSL connections
  - Backup schedule
  - Monitoring
- Run production migrations
- Set up database monitoring

**Acceptance Criteria:**
- [ ] Database is accessible
- [ ] Backups are configured
- [ ] Monitoring works
- [ ] Performance is good

---

## 📋 TESTING & QUALITY

### Issue: Backend Test Suite

Create comprehensive backend tests.

**Requirements:**
- Set up pytest with fixtures
- Create tests for:
  - Authentication flows
  - Product CRUD
  - Order workflows
  - Invoice generation
  - Permission checks
- Add integration tests
- Set up test database
- Configure coverage reporting

**Acceptance Criteria:**
- [ ] All endpoints have tests
- [ ] Coverage > 80%
- [ ] Tests run in CI
- [ ] Mocks work correctly

---

### Issue: Frontend Test Suite

Create frontend component and integration tests.

**Requirements:**
- Set up Vitest with React Testing Library
- Create tests for:
  - Authentication pages
  - Product forms
  - Order creation
  - Dashboard components
- Add E2E tests with Playwright
- Configure visual regression tests

**Acceptance Criteria:**
- [ ] Components have tests
- [ ] E2E tests pass
- [ ] Tests run in CI
- [ ] Coverage is tracked

---

## 🎯 Implementation Order

For best results with Beads, implement issues in this order:

### Sprint 1 (Week 1-2): Foundation
1. Project Repository Setup
2. Docker Development Environment
3. Database Schema and Migrations
4. CI/CD Pipeline Setup

### Sprint 2 (Week 3-4): Authentication
5. FastAPI Authentication System
6. Google OAuth Integration
7. Role-Based Access Control
8. Next.js Authentication UI

### Sprint 3 (Week 5-6): Core UI
9. Design System Setup
10. Application Layout and Navigation
11. Dashboard Page

### Sprint 4 (Week 7-8): Products & Inventory
12. Product API Endpoints
13. Product Management UI
14. Product Categories API and UI
15. Inventory API Endpoints
16. Inventory Management UI

### Sprint 5 (Week 9-10): Orders & Customers
17. Order API Endpoints
18. Order Management UI
19. Customer API Endpoints
20. Customer Management UI

### Sprint 6 (Week 11-12): Financial
21. Invoice API Endpoints
22. Invoice UI and PDF Generation
23. Payment Management

### Sprint 7 (Week 13-14): Advanced Features
24. AI Assistant Backend
25. AI Chat Interface
26. Financial Reports API
27. Reports Dashboard UI
28. QR Code Generator

### Sprint 8 (Week 15-16): Polish & Deploy
29. Business Settings
30. User Team Management
31. Progressive Web App
32. Vercel Deployment Configuration
33. Production Database Setup
34. Backend Test Suite
35. Frontend Test Suite

---

## 📚 Resources

- **Original BizPilot Repo:** Current repository with UI reference
- **PRP Document:** `PRP_Application_Rewrite.md` for detailed architecture
- **Tech Stack Recommendation:** `TECH_STACK_RECOMMENDATION.md`
- **Beads Documentation:** https://github.com/steveyegge/beads

---

*This PRD is designed for use with Beads issue-driven development. Run `beads plan` to generate GitHub issues from these feature specifications.*
