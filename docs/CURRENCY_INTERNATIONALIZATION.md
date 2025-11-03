# Currency & Financial Internationalization Guide

## Overview

BizPilot supports **currency and financial formatting** for multiple countries and regions. The system automatically detects your location and sets the appropriate currency, or you can manually select your preferred currency.

## Supported Currencies

- **ZAR** - South African Rand (R)
- **USD** - US Dollar ($)
- **EUR** - Euro (€)
- **GBP** - British Pound (£)
- **JPY** - Japanese Yen (¥)
- **CNY** - Chinese Yuan (¥)
- **INR** - Indian Rupee (₹)
- **BRL** - Brazilian Real (R$)
- **CAD** - Canadian Dollar ($)
- **AUD** - Australian Dollar ($)
- **CHF** - Swiss Franc (CHF)

## Features

✅ **Automatic currency detection** based on IP geolocation  
✅ **Manual currency selection** via UI component  
✅ **Locale-specific formatting** for numbers, dates, and currency  
✅ **Proper decimal and thousand separators** for each currency  
✅ **Currency symbol positioning** (before/after amount)  
✅ **Compact notation** for large amounts (1.2K, 1.5M)  
✅ **Date and time formatting** for financial reports  
✅ **Currency parsing** from formatted strings

## Quick Usage

### Using the Hook

```tsx
import { useCurrency } from '../hooks/useCurrency';

function MyComponent() {
  const { format, formatNumber, formatDate, currency } = useCurrency();

  return (
    <div>
      {/* Format currency */}
      <p>Total: {format(1234.56)}</p>
      {/* Output: "R 1 234,56" (for ZAR) */}

      {/* Format number */}
      <p>Quantity: {formatNumber(1234.56)}</p>
      {/* Output: "1 234,56" (for en-ZA locale) */}

      {/* Format date */}
      <p>Date: {formatDate(new Date())}</p>
      {/* Output: "29 Oct 2024" */}

      {/* Current currency */}
      <p>Currency: {currency}</p>
      {/* Output: "ZAR" */}
    </div>
  );
}
```

### Using Formatters Directly

```tsx
import { formatCurrency, formatNumber, formatPercentage } from '../lib/i18n/formatters';

// Format currency with specific currency code
const formatted = formatCurrency(1234.56, 'ZAR');
// Output: "R 1 234,56"

// Format as US dollars
const usd = formatCurrency(1234.56, 'USD');
// Output: "$1,234.56"

// Format number with locale
const number = formatNumber(1234.56, 'en-ZA');
// Output: "1 234,56"

// Format percentage
const percentage = formatPercentage(0.15);
// Output: "15%"
```

## Currency Selector Component

The `CurrencySelector` component is available in the navigation sidebar for easy currency switching:

```tsx
import { CurrencySelector } from '../components/CurrencySelector';

<CurrencySelector className="w-full" showLabel={true} />
```

**Location**: Bottom of the navigation sidebar (left side)

## useCurrency Hook API

### Properties

```typescript
const {
  // Current state
  currency,          // string: Current currency code (e.g., "ZAR")
  config,            // CurrencyConfig: Configuration for current currency
  isLoading,         // boolean: Loading state during detection

  // Actions
  setCurrency,       // (code: string) => void: Change currency

  // Available options
  availableCurrencies, // Array<{code, name, symbol}>: All supported currencies

  // Formatting functions
  format,            // (amount, options?) => string: Format currency
  formatNumber,      // (value, options?) => string: Format number
  formatPercentage,  // (value, decimalPlaces?) => string: Format percentage
  formatDate,        // (date, format?) => string: Format date
  formatDateTime,    // (date) => string: Format date + time
  parseCurrency,     // (value) => number: Parse currency string to number
  formatCompact,     // (value) => string: Format with K/M notation
  formatCompactCurrency, // (amount) => string: Format currency with K/M
} = useCurrency();
```

### Examples

#### Format Currency

