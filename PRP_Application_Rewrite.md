# BizPilot - Project Requirements Proposal (PRP)
## Complete Application Rewrite with Modern Tech Stack

**Document Version:** 1.0  
**Created:** December 11, 2025  
**Author:** Development Team  
**Status:** Proposal  

---

## 📋 Executive Summary

This Project Requirements Proposal (PRP) outlines a complete rewrite of the BizPilot business management platform using a modern, enterprise-grade tech stack. The proposal includes two technology options (Python-based and .NET-based), comprehensive feature specifications covering all existing functionality plus enhanced capabilities, and a detailed implementation roadmap following modern architectural patterns.

### Why Rewrite?

1. **Enterprise Scalability**: Current Node.js/React stack serves MVP well, but enterprise features require more robust foundations
2. **Performance Optimization**: Backend processing for analytics, reporting, and AI features benefits from compiled languages
3. **Type Safety & Maintainability**: Stronger type systems in .NET/Python with type hints improve long-term maintainability
4. **Integration Capabilities**: Better enterprise integration support for accounting, ERP, and payment systems
5. **Mobile-First Architecture**: Unified API architecture supporting web, mobile, and third-party integrations

---

## 🎯 Current State Analysis

### Existing Architecture

```
BizPilot (Current)
├── src/               # React + Vite SPA (Primary Frontend)
│   ├── components/    # 50+ React components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── store/         # Zustand state management
│   └── utils/         # Utility functions
├── backend/           # Node.js/Express API
│   ├── prisma/        # Database ORM
│   └── src/           # Express routes & middleware
├── web/               # Next.js (Secondary frontend)
├── mobile/            # React Native + Expo
├── shared/            # Shared types/utilities
└── supabase/          # Database migrations
```

### Current Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + Vite | 18.2 / 5.0 |
| Styling | Tailwind CSS | 3.3.6 |
| State Management | Zustand | 5.0.6 |
| Backend | Node.js + Express | 18+ / 4.19 |
| Database | PostgreSQL (Supabase) | 15+ |
| ORM | Prisma | 5.19 |
| Mobile | React Native + Expo | 0.79 / 53 |
| Auth | Supabase Auth + JWT | 2.38 |
| AI | OpenAI/Groq SDK | Latest |

### Implemented Features (100% Complete)

#### Core Business Management
- ✅ Multi-business support with role-based access
- ✅ Business profiles and settings
- ✅ User invitation and team management
- ✅ Category management system

#### Product & Inventory
- ✅ Product catalog with SKU/barcode tracking
- ✅ Ingredient-based cost calculations
- ✅ Real-time inventory tracking
- ✅ Low stock alerts and reorder points
- ✅ Bulk import/export (CSV)
- ✅ Batch/lot number tracking

#### Orders & Customers
- ✅ Order processing and status tracking
- ✅ Customer database with history
- ✅ Customer communication tools
- ✅ Order status management

#### Financial Management
- ✅ Invoice generation with PDF export
- ✅ Payment tracking and recording
- ✅ Expense tracking and categorization
- ✅ VAT/Tax calculations (South African market)
- ✅ Financial reporting dashboard
- ✅ Profit margin analysis

#### AI & Advanced Features
- ✅ AI-powered business assistant
- ✅ Conversation-based AI help
- ✅ QR code generation
- ✅ Multi-language support (i18n)

#### Authentication & Security
- ✅ Email/password authentication
- ✅ Google OAuth integration
- ✅ Session management with auto-recovery
- ✅ Role-based access control (RBAC)

---

## 🔧 Proposed Technology Stacks

### Option A: Python-Based Stack (Recommended)

A modern Python stack leveraging FastAPI for high-performance APIs, Django Admin for backoffice, and modern frontend frameworks.

```
BizPilot v2.0 (Python Stack)
├── backend/
│   ├── api/                    # FastAPI Application
│   │   ├── app/
│   │   │   ├── core/           # Core configuration
│   │   │   ├── models/         # SQLAlchemy models
│   │   │   ├── schemas/        # Pydantic schemas
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── repositories/   # Data access layer
│   │   │   ├── api/            # API routes (v1, v2)
│   │   │   ├── middleware/     # Custom middleware
│   │   │   └── utils/          # Utilities
│   │   ├── tests/              # pytest tests
│   │   └── alembic/            # Database migrations
│   │
│   ├── admin/                  # Django Admin Panel
│   │   ├── core/               # Admin configuration
│   │   └── apps/               # Admin modules
│   │
│   └── workers/                # Celery Workers
│       ├── tasks/              # Background tasks
│       └── schedulers/         # Periodic tasks
│
├── frontend/
│   ├── web/                    # Next.js 14+ (App Router)
│   │   ├── app/                # App directory
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities
│   │   └── styles/             # Global styles
│   │
│   └── mobile/                 # React Native + Expo
│       ├── app/                # Expo Router
│       ├── components/         # Mobile components
│       └── services/           # API integration
│
├── shared/
│   ├── contracts/              # API contracts (OpenAPI)
│   └── types/                  # Shared TypeScript types
│
├── infrastructure/
│   ├── docker/                 # Docker configurations
│   ├── kubernetes/             # K8s manifests
│   ├── terraform/              # Infrastructure as Code
│   └── monitoring/             # Observability configs
│
└── docs/                       # Documentation
```

#### Python Stack Components

