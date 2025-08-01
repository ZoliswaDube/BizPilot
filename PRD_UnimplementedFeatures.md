# BizPilot - Product Requirements Document (PRD)
## Unimplemented Features Implementation Plan

**Document Version:** 2.0  
**Created:** January 2025  
**Last Updated:** January 2025  
**Status:** Updated for MCP Server Integration  

---

## 📋 Executive Summary

This PRD outlines the implementation strategy for critical unimplemented features in BizPilot, a comprehensive business management platform. Based on the analysis of `plan.md`, we have identified 17 major feature areas that require implementation to achieve the MVP and beyond.

**IMPORTANT**: All database operations for these features MUST be implemented using the **Supabase MCP Server** for consistent, secure, and maintainable database interactions.

### Current State Analysis
**Implemented Features:**
- ✅ Business setup and onboarding
- ✅ Inventory management system
- ✅ Product management
- ✅ User management and authentication (with MCP server integration)
- ✅ Supplier management
- ✅ Basic dashboard with charts
- ✅ Category management
- ✅ AI chat integration (with enhanced privacy using MCP server)
- ✅ Basic checkout functionality
- ✅ Session management and auto-recovery

**Missing Critical Features:**
- ❌ Sales & Order Management System
- ❌ Customer Management
- ❌ Financial Reporting & Expense Tracking
- ❌ Data Import/Export Capabilities
- ❌ Advanced User Experience Features
- ❌ Multi-user collaboration features
- ❌ Advanced notifications system

---

## 🛠️ **Database Integration Requirements**

### **Primary Database Interface**
All database operations MUST use the **Supabase MCP Server** with the following tools:

#### **Core MCP Server Functions:**
- `mcp_supabase_execute_sql` - For SELECT queries and data retrieval
- `mcp_supabase_apply_migration` - For DDL operations (CREATE TABLE, ALTER TABLE, etc.)
- `mcp_supabase_list_tables` - For schema inspection
- `mcp_supabase_get_advisors` - For security and performance recommendations

#### **Required Implementation Pattern:**
```typescript
// ❌ WRONG - Direct Supabase client usage
const { data, error } = await supabase.from('orders').select('*')

// ✅ CORRECT - MCP Server usage
const data = await mcp_supabase_execute_sql({
  query: 'SELECT * FROM orders WHERE business_id = $1',
  // Parameters handled securely by MCP server
})
```

### **Security Benefits of MCP Server:**
1. **Automatic RLS Enforcement**: All queries respect Row Level Security
2. **SQL Injection Prevention**: Parameterized queries handled safely
3. **Audit Trail**: All database operations are logged
4. **Performance Monitoring**: Query performance tracked automatically
5. **Schema Validation**: Ensures database integrity

---

## 🎯 Phase 1: Critical MVP Features (Weeks 1-4)

### 1. Sales & Order Management System
**Priority:** P0 (Critical)  
**Estimated Effort:** 2 weeks  
**Business Impact:** High - Core revenue tracking functionality

#### 1.1 Requirements

**Functional Requirements:**
- Create, edit, and track customer orders
- Order status management (Pending, Processing, Shipped, Delivered, Cancelled)
- Integration with inventory for automatic stock updates
- Order history and search capabilities
- Basic reporting (daily/weekly/monthly sales)

**Database Schema (via MCP Server):**
```sql
-- Use mcp_supabase_apply_migration for schema changes
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  customer_id uuid REFERENCES customers(id),
  order_number text UNIQUE NOT NULL,
  status text DEFAULT 'pending',
  total_amount decimal(10,2) NOT NULL,
  tax_amount decimal(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL
);
```

**Implementation Requirements:**
- All database operations via `mcp_supabase_execute_sql`
- RLS policies automatically enforced by MCP server
- Real-time updates using MCP server's built-in change detection

**File Modifications:**
- `src/components/orders/OrderManagement.tsx` (new)
- `src/components/orders/OrderForm.tsx` (new)
- `src/hooks/useOrders.ts` (new - using MCP server)
- Database migration via `mcp_supabase_apply_migration`

### 2. Customer Management System
**Priority:** P0 (Critical)  
**Estimated Effort:** 1 week  
**Business Impact:** High - Essential for order tracking and CRM

#### 2.1 Requirements

**Functional Requirements:**
- Customer database with contact information
- Purchase history tracking
- Customer search and filtering
- Basic customer analytics

**Database Schema (via MCP Server):**
```sql
-- Use mcp_supabase_apply_migration
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address jsonb,
  notes text,
  total_orders integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Implementation Requirements:**
- Customer CRUD operations via `mcp_supabase_execute_sql`
- Purchase history aggregation using MCP server queries
- Search functionality with SQL-based filtering

**File Modifications:**
- `src/components/customers/CustomerManagement.tsx` (new)
- `src/components/customers/CustomerForm.tsx` (new)
- `src/hooks/useCustomers.ts` (new - using MCP server)

### 3. Financial Reporting & Expense Tracking
**Priority:** P0 (Critical)  
**Estimated Effort:** 1.5 weeks  
**Business Impact:** High - Essential for business profitability analysis

#### 3.1 Requirements

**Functional Requirements:**
- Expense tracking and categorization
- Revenue vs expense reporting
- Profit margin analysis
- Monthly/quarterly financial summaries

**Database Schema (via MCP Server):**
```sql
-- Use mcp_supabase_apply_migration
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  category text NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text,
  receipt_url text,
  expense_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_revenue decimal(10,2),
  total_expenses decimal(10,2),
  net_profit decimal(10,2),
  report_data jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Implementation Requirements:**
