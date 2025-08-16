// Order Management Types
// Using TypeScript best practices from Context7 documentation

export interface Order {
  id: string
  business_id: string
  customer_id?: string
  order_number: string
  status: OrderStatus
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_status: PaymentStatus
  payment_method?: string
  notes?: string
  shipping_address?: Address
  billing_address?: Address
  estimated_delivery_date?: string
  actual_delivery_date?: string
  order_date: string
  delivery_date?: string
  created_at: string
  updated_at: string
  created_by?: string
  // Optional denormalized fields used by UI components
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  customer_company?: string
  order_items?: OrderItem[]
  customer?: Customer
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  inventory_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  sku?: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  changed_by?: string
  changed_at: string
  notes?: string
  changed_by_name?: string
}

export interface Customer {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: Address | string
  notes?: string
  tags: string[]
  total_orders: number
  total_spent: number
  average_order_value: number
  last_order_date?: string
  customer_since: string
  preferred_contact_method: 'email' | 'phone' | 'sms'
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  // Optional extended fields used by some UIs
  customer_type?: 'individual' | 'business'
  tax_number?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  orders?: any[]
}

export interface Address {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

// Enums for type safety
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled'

export type PaymentStatus = 
  | 'unpaid' 
  | 'partial' 
  | 'paid' 
  | 'refunded'

// Form interfaces for creating/updating orders
export interface CreateOrderRequest {
  customer_id?: string
  items: CreateOrderItemRequest[]
  notes?: string
  shipping_address?: Address
  billing_address?: Address
  estimated_delivery_date?: string
  payment_method?: string
  discount_amount?: number
}

export interface CreateOrderItemRequest {
  product_id?: string
  inventory_id?: string
  product_name: string
  quantity: number
  unit_price: number
}

export interface UpdateOrderRequest {
  status?: OrderStatus
  payment_status?: PaymentStatus
  notes?: string
  shipping_address?: Address
  billing_address?: Address
  estimated_delivery_date?: string
  actual_delivery_date?: string
  payment_method?: string
  discount_amount?: number
  tax_amount?: number
  total_amount?: number
  subtotal?: number
}

// Validation and calculation interfaces
export interface InventoryValidation {
  isValid: boolean
  errors: InventoryValidationError[]
  warnings: InventoryValidationWarning[]
}

export interface InventoryValidationError {
  product_id?: string
  inventory_id?: string
  product_name: string
  requested_quantity: number
  available_quantity: number
  message: string
}

export interface InventoryValidationWarning {
  product_id?: string
  inventory_id?: string
  product_name: string
  message: string
}

export interface OrderTotal {
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
}

// Hook return types using TypeScript patterns from Context7
export interface UseOrdersReturn {
  orders: Order[]
  loading: boolean
  error: string | null
  createOrder: (orderData: CreateOrderRequest) => Promise<Order>
  updateOrder: (orderId: string, updates: UpdateOrderRequest) => Promise<Order>
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  validateInventory: (items: CreateOrderItemRequest[]) => Promise<InventoryValidation>
  calculateOrderTotal: (items: CreateOrderItemRequest[], discountAmount?: number) => Promise<OrderTotal>
  refreshOrders: () => Promise<void>
  // Optional helpers used by some UIs
  getOrderById?: (orderId: string) => Promise<Order | null>
  loadOrders?: () => Promise<void>
  cancelOrder?: (orderId: string, reason?: string) => Promise<void>
  getOrderStats?: () => Promise<any>
}

// Minimal product and inventory types for UI typing
export interface Product {
  id: string
  name: string
  selling_price?: number
}

export interface InventoryItem {
  id: string
  name: string
  current_quantity: number
  cost_per_unit?: number
  product_id?: string
}

export interface UseOrderReturn {
  order: Order | null
  orderItems: OrderItem[]
  statusHistory: OrderStatusHistory[]
  loading: boolean
  error: string | null
  updateOrder: (updates: UpdateOrderRequest) => Promise<Order>
  updateStatus: (status: OrderStatus, notes?: string) => Promise<void>
  addItem: (item: CreateOrderItemRequest) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  refreshOrder: () => Promise<void>
}

// Search and filter interfaces
export interface OrderFilters {
  status?: OrderStatus[]
  payment_status?: PaymentStatus[]
  customer_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface OrderSearchResult {
  orders: Order[]
  total_count: number
  has_more: boolean
}