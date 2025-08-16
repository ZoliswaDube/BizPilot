import type { 
  CreateOrderRequest, 
  CreateOrderItemRequest, 
  UpdateOrderRequest,
  OrderStatus,
  PaymentStatus,
  Address 
} from '../types/orders'

// Validation error interface
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Order status workflow validation
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['processing', 'cancelled'],
  'processing': ['shipped', 'cancelled'],
  'shipped': ['delivered'],
  'delivered': [],
  'cancelled': []
}

// Validate order status transition
export function validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): ValidationResult {
  const errors: ValidationError[] = []

  if (currentStatus === newStatus) {
    errors.push({
      field: 'status',
      message: 'Order is already in this status'
    })
  }

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || []
  if (!allowedTransitions.includes(newStatus)) {
    errors.push({
      field: 'status',
      message: `Cannot change status from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate create order request
export function validateCreateOrderRequest(orderData: CreateOrderRequest): ValidationResult {
  const errors: ValidationError[] = []

  // Validate items
  if (!orderData.items || orderData.items.length === 0) {
    errors.push({
      field: 'items',
      message: 'Order must have at least one item'
    })
  } else {
    orderData.items.forEach((item, index) => {
      const itemErrors = validateOrderItem(item, `items[${index}]`)
      errors.push(...itemErrors.errors)
    })
  }

  // Validate discount amount
  if (orderData.discount_amount !== undefined && orderData.discount_amount < 0) {
    errors.push({
      field: 'discount_amount',
      message: 'Discount amount cannot be negative'
    })
  }

  // Validate addresses
  if (orderData.shipping_address) {
    const shippingErrors = validateAddress(orderData.shipping_address, 'shipping_address')
    errors.push(...shippingErrors.errors)
  }

  if (orderData.billing_address) {
    const billingErrors = validateAddress(orderData.billing_address, 'billing_address')
    errors.push(...billingErrors.errors)
  }

  // Validate estimated delivery date
  if (orderData.estimated_delivery_date) {
    const deliveryDate = new Date(orderData.estimated_delivery_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (deliveryDate < today) {
      errors.push({
        field: 'estimated_delivery_date',
        message: 'Estimated delivery date cannot be in the past'
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate order item
export function validateOrderItem(item: CreateOrderItemRequest, fieldPrefix = ''): ValidationResult {
  const errors: ValidationError[] = []
  const prefix = fieldPrefix ? `${fieldPrefix}.` : ''

  // Validate product name
  if (!item.product_name || item.product_name.trim().length === 0) {
    errors.push({
      field: `${prefix}product_name`,
      message: 'Product name is required'
    })
  }

  if (item.product_name && item.product_name.length > 255) {
    errors.push({
      field: `${prefix}product_name`,
      message: 'Product name cannot exceed 255 characters'
    })
  }

  // Validate quantity
  if (!item.quantity || item.quantity <= 0) {
    errors.push({
      field: `${prefix}quantity`,
      message: 'Quantity must be greater than 0'
    })
  }

  if (item.quantity && !Number.isInteger(item.quantity)) {
    errors.push({
      field: `${prefix}quantity`,
      message: 'Quantity must be a whole number'
    })
  }

  if (item.quantity && item.quantity > 10000) {
    errors.push({
      field: `${prefix}quantity`,
      message: 'Quantity cannot exceed 10,000'
    })
  }

  // Validate unit price
  if (item.unit_price === undefined || item.unit_price < 0) {
    errors.push({
      field: `${prefix}unit_price`,
      message: 'Unit price must be 0 or greater'
    })
  }

  if (item.unit_price && item.unit_price > 999999.99) {
    errors.push({
      field: `${prefix}unit_price`,
      message: 'Unit price cannot exceed $999,999.99'
    })
  }

  // Validate that either product_id or inventory_id is provided (but not both)
  if (item.product_id && item.inventory_id) {
    errors.push({
      field: `${prefix}product_id`,
      message: 'Cannot specify both product_id and inventory_id'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate update order request
export function validateUpdateOrderRequest(updates: UpdateOrderRequest): ValidationResult {
  const errors: ValidationError[] = []

  // Validate status
  if (updates.status && !['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(updates.status)) {
    errors.push({
      field: 'status',
      message: 'Invalid order status'
    })
  }

  // Validate payment status
  if (updates.payment_status && !['unpaid', 'partial', 'paid', 'refunded'].includes(updates.payment_status)) {
    errors.push({
      field: 'payment_status',
      message: 'Invalid payment status'
    })
  }

  // Validate discount amount
  if (updates.discount_amount !== undefined && updates.discount_amount < 0) {
    errors.push({
      field: 'discount_amount',
      message: 'Discount amount cannot be negative'
    })
  }

  // Validate addresses
  if (updates.shipping_address) {
    const shippingErrors = validateAddress(updates.shipping_address, 'shipping_address')
    errors.push(...shippingErrors.errors)
  }

  if (updates.billing_address) {
    const billingErrors = validateAddress(updates.billing_address, 'billing_address')
    errors.push(...billingErrors.errors)
  }

  // Validate dates
  if (updates.estimated_delivery_date) {
    const deliveryDate = new Date(updates.estimated_delivery_date)
    if (isNaN(deliveryDate.getTime())) {
      errors.push({
        field: 'estimated_delivery_date',
        message: 'Invalid estimated delivery date format'
      })
    }
  }

  if (updates.actual_delivery_date) {
    const deliveryDate = new Date(updates.actual_delivery_date)
    if (isNaN(deliveryDate.getTime())) {
      errors.push({
        field: 'actual_delivery_date',
        message: 'Invalid actual delivery date format'
      })
    }
  }

  // Validate that actual delivery date is not before estimated delivery date
  if (updates.estimated_delivery_date && updates.actual_delivery_date) {
    const estimated = new Date(updates.estimated_delivery_date)
    const actual = new Date(updates.actual_delivery_date)
    
    if (actual < estimated) {
      errors.push({
        field: 'actual_delivery_date',
        message: 'Actual delivery date cannot be before estimated delivery date'
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate address
export function validateAddress(address: Address, fieldPrefix = ''): ValidationResult {
  const errors: ValidationError[] = []
  const prefix = fieldPrefix ? `${fieldPrefix}.` : ''

  // Street is optional but if provided, validate length
  if (address.street && address.street.length > 255) {
    errors.push({
      field: `${prefix}street`,
      message: 'Street address cannot exceed 255 characters'
    })
  }

  // City validation
  if (address.city && address.city.length > 100) {
    errors.push({
      field: `${prefix}city`,
      message: 'City cannot exceed 100 characters'
    })
  }

  // State validation
  if (address.state && address.state.length > 100) {
    errors.push({
      field: `${prefix}state`,
      message: 'State cannot exceed 100 characters'
    })
  }

  // Postal code validation
  if (address.postal_code) {
    if (address.postal_code.length > 20) {
      errors.push({
        field: `${prefix}postal_code`,
        message: 'Postal code cannot exceed 20 characters'
      })
    }

    // Basic postal code format validation (alphanumeric, spaces, hyphens)
    const postalCodeRegex = /^[A-Za-z0-9\s\-]+$/
    if (!postalCodeRegex.test(address.postal_code)) {
      errors.push({
        field: `${prefix}postal_code`,
        message: 'Postal code contains invalid characters'
      })
    }
  }

  // Country validation
  if (address.country && address.country.length > 100) {
    errors.push({
      field: `${prefix}country`,
      message: 'Country cannot exceed 100 characters'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate order number format
export function validateOrderNumber(orderNumber: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!orderNumber || orderNumber.trim().length === 0) {
    errors.push({
      field: 'order_number',
      message: 'Order number is required'
    })
  }

  if (orderNumber && orderNumber.length > 50) {
    errors.push({
      field: 'order_number',
      message: 'Order number cannot exceed 50 characters'
    })
  }

  // Order number should follow pattern: ORD-XXXXXXX-XXXXX
  const orderNumberRegex = /^ORD-[A-Z0-9]+-[A-Z0-9]+$/
  if (orderNumber && !orderNumberRegex.test(orderNumber)) {
    errors.push({
      field: 'order_number',
      message: 'Order number must follow format: ORD-XXXXXXX-XXXXX'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate payment method
export function validatePaymentMethod(paymentMethod: string): ValidationResult {
  const errors: ValidationError[] = []
  const validMethods = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'other']

  if (paymentMethod && !validMethods.includes(paymentMethod.toLowerCase())) {
    errors.push({
      field: 'payment_method',
      message: `Invalid payment method. Valid options: ${validMethods.join(', ')}`
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Comprehensive order validation
export function validateOrder(orderData: CreateOrderRequest): ValidationResult {
  const errors: ValidationError[] = []

  // Basic order validation
  const basicValidation = validateCreateOrderRequest(orderData)
  errors.push(...basicValidation.errors)

  // Validate payment method if provided
  if (orderData.payment_method) {
    const paymentValidation = validatePaymentMethod(orderData.payment_method)
    errors.push(...paymentValidation.errors)
  }

  // Business logic validations
  const totalValue = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  
  if (totalValue <= 0) {
    errors.push({
      field: 'items',
      message: 'Order total must be greater than $0'
    })
  }

  if (totalValue > 1000000) {
    errors.push({
      field: 'items',
      message: 'Order total cannot exceed $1,000,000'
    })
  }

  // Validate discount doesn't exceed order total
  if (orderData.discount_amount && orderData.discount_amount > totalValue) {
    errors.push({
      field: 'discount_amount',
      message: 'Discount amount cannot exceed order subtotal'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}