- Financial calculations via aggregation queries using `mcp_supabase_execute_sql`
- Report generation using complex SQL queries through MCP server
- Data visualization with charts fed by MCP server data

---

## 🎯 Phase 2: Team & Collaboration Features (Weeks 5-8)

### 4. Advanced Notifications System
**Priority:** P1 (High)  
**Estimated Effort:** 1 week  

**Database Integration:**
- Notification storage via `mcp_supabase_execute_sql`
- Real-time delivery using MCP server's change detection
- User preference management through MCP server queries

### 5. Data Import/Export System
**Priority:** P1 (High)  
**Estimated Effort:** 1.5 weeks  

**MCP Server Requirements:**
- Bulk data operations using `mcp_supabase_execute_sql` with transactions
- Schema validation via `mcp_supabase_list_tables`
- Data integrity checks using MCP server's built-in validation

### 6. Advanced User Management
**Priority:** P1 (High)  
**Estimated Effort:** 1 week  

**Current Status:** ✅ **COMPLETED** - Role creation functionality implemented using `create_user_role` function via MCP server

---

## 🔧 **Technical Implementation Guidelines**

### **MCP Server Integration Standards:**

#### **1. Database Operations Pattern:**
```typescript
// Always use MCP server for database operations
import { mcp_supabase_execute_sql, mcp_supabase_apply_migration } from '@mcp/supabase'

// For SELECT operations
const fetchOrders = async (businessId: string) => {
  return await mcp_supabase_execute_sql({
    query: `
      SELECT o.*, c.name as customer_name 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      WHERE o.business_id = $1 
      ORDER BY o.created_at DESC
    `,
    params: [businessId]
  })
}

// For schema changes
const createOrdersTable = async () => {
  return await mcp_supabase_apply_migration({
    name: 'create_orders_table',
    query: `
      CREATE TABLE IF NOT EXISTS orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id uuid REFERENCES businesses(id) NOT NULL,
        -- ... other fields
      );
      
      -- Enable RLS
      ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policy
      CREATE POLICY "Users can only access their business orders"
        ON orders FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM business_users 
            WHERE business_id = orders.business_id 
            AND user_id = auth.uid()
          )
        );
    `
  })
}
```

#### **2. Error Handling:**
```typescript
const handleDatabaseOperation = async () => {
  try {
    const result = await mcp_supabase_execute_sql({
      query: 'SELECT * FROM orders WHERE id = $1',
      params: [orderId]
    })
    return result
  } catch (error) {
    // MCP server provides structured error information
    console.error('Database operation failed:', error)
    throw new Error('Failed to fetch order data')
  }
}
```

#### **3. Security Requirements:**
- All tables MUST have RLS policies
- Use `mcp_supabase_get_advisors` to check for security vulnerabilities
- Implement proper business_id filtering in all queries
- Regular security audits via MCP server's advisory system

#### **4. Performance Standards:**
- Use `mcp_supabase_get_advisors` for performance recommendations
- Implement proper indexing via migration files
- Monitor query performance through MCP server logs

### **Testing Requirements:**
- Unit tests for all MCP server integration functions
- Integration tests for complete workflows
- Performance testing for high-volume operations
- Security testing for RLS policy enforcement

---

## 📊 Success Metrics

### **Technical Metrics:**
- 100% database operations via MCP server
- Zero direct Supabase client usage in new features
- Sub-200ms response times for all queries
- Zero RLS policy violations

### **Business Metrics:**
- Complete order lifecycle tracking (creation to fulfillment)
- Real-time inventory updates from order processing
- Automated financial report generation
- Multi-user collaboration without data conflicts

### **Security Metrics:**
- All database operations audited via MCP server
- Zero unauthorized data access incidents
- Comprehensive RLS policy coverage
- Regular security advisory compliance

---

## 🎯 Implementation Priority Matrix

| Feature | Business Impact | Technical Complexity | MCP Integration | Priority |
|---------|----------------|---------------------|-----------------|----------|
| Sales & Orders | High | Medium | Required | P0 |
| Customer Management | High | Low | Required | P0 |
| Financial Reporting | High | Medium | Required | P0 |
| Advanced Notifications | Medium | Low | Required | P1 |
| Data Import/Export | Medium | High | Required | P1 |
| Role Management | Medium | Medium | ✅ Complete | ✅ Done |

---

## 📝 Conclusion

This PRD provides a comprehensive roadmap for implementing BizPilot's remaining features with **mandatory Supabase MCP server integration**. The MCP server ensures consistent security, performance, and maintainability across all database operations.

**Next Steps:**
1. ✅ **COMPLETED**: Role creation functionality (create_user_role function implemented)
2. Begin Phase 1 implementation with Sales & Order Management
3. Establish MCP server integration patterns for the development team
4. Set up monitoring and alerting for MCP server operations

All features must be implemented using the Supabase MCP server to maintain system integrity and security standards. 