```tsx
const { format } = useCurrency();

// Basic formatting
format(1234.56)  // "R 1 234,56" (ZAR)

// Without symbol
format(1234.56, { showSymbol: false })  // "1 234,56"

// With currency code
format(1234.56, { showCode: true })  // "R 1 234,56 ZAR"

// Custom decimal places
format(1234.567, { maximumFractionDigits: 3 })  // "R 1 234,567"
```

#### Format Numbers

```tsx
const { formatNumber } = useCurrency();

formatNumber(1234.56)  // "1 234,56" (en-ZA)
formatNumber(1234.56, { minimumFractionDigits: 0 })  // "1 235"
```

#### Format Dates

```tsx
const { formatDate, formatDateTime } = useCurrency();

formatDate(new Date())  // "29 Oct 2024"
formatDate(new Date(), 'short')  // "29/10/2024"
formatDate(new Date(), 'long')  // "29 October 2024"
formatDateTime(new Date())  // "29 Oct 2024, 14:30"
```

#### Format Percentages

```tsx
const { formatPercentage } = useCurrency();

formatPercentage(0.15)  // "15%"
formatPercentage(0.1534, 1)  // "15.3%"
formatPercentage(0.1534, 2)  // "15.34%"
```

#### Format Compact Numbers

```tsx
const { formatCompact, formatCompactCurrency } = useCurrency();

formatCompact(1234)  // "1.2K"
formatCompact(1234567)  // "1.2M"
formatCompact(1234567890)  // "1.2B"

formatCompactCurrency(1234567)  // "R1.2M"
```

#### Parse Currency

```tsx
const { parseCurrency } = useCurrency();

parseCurrency("R 1 234,56")  // 1234.56
parseCurrency("$1,234.56")  // 1234.56
parseCurrency("€1.234,56")  // 1234.56
```

## Currency Configuration

Each currency has specific configuration:

```typescript
interface CurrencyConfig {
  code: string;              // ISO currency code (e.g., "ZAR")
  symbol: string;            // Currency symbol (e.g., "R")
  name: string;              // Full name (e.g., "South African Rand")
  locale: string;            // Locale code (e.g., "en-ZA")
  decimalPlaces: number;     // Number of decimal places (usually 2)
  thousandsSeparator: string; // Thousands separator (e.g., " " or ",")
  decimalSeparator: string;  // Decimal separator (e.g., "," or ".")
  symbolPosition: 'before' | 'after'; // Where to place symbol
  symbolSpacing: boolean;    // Whether to add space between symbol and amount
}
```

### Example Configurations

**South African Rand (ZAR)**:
```typescript
{
  code: 'ZAR',
  symbol: 'R',
  locale: 'en-ZA',
  decimalPlaces: 2,
  thousandsSeparator: ' ',    // Space
  decimalSeparator: ',',       // Comma
  symbolPosition: 'before',    // R 1 234,56
  symbolSpacing: true
}
```

**US Dollar (USD)**:
```typescript
{
  code: 'USD',
  symbol: '$',
  locale: 'en-US',
  decimalPlaces: 2,
  thousandsSeparator: ',',     // Comma
  decimalSeparator: '.',        // Period
  symbolPosition: 'before',     // $1,234.56
  symbolSpacing: false
}
```

**Euro (EUR)**:
```typescript
{
  code: 'EUR',
  symbol: '€',
  locale: 'de-DE',
  decimalPlaces: 2,
  thousandsSeparator: '.',      // Period
  decimalSeparator: ',',         // Comma
  symbolPosition: 'after',       // 1.234,56 €
  symbolSpacing: true
}
```

## Real-World Examples

### Invoice Total

```tsx
import { useCurrency } from '../hooks/useCurrency';

function InvoiceTotal({ subtotal, tax, total }) {
  const { format } = useCurrency();

  return (
    <div>
      <div>Subtotal: {format(subtotal)}</div>
      <div>Tax (15%): {format(tax)}</div>
      <div className="font-bold">Total: {format(total)}</div>
    </div>
  );
}
```

### Product Price

```tsx
function ProductCard({ product }) {
  const { format } = useCurrency();

  return (
    <div>
      <h3>{product.name}</h3>
      <p className="text-2xl font-bold">{format(product.price)}</p>
    </div>
  );
}
```

