/**
 * Tests for order validation utilities.
 *
 * Framework: Jest (TypeScript). These tests assume a ts-jest or babel-jest setup.
 * If this repository uses Vitest/Mocha instead, adapt the describe/it/expect syntax minimally.
 *
 * Focus: Cover the public validators (status transitions, create/update order validations,
 * address validation, order number, payment method, and composite validateOrder).
 *
 * Note: Update the import path below to match the actual module path of the validators.
 * We attempt two common guesses: 'src/validation/orderValidation' and 'src/lib/orderValidation'.
 * If neither exists, adjust to the correct relative path in your project.
 */

// Attempt to import from commonly used locations. Uncomment the one that matches your codebase.
// import {
//   validateStatusTransition,
//   validateCreateOrderRequest,
//   validateOrderItem,
//   validateUpdateOrderRequest,
//   validateAddress,
//   validateOrderNumber,
//   validatePaymentMethod,
//   validateOrder,
//   type ValidationResult,
// } from '../validation/orderValidation'

// Alternative common path:
// import { ... } from '../lib/orderValidation'

// Fallback for colocated module with tests (if module is next to tests). Adjust as needed.
import {
  validateStatusTransition,
  validateCreateOrderRequest,
  validateOrderItem,
  validateUpdateOrderRequest,
  validateAddress,
  validateOrderNumber,
  validatePaymentMethod,
  validateOrder,
  type ValidationResult,
} from '../orderValidation'

type OrderStatus = 'pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled'
type PaymentStatus = 'unpaid'|'partial'|'paid'|'refunded'

interface Address {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

interface CreateOrderItemRequest {
  product_id?: string
  inventory_id?: string
  product_name?: string
  quantity: number
  unit_price: number
}

interface CreateOrderRequest {
  items: CreateOrderItemRequest[]
  discount_amount?: number
  shipping_address?: Address
  billing_address?: Address
  estimated_delivery_date?: string
  payment_method?: string
}

interface UpdateOrderRequest {
  status?: OrderStatus
  payment_status?: PaymentStatus
  discount_amount?: number
  shipping_address?: Address
  billing_address?: Address
  estimated_delivery_date?: string
  actual_delivery_date?: string
}

function expectValid(result: ValidationResult) {
  expect(result.isValid).toBe(true)
  expect(result.errors).toEqual([])
}

function expectInvalid(result: ValidationResult, field?: string, containsMessage?: string | RegExp) {
  expect(result.isValid).toBe(false)
  expect(result.errors.length).toBeGreaterThan(0)
  if (field) {
    expect(result.errors.some(e => e.field === field)).toBe(true)
  }
  if (containsMessage) {
    const messages = result.errors.map(e => e.message).join(' | ')
    if (containsMessage instanceof RegExp) {
      expect(messages).toMatch(containsMessage)
    } else {
      expect(messages).toContain(containsMessage)
    }
  }
}

describe('validateStatusTransition', () => {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  }

  it('rejects same-status transition', () => {
    const r = validateStatusTransition('pending', 'pending')
    expectInvalid(r, 'status', 'already in this status')
  })

  for (const current of Object.keys(transitions) as OrderStatus[]) {
    const allowed = transitions[current]
    const all: OrderStatus[] = ['pending','confirmed','processing','shipped','delivered','cancelled']
    const disallowed = all.filter(s => s !== current && !allowed.includes(s))
    allowed.forEach(next => {
      it(`allows transition ${current} -> ${next}`, () => {
        const r = validateStatusTransition(current, next)
        expectValid(r)
      })
    })
    disallowed.forEach(next => {
      it(`disallows transition ${current} -> ${next}`, () => {
        const r = validateStatusTransition(current, next)
        expectInvalid(r, 'status', `Cannot change status from ${current} to ${next}`)
      })
    })
  }
})