| Layer | Technology | Purpose |
|-------|------------|---------|
| **API Framework** | FastAPI 0.109+ | High-performance async API |
| **Admin Panel** | Django 5.0+ | Backoffice administration |
| **ORM** | SQLAlchemy 2.0+ | Database operations |
| **Validation** | Pydantic v2 | Data validation & serialization |
| **Authentication** | FastAPI-Users + OAuth2 | Auth management |
| **Background Jobs** | Celery + Redis | Async task processing |
| **Database** | PostgreSQL 16 | Primary database |
| **Cache** | Redis 7+ | Caching & sessions |
| **Search** | Elasticsearch/OpenSearch | Full-text search |
| **Message Queue** | RabbitMQ/Redis | Event-driven messaging |
| **AI/ML** | LangChain + OpenAI | AI features |
| **Testing** | pytest + pytest-asyncio | Unit & integration tests |

#### Frontend Stack (Python Option)

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Web Framework** | Next.js 14+ | SSR/SSG React framework |
| **Language** | TypeScript 5+ | Type safety |
| **Styling** | Tailwind CSS 4+ | Utility-first CSS |
| **Components** | shadcn/ui + Radix | Accessible components |
| **State** | Zustand + React Query | State & server state |
| **Forms** | React Hook Form + Zod | Form handling |
| **Charts** | Recharts/Chart.js | Data visualization |
| **Mobile** | React Native + Expo | Cross-platform mobile |

---

### Option B: .NET-Based Stack

An enterprise-grade .NET stack with Clean Architecture, suitable for organizations with Microsoft ecosystem investments.

```
BizPilot v2.0 (.NET Stack)
├── src/
│   ├── Core/                           # Domain Layer
│   │   ├── BizPilot.Domain/            # Entities, Value Objects
│   │   └── BizPilot.Application/       # Use Cases, Interfaces
│   │
│   ├── Infrastructure/                  # Infrastructure Layer
│   │   ├── BizPilot.Persistence/       # EF Core, Repositories
│   │   ├── BizPilot.Identity/          # Identity & Auth
│   │   ├── BizPilot.Messaging/         # Message queues
│   │   └── BizPilot.ExternalServices/  # Third-party integrations
│   │
│   ├── Presentation/                    # Presentation Layer
│   │   ├── BizPilot.API/               # ASP.NET Core Web API
│   │   ├── BizPilot.Admin/             # Blazor Admin Panel
│   │   └── BizPilot.gRPC/              # gRPC services
│   │
│   └── Workers/                         # Background Services
│       └── BizPilot.BackgroundJobs/    # Hangfire/Quartz jobs
│
├── frontend/
│   ├── web/                            # Next.js 14+
│   └── mobile/                         # React Native + Expo
│
├── tests/
│   ├── UnitTests/                      # xUnit tests
│   ├── IntegrationTests/               # Integration tests
│   └── FunctionalTests/                # E2E tests
│
├── infrastructure/
│   ├── docker/                         # Docker configurations
│   ├── kubernetes/                     # K8s manifests
│   └── azure/                          # Azure ARM/Bicep templates
│
└── docs/                               # Documentation
```

#### .NET Stack Components

| Layer | Technology | Purpose |
|-------|------------|---------|
| **API Framework** | ASP.NET Core 8.0 | Enterprise-grade API |
| **Architecture** | Clean Architecture | Maintainable structure |
| **ORM** | Entity Framework Core 8 | Database operations |
| **CQRS** | MediatR | Command/Query separation |
| **Validation** | FluentValidation | Data validation |
| **Authentication** | ASP.NET Core Identity + Duende IdentityServer | Enterprise auth |
| **Background Jobs** | Hangfire/Quartz.NET | Scheduled tasks |
| **Database** | PostgreSQL/SQL Server | Primary database |
| **Cache** | Redis + IMemoryCache | Multi-level caching |
| **Search** | Elasticsearch | Full-text search |
| **Message Queue** | MassTransit + RabbitMQ | Event-driven messaging |
| **AI/ML** | Semantic Kernel + Azure OpenAI | AI features |
| **Testing** | xUnit + NSubstitute + FluentAssertions | Testing |
| **API Docs** | Swashbuckle/NSwag | OpenAPI documentation |

---

## 📐 Modern Architecture Patterns

### 1. Clean Architecture / Onion Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│        (API Controllers, GraphQL, gRPC, Admin UI)               │
├─────────────────────────────────────────────────────────────────┤
│                    Application Layer                            │
│    (Use Cases, DTOs, Application Services, Interfaces)          │
├─────────────────────────────────────────────────────────────────┤
│                      Domain Layer                               │
│     (Entities, Value Objects, Domain Events, Aggregates)        │
├─────────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                          │
│   (Repositories, External APIs, Persistence, Messaging)         │
└─────────────────────────────────────────────────────────────────┘
```

### 2. CQRS (Command Query Responsibility Segregation)

Separate read and write operations for optimal performance:

```
┌─────────────────┐     ┌─────────────────┐
│   Write Model   │     │   Read Model    │
│                 │     │                 │
│  ┌───────────┐  │     │  ┌───────────┐  │
│  │  Command  │──┼─────┼──│   Query   │  │
│  │  Handler  │  │     │  │  Handler  │  │
│  └───────────┘  │     │  └───────────┘  │
│        │        │     │        │        │
│  ┌───────────┐  │     │  ┌───────────┐  │
│  │  Domain   │  │     │  │  Read DB  │  │
│  │  Events   │  │     │  │  (Views)  │  │
│  └───────────┘  │     │  └───────────┘  │
└─────────────────┘     └─────────────────┘
```

### 3. Event-Driven Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Producer   │───▶│  Message    │───▶│  Consumer   │
│  Service    │    │  Broker     │    │  Service    │
└─────────────┘    │ (RabbitMQ)  │    └─────────────┘
                   └─────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Inventory  │    │  Analytics  │    │Notification │
│  Service    │    │  Service    │    │  Service    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 4. Microservices Architecture (Optional - Phase 3+)

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Kong/NGINX)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
    ┌───────────────┬───────┴───────┬───────────────┐
    ▼               ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Identity│   │ Product │   │  Order  │   │ Finance │
│ Service │   │ Service │   │ Service │   │ Service │
└────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
     │             │             │             │
     ▼             ▼             ▼             ▼
  ┌─────┐      ┌─────┐      ┌─────┐      ┌─────┐
  │ DB  │      │ DB  │      │ DB  │      │ DB  │
  └─────┘      └─────┘      └─────┘      └─────┘
```

