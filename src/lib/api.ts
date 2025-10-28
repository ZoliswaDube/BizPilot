import axios, { AxiosResponse } from 'axios';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Type definitions
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  discountAmount?: number;
  paymentMethod?: string;
  notes?: string;
  orderDate: string;
  deliveryDate?: string;
  actualDeliveryDate?: string;
  customer?: Customer;
  items: OrderItem[];
  creator?: User;
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  inventoryId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
  inventory?: Inventory;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: string;
  changedBy?: string;
  changedAt: string;
  notes?: string;
  changer?: User;
}

export interface CreateOrderRequest {
  customerId?: string;
  items: {
    productId?: string;
    inventoryId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  discountAmount?: number;
  paymentMethod?: string;
  notes?: string;
  deliveryDate?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface UpdateOrderRequest {
  status?: Order['status'];
  paymentStatus?: Order['paymentStatus'];
  notes?: string;
  deliveryDate?: string;
  actualDeliveryDate?: string;
}

// Customer Types
export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: Address;
  notes?: string;
  tags: string[];
  preferredContactMethod: 'email' | 'phone' | 'sms';
  isActive: boolean;
  customerSince: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  metrics?: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
  };
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: Address;
  notes?: string;
  tags?: string[];
  preferredContactMethod?: 'email' | 'phone' | 'sms';
}

// Expense Types
export interface Expense {
  id: string;
  businessId: string;
  categoryId?: string;
  amount: number;
  description: string;
  expenseDate: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other';
  supplierName?: string;
  receiptUrl?: string;
  notes?: string;
  taxDeductible: boolean;
  isRecurring: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  tags: string[];
  category?: ExpenseCategory;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateExpenseRequest {
  categoryId?: string;
  amount: number;
  description: string;
  expenseDate?: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other';
  supplierName?: string;
  receiptUrl?: string;
  notes?: string;
  taxDeductible?: boolean;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  tags?: string[];
}

// Report Types
export interface DashboardStats {
  period: number;
  revenue: {
    total: number;
    orderCount: number;
    averageOrderValue?: number;
  };
  expenses: {
    total: number;
    expenseCount: number;
  };
  profit: {
    net: number;
    margin: number;
  };
  inventory?: {
    totalItems: number;
    totalQuantity: number;
  };
  customers?: {
    new: number;
  };
  products?: {
    total: number;
  };
}

// Common Types
export interface User {
  id: string;
  email: string;
  profile?: {
    fullName?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  totalCost?: number;
  sellingPrice?: number;
}

export interface Inventory {
  id: string;
  name: string;
  currentQuantity: number;
  costPerUnit: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// API Functions

// Orders API
export const ordersApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<AxiosResponse<PaginatedResponse<Order>>> => {
    return api.get('/orders', { params });
  },

  get: (id: string): Promise<AxiosResponse<Order>> => {
    return api.get(`/orders/${id}`);
  },

  create: (data: CreateOrderRequest): Promise<AxiosResponse<Order>> => {
    return api.post('/orders', data);
  },

  update: (id: string, data: UpdateOrderRequest): Promise<AxiosResponse<Order>> => {
    return api.put(`/orders/${id}`, data);
  },

  delete: (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/orders/${id}`);
  },

  getStats: (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AxiosResponse<any>> => {
    return api.get('/orders/stats/summary', { params });
  },
};

// Customers API
export const customersApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<AxiosResponse<PaginatedResponse<Customer>>> => {
    return api.get('/customers', { params });
  },

  get: (id: string): Promise<AxiosResponse<Customer>> => {
    return api.get(`/customers/${id}`);
  },

  create: (data: CreateCustomerRequest): Promise<AxiosResponse<Customer>> => {
    return api.post('/customers', data);
  },

  update: (id: string, data: Partial<CreateCustomerRequest>): Promise<AxiosResponse<Customer>> => {
    return api.put(`/customers/${id}`, data);
  },

  delete: (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/customers/${id}`);
  },

  getStats: (): Promise<AxiosResponse<any>> => {
    return api.get('/customers/stats/summary');
  },
};

// Expenses API
export const expensesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    paymentMethod?: string;
    taxDeductible?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<AxiosResponse<PaginatedResponse<Expense>>> => {
    return api.get('/expenses', { params });
  },

  get: (id: string): Promise<AxiosResponse<Expense>> => {
    return api.get(`/expenses/${id}`);
  },

  create: (data: CreateExpenseRequest): Promise<AxiosResponse<Expense>> => {
    return api.post('/expenses', data);
  },

  update: (id: string, data: Partial<CreateExpenseRequest>): Promise<AxiosResponse<Expense>> => {
    return api.put(`/expenses/${id}`, data);
  },

  delete: (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/expenses/${id}`);
  },

  getStats: (params?: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }): Promise<AxiosResponse<any>> => {
    return api.get('/expenses/stats/summary', { params });
  },

  // Categories
  listCategories: (): Promise<AxiosResponse<ExpenseCategory[]>> => {
    return api.get('/expenses/categories');
  },

  createCategory: (data: { name: string; description?: string }): Promise<AxiosResponse<ExpenseCategory>> => {
    return api.post('/expenses/categories', data);
  },
};

// Reports API
export const reportsApi = {
  getDashboard: (params?: {
    period?: string;
  }): Promise<AxiosResponse<DashboardStats>> => {
    return api.get('/reports/dashboard', { params });
  },

  getProfitLoss: (params: {
    startDate: string;
    endDate: string;
    reportType?: string;
  }): Promise<AxiosResponse<any>> => {
    return api.get('/reports/profit-loss', { params });
  },

  getCashFlow: (params: {
    startDate: string;
    endDate: string;
    reportType?: string;
  }): Promise<AxiosResponse<any>> => {
    return api.get('/reports/cash-flow', { params });
  },

  getSalesTrends: (params?: {
    period?: string;
  }): Promise<AxiosResponse<any>> => {
    return api.get('/reports/sales-trends', { params });
  },

  getInventoryValuation: (): Promise<AxiosResponse<any>> => {
    return api.get('/reports/inventory-valuation');
  },

  generateReport: (data: {
    startDate: string;
    endDate: string;
    reportType: string;
  }): Promise<AxiosResponse<any>> => {
    return api.post('/reports/generate', data);
  },
};