describe('validateOrderItem', () => {
  const base: CreateOrderItemRequest = {
    product_name: 'Widget',
    quantity: 1,
    unit_price: 9.99,
  }

  it('valid item passes', () => {
    expectValid(validateOrderItem(base))
  })

  it('requires product_name non-empty', () => {
    expectInvalid(validateOrderItem({ ...base, product_name: '' }), 'product_name', 'Product name is required')
    expectInvalid(validateOrderItem({ ...base, product_name: '   ' }), 'product_name', 'Product name is required')
  })

  it('limits product_name length to 255', () => {
    const long = 'A'.repeat(256)
    const r = validateOrderItem({ ...base, product_name: long })
    expectInvalid(r, 'product_name', 'cannot exceed 255')
  })

  it('requires quantity > 0 and integer and <= 10,000', () => {
    expectInvalid(validateOrderItem({ ...base, quantity: 0 }), 'quantity', 'greater than 0')
    expectInvalid(validateOrderItem({ ...base, quantity: -3 }), 'quantity', 'greater than 0')
    expectInvalid(validateOrderItem({ ...base, quantity: 2.5 as any }), 'quantity', 'whole number')
    expectInvalid(validateOrderItem({ ...base, quantity: 10001 }), 'quantity', 'cannot exceed 10,000')
    expectValid(validateOrderItem({ ...base, quantity: 10000 }))
  })

  it('requires unit_price >= 0 and <= 999999.99', () => {
    expectInvalid(validateOrderItem({ ...base, unit_price: -0.01 }), 'unit_price', '0 or greater')
    expectInvalid(validateOrderItem({ ...base, unit_price: 1000000 }), 'unit_price', 'cannot exceed $999,999.99')
    expectValid(validateOrderItem({ ...base, unit_price: 0 }))
  })

  it('disallows specifying both product_id and inventory_id', () => {
    const r = validateOrderItem({ ...base, product_id: 'P1', inventory_id: 'I1' })
    expectInvalid(r, 'product_id', 'Cannot specify both product_id and inventory_id')
  })

  it('prefixes nested field errors when fieldPrefix is provided', () => {
    const r = validateOrderItem({ ...base, product_name: '' }, 'items[0]')
    expectInvalid(r, 'items[0].product_name')
  })
})

describe('validateAddress', () => {
  const base: Address = {
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62704',
    country: 'USA',
  }

  it('valid address passes', () => {
    expectValid(validateAddress(base))
  })

  it('street length max 255', () => {
    const r = validateAddress({ ...base, street: 'A'.repeat(256) })
    expectInvalid(r, 'street', 'cannot exceed 255')
  })

  it('city length max 100', () => {
    const r = validateAddress({ ...base, city: 'C'.repeat(101) })
    expectInvalid(r, 'city', 'cannot exceed 100')
  })

  it('state length max 100', () => {
    const r = validateAddress({ ...base, state: 'S'.repeat(101) })
    expectInvalid(r, 'state', 'cannot exceed 100')
  })

  it('postal code length and format', () => {
    expectInvalid(validateAddress({ ...base, postal_code: 'X'.repeat(21) }), 'postal_code', 'cannot exceed 20')
    expectInvalid(validateAddress({ ...base, postal_code: '12@#' }), 'postal_code', 'invalid characters')
    expectValid(validateAddress({ ...base, postal_code: 'A1B 2C-3' }))
  })

  it('country length max 100', () => {
    const r = validateAddress({ ...base, country: 'U'.repeat(101) })
    expectInvalid(r, 'country', 'cannot exceed 100')
  })

  it('prefixes fields when fieldPrefix provided', () => {
    const r = validateAddress({ ...base, city: 'C'.repeat(101) }, 'shipping_address')
    expectInvalid(r, 'shipping_address.city')
  })
})

describe('validateCreateOrderRequest', () => {
  const goodItem: CreateOrderItemRequest = {
    product_name: 'Widget',
    quantity: 2,
    unit_price: 10.0
  }

  const goodOrder = (overrides: Partial<CreateOrderRequest> = {}): CreateOrderRequest => ({
    items: [goodItem],
    ...overrides,
  })

  it('requires at least one item', () => {
    const r = validateCreateOrderRequest({ items: [] })
    expectInvalid(r, 'items', 'at least one item')
  })

  it('propagates nested item errors', () => {
    const r = validateCreateOrderRequest({ items: [{ ...goodItem, quantity: 0 }] })
    expectInvalid(r, 'items[0].quantity', 'greater than 0')
  })

  it('disallows negative discount', () => {
    const r = validateCreateOrderRequest(goodOrder({ discount_amount: -5 }))
    expectInvalid(r, 'discount_amount', 'cannot be negative')
  })

  it('validates shipping and billing addresses if present', () => {
    const badAddr: Address = { city: 'C'.repeat(101) }
    const r = validateCreateOrderRequest(goodOrder({ shipping_address: badAddr, billing_address: badAddr }))
    expectInvalid(r, 'shipping_address.city')
    expectInvalid(r, 'billing_address.city')
  })

  it('disallows estimated delivery date in the past', () => {
    const past = new Date(Date.now() - 24*60*60*1000).toISOString()
    const r = validateCreateOrderRequest(goodOrder({ estimated_delivery_date: past }))
    expectInvalid(r, 'estimated_delivery_date', 'cannot be in the past')
  })

  it('passes with valid data', () => {
    const future = new Date(Date.now() + 24*60*60*1000).toISOString()
    const r = validateCreateOrderRequest(goodOrder({ estimated_delivery_date: future }))
    expectValid(r)
  })
})