### Dashboard Stats

```tsx
function DashboardStats({ revenue, orders }) {
  const { formatCompactCurrency, formatNumber } = useCurrency();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="stat-card">
        <div className="label">Total Revenue</div>
        <div className="value">{formatCompactCurrency(revenue)}</div>
        {/* "R1.2M" instead of "R 1 234 567,89" */}
      </div>
      <div className="stat-card">
        <div className="label">Orders</div>
        <div className="value">{formatNumber(orders, { maximumFractionDigits: 0 })}</div>
      </div>
    </div>
  );
}
```

### Date Range Picker

```tsx
function ReportDateRange({ startDate, endDate }) {
  const { formatDate } = useCurrency();

  return (
    <div>
      Report Period: {formatDate(startDate, 'short')} - {formatDate(endDate, 'short')}
    </div>
  );
}
```

## Automatic Currency Detection

The system automatically detects your currency based on your location:

1. **IP Geolocation**: Uses free geolocation APIs to detect country
2. **Country Mapping**: Maps country code to currency (e.g., ZA → ZAR)
3. **Storage**: Saves detected currency to localStorage
4. **Fallback**: Defaults to ZAR if detection fails

### Detection Flow

```
User visits app
    ↓
Check localStorage for saved preference
    ↓
If found → Use saved currency
    ↓
If not found → Detect via IP geolocation
    ↓
Map country to currency (ZA → ZAR)
    ↓
Save to localStorage
    ↓
Apply currency formatting
```

## Manual Currency Selection

Users can change their currency preference at any time:

1. Click the currency selector in the navigation sidebar
2. Choose from the list of available currencies
3. Selection is saved to localStorage
4. All amounts update immediately

## Best Practices

### 1. Always Use the Hook

```tsx
// ✅ Good
const { format } = useCurrency();
<p>{format(price)}</p>

// ❌ Bad
<p>R{price.toFixed(2)}</p>
```

### 2. Handle Loading State

```tsx
const { format, isLoading } = useCurrency();

if (isLoading) {
  return <Skeleton />;
}

return <p>{format(price)}</p>;
```

### 3. Use Appropriate Format

```tsx
// For large numbers, use compact format
<p>Revenue: {formatCompactCurrency(1234567)}</p>  // "R1.2M"

// For precise amounts, use standard format
<p>Total: {format(1234.56)}</p>  // "R 1 234,56"
```

### 4. Store Raw Numbers

```tsx
// ✅ Store as number in database
{ price: 1234.56 }

// ❌ Don't store formatted strings
{ price: "R 1 234,56" }
```

### 5. Parse User Input

```tsx
const { parseCurrency } = useCurrency();

function handlePriceInput(input: string) {
  const numericValue = parseCurrency(input);
  // numericValue is now a number you can save
}
```

## Troubleshooting

### Currency Not Detected

**Solution**: The system will fallback to ZAR. Check browser console for errors.

### Wrong Thousands Separator

**Solution**: Ensure you're using `format()` from the hook, not manual formatting.

### Numbers Not Formatting

**Solution**: Pass numbers, not strings:
```tsx
// ✅ Good
format(1234.56)

// ❌ Bad
format("1234.56")  // Convert to number first
```

### Date Format Incorrect

**Solution**: Pass a Date object, not a string:
```tsx
// ✅ Good
formatDate(new Date(dateString))

// ❌ Bad
formatDate(dateString)
```

## Resources

- [JavaScript Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Currency Codes (ISO 4217)](https://en.wikipedia.org/wiki/ISO_4217)
- [Locale Codes](https://en.wikipedia.org/wiki/Locale_(computer_software))

## Summary

BizPilot's financial internationalization system:
- ✅ Automatically detects and formats currency based on location
- ✅ Supports 11+ major currencies
- ✅ Provides easy-to-use React hooks
- ✅ Handles all number, currency, and date formatting
- ✅ Allows manual currency selection
- ✅ Persists user preferences

Use the `useCurrency` hook throughout your application for consistent financial formatting! 💰