---

## 🚀 Complete Feature Specification

### Module 1: Authentication & Identity Management

#### 1.1 Current Features (Retained)
- Email/Password authentication
- Google OAuth 2.0
- Session management with auto-recovery
- Password reset flow
- User profile management

#### 1.2 Enhanced Features (New)
- **Multi-Factor Authentication (MFA)**
  - TOTP (Google Authenticator, Authy)
  - SMS verification
  - Email verification codes
  - Recovery codes

- **Enterprise SSO**
  - SAML 2.0 integration
  - OpenID Connect (OIDC)
  - Active Directory/LDAP sync
  - Microsoft Azure AD
  - Okta integration

- **Advanced Session Management**
  - Device fingerprinting
  - Concurrent session control
  - Session revocation
  - Geo-location tracking
  - Suspicious activity detection

- **API Authentication**
  - API key management
  - OAuth2 client credentials
  - JWT with refresh tokens
  - Rate limiting per key

```python
# Example: Python FastAPI Auth Implementation
from fastapi import FastAPI, Depends
from fastapi_users import FastAPIUsers
from app.models.user import User
from app.auth.backend import auth_backend

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_backend],
)

app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"]
)

# MFA Endpoint
@app.post("/auth/mfa/setup")
async def setup_mfa(user: User = Depends(current_active_user)):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(user.email, issuer_name="BizPilot")
    return {"secret": secret, "qr_code": generate_qr(provisioning_uri)}
```

---

### Module 2: Business & Organization Management

#### 2.1 Current Features (Retained)
- Multi-business support
- Business profiles and settings
- User invitation system
- Role-based access control

#### 2.2 Enhanced Features (New)
- **Organization Hierarchy**
  - Parent/child organization structure
  - Department management
  - Cost center allocation
  - Cross-organization reporting

- **Advanced RBAC**
  - Custom role builder
  - Fine-grained permissions
  - Permission inheritance
  - Attribute-based access control (ABAC)
  - Resource-level permissions

- **Business Configuration**
  - White-label branding
  - Custom domains
  - Multi-currency support
  - Multi-timezone handling
  - Regional tax configurations

- **Onboarding & Setup**
  - Guided setup wizard
  - Industry-specific templates
  - Data migration tools
  - Bulk user import

```python
# Example: Permission System
from enum import Enum
from typing import List
from uuid import UUID
from pydantic import BaseModel

class Permission(str, Enum):
    PRODUCTS_VIEW = "products:view"
    PRODUCTS_CREATE = "products:create"
    PRODUCTS_UPDATE = "products:update"
    PRODUCTS_DELETE = "products:delete"
    INVENTORY_VIEW = "inventory:view"
    INVENTORY_ADJUST = "inventory:adjust"
    ORDERS_VIEW = "orders:view"
    ORDERS_CREATE = "orders:create"
    ORDERS_FULFILL = "orders:fulfill"
    REPORTS_VIEW = "reports:view"
    REPORTS_EXPORT = "reports:export"
    SETTINGS_MANAGE = "settings:manage"
    USERS_MANAGE = "users:manage"

class Role(BaseModel):
    id: UUID
    name: str
    permissions: List[Permission]
    business_id: UUID
    is_custom: bool = False
```

---

### Module 3: Product & Catalog Management

#### 3.1 Current Features (Retained)
- Product catalog with SKU/barcode
- Ingredient-based cost calculations
- Product categories
- Profit margin calculations

#### 3.2 Enhanced Features (New)
- **Product Information Management (PIM)**
  - Rich product descriptions (markdown support)
  - Multiple images with CDN delivery
  - Product variants (size, color, etc.)
  - Product bundles and kits
  - Digital product support (downloads)

- **Advanced Pricing**
  - Price lists per customer segment
  - Volume-based pricing tiers
  - Time-based pricing (happy hours, seasonal)
  - Dynamic pricing algorithms
  - Promotional pricing rules
  - Currency conversion

- **Product Lifecycle**
  - Product versioning
  - Draft/Published states
  - Scheduled publishing
  - Product archival
  - Audit trail

- **Integration Features**
  - Barcode generation (CODE128, QR, EAN)
  - Supplier product linking
  - Marketplace sync (Amazon, eBay)
  - POS integration

```python
# Example: Product Model with Variants
class Product(BaseModel):
    id: UUID
    sku: str
    name: str
    description: Optional[str]
    category_id: UUID
    base_price: Decimal
    cost_price: Decimal
    tax_rate: Decimal
    status: ProductStatus
    variants: List[ProductVariant]
    images: List[ProductImage]
    attributes: Dict[str, Any]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class ProductVariant(BaseModel):
    id: UUID
    product_id: UUID
    sku: str
    name: str
    attributes: Dict[str, str]  # {"size": "L", "color": "Blue"}
    price_adjustment: Decimal
    inventory_count: int
```

