# 🤖 BizPilot AI Assistant Context Document

**Purpose**: This document provides complete context about the BizPilot application for AI assistants to provide accurate user support and technical guidance.

**Last Updated**: January 27, 2025  
**Version**: 1.0.0  
**Target Market**: South Africa 🇿🇦  
**Currency**: ZAR (South African Rand)  
**VAT Rate**: 15%

---

## 📖 TABLE OF CONTENTS

1. [Application Overview](#application-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Features](#core-features)
4. [Application Structure](#application-structure)
5. [User Workflows](#user-workflows)
6. [Technical Architecture](#technical-architecture)
7. [Common User Questions](#common-user-questions)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Feature Availability](#feature-availability)

---

## 📱 APPLICATION OVERVIEW

### **What is BizPilot?**
BizPilot is a comprehensive business management platform specifically designed for South African small and medium businesses (SMBs). It helps businesses manage inventory, process payments, generate VAT-compliant invoices, track customers, and analyze business performance.

### **Target Users**
- Small business owners (restaurants, retail, services)
- Entrepreneurs and startups
- South African SMBs needing VAT compliance
- Businesses accepting multiple payment methods

### **Key Differentiators**
1. **South African First** - ZAR currency, 15% VAT, SA payment methods
2. **All-in-One** - Inventory, payments, invoices, customers, analytics
3. **Affordable** - Cheaper than Xero, QuickBooks
4. **Easy to Use** - No accounting knowledge required
5. **Mobile-Friendly** - Works on phones and tablets

### **Technology Stack**
- **Frontend**: React + TypeScript + Vite
- **UI**: TailwindCSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **PDF**: jsPDF

---

## 👥 USER ROLES & PERMISSIONS

### **Role Hierarchy**

#### **1. Admin/Owner** (Highest)
- Full access to everything
- Can edit business settings
- Can manage users and assign roles
- Can view all financial data
- Can delete records
- **First user who creates the business automatically becomes admin**

#### **2. Manager**
- Can manage inventory (add, edit, delete products)
- Can create and edit invoices
- Can process payments
- Can view reports and analytics
- **Cannot** delete business or manage users

#### **3. Employee** (Lowest)
- Can view inventory
- Can process sales/orders
- Can view customer information
- **Cannot** edit prices or view financial reports
- **Cannot** manage users

### **Permission Rules**
- **One business per user** - Each user belongs to only one business
- **One admin per business** - Only one admin/owner allowed
- **Role-based UI** - Forms and buttons disabled based on permissions
- **RLS Security** - Database enforces business isolation

---

## 🎯 CORE FEATURES

### **1. Inventory Management** ✅ COMPLETE
- Add, edit, delete products
- Track stock levels
- Low stock alerts
- Product categories
- Barcode/SKU support
- Product images
- Price management

### **2. Payment Processing** ✅ COMPLETE (Backend)
**South African Payment Methods:**
- **EFT/Bank Transfer** - FNB, Standard Bank, Nedbank, ABSA, Capitec
- **Card Payments** - PayFast, Yoco
- **Mobile Payments** - SnapScan, Zapper
- **Cash** - Manual recording

**Payment Features:**
- Track payment status
- Partial payments supported
- Payment history
- Automatic receipt generation
- Refund tracking

### **3. Invoicing System** ✅ COMPLETE (Backend)
**VAT-Compliant Invoices:**
- Automatic 15% VAT calculation
- Professional invoice templates
- Invoice numbering (INV-XXX-2025-0001)
- Multiple line items
- Discounts per line item
- Bank details for EFT payments
- VAT number display
- Company registration display

**Invoice Statuses:**
- **Draft** - Being created, not sent
- **Sent** - Delivered to customer
- **Viewed** - Customer opened it
- **Paid** - Fully paid
- **Overdue** - Past due date
- **Cancelled** - Voided
- **Refunded** - Money returned

### **4. Customer Management** ✅ COMPLETE
- Customer database
- Contact information
- Purchase history
- VAT numbers for B2B
- Company details
- Customer notes
- Total spent tracking

### **5. Business Settings** ✅ COMPLETE
- Business profile
- Logo upload
- VAT registration number
- Company registration
- Bank account details
- Address information
- Email settings

### **6. Analytics & Reporting** 🟡 IN PROGRESS
- Revenue tracking
- Expense tracking
- Profit/loss calculations
- Sales trends
- Top products
- Customer analytics

### **7. User Management** ✅ COMPLETE
- Add/remove users
- Assign roles
- User profiles
- Activity tracking

---

## 🏗️ APPLICATION STRUCTURE

### **Database Schema**

```
Core Tables:
├── businesses (business profiles)
├── business_users (user-business relationships + roles)
├── user_profiles (user account details)
│
Product Management:
├── categories (product categories)
├── products (inventory items)
├── suppliers (supplier information)
│
Customer Management:
├── customers (customer database)
│
Sales & Orders:
├── orders (sales transactions)
├── order_items (order line items)
│
Payment & Invoicing:
├── payment_methods (available payment options)
├── payments (payment transactions)
├── invoices (VAT-compliant invoices)
├── invoice_items (invoice line items)
└── payment_transactions (detailed payment history)
```

### **Frontend Structure**

```
src/
├── components/           # React components
│   ├── auth/            # Login, signup
│   ├── inventory/       # Product management
│   ├── customers/       # Customer management
│   ├── payments/        # Payment forms (🟡 coming soon)
│   ├── invoices/        # Invoice forms (🟡 coming soon)
│   ├── dashboard/       # Dashboard widgets
│   ├── business/        # Business settings
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Navigation, sidebar
│
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication
│   ├── useBusiness.ts   # Business data
│   ├── useInventory.ts  # Product management
│   ├── useCustomers.ts  # Customer data
│   ├── usePayments.ts   # Payment processing
│   └── useInvoices.ts   # Invoice management
│
├── services/            # Business logic layer
│   ├── paymentService.ts
│   ├── invoiceService.ts
│   └── supabase.ts
│
├── types/               # TypeScript definitions
│   ├── payments.ts      # Payment & invoice types
│   └── database.ts      # Database types
│
├── stores/              # Zustand state management
│   └── authStore.ts     # Auth state
│
└── pages/               # Route pages
    ├── Dashboard.tsx
    ├── Inventory.tsx
    ├── Customers.tsx
    ├── Orders.tsx
    ├── Payments.tsx     # 🟡 Coming soon
    ├── Invoices.tsx     # 🟡 Coming soon
    └── Settings.tsx
```

### **Key Files to Know**

| File | Purpose |
|------|---------|
| `src/types/payments.ts` | All payment/invoice type definitions |
| `src/services/paymentService.ts` | Payment processing logic |
| `src/services/invoiceService.ts` | Invoice generation logic |
| `src/hooks/usePayments.ts` | Payment React hook |
| `src/hooks/useInvoices.ts` | Invoice React hook |
| `supabase/migrations/*.sql` | Database schema |

---

## 👣 USER WORKFLOWS

### **🎯 WORKFLOW 1: How to Create an Invoice**

#### **Step-by-Step Guide:**

**Prerequisites:**
- You must be logged in
- You must have **Admin** or **Manager** role
- You must have at least one customer in the system

**Steps:**

1. **Navigate to Invoices Page**
   - Click "Invoices" in the sidebar navigation
   - Or go to `/invoices` route

2. **Click "Create Invoice" Button**
   - Located at top-right of page
   - Opens invoice creation form

3. **Fill in Invoice Details**
   
   **Customer Information:**
   - Select customer from dropdown
   - Customer's details auto-fill (name, email, VAT number)
   
   **Invoice Settings:**
   - Issue Date (defaults to today)
   - Due Date (select payment deadline)
   - Invoice Number (auto-generated: INV-XXX-2025-0001)
   
   **Add Line Items:**
   - Click "Add Item" button
   - For each item:
     - Description (e.g., "Web Design Services")
     - Quantity (e.g., 40 hours)
     - Unit Price (e.g., R850.00)
     - Tax % (defaults to 15% VAT)
     - Discount % (optional)
   
   **Automatic Calculations:**
   - Subtotal = Quantity × Unit Price
   - Discount = Subtotal × Discount %
   - VAT = (Subtotal - Discount) × 15%
   - Total = Subtotal - Discount + VAT
   
   **Additional Details (Optional):**
   - Notes for customer
   - Payment terms
   - Payment instructions
   - Bank details for EFT

4. **Review Totals**
   - Check subtotal, VAT, and total amount
   - All calculations are automatic

5. **Save Invoice**
   - **Save as Draft**: Click "Save Draft" (status: draft)
   - **Send to Customer**: Click "Send Invoice" (status: sent)

6. **After Creation**
   - Invoice appears in invoice list
   - Can view, edit, or send PDF
   - Can track payment status

#### **Technical Implementation:**

```typescript
// Using the useInvoices hook
import { useInvoices } from '@/hooks/useInvoices'

const { createInvoice, loading, error } = useInvoices()

const newInvoice = {
  customer_id: 'customer-uuid',
  issue_date: '2025-01-27',
  due_date: '2025-02-27',
  status: 'draft',
  items: [
    {
      description: 'Web Design Services',
      quantity: 40,
      unit_price: 850.00,
      tax_percentage: 15,
      discount_percentage: 0
    }
  ],
  notes: 'Thank you for your business!',
  vat_number: '4123456789',
  bank_name: 'FNB',
  bank_account_number: '62********45'
}

await createInvoice(newInvoice)
```

---

### **🎯 WORKFLOW 2: How to Process a Payment**

#### **Step-by-Step Guide:**

**Prerequisites:**
- You must be logged in
- You must have **Admin** or **Manager** role
- Payment methods must be set up

**Steps:**

1. **Navigate to Payments Page**
   - Click "Payments" in sidebar
   - Or go to `/payments` route

2. **Two Ways to Create Payment:**

   **Option A: From Invoice**
   - Go to Invoices page
   - Find invoice to pay
   - Click "Record Payment" button
   - Invoice details auto-fill

   **Option B: Direct Payment**
   - Click "New Payment" button
   - Select invoice (or leave blank for direct sale)

3. **Enter Payment Details**
   
   **Amount:**
   - Enter payment amount in ZAR
   - Can be partial or full payment
   
   **Payment Method:**
   - Select from dropdown:
     - EFT (FNB, Standard Bank, Nedbank, ABSA, Capitec)
     - Card (Yoco, PayFast)
     - Mobile (SnapScan, Zapper)
     - Cash
   
   **Payment Information:**
   - Payment date (defaults to today)
   - Reference/description
   - Bank reference (for EFT)
   
4. **Submit Payment**
   - Click "Record Payment"
   - Payment is saved with status "succeeded"
   - Invoice status updates automatically

5. **After Recording:**
   - Payment appears in payment history
   - Invoice shows amount paid
   - Receipt can be generated

#### **Payment Statuses:**
- **Pending**: Payment initiated, waiting
- **Processing**: Being processed by provider
- **Succeeded**: Payment received ✅
- **Failed**: Payment declined ❌
- **Refunded**: Money returned
- **Cancelled**: Payment voided

#### **Technical Implementation:**

```typescript
// Using the usePayments hook
import { usePayments } from '@/hooks/usePayments'

const { createPayment, loading, error } = usePayments()

const newPayment = {
  invoice_id: 'invoice-uuid',
  payment_method_id: 'payment-method-uuid',
  amount: 20000.00,
  currency: 'ZAR',
  status: 'succeeded',
  provider: 'eft',
  description: 'EFT payment via FNB',
  paid_at: new Date().toISOString()
}

await createPayment(newPayment)
```

---

### **🎯 WORKFLOW 3: How to Add a Product**

**Steps:**

1. Navigate to Inventory
2. Click "Add Product"
3. Fill in:
   - Product name
   - SKU/Barcode
   - Category
   - Price
   - Stock quantity
   - Low stock alert level
4. Upload image (optional)
5. Click "Save"

---

### **🎯 WORKFLOW 4: How to Add a Customer**

**Steps:**

1. Navigate to Customers
2. Click "Add Customer"
3. Fill in:
   - Customer name
   - Company name (for B2B)
   - Email and phone
   - Address
   - VAT number (for VAT-registered companies)
4. Click "Save"

---

### **🎯 WORKFLOW 5: How to View Business Reports**

**Steps:**

1. Navigate to Dashboard
2. View widgets:
   - Total revenue
   - Outstanding payments
   - Recent sales
   - Top products
   - Low stock alerts
3. Click widgets to drill down
4. Export reports (coming soon)

---

## 🔧 TECHNICAL ARCHITECTURE

### **Authentication Flow**

```
1. User signs up → Create user in auth.users
2. Create profile in user_profiles
3. User creates business → Create business record
4. User becomes admin → Insert into business_users (role='admin')
5. User logs in → Load profile + business + role
6. Access controlled by RLS policies based on role
```

### **Payment Processing Flow**

```
1. User creates invoice with items
2. Items calculate subtotal, VAT, total (automatic)
3. Invoice totals update via trigger
4. User records payment
5. Payment links to invoice
6. Invoice amount_paid updates
7. Invoice status updates (paid/partial/overdue)
8. Payment transaction logged
```

### **Invoice Calculation Logic**

```typescript
// For each line item:
subtotal = quantity × unit_price
discount_amount = subtotal × (discount_percentage / 100)
taxable_amount = subtotal - discount_amount
tax_amount = taxable_amount × (tax_percentage / 100)
total_amount = taxable_amount + tax_amount

// Invoice totals:
invoice.subtotal = SUM(items.subtotal)
invoice.tax_amount = SUM(items.tax_amount)
invoice.discount_amount = SUM(items.discount_amount)
invoice.total_amount = SUM(items.total_amount)
invoice.amount_due = total_amount - amount_paid
```

### **Database Functions**

```sql
-- Generate invoice number
generate_invoice_number(business_id) → 'INV-XXX-2025-0001'

-- Generate payment number
generate_payment_number(business_id) → 'PAY-XXX-2025-0001'

-- Update invoice totals (trigger)
update_invoice_totals() → Recalculates on item change
```

---

## ❓ COMMON USER QUESTIONS

### **Q: How do I create an invoice?**
**A**: See [Workflow 1](#workflow-1-how-to-create-an-invoice) above for detailed steps.

### **Q: How do I accept payments?**
**A**: See [Workflow 2](#workflow-2-how-to-process-a-payment) above.

### **Q: Where do I set up my payment methods?**
**A**: 
1. Go to Settings → Payment Methods
2. Click "Add Payment Method"
3. Choose type (EFT, Card, Mobile, Cash)
4. Enter bank details or provider info
5. Set as default (optional)

### **Q: How do I add my VAT number?**
**A**:
1. Go to Settings → Business Profile
2. Find "VAT Number" field
3. Enter your VAT registration number
4. It will appear on all invoices

### **Q: Can I send partial invoices or accept partial payments?**
**A**: Yes! The system supports:
- Partial payments (pay R20,000 on R50,000 invoice)
- Multiple payments per invoice
- Outstanding balance tracking
- Automatic status updates

### **Q: How do I track overdue invoices?**
**A**:
1. Go to Invoices page
2. Filter by status "Overdue"
3. System automatically marks invoices overdue after due date
4. Dashboard shows overdue count

### **Q: Can I edit an invoice after sending?**
**A**:
- **Draft invoices**: Yes, fully editable
- **Sent invoices**: Limited edits (avoid changing amounts)
- **Paid invoices**: Cannot edit amounts
- Best practice: Cancel and recreate if major changes needed

### **Q: How do I give someone access to my business?**
**A**:
1. Go to Settings → User Management
2. Click "Add User"
3. Enter email address
4. Assign role (Manager or Employee)
5. User receives invitation
6. Note: Only one admin allowed per business

### **Q: What payment methods does BizPilot support?**
**A**: All major South African methods:
- **EFT**: FNB, Standard Bank, Nedbank, ABSA, Capitec
- **Cards**: Yoco, PayFast (coming soon)
- **Mobile**: SnapScan, Zapper (coming soon)
- **Cash**: Manual recording

### **Q: Is VAT automatically calculated?**
**A**: Yes! 
- 15% VAT applied to all invoice items by default
- Can set 0% for zero-rated items
- Subtotal, VAT, and total calculated automatically
- Invoice shows VAT breakdown

### **Q: How do I export my data?**
**A**: (Coming soon)
- Export invoices to PDF
- Export payments to CSV
- Export products to Excel
- Export for SARS/accounting software

### **Q: Can I use this on my phone?**
**A**: Yes!
- Mobile-responsive design
- Works on all devices
- Mobile app coming soon with:
  - Barcode scanning
  - Offline mode
  - Push notifications

---

## 🔥 TROUBLESHOOTING GUIDE

### **Problem: Cannot create invoice**

**Symptoms**: Button disabled or error message

**Solutions**:
1. **Check role**: Must be Admin or Manager
2. **Check customer**: Must select a customer first
3. **Check items**: Must add at least one item
4. **Check amounts**: Prices must be > 0
5. **Check dates**: Due date must be after issue date

---

### **Problem: Payment not showing on invoice**

**Symptoms**: Payment recorded but invoice still shows unpaid

**Solutions**:
1. **Check invoice link**: Ensure payment linked to correct invoice
2. **Check status**: Payment must have status "succeeded"
3. **Refresh page**: Sometimes needs manual refresh
4. **Check amount**: Verify amount matches or is partial

---

### **Problem: VAT calculation wrong**

**Symptoms**: VAT amount doesn't look right

**Solutions**:
1. **Check tax %**: Should be 15% for most items
2. **Check discount**: Discount applied before VAT
3. **Formula**: VAT = (Subtotal - Discount) × 15%
4. **Zero-rated**: Use 0% tax for exports/basic foods

---

### **Problem: Cannot see business data**

**Symptoms**: Empty dashboard, no products/customers

**Solutions**:
1. **Check business**: Ensure business created
2. **Check role**: Ensure assigned to business
3. **Check RLS**: Database security may be blocking
4. **Re-login**: Sometimes fixes stale session

---

### **Problem: Permission denied**

**Symptoms**: "You don't have permission" error

**Solutions**:
1. **Check role**: 
   - Employee: Limited access
   - Manager: Can edit inventory/invoices
   - Admin: Full access
2. **Contact admin**: Ask for role upgrade
3. **Refresh**: Reload page after role change

---

## 📊 FEATURE AVAILABILITY

### **✅ Fully Available (Working Now)**
- User authentication
- Business profile management
- Inventory management
- Customer management
- User management with roles
- Database for payments & invoices
- Payment tracking (backend)
- Invoice generation (backend)
- VAT calculations

### **🟡 Partially Available (Backend Ready, UI Coming)**
- Payment processing UI
- Invoice creation UI
- Payment history view
- Invoice PDF generation

### **⏳ Coming Soon**
- PayFast integration
- Yoco integration
- Email notifications
- SMS notifications
- Advanced analytics
- Data export
- Mobile app
- Barcode scanning
- Offline mode

---

## 🎓 SUPPORT GUIDELINES FOR AI ASSISTANTS

### **When Answering Questions:**

1. **Always check role permissions first**
   - Different roles have different access
   - Refer to [User Roles](#user-roles--permissions)

2. **Provide step-by-step instructions**
   - Be specific (button names, page locations)
   - Include screenshots references when possible
   - Refer to [User Workflows](#user-workflows)

3. **Use South African context**
   - Amounts in ZAR (R)
   - Mention VAT (15%)
   - Reference local banks (FNB, Nedbank, etc.)

4. **Explain "why" not just "how"**
   - Help users understand concepts
   - VAT compliance reasons
   - Business benefits

5. **Know what's available**
   - Check [Feature Availability](#feature-availability)
   - Don't promise features not yet built
   - Set expectations clearly

6. **Troubleshoot effectively**
   - Ask clarifying questions
   - Check common issues first
   - Refer to [Troubleshooting Guide](#troubleshooting-guide)

### **Example Responses:**

**Bad**: "Just create an invoice."

**Good**: "To create an invoice, follow these steps:
1. Click 'Invoices' in the sidebar
2. Click 'Create Invoice' button (top-right)
3. Select your customer from the dropdown
4. Add line items with descriptions and amounts
5. The system will automatically calculate 15% VAT
6. Click 'Save Draft' or 'Send Invoice'

Note: You need Admin or Manager role to create invoices. If you're an Employee, ask your admin for permission."

---

## 📝 QUICK REFERENCE

### **Common Paths**
- Dashboard: `/dashboard`
- Inventory: `/inventory`
- Customers: `/customers`
- Invoices: `/invoices`
- Payments: `/payments`
- Settings: `/settings`

### **Default Values**
- Currency: ZAR
- VAT Rate: 15%
- Invoice Due: 30 days
- Low Stock: 10 units

### **Contact & Support**
- Documentation: `/docs` folder
- Implementation Plan: `IMPLEMENTATION_PLAN.md`
- Quick Start: `docs/QUICK_START_GUIDE.md`

---

**This document should enable AI assistants to provide comprehensive support for BizPilot users.** 🚀

*Last Updated: January 27, 2025*
