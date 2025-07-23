# **BizPilot MVP - One-Day Build Plan**

---

## 🚀 Product: **BizPilot**
### Tagline: *AI-powered business assistant that knows your costs and inventory*

---

## 📋 MVP Task List

### **Phase 1: Project Setup & Authentication (1 hour)**

#### Task 1.1: Initialize Project
- [ ] Create new React project in Bolt.new
- [ ] Set up Tailwind CSS styling
- [ ] Install required dependencies: `@supabase/supabase-js`, `lucide-react`, `qrcode`

#### Task 1.2: Supabase Setup
- [ ] Create Supabase project
- [ ] Configure authentication (email/password)
- [ ] Set up database tables (see schema below)
- [ ] Add Supabase config to React app

#### Task 1.3: Basic Auth UI
- [ ] Create login/signup forms
- [ ] Implement auth state management
- [ ] Add protected route wrapper
- [ ] Basic navigation header with logout

---

### **Phase 2: Core Data Models & UI (2 hours)**

#### Task 2.1: Database Schema Setup
```sql
-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  total_cost DECIMAL(10,2),
  labor_minutes INTEGER DEFAULT 0,
  selling_price DECIMAL(10,2),
  profit_margin DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost DECIMAL(10,2),
  quantity DECIMAL(10,2),
  unit TEXT
);

-- Inventory table
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  current_quantity DECIMAL(10,2),
  unit TEXT,
  low_stock_alert DECIMAL(10,2),
  cost_per_unit DECIMAL(10,2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User settings
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  business_name TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 15.00,
  default_margin DECIMAL(5,2) DEFAULT 40.00
);
```