---

### Module 4: Inventory Management System

#### 4.1 Current Features (Retained)
- Real-time inventory tracking
- Low stock alerts
- Bulk import/export
- Batch/lot tracking

#### 4.2 Enhanced Features (New)
- **Multi-Location Inventory**
  - Warehouse management
  - Location/bin tracking
  - Zone management
  - Cross-location visibility

- **Advanced Tracking**
  - Serial number tracking
  - Expiration date management
  - FIFO/LIFO/FEFO costing
  - Consignment inventory
  - Reserved stock management

- **Inventory Operations**
  - Stock transfers
  - Cycle counting
  - Physical inventory
  - Adjustments with reasons
  - Returns processing

- **Automation**
  - Auto-reorder points
  - Demand forecasting (AI)
  - Seasonal adjustment
  - Lead time calculations
  - Safety stock optimization

- **Reporting**
  - Stock valuation reports
  - Movement history
  - Aging analysis
  - ABC classification
  - Turnover analysis

```python
# Example: Inventory Transaction System
class InventoryTransaction(BaseModel):
    id: UUID
    product_id: UUID
    variant_id: Optional[UUID]
    location_id: UUID
    transaction_type: TransactionType  # RECEIVE, SHIP, ADJUST, TRANSFER
    quantity: Decimal
    unit_cost: Decimal
    reference_type: Optional[str]  # ORDER, PO, ADJUSTMENT
    reference_id: Optional[UUID]
    lot_number: Optional[str]
    serial_number: Optional[str]
    expiration_date: Optional[date]
    notes: Optional[str]
    created_by: UUID
    created_at: datetime

class TransactionType(str, Enum):
    RECEIVE = "receive"
    SHIP = "ship"
    ADJUST_IN = "adjust_in"
    ADJUST_OUT = "adjust_out"
    TRANSFER_OUT = "transfer_out"
    TRANSFER_IN = "transfer_in"
    RETURN_CUSTOMER = "return_customer"
    RETURN_VENDOR = "return_vendor"
```

---

### Module 5: Order Management System

#### 5.1 Current Features (Retained)
- Order creation and tracking
- Order status management
- Customer association
- Order history

#### 5.2 Enhanced Features (New)
- **Order Lifecycle**
  - Draft orders
  - Order approval workflow
  - Split orders
  - Partial fulfillment
  - Backorder management
  - Order cancellation workflow

- **Multi-Channel Orders**
  - POS orders
  - Online orders
  - Phone orders
  - Marketplace imports
  - B2B portal orders

- **Fulfillment**
  - Pick lists generation
  - Packing slips
  - Shipping label integration
  - Carrier rate shopping
  - Tracking updates

- **Order Automation**
  - Order routing rules
  - Auto-assignment
  - Fraud detection
  - Payment verification
  - Inventory allocation

```python
# Example: Order State Machine
class OrderStatus(str, Enum):
    DRAFT = "draft"
    PENDING_PAYMENT = "pending_payment"
    PAYMENT_FAILED = "payment_failed"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    READY_FOR_PICKUP = "ready_for_pickup"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

ORDER_TRANSITIONS = {
    OrderStatus.DRAFT: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
    OrderStatus.PENDING_PAYMENT: [OrderStatus.CONFIRMED, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    OrderStatus.PROCESSING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.SHIPPED],
    OrderStatus.SHIPPED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
    # ...
}
```

---

### Module 6: Customer Relationship Management (CRM)

#### 6.1 Current Features (Retained)
- Customer database
- Purchase history
- Customer search/filtering
- Basic analytics

#### 6.2 Enhanced Features (New)
- **Customer 360 View**
  - Unified customer profile
  - Interaction history
  - Communication preferences
  - Lifetime value calculation
  - Satisfaction scoring

- **Segmentation**
  - Dynamic customer segments
  - RFM analysis (Recency, Frequency, Monetary)
  - Custom tags and attributes
  - Behavioral segmentation
  - Geographic segmentation

- **Communication**
  - Email campaigns (integration)
  - SMS notifications
  - WhatsApp Business API
  - In-app messaging
  - Communication templates

- **Loyalty & Rewards**
  - Points-based loyalty program
  - Tier management
  - Reward redemption
  - Referral tracking
  - Birthday rewards

- **Customer Portal**
  - Self-service portal
  - Order tracking
  - Invoice access
  - Support ticket creation
  - Account management

```python
# Example: Customer Segmentation
class CustomerSegment(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    rules: List[SegmentRule]
    is_dynamic: bool = True
    customer_count: int = 0
    created_at: datetime
    updated_at: datetime

class SegmentRule(BaseModel):
    field: str  # "total_orders", "total_spent", "last_order_date"
    operator: str  # "gt", "lt", "eq", "between", "in"
    value: Any

# Example segment: High-value customers
high_value_segment = CustomerSegment(
    name="High Value Customers",
    rules=[
        SegmentRule(field="total_spent", operator="gt", value=10000),
        SegmentRule(field="total_orders", operator="gt", value=5),
    ]
)
```

---

### Module 7: Financial Management

#### 7.1 Current Features (Retained)
- Invoice generation with PDF
- Payment tracking
- Expense categorization
- VAT/Tax calculations
- Financial dashboard