describe('validateUpdateOrderRequest', () => {
  it('rejects invalid status and payment status', () => {
    const r = validateUpdateOrderRequest({ status: 'weird' as any, payment_status: 'unknown' as any })
    expectInvalid(r, 'status', 'Invalid order status')
    expectInvalid(r, 'payment_status', 'Invalid payment status')
  })

  it('rejects negative discount_amount', () => {
    const r = validateUpdateOrderRequest({ discount_amount: -1 })
    expectInvalid(r, 'discount_amount', 'cannot be negative')
  })

  it('validates address subfields when provided', () => {
    const r = validateUpdateOrderRequest({ shipping_address: { city: 'C'.repeat(101) } })
    expectInvalid(r, 'shipping_address.city')
  })

  it('validates date formats when provided', () => {
    const r1 = validateUpdateOrderRequest({ estimated_delivery_date: 'not-a-date' })
    expectInvalid(r1, 'estimated_delivery_date', 'Invalid estimated delivery date format')

    const r2 = validateUpdateOrderRequest({ actual_delivery_date: 'also-not-a-date' })
    expectInvalid(r2, 'actual_delivery_date', 'Invalid actual delivery date format')
  })

  it('actual_delivery_date cannot be before estimated_delivery_date', () => {
    const estimated = new Date(Date.now() + 2*24*60*60*1000).toISOString()
    const actual = new Date(Date.now() + 1*24*60*60*1000).toISOString()
    const r = validateUpdateOrderRequest({ estimated_delivery_date: estimated, actual_delivery_date: actual })
    expectInvalid(r, 'actual_delivery_date', 'cannot be before estimated delivery date')
  })

  it('passes when updates valid', () => {
    const r = validateUpdateOrderRequest({
      status: 'processing',
      payment_status: 'paid',
      discount_amount: 0,
      shipping_address: { city: 'City' },
      estimated_delivery_date: new Date(Date.now() + 24*60*60*1000).toISOString(),
      actual_delivery_date: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
    })
    expectValid(r)
  })
})

describe('validateOrderNumber', () => {
  it('requires non-empty', () => {
    expectInvalid(validateOrderNumber(''), 'order_number', 'Order number is required')
  })

  it('limits length to 50', () => {
    const r = validateOrderNumber('O'.repeat(51))
    expectInvalid(r, 'order_number', 'cannot exceed 50')
  })

  it('requires format ORD-XXXX-YYYY (alnum with hyphens)', () => {
    expectInvalid(validateOrderNumber('ORD-12345'), 'order_number', 'must follow format')
    expectInvalid(validateOrderNumber('ord-ABC-123'), 'order_number', 'must follow format')
    expectValid(validateOrderNumber('ORD-ABC123-XYZ789'))
  })
})

describe('validatePaymentMethod', () => {
  const valid = ['cash','credit_card','debit_card','bank_transfer','paypal','stripe','other']

  it('accepts valid methods (case-insensitive)', () => {
    for (const m of valid) {
      expectValid(validatePaymentMethod(m))
      expectValid(validatePaymentMethod(m.toUpperCase()))
    }
  })

  it('rejects invalid method', () => {
    const r = validatePaymentMethod('crypto')
    expectInvalid(r, 'payment_method', 'Invalid payment method')
  })

  it('allows undefined/empty payment method (no validation triggered)', () => {
    // As per implementation, only validates if provided
    expectValid(validatePaymentMethod('' as any))
    expectValid(validatePaymentMethod(undefined as any))
  })
})

describe('validateOrder (composite)', () => {
  const item = (overrides: Partial<CreateOrderItemRequest> = {}): CreateOrderItemRequest => ({
    product_name: 'Gadget',
    quantity: 1,
    unit_price: 100,
    ...overrides,
  })
  const order = (overrides: Partial<CreateOrderRequest> = {}): CreateOrderRequest => ({
    items: [item()],
    ...overrides,
  })

  it('aggregates errors from basic validation', () => {
    const r = validateOrder({ items: [{ ...item(), quantity: 0 }] })
    expectInvalid(r, 'items', /greater than \$0|Quantity must be greater than 0/)
    // We expect at least the item quantity error to be included
    expect(r.errors.some(e => e.field.endsWith('quantity'))).toBe(true)
  })

  it('validates payment method when provided', () => {
    const r = validateOrder(order({ payment_method: 'invalid' }))
    expectInvalid(r, 'payment_method', 'Invalid payment method')
  })

  it('rejects total <= 0', () => {
    const r = validateOrder({ items: [{ ...item(), quantity: 1, unit_price: 0 }] })
    expectInvalid(r, 'items', 'Order total must be greater than $0')
  })

  it('rejects total > 1,000,000', () => {
    const r = validateOrder({ items: [{ ...item(), quantity: 100000, unit_price: 1000 }] })
    expectInvalid(r, 'items', 'cannot exceed $1,000,000')
  })

  it('rejects discount greater than subtotal', () => {
    const r = validateOrder(order({ discount_amount: 101 }))
    expectInvalid(r, 'discount_amount', 'cannot exceed order subtotal')
  })

  it('passes with valid order and optional fields', () => {
    const r = validateOrder(order({ discount_amount: 50, payment_method: 'stripe' }))
    expectValid(r)
  })
})