# Currency & Financial Internationalization - Complete! ✅

## Overview

BizPilot now has **currency and financial formatting** internationalization (not language translation). The system automatically formats currency, numbers, and dates based on your location.

## 🌍 What Was Implemented

### Currency Support (11+ Currencies)
- **ZAR** - South African Rand (R) - Default
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

### Key Features
✅ Automatic currency detection based on location (IP geolocation)  
✅ Manual currency selection via UI component  
✅ Locale-specific number formatting (1 234,56 vs 1,234.56)  
✅ Proper decimal and thousands separators for each currency  
✅ Currency symbol positioning (before/after amount)  
✅ Date and time formatting for financial reports  
✅ Compact notation for large amounts (1.2K, 1.5M)  
✅ Currency parsing from formatted strings

## 🚀 Quick Usage

### Basic Hook Usage

```tsx
import { useCurrency } from '../hooks/useCurrency';

function MyComponent() {
  const { format, formatNumber, formatDate } = useCurrency();

  return (
    <div>
      <p>Price: {format(1234.56)}</p>
      {/* Output: "R 1 234,56" (for ZAR) */}
      
      <p>Quantity: {formatNumber(1234.56)}</p>
      {/* Output: "1 234,56" */}
      
      <p>Date: {formatDate(new Date())}</p>
      {/* Output: "29 Oct 2024" */}
    </div>
  );
}
```

### Currency Selector

The currency selector is already in your navigation sidebar (bottom left). Users can:
1. Click the currency selector
2. Choose their preferred currency
3. All amounts update immediately

## 📦 Files Created

### Core Files
- `src/lib/i18n/currencyConfig.ts` - Currency configurations
- `src/lib/i18n/formatters.ts` - Formatting functions
- `src/hooks/useCurrency.ts` - React hook for currency
- `src/components/CurrencySelector.tsx` - UI component

### Documentation
- `docs/CURRENCY_INTERNATIONALIZATION.md` - Complete guide

### Updated Files
- `src/components/layout/Navigation.tsx` - Added CurrencySelector

## 💡 Common Examples

### Format Invoice Total

```tsx
function InvoiceSummary({ subtotal, tax, total }) {
  const { format } = useCurrency();

  return (
    <div>
      <div>Subtotal: {format(subtotal)}</div>
      <div>Tax: {format(tax)}</div>
      <div className="font-bold">Total: {format(total)}</div>
    </div>
  );
}
```

### Format Product Price

```tsx
function ProductCard({ product }) {
  const { format } = useCurrency();

  return (
    <div>
      <h3>{product.name}</h3>
      <p className="price">{format(product.price)}</p>
    </div>
  );
}
```

### Format Dashboard Stats

```tsx
function StatsCard({ revenue }) {
  const { formatCompactCurrency } = useCurrency();

  return (
    <div className="stat-card">
      <p className="label">Total Revenue</p>
      <p className="value">{formatCompactCurrency(revenue)}</p>
      {/* Output: "R1.2M" instead of "R 1 234 567,89" */}
    </div>
  );
}
```

### Parse User Input

```tsx
function PriceInput() {
  const { parseCurrency } = useCurrency();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseCurrency(e.target.value);
    // numericValue is now a number (1234.56)
    console.log(numericValue);
  };

  return <input type="text" onChange={handleChange} />;
}
```

## 🎯 Hook API Reference

```tsx
const {
  // State
  currency,          // "ZAR" | "USD" | "EUR" | ...
  config,            // { symbol: "R", locale: "en-ZA", ... }
  isLoading,         // boolean
  
  // Actions
  setCurrency,       // (code: string) => void
  
  // Options
  availableCurrencies, // [{ code, name, symbol }, ...]
  
  // Formatting
  format,            // (amount) => "R 1 234,56"
  formatNumber,      // (value) => "1 234,56"
  formatPercentage,  // (0.15) => "15%"
  formatDate,        // (date) => "29 Oct 2024"
  formatDateTime,    // (date) => "29 Oct 2024, 14:30"
  parseCurrency,     // ("R 1 234,56") => 1234.56
  formatCompact,     // (1234567) => "1.2M"
  formatCompactCurrency, // (1234567) => "R1.2M"
} = useCurrency();
```

## 🔄 How Currency Detection Works

```
User visits app
    ↓
Check localStorage for saved currency preference
    ↓
If found → Use saved currency
If not found → Detect via IP geolocation
    ↓
Get country code (e.g., "ZA")
    ↓
Map to currency code (ZA → ZAR)
    ↓
Save to localStorage
    ↓
Apply formatting
```

## 🎨 Formatting Examples by Currency

### South African Rand (ZAR)
```tsx
format(1234.56)  // "R 1 234,56"
```
- Symbol: R
- Position: Before with space
- Thousands: Space
- Decimal: Comma

### US Dollar (USD)
```tsx
format(1234.56)  // "$1,234.56"
```
- Symbol: $
- Position: Before without space
- Thousands: Comma
- Decimal: Period

### Euro (EUR)
```tsx
format(1234.56)  // "1.234,56 €"
```
- Symbol: €
- Position: After with space
- Thousands: Period
- Decimal: Comma

## 📝 Best Practices

### 1. Always Use the Hook

```tsx
// ✅ Good - Uses hook
const { format } = useCurrency();
<p>{format(price)}</p>

// ❌ Bad - Manual formatting
<p>R{price.toFixed(2)}</p>
```

### 2. Store Raw Numbers in Database

```tsx
// ✅ Good
{ price: 1234.56, currency: "ZAR" }

// ❌ Bad
{ price: "R 1 234,56" }
```

### 3. Parse User Input Before Saving

```tsx
const { parseCurrency } = useCurrency();

const handleSubmit = (formData) => {
  const numericPrice = parseCurrency(formData.price);
  // Save numericPrice to database
};
```

### 4. Use Compact Format for Large Numbers

```tsx
// Dashboard/stats
<p>{formatCompactCurrency(1234567)}</p>  // "R1.2M"

// Invoice totals (need precision)
<p>{format(1234567)}</p>  // "R 1 234 567,00"
```

## 🐛 Troubleshooting

### Currency Not Detected
**Solution**: Fallback to ZAR. Check browser console for errors.

### Wrong Format
**Solution**: Ensure you're passing numbers, not strings:
```tsx
format(1234.56)  // ✅ Good
format("1234.56")  // ❌ Convert to number first
```

### Date Not Formatting
**Solution**: Pass Date object:
```tsx
formatDate(new Date(dateString))  // ✅ Good
formatDate(dateString)  // ❌ Bad
```

## 📚 Documentation

Complete guide: **[docs/CURRENCY_INTERNATIONALIZATION.md](./docs/CURRENCY_INTERNATIONALIZATION.md)**

## ✅ What's Different from Language i18n?

| Feature | Language i18n | Currency i18n |
|---------|---------------|---------------|
| Purpose | Translate text | Format numbers/currency |
| Detection | Browser language | IP geolocation |
| Selector UI | Language dropdown | Currency dropdown |
| Format | Text translation | Number/currency formatting |
| Storage | `i18nextLng` | `userCurrency` |
| Use Case | Multi-language UI | Multi-currency financial data |

## 🎉 Ready to Use!

The currency selector is already in your navigation sidebar. Try it:

1. Click the currency selector (dollar icon)
2. Choose a different currency
3. Watch all amounts update!

Use `useCurrency()` hook in any component that displays financial data.

Happy formatting! 💰
