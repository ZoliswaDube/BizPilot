# 📄 BizPilot User Guide: Invoicing

**For**: South African Business Owners  
**Topic**: How to Create and Manage VAT-Compliant Invoices  
**Difficulty**: Beginner-Friendly

---

## 🎯 What You'll Learn

- How to create a professional invoice
- Understanding VAT calculations (15%)
- Adding multiple items to an invoice
- Sending invoices to customers
- Tracking payment status
- Handling overdue invoices

---

## 📋 Prerequisites

Before creating an invoice, make sure you have:

✅ **Business Profile Set Up**
- Business name
- VAT registration number
- Company registration number
- Bank account details

✅ **At Least One Customer**
- Customer name and email
- Company details (for B2B)
- VAT number (if applicable)

✅ **Correct User Role**
- Admin or Manager role required
- Employees cannot create invoices

---

## 🚀 Step 1: Navigate to Invoices

1. Log in to BizPilot
2. Look at the sidebar (left side of screen)
3. Click on **"Invoices"**
4. You'll see your invoice list

---

## ✨ Step 2: Create New Invoice

### Click "Create Invoice" Button
- Located at the top-right of the page
- Opens the invoice creation form

### Select Customer
1. Click the **"Customer"** dropdown
2. Choose from your customer list
3. Their details will auto-fill:
   - Name
   - Email
   - Company name
   - VAT number

**Don't see your customer?**
- Click "Add New Customer" link
- Or go to Customers page first

---

## 📝 Step 3: Set Invoice Details

### Invoice Number
- **Automatically generated** (e.g., INV-GAS-2025-0001)
- Uses your business code + year + number
- You don't need to change this

### Issue Date
- **Default**: Today's date
- Change if backdating an invoice
- Format: DD/MM/YYYY

### Due Date
- **Default**: 30 days from issue date
- Common terms:
  - 7 days: Quick payment
  - 14 days: Standard retail
  - 30 days: Standard B2B
  - 60 days: Large corporates

---

## 🛒 Step 4: Add Line Items

This is where you list what you're charging for.

### Click "Add Item" Button

For each item, enter:

1. **Description**
   - What you're selling/charging for
   - Examples:
     - "Web Design Services"
     - "Monthly Consulting Fee"
     - "Product Name - SKU123"

2. **Quantity**
   - How many units
   - Examples:
     - 40 (hours)
     - 1 (month)
     - 100 (units)

3. **Unit Price** (in Rands)
   - Price per unit
   - Examples:
     - R850.00 (per hour)
     - R5,000.00 (per month)
     - R45.00 (per item)

4. **Tax %** (VAT)
   - **Default: 15%** (South African standard rate)
   - Use **0%** for:
     - Exports (selling overseas)
     - Zero-rated items (brown bread, milk, etc.)
     - Services to non-VAT vendors

5. **Discount %** (Optional)
   - If giving a discount
   - Examples:
     - 10% (bulk purchase discount)
     - 5% (loyalty discount)

---

## 🧮 Step 5: Understanding the Calculations

### How BizPilot Calculates:

**Example Item:**
- Description: Web Design
- Quantity: 40 hours
- Unit Price: R850.00
- Discount: 0%
- Tax: 15% VAT

**Automatic Calculation:**
```
Subtotal     = 40 × R850.00           = R34,000.00
Discount     = R34,000.00 × 0%        = R0.00
Taxable      = R34,000.00 - R0.00     = R34,000.00
VAT (15%)    = R34,000.00 × 15%       = R5,100.00
────────────────────────────────────────────────────
TOTAL        = R34,000.00 + R5,100.00 = R39,100.00
```

### Multiple Items:
BizPilot adds up all items:
```
Item 1:  R39,100.00
Item 2:  R2,875.00
Item 3:  R172.50
────────────────────
Subtotal: R37,150.00
VAT:      R5,572.50
────────────────────
TOTAL:    R42,722.50
```

---

## 💼 Step 6: Add Business Details

### Banking Information
**Why?** So customers can pay via EFT

Fill in:
- **Bank Name**: FNB, Standard Bank, Nedbank, etc.
- **Account Number**: Your business account
- **Branch Code**: Your bank's branch code
- **Account Type**: Current, Savings, or Transmission

**Example:**
```
Bank: FNB
Account: 62********45 (masked for security)
Branch: 250655
Type: Current Account
```

### VAT & Registration
- **VAT Number**: Your SARS VAT registration
- **Company Reg**: Your CK/registration number

These auto-fill from your business settings.

---

## 📧 Step 7: Add Payment Terms

### Notes (Optional)
Personal message to customer:
```
"Thank you for your business! 
We appreciate your continued support."
```

### Payment Terms (Recommended)
Clear payment expectations:
```
"Payment due within 30 days from invoice date.
Interest may be charged on overdue accounts."
```

### Payment Instructions
Help customers pay correctly:
```
"Please use your invoice number (INV-GAS-2025-0001) 
as payment reference when making EFT payment."
```

---

## 💾 Step 8: Save Your Invoice

### Two Options:

#### **Option 1: Save as Draft**
- Click **"Save Draft"** button
- Invoice saved but not sent
- Status: **Draft** 📝
- You can:
  - Edit it later
  - Send it when ready
  - Delete if needed

#### **Option 2: Send Invoice**
- Click **"Send Invoice"** button
- Invoice sent to customer email
- Status: **Sent** 📧
- Customer receives:
  - Email with invoice attached
  - Link to view online
  - Payment instructions

---

## 📊 Step 9: Track Invoice Status

### Invoice Statuses Explained:

| Status | Meaning | What to Do |
|--------|---------|------------|
| **Draft** 📝 | Not sent yet | Edit or send |
| **Sent** 📧 | Delivered to customer | Wait for payment |
| **Viewed** 👀 | Customer opened it | Follow up if needed |
| **Paid** ✅ | Fully paid | Mark complete |
| **Overdue** ⚠️ | Past due date | Send reminder |
| **Cancelled** ❌ | Voided | Recreate if needed |
| **Refunded** 💸 | Money returned | Issue credit note |

### Where to Check Status:
1. Go to Invoices page
2. Find your invoice in the list
3. Status shown in badge/label
4. Click invoice to see details

---

## 💰 Step 10: Record Payments

### When Customer Pays:

1. **Find the Invoice**
   - Go to Invoices page
   - Click on the invoice

2. **Click "Record Payment"**
   - Opens payment form
   - Invoice details pre-filled

3. **Enter Payment Details**
   - **Amount**: How much they paid (can be partial)
   - **Payment Method**: 
     - EFT (which bank?)
     - Card (Yoco, PayFast)
     - Mobile (SnapScan, Zapper)
     - Cash
   - **Date**: When payment received
   - **Reference**: Bank reference or receipt number

4. **Save Payment**
   - Click "Record Payment"
   - Invoice updates automatically
   - Status changes:
     - Full payment → **Paid** ✅
     - Partial payment → **Sent** (shows amount remaining)

---

## 🔔 Step 11: Handling Overdue Invoices

### What Happens:
- Invoice past due date → Status changes to **Overdue** ⚠️
- Shows on dashboard as "Overdue Invoices"
- Highlighted in red on invoice list

### What to Do:

1. **Send Friendly Reminder**
   ```
   Subject: Friendly Reminder - Invoice INV-GAS-2025-0001
   
   Hi [Customer Name],
   
   Just a friendly reminder that invoice INV-GAS-2025-0001 
   for R42,722.50 was due on [due date].
   
   If you've already paid, please ignore this reminder.
   If not, we'd appreciate payment at your earliest convenience.
   
   Payment Details:
   FNB - 62********45 - Branch: 250655
   Reference: INV-GAS-2025-0001
   
   Thank you!
   [Your Name]
   ```

2. **Check if Payment Received**
   - Sometimes payment made but not recorded
   - Check your bank account
   - Record payment if received

3. **Follow Up**
   - After 7 days: Send another reminder
   - After 14 days: Phone call
   - After 30 days: Formal letter

---

## ✏️ Step 12: Editing Invoices

### Can I Edit?

**Draft Invoices** ✅
- Fully editable
- Change anything
- No restrictions

**Sent Invoices** ⚠️
- Edit with caution
- Avoid changing amounts
- Add notes if needed

**Paid Invoices** ❌
- Cannot edit amounts
- Can add notes only

### Best Practice:
If major changes needed on sent/paid invoice:
1. Cancel the invoice
2. Create new invoice
3. Explain to customer

---

## 🎓 Pro Tips

### 1. **Use Consistent Numbering**
- Let system auto-generate
- Don't skip numbers
- Needed for SARS compliance

### 2. **Always Include VAT Details**
- Your VAT number
- 15% VAT breakdown
- "Tax Invoice" heading

### 3. **Clear Payment Instructions**
- Specify payment methods accepted
- Include bank details
- Ask for reference number

### 4. **Set Realistic Due Dates**
- 30 days standard for B2B
- 7-14 days for retail
- Consider customer's payment cycle

### 5. **Track Everything**
- Record all payments promptly
- Update statuses regularly
- Review overdue invoices weekly

### 6. **Professional Presentation**
- Use your business logo
- Include all contact details
- Proofread before sending

---

## ❓ Common Questions

**Q: Can I create recurring invoices?**
A: Not yet, but coming soon! For now, duplicate previous invoice.

**Q: Can customers pay online directly?**
A: PayFast integration coming soon for online payments.

**Q: How do I handle partial payments?**
A: Just record the amount received. System tracks remaining balance.

**Q: What if I need to refund?**
A: Record a refund payment with negative amount. Status changes to "Refunded".

**Q: Can I customize the invoice template?**
A: Custom templates coming soon. Current template is VAT-compliant.

**Q: How do I export invoices for my accountant?**
A: Export to PDF (available) or CSV (coming soon).

---

## 📞 Need Help?

**Contact Support:**
- Email: support@bizpilot.co.za
- In-app chat: Click help icon
- Knowledge base: docs.bizpilot.co.za

**VAT Questions:**
- SARS: www.sars.gov.za
- VAT Helpline: 0800 00 7277

---

## ✅ Checklist: Before Sending Invoice

Use this checklist every time:

- [ ] Customer details correct
- [ ] All items listed with descriptions
- [ ] Quantities and prices accurate
- [ ] Discounts applied correctly
- [ ] VAT calculated (15% or 0%)
- [ ] Total amount looks right
- [ ] Due date set appropriately
- [ ] Bank details included
- [ ] VAT number displayed
- [ ] Payment instructions clear
- [ ] Proofread for errors
- [ ] Ready to send!

---

**You're now ready to create professional, VAT-compliant invoices!** 🎉

*Remember: BizPilot handles all the calculations automatically. You just enter the details, and we do the rest!*

---

**Next Steps:**
- Read: [Payment Processing Guide](USER_GUIDE_PAYMENTS.md)
- Read: [VAT Compliance Guide](USER_GUIDE_VAT.md)
- Watch: Video tutorials (coming soon)

*Last Updated: January 27, 2025*