#### 7.2 Enhanced Features (New)
- **Invoicing**
  - Recurring invoices
  - Invoice templates (customizable)
  - Multi-currency invoicing
  - Credit notes
  - Pro-forma invoices
  - Invoice scheduling
  - Late payment reminders

- **Payments**
  - Multiple payment gateways
    - Stripe
    - PayFast (South Africa)
    - Yoco (South Africa)
    - PayPal
    - Square
  - Partial payments
  - Payment plans
  - Auto-reconciliation
  - Payment links

- **Accounting Integration**
  - Chart of accounts
  - Journal entries
  - General ledger
  - Bank reconciliation
  - QuickBooks integration
  - Xero integration
  - Sage integration

- **Tax Management**
  - Multi-jurisdiction tax
  - Tax exemptions
  - Tax reports (VAT/GST)
  - SARS compliance (South Africa)
  - Tax certificate generation

- **Reporting**
  - Profit & Loss statements
  - Balance sheet
  - Cash flow statements
  - Accounts receivable aging
  - Accounts payable aging
  - Custom report builder

```python
# Example: Invoice Generation Service
class InvoiceService:
    async def create_invoice(
        self,
        customer_id: UUID,
        line_items: List[InvoiceLineItem],
        due_date: date,
        currency: str = "ZAR"
    ) -> Invoice:
        # Calculate totals
        subtotal = sum(item.quantity * item.unit_price for item in line_items)
        tax_amount = self._calculate_tax(subtotal, line_items)
        total = subtotal + tax_amount
        
        invoice = Invoice(
            invoice_number=await self._generate_invoice_number(),
            customer_id=customer_id,
            line_items=line_items,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total=total,
            currency=currency,
            due_date=due_date,
            status=InvoiceStatus.DRAFT
        )
        
        await self.repository.create(invoice)
        await self.event_publisher.publish(InvoiceCreatedEvent(invoice))
        
        return invoice
```

---

### Module 8: AI-Powered Features

#### 8.1 Current Features (Retained)
- AI business assistant
- Conversation-based help
- Business insights

#### 8.2 Enhanced Features (New)
- **Intelligent Assistant**
  - Natural language queries
  - Context-aware responses
  - Multi-turn conversations
  - Action suggestions
  - Voice input support

- **Predictive Analytics**
  - Demand forecasting
  - Sales predictions
  - Churn prediction
  - Inventory optimization
  - Price optimization

- **Automated Insights**
  - Daily business summaries
  - Anomaly detection
  - Trend identification
  - Performance alerts
  - Recommendation engine

- **Document Intelligence**
  - Receipt scanning (OCR)
  - Invoice data extraction
  - Contract analysis
  - Expense categorization

- **AI-Powered Search**
  - Semantic search
  - Natural language filters
  - Smart suggestions
  - Typo tolerance

```python
# Example: AI Service with LangChain
from uuid import UUID
from langchain_openai import ChatOpenAI  # Updated import for LangChain 0.1+
from langchain.memory import ConversationBufferWindowMemory
from langchain.agents import AgentExecutor, create_openai_tools_agent

class AIBusinessAssistant:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview")
        self.tools = [
            get_sales_data_tool,
            get_inventory_status_tool,
            get_customer_insights_tool,
            generate_report_tool,
            create_order_tool,
        ]
        self.memory = ConversationBufferWindowMemory(k=10)
        
    async def chat(self, user_id: UUID, message: str) -> str:
        try:
            # Load user context
            context = await self._load_business_context(user_id)
            
            # Create agent with tools
            agent = create_openai_tools_agent(self.llm, self.tools, prompt)
            executor = AgentExecutor(agent=agent, tools=self.tools, verbose=True)
            
            response = await executor.ainvoke({
                "input": message,
                "context": context,
                "chat_history": self.memory.chat_memory.messages
            })
            
            return response.get("output", "I apologize, but I couldn't process that request.")
        except Exception as e:
            # Log error and return graceful fallback
            logger.error(f"AI chat error for user {user_id}: {e}")
            return "I'm having trouble processing your request. Please try again."
```

---

### Module 9: Reporting & Analytics

#### 9.1 Current Features (Retained)
- Dashboard charts
- Basic financial reports
- Inventory reports

#### 9.2 Enhanced Features (New)
- **Dashboard Builder**
  - Drag-and-drop widgets
  - Custom dashboards
  - Role-based dashboards
  - Real-time updates
  - Shareable dashboards

- **Report Builder**
  - Custom report creation
  - Filter builder
  - Column selection
  - Grouping and aggregation
  - Scheduled reports
  - Report templates

- **Data Visualization**
  - Interactive charts
  - Drill-down capability
  - Comparison views
  - Trend analysis
  - Geographic heat maps

- **Export & Sharing**
  - PDF export
  - Excel export (formatted)
  - CSV export
  - Email scheduling
  - API access

- **Performance Metrics**
  - KPI tracking
  - Goal setting
  - Progress indicators
  - Benchmarking
  - Scorecards

```python
# Example: Report Builder
class ReportDefinition(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    data_source: str  # "orders", "products", "customers"
    columns: List[ReportColumn]
    filters: List[ReportFilter]
    grouping: List[str]
    sorting: List[ReportSort]
    aggregations: List[ReportAggregation]
    schedule: Optional[ReportSchedule]

class ReportColumn(BaseModel):
    field: str
    label: str
    format: Optional[str]  # "currency", "date", "percentage"
    width: Optional[int]

class ReportService:
    async def execute_report(self, definition: ReportDefinition) -> ReportResult:
        query = self._build_query(definition)
        data = await self.repository.execute_query(query)
        return ReportResult(
            columns=definition.columns,
            rows=data,
            totals=self._calculate_totals(data, definition.aggregations)
        )
```