#### Task 2.2: Main Dashboard UI
- [ ] Create dashboard layout with sidebar navigation
- [ ] Add summary cards (total products, low stock alerts, today's insights)
- [ ] Implement responsive design
- [ ] Add loading states and error handling

---

### **Phase 3: Product Management (2 hours)**

#### Task 3.1: Product CRUD Operations
- [ ] Create "Add Product" form with ingredients
- [ ] Implement dynamic ingredient input (add/remove ingredients)
- [ ] Auto-calculate total cost from ingredients + labor
- [ ] Save products to Supabase
- [ ] Display products list with search/filter

#### Task 3.2: Smart Pricing Calculator
- [ ] Margin calculator component
- [ ] Real-time price updates as costs change
- [ ] Visual profit breakdown (materials vs labor vs profit)
- [ ] Save pricing history

#### Task 3.3: Product Detail View
- [ ] Individual product page
- [ ] Edit product functionality
- [ ] Cost breakdown visualization
- [ ] Delete product with confirmation

---

### **Phase 4: Inventory Management (1 hour)**

#### Task 4.1: Inventory Tracking
- [ ] Inventory list view with current quantities
- [ ] Quick add/subtract quantity controls
- [ ] Low stock alerts (visual indicators)
- [ ] Link inventory items to product ingredients

#### Task 4.2: Inventory Operations
- [ ] Add new inventory items
- [ ] Edit existing inventory
- [ ] Set low stock thresholds
- [ ] Basic inventory value calculations

---

### **Phase 5: AI Business Assistant (1.5 hours)**

#### Task 5.1: OpenAI Integration
- [ ] Set up OpenAI API client
- [ ] Create chat interface component
- [ ] Implement context-aware prompts with user's business data
- [ ] Handle API responses and errors

#### Task 5.2: Business Context System
- [ ] Fetch user's products, inventory, and settings for AI context
- [ ] Create business summary for AI prompts
- [ ] Implement common business questions shortcuts
- [ ] Add conversation history (session-based)

---

### **Phase 6: QR Tip Generator (0.5 hours)**

#### Task 6.1: Tip Page Generator
- [ ] Create simple tip page template
- [ ] Generate QR code using qrcode library
- [ ] Allow customization (business name, tip amounts)
- [ ] Downloadable QR code image

---

### **Phase 7: Polish & Deploy (0.5 hours)**

#### Task 7.1: Final Polish
- [ ] Add proper error boundaries
- [ ] Implement basic analytics tracking
- [ ] Optimize performance and loading states
- [ ] Test all core flows
- [ ] Deploy to production

---

## 🛠️ Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (Database + Auth)
- **AI:** OpenAI GPT-4 API
- **Utilities:** Lucide React (icons), QRCode.js
- **Deployment:** Vercel (via Bolt.new)

---

## 📱 Core Components Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── SignupForm.jsx
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── StatsCards.jsx
│   │   └── RecentActivity.jsx
│   ├── products/
│   │   ├── ProductList.jsx
│   │   ├── ProductForm.jsx
│   │   ├── ProductDetail.jsx
│   │   └── PricingCalculator.jsx
│   ├── inventory/
│   │   ├── InventoryList.jsx
│   │   └── InventoryForm.jsx
│   ├── ai/
│   │   ├── ChatInterface.jsx
│   │   └── BusinessContext.jsx
│   └── shared/
│       ├── Layout.jsx
│       ├── Navigation.jsx
│       └── LoadingSpinner.jsx
├── services/
│   ├── supabase.js
│   ├── openai.js
│   └── calculations.js
├── hooks/
│   ├── useAuth.js
│   ├── useProducts.js
│   └── useInventory.js
└── utils/
    ├── constants.js
    └── helpers.js
```

---

## 🚀 Bolt.new Build Prompt

```
Create a React app called "BizPilot" - an AI-powered business assistant for small businesses to manage costs, inventory, and get smart pricing insights.

CORE FEATURES TO BUILD:

1. AUTHENTICATION (Supabase)
- User signup/login with email/password
- Protected routes
- User session management

2. PRODUCT MANAGEMENT
- Add products with multiple ingredients (name, cost, quantity, unit)
- Auto-calculate total product cost (materials + labor)
- Smart pricing calculator with profit margins
- Products list with search functionality
- Edit/delete products

3. INVENTORY TRACKING  
- Track inventory items with quantities and units
- Set low stock alerts with visual indicators
- Add/subtract inventory quantities
- Link inventory to product ingredients

4. AI BUSINESS ASSISTANT
- Chat interface that uses OpenAI GPT-4
- Provide business context (user's products, costs, inventory) to AI
- Answer questions like "What's my most profitable item?" or "What should I restock?"
- Pre-built question shortcuts

5. QR TIP GENERATOR
- Generate QR codes for tip pages
- Simple tip page with business name and tip amounts
- Download QR code as image

TECHNICAL REQUIREMENTS:
- React + Vite + Tailwind CSS
- Supabase for database and authentication  
- Deepseek API for AI insights
- Lucide React for icons
- QRCode.js for QR generation
- Responsive design
- Error handling and loading states

DATABASE SCHEMA:
- products (id, user_id, name, total_cost, labor_minutes, selling_price, profit_margin)
- ingredients (id, product_id, name, cost, quantity, unit)  
- inventory (id, user_id, name, current_quantity, unit, low_stock_alert, cost_per_unit)
- user_settings (id, user_id, business_name, hourly_rate, default_margin)

UI DESIGN:
- Clean, modern dashboard with sidebar navigation
- Cards-based layout for products and inventory
- Inline editing capabilities
- Mobile-responsive design
- Professional color scheme (blues/grays)

KEY CALCULATIONS:
- Product cost = Sum of (ingredient cost × quantity) + (labor minutes × hourly rate)
- Selling price = Total cost ÷ (1 - margin percentage)  
- Profit margin = (Selling price - Total cost) ÷ Selling price × 100

Start with authentication setup, then build the core product management features, followed by inventory tracking, AI integration, and finally the QR generator. Focus on making it functional and user-friendly.

Make sure to:
- Add proper error handling
- Include loading states
- Make forms user-friendly with validation
- Use consistent styling throughout
- Add helpful tooltips and guidance text
- Make the AI context-aware of the user's actual business data

Environment variables needed:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY  
- VITE_OPENAI_API_KEY
```

---

## 🎯 Success Criteria

### **Must Have (MVP):**
- ✅ User can sign up and log in
- ✅ Add products with ingredients and costs
- ✅ Auto-calculate pricing with margins
- ✅ Track basic inventory
- ✅ Ask AI questions about their business
- ✅ Generate QR tip codes

### **Should Have (Polish):**
- ✅ Responsive mobile design
- ✅ Proper error handling
- ✅ Fast loading times
- ✅ Intuitive user interface

### **Could Have (Future):**
- 📱 Mobile app
- 🔄 Real-time collaboration
- 📊 Advanced analytics
- 🔗 Third-party integrations

This plan delivers a functional, valuable MVP in one day while setting up the foundation for future enhancements.