---

### Module 10: Integrations & API

#### 10.1 Current Features (Retained)
- Supabase integration
- Basic API endpoints

#### 10.2 Enhanced Features (New)
- **Payment Gateways**
  - Stripe (global)
  - PayFast (South Africa)
  - Yoco (South Africa)
  - PayPal
  - Square
  - Ozow (instant EFT)

- **Accounting Software**
  - QuickBooks Online
  - Xero
  - Sage
  - FreshBooks

- **E-Commerce Platforms**
  - Shopify
  - WooCommerce
  - Magento
  - BigCommerce
  - Takealot (South Africa)

- **Shipping Carriers**
  - DHL
  - FedEx
  - Courier Guy (South Africa)
  - Pudo (South Africa)
  - PostNet (South Africa)

- **Communication**
  - SendGrid (email)
  - Twilio (SMS)
  - WhatsApp Business API
  - Slack notifications

- **Developer API**
  - REST API (OpenAPI 3.0)
  - GraphQL API
  - Webhooks
  - SDK libraries (Python, JavaScript)
  - API documentation portal

```python
# Example: Webhook System
class WebhookEvent(str, Enum):
    ORDER_CREATED = "order.created"
    ORDER_UPDATED = "order.updated"
    ORDER_FULFILLED = "order.fulfilled"
    PAYMENT_RECEIVED = "payment.received"
    INVENTORY_LOW = "inventory.low"
    CUSTOMER_CREATED = "customer.created"

class WebhookService:
    async def trigger_webhook(
        self,
        event: WebhookEvent,
        payload: Dict[str, Any],
        business_id: UUID
    ):
        subscriptions = await self.get_subscriptions(business_id, event)
        
        for subscription in subscriptions:
            await self.queue.enqueue(
                "send_webhook",
                {
                    "url": subscription.url,
                    "event": event,
                    "payload": self._sign_payload(payload, subscription.secret)
                }
            )
```

---

### Module 11: Mobile Application

#### 11.1 Current Features (Retained)
- React Native + Expo app
- Basic functionality

#### 11.2 Enhanced Features (New)
- **Core Features**
  - Full feature parity with web
  - Offline mode support
  - Background sync
  - Push notifications
  - Biometric authentication

- **Mobile-Specific**
  - Barcode/QR scanning
  - Camera integration
  - GPS location services
  - Mobile payments (Apple Pay, Google Pay)
  - Voice commands

- **Performance**
  - Optimized for slow networks
  - Image caching
  - Lazy loading
  - Compression

```typescript
// Example: React Native Offline Support
import { useNetInfo } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

export function useSyncManager() {
  const netInfo = useNetInfo();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      // Sync pending operations
      syncPendingOperations();
      // Refresh cached data
      queryClient.invalidateQueries();
    }
  }, [netInfo.isConnected]);
  
  const queueOperation = async (operation: PendingOperation) => {
    await AsyncStorage.setItem(
      `pending_${operation.id}`,
      JSON.stringify(operation)
    );
  };
  
  return { queueOperation, isOnline: netInfo.isConnected };
}
```

---

### Module 12: Administration & Operations

#### 12.1 New Features
- **Admin Dashboard**
  - System health monitoring
  - User management
  - Business management
  - Audit logs viewer
  - Feature flags

- **System Configuration**
  - Environment settings
  - Email templates
  - Notification settings
  - Integration management

- **Data Management**
  - Backup/restore
  - Data export
  - GDPR compliance tools
  - Data retention policies

- **Monitoring**
  - Real-time metrics
  - Error tracking
  - Performance monitoring
  - User activity logs

---

## 📊 Database Schema Design

### Core Entities ERD

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Organization   │     │    Business      │     │      User        │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id               │────▶│ id               │     │ id               │
│ name             │     │ organization_id  │◀────│ email            │
│ settings         │     │ name             │     │ password_hash    │
│ created_at       │     │ currency         │     │ full_name        │
└──────────────────┘     │ tax_rate         │     │ created_at       │
                         │ settings         │     └────────┬─────────┘
                         └────────┬─────────┘              │
                                  │                         │
                         ┌────────┴─────────┐     ┌────────┴─────────┐
                         │                  │     │                  │
              ┌──────────▼──────────┐   ┌───▼─────┴───────┐   ┌──────▼───────┐
              │      Product        │   │  BusinessUser   │   │     Role     │
              ├─────────────────────┤   ├─────────────────┤   ├──────────────┤
              │ id                  │   │ business_id     │   │ id           │
              │ business_id         │   │ user_id         │   │ name         │
              │ sku                 │   │ role_id         │   │ permissions  │
              │ name                │   │ invited_at      │   └──────────────┘
              │ price               │   └─────────────────┘
              │ cost                │
              └─────────┬───────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
┌────────▼─────┐ ┌──────▼──────┐ ┌─────▼──────┐
│   Variant    │ │  Inventory  │ │  Category  │
├──────────────┤ ├─────────────┤ ├────────────┤
│ id           │ │ id          │ │ id         │
│ product_id   │ │ product_id  │ │ name       │
│ sku          │ │ location_id │ │ parent_id  │
│ attributes   │ │ quantity    │ └────────────┘
└──────────────┘ │ lot_number  │
                 └─────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     Customer     │     │      Order       │     │   OrderItem      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id               │────▶│ id               │────▶│ id               │
│ business_id      │     │ customer_id      │     │ order_id         │
│ name             │     │ order_number     │     │ product_id       │
│ email            │     │ status           │     │ variant_id       │
│ phone            │     │ total            │     │ quantity         │
│ address          │     │ created_at       │     │ unit_price       │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                         ┌────────┴─────────┐
                         │                  │
              ┌──────────▼──────────┐   ┌───▼─────────────┐
              │      Invoice        │   │    Payment      │
              ├─────────────────────┤   ├─────────────────┤
              │ id                  │   │ id              │
              │ order_id            │   │ invoice_id      │
              │ invoice_number      │   │ amount          │
              │ status              │   │ method          │
              │ due_date            │   │ status          │
              └─────────────────────┘   └─────────────────┘
```

---

## 🗓️ Implementation Roadmap

### Phase 1: Foundation (Weeks 1-6)

**Goal:** Establish core infrastructure and migrate essential features

#### Week 1-2: Project Setup
- [ ] Repository structure setup
- [ ] CI/CD pipeline configuration
- [ ] Development environment (Docker)
- [ ] Database schema design
- [ ] Authentication system

#### Week 3-4: Core API Development
- [ ] User management endpoints
- [ ] Business/Organization endpoints
- [ ] Product management endpoints
- [ ] Inventory management endpoints

#### Week 5-6: Frontend Migration
- [ ] Next.js project setup
- [ ] Authentication UI
- [ ] Dashboard implementation
- [ ] Product management UI

**Deliverables:**
- Working authentication system
- Core CRUD operations
- Basic dashboard
- CI/CD pipeline

---

### Phase 2: Business Features (Weeks 7-12)

**Goal:** Implement complete business management features

#### Week 7-8: Order Management
- [ ] Order creation workflow
- [ ] Order status management
- [ ] Order fulfillment
- [ ] Order history and search

#### Week 9-10: Customer Management
- [ ] Customer CRUD
- [ ] Customer 360 view
- [ ] Purchase history
- [ ] Customer segmentation

#### Week 11-12: Financial Management
- [ ] Invoice generation
- [ ] Payment processing
- [ ] Expense tracking
- [ ] Financial reports

**Deliverables:**
- Complete order lifecycle
- Customer management system
- Invoice and payment processing
- Basic financial reporting

---

### Phase 3: Advanced Features (Weeks 13-18)

**Goal:** Implement advanced capabilities and integrations

#### Week 13-14: AI Features
- [ ] AI assistant implementation
- [ ] Predictive analytics
- [ ] Automated insights
- [ ] Natural language search

#### Week 15-16: Integrations
- [ ] Payment gateway integrations
- [ ] Accounting software sync
- [ ] Email/SMS providers
- [ ] Webhook system

#### Week 17-18: Mobile App
- [ ] React Native setup
- [ ] Core feature implementation
- [ ] Offline support
- [ ] Push notifications

**Deliverables:**
- AI-powered features
- Third-party integrations
- Mobile application
- Webhook system

---

### Phase 4: Enterprise Features (Weeks 19-24)

**Goal:** Enterprise-grade features and polish

#### Week 19-20: Multi-Location
- [ ] Location management
- [ ] Cross-location inventory
- [ ] Transfer management
- [ ] Location-based reporting

#### Week 21-22: Advanced Reporting
- [ ] Custom report builder
- [ ] Dashboard builder
- [ ] Scheduled reports
- [ ] Data export

#### Week 23-24: Security & Compliance
- [ ] MFA implementation
- [ ] SSO integration
- [ ] Audit logging
- [ ] GDPR compliance

**Deliverables:**
- Multi-location support
- Advanced reporting
- Enterprise security
- Compliance tools

---

## 🧪 Testing Strategy

### Unit Testing
- **Coverage Target:** 80%+
- **Framework:** pytest (Python) / xUnit (.NET)
- **Mocking:** unittest.mock / NSubstitute

### Integration Testing
- **API Tests:** Test all endpoints
- **Database Tests:** Test data access layer
- **Service Tests:** Test business logic

### End-to-End Testing
- **Framework:** Playwright
- **Coverage:** Critical user journeys
- **Environments:** Staging before production

### Performance Testing
- **Load Testing:** Locust (Python) / NBomber (.NET)
- **Targets:**
  - API response time < 200ms
  - Page load time < 2s
  - 1000 concurrent users

---

## 🚀 Deployment Strategy

### Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                        CDN (Cloudflare)                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
    ┌─────────▼─────────┐             ┌───────────▼───────────┐
    │   Static Assets   │             │     API Gateway       │
    │    (Vercel/S3)    │             │   (Kong/AWS ALB)      │
    └───────────────────┘             └───────────┬───────────┘
                                                  │
                            ┌─────────────────────┼─────────────────────┐
                            │                     │                     │
                  ┌─────────▼─────────┐ ┌─────────▼─────────┐ ┌─────────▼─────────┐
                  │    API Service    │ │   Admin Service   │ │  Worker Service   │
                  │   (Kubernetes)    │ │   (Kubernetes)    │ │   (Kubernetes)    │
                  └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘
                            │                     │                     │
              ┌─────────────┴─────────────────────┴─────────────────────┴─────────┐
              │                                                                    │
    ┌─────────▼─────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌───────▼───────┐
    │    PostgreSQL     │ │       Redis         │ │    Elasticsearch    │ │   RabbitMQ    │
    │    (Primary)      │ │   (Cache/Queue)     │ │     (Search)        │ │   (Messages)  │
    └───────────────────┘ └─────────────────────┘ └─────────────────────┘ └───────────────┘
```

### Environments

| Environment | Purpose | Infrastructure |
|-------------|---------|----------------|
| Development | Local dev | Docker Compose |
| Testing | Automated tests | Kubernetes (test) |
| Staging | Pre-production | Kubernetes (staging) |
| Production | Live users | Kubernetes (prod) |

### CI/CD Pipeline

```yaml
# Example GitHub Actions
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Tests
        run: |
          docker-compose -f docker-compose.test.yml up --abort-on-container-exit
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Images
        run: |
          docker build -t bizpilot-api:${{ github.sha }} -f backend/Dockerfile .
          docker build -t bizpilot-web:${{ github.sha }} -f frontend/Dockerfile .

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          kubectl set image deployment/api api=bizpilot-api:${{ github.sha }}
          kubectl set image deployment/web web=bizpilot-web:${{ github.sha }}
```

---

## 📈 Success Metrics

### Technical Metrics
| Metric | Target | Notes |
|--------|--------|-------|
| API Response Time (p95) - Simple CRUD | < 100ms | Create, Read, Update, Delete operations |
| API Response Time (p95) - List/Search | < 200ms | Paginated lists, filtered queries |
| API Response Time (p95) - Complex Reports | < 2s | Report generation, analytics queries |
| API Response Time (p95) - AI Operations | < 10s | AI assistant, predictions (with streaming) |
| Page Load Time (Initial) | < 2s | First contentful paint |
| Page Load Time (Subsequent) | < 500ms | Client-side navigation |
| Uptime | 99.9% | ~8.76 hours downtime/year allowed |
| Test Coverage | > 80% | Unit + integration tests |
| Build Time | < 10 min | CI/CD pipeline |
| Error Rate | < 0.1% | Application errors |

### Business Metrics
| Metric | Target |
|--------|--------|
| User Activation Rate | > 60% |
| Monthly Active Users | Growth 20% MoM |
| Feature Adoption | > 40% |
| NPS Score | > 50 |
| Support Tickets | < 5% of users |

---

## 💰 Resource Estimation

### Development Team

| Role | Count | Duration | FTE/Commitment |
|------|-------|----------|----------------|
| Technical Lead | 1 | Full project | 100% (40 hrs/wk) |
| Backend Developers | 2-3 | Full project | 100% (40 hrs/wk each) |
| Frontend Developers | 2 | Full project | 100% (40 hrs/wk each) |
| Mobile Developer | 1 | Phase 3-4 | 100% (40 hrs/wk) |
| DevOps Engineer | 1 | Full project | 50% (20 hrs/wk) |
| QA Engineer | 1 | Phase 2-4 | 75% (30 hrs/wk) |
| UI/UX Designer | 1 | Phase 1-2 | 50% (20 hrs/wk) |

**Total Estimated Hours:** 8,000 - 10,000 developer hours

### Infrastructure Costs (Monthly)

| Service | Estimated Cost |
|---------|---------------|
| Cloud Compute (Kubernetes) | $500-1500 |
| Database (PostgreSQL) | $100-300 |
| Redis | $50-100 |
| Elasticsearch | $100-200 |
| Storage (S3/Blob) | $50-100 |
| CDN | $50-100 |
| Monitoring | $100-200 |
| **Total** | **$950-2500/mo** |

### Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | 6 weeks | Core infrastructure, Auth, Basic CRUD |
| Phase 2: Business | 6 weeks | Orders, Customers, Financials |
| Phase 3: Advanced | 6 weeks | AI, Integrations, Mobile |
| Phase 4: Enterprise | 6 weeks | Multi-location, Advanced Reports, Security |
| **Total** | **24 weeks** | **Complete Platform** |

---

## 🎯 Recommendation

### Recommended Stack: **Python (FastAPI + Next.js)**

**Rationale:**
1. **Faster Development:** Python's ecosystem accelerates development
2. **AI Integration:** Native support for ML/AI libraries (LangChain, scikit-learn)
3. **Developer Availability:** Larger talent pool
4. **Modern Async:** FastAPI provides excellent async performance
5. **Cost Effective:** Lower infrastructure requirements

### Alternative: **.NET Stack**

**Consider if:**
- Organization has Microsoft ecosystem investment
- Enterprise customers require .NET stack
- Team has strong C#/.NET expertise
- Azure is the primary cloud provider

---

## 📝 Next Steps

1. **Stakeholder Review:** Present PRP to stakeholders
2. **Technology Decision:** Choose between Python and .NET stack
3. **Team Assembly:** Recruit development team
4. **Environment Setup:** Prepare development infrastructure
5. **Sprint Planning:** Create detailed sprint backlog for Phase 1
6. **Kickoff:** Begin Phase 1 development

---

## 📚 Appendices

### Appendix A: API Specification

See `docs/api/openapi.yaml` for complete API specification.

### Appendix B: Database Migrations

See `docs/database/migrations.md` for database migration strategy.

### Appendix C: Security Considerations

See `docs/security/security-requirements.md` for security requirements.

### Appendix D: Compliance Requirements

See `docs/compliance/` for GDPR, POPIA, and other compliance requirements.

---

**Document Control:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-11 | Development Team | Initial version |

---

*This PRP is a living document and will be updated as the project progresses.*
