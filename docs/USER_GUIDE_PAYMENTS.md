# 💰 BizPilot User Guide: Payment Processing

**For**: South African Business Owners  
**Topic**: How to Accept and Track Payments  
**Difficulty**: Beginner-Friendly

---

## 🎯 What You'll Learn

- How to set up payment methods
- Recording EFT payments
- Processing card payments
- Tracking payment status
- Handling refunds
- Reconciling bank statements

---

## 💳 South African Payment Methods

### **What BizPilot Supports:**

#### **1. EFT/Bank Transfer** (Most Common - 60% of SA B2B)
- FNB
- Standard Bank
- Nedbank
- ABSA
- Capitec
- Discovery Bank
- TymeBank
- African Bank

#### **2. Card Payments** (Retail - 25%)
- Yoco (card machines & online)
- PayFast (payment gateway)
- Stripe (international)

#### **3. Mobile Payments** (Growing - 10%)
- SnapScan (Scan QR code)
- Zapper (QR code payments)

#### **4. Cash** (Small transactions - 5%)
- Manual recording
- Receipt generation

---

## 🚀 Step 1: Set Up Payment Methods

### Navigate to Payment Methods

1. Click **Settings** in sidebar
2. Click **Payment Methods** tab
3. Click **"Add Payment Method"**

### Add EFT/Bank Transfer

**When to use**: For bank-to-bank payments

1. Select **"EFT"** as type
2. Choose your **bank**:
   - FNB
   - Standard Bank
   - Nedbank
   - ABSA
   - Capitec
   - Other
3. Set as **default** (optional)
4. Click **Save**

**Result**: This payment method now available when recording payments

### Add Card Payment

**When to use**: For card machine or online card payments

1. Select **"Card"** as type
2. Choose **provider**:
   - Yoco
   - PayFast
   - Other
3. Enter API credentials (if integrating)
4. Click **Save**

### Add Mobile Payment

**When to use**: For SnapScan/Zapper payments

1. Select **"Mobile Payment"** as type
2. Choose **provider**:
   - SnapScan
   - Zapper
3. Set as **default** (optional)
4. Click **Save**

### Add Cash

**When to use**: For in-person cash transactions

1. Select **"Cash"** as type
2. Provider: **Manual**
3. Click **Save**

---

## 📝 Step 2: Recording a Payment

### Two Ways to Record Payment:

#### **Method A: From Invoice (Recommended)**

1. Go to **Invoices** page
2. Find the invoice
3. Click **"Record Payment"** button
4. Details pre-fill automatically

**Advantage**: Links payment to invoice automatically

#### **Method B: Direct Payment Entry**

1. Go to **Payments** page
2. Click **"New Payment"** button
3. Select invoice (or leave blank)
4. Enter details manually

**When to use**: Walk-in customers, direct sales

---

## 💸 Step 3: Enter Payment Details

### Amount (Required)
- Enter in **ZAR (Rands)**
- Examples:
  - R20,000.00 (full payment)
  - R10,000.00 (partial payment)
  - R575.00 (small transaction)

**Tip**: You can accept partial payments! System tracks remaining balance.

### Payment Method (Required)
Select from dropdown:
- EFT (which bank?)
- Card (Yoco, PayFast)
- Mobile (SnapScan, Zapper)
- Cash

### Payment Date
- **Default**: Today
- Change if backdating
- Format: DD/MM/YYYY

### Reference/Description
Examples:
- "EFT payment via FNB - Ref: 12345678"
- "Card payment - Yoco terminal"
- "SnapScan QR code payment"
- "Cash payment - Walk-in customer"

### Bank Reference (For EFT)
The reference number from bank statement:
- EFT reference
- Transaction ID
- Receipt number

**Why important?** Helps with bank reconciliation

---

## 🏦 Step 4: Recording EFT Payments

### Most Common in SA B2B

**Scenario**: Customer paid via bank transfer

1. **Check Your Bank Account**
   - Login to online banking
   - Check recent transactions
   - Note the amount and reference

2. **Find the Invoice**
   - Go to Invoices in BizPilot
   - Find invoice matching payment
   - Check invoice reference

3. **Record Payment**
   - Click "Record Payment" on invoice
   - Amount: Match bank statement
   - Method: EFT
   - Bank: Customer's bank (if known)
   - Reference: Bank transaction reference
   - Date: Payment date from statement

4. **Save**
   - Click "Record Payment"
   - Payment linked to invoice
   - Invoice status updates

### Example:

**Bank Statement Shows:**
```
Date: 27 Jan 2025
Description: Payment from Thabo Mbeki Trading
Reference: INV-GAS-2025-0001
Amount: R20,000.00
```

**In BizPilot:**
```
Invoice: INV-GAS-2025-0001
Amount: R20,000.00
Method: EFT (FNB)
Reference: INV-GAS-2025-0001
Date: 27/01/2025
Status: Succeeded
```

---

## 💳 Step 5: Recording Card Payments

### Yoco or Card Machine

**Scenario**: Customer paid by card at your shop

1. **Process on Card Machine**
   - Swipe/tap customer's card
   - Get approval
   - Print receipt

2. **Note Details**
   - Amount charged
   - Last 4 digits of card
   - Receipt/transaction number

3. **Record in BizPilot**
   - Amount: Match card receipt
   - Method: Card (Yoco)
   - Reference: Receipt number
   - Date: Today
   - Status: Succeeded

### PayFast Online (Coming Soon)

For online payments:
1. Customer clicks "Pay Now" on invoice
2. Redirected to PayFast
3. Completes payment
4. Auto-recorded in BizPilot

**Status**: Integration in progress

---

## 📱 Step 6: Recording Mobile Payments

### SnapScan

**Scenario**: Customer scans your SnapScan code

1. **Customer Scans QR Code**
   - Shows your business name
   - Enters amount
   - Confirms payment

2. **You Receive Notification**
   - SMS or app notification
   - Shows amount received

3. **Record in BizPilot**
   - Amount: From notification
   - Method: Mobile (SnapScan)
   - Reference: Transaction ID
   - Date: Today

### Zapper

Similar process to SnapScan:
1. Customer scans Zapper code
2. Payment confirmed
3. Record in BizPilot

---

## 💵 Step 7: Recording Cash Payments

### Walk-in or Delivery Payments

**Scenario**: Customer pays cash

1. **Accept Cash**
   - Count money
   - Verify amount
   - Give change if needed

2. **Issue Receipt**
   - Manual or printed
   - Include amount and date

3. **Record in BizPilot**
   - Amount: Cash received
   - Method: Cash
   - Reference: Receipt number
   - Date: Today
   - Status: Succeeded

### Cash Handling Tips:
- Count in front of customer
- Issue receipt immediately
- Record same day
- Bank cash regularly
- Keep cash secure

---

## 📊 Step 8: Understanding Payment Statuses

### Status Meanings:

| Status | What It Means | What to Do |
|--------|---------------|------------|
| **Pending** ⏳ | Payment initiated, not confirmed | Wait for confirmation |
| **Processing** 🔄 | Being processed by bank/provider | Wait (usually 1-2 min) |
| **Succeeded** ✅ | Money received successfully | Nothing - completed! |
| **Failed** ❌ | Payment declined/rejected | Try different method |
| **Refunded** 💸 | Money returned to customer | Issue credit note |
| **Cancelled** 🚫 | Payment voided | Recreate if needed |

### Status Updates:

**Automatic:**
- Card payments (instant)
- Online payments (instant)
- PayFast (instant)

**Manual:**
- EFT (you record after checking bank)
- Cash (you record immediately)
- Mobile (you record after notification)

---

## 🔄 Step 9: Handling Partial Payments

### Scenario: Customer Pays in Installments

**Example:**
- Invoice Total: R50,000.00
- Customer pays in 2 parts

**First Payment:**
1. Record: R25,000.00
2. Status: Invoice still "Sent"
3. Shows: "R25,000 paid, R25,000 due"

**Second Payment:**
1. Record: R25,000.00
2. Status: Changes to "Paid" ✅
3. Shows: "Fully paid"

### BizPilot Automatically:
- Tracks total paid
- Calculates remaining
- Updates invoice status
- Shows payment history

---

## 💸 Step 10: Processing Refunds

### When Customer Returns Item or Cancels

**Steps:**

1. **Go to Original Payment**
   - Find in Payments list
   - Click to open details

2. **Click "Refund" Button**
   - Opens refund form

3. **Enter Refund Details**
   - **Amount**: Full or partial refund
   - **Reason**: Why refunding
   - **Method**: Same as original payment
   - **Date**: Today

4. **Process Refund**
   - Click "Process Refund"
   - Payment status → "Refunded"
   - Invoice status → "Refunded"

### Important Notes:
- Refunds reduce your revenue
- Issue credit note to customer
- Record in accounting
- May take 3-5 days to reflect in customer's account

---

## 🏦 Step 11: Bank Reconciliation

### Matching BizPilot with Bank Statements

**Why Important?**
- Verify all payments received
- Catch missing payments
- Ensure accuracy
- SARS compliance

### Monthly Reconciliation Process:

1. **Export from Bank**
   - Download statement (CSV or PDF)
   - Note all incoming payments

2. **Export from BizPilot**
   - Go to Payments page
   - Filter by date range
   - Export to CSV (coming soon)

3. **Compare Line by Line**
   - Match amounts
   - Match dates
   - Match references

4. **Find Discrepancies**
   - Missing payments in BizPilot → Record them
   - Missing in bank → Investigate
   - Amount differences → Correct entry

### Tips for Easy Reconciliation:
- Always use invoice number as reference
- Record payments same day
- Check bank account daily
- Keep payment receipts
- Use consistent descriptions

---

## 📈 Step 12: Payment Reporting

### View Payment History

1. Go to **Payments** page
2. See all payments listed
3. Filter by:
   - Date range
   - Payment method
   - Status
   - Customer

### Useful Reports:

**Daily Takings:**
- Total received today
- By payment method
- Cash vs. electronic

**Monthly Revenue:**
- Total for the month
- Outstanding payments
- Overdue amounts

**Customer Payments:**
- Payment history per customer
- Average payment time
- Frequent payers

### Export Options (Coming Soon):
- Export to Excel
- Export to PDF
- Share with accountant
- Submit to SARS

---

## 🎓 Pro Tips

### 1. **Record Payments Promptly**
- Record EFT same day you see it
- Record cash immediately
- Don't delay - prevents confusion

### 2. **Use Clear References**
- Always include invoice number
- Add transaction IDs
- Note bank references
- Helps with reconciliation

### 3. **Check Bank Daily**
- Morning routine: Check online banking
- Match payments to invoices
- Record in BizPilot
- Takes 5 minutes, saves hours later

### 4. **Accept Multiple Methods**
- EFT for B2B
- Cards for retail
- Mobile for convenience
- Cash as backup
- More options = more sales

### 5. **Follow Up on Failed Payments**
- Contact customer immediately
- Offer alternative method
- Keep communication friendly
- Resolve quickly

### 6. **Secure Payment Information**
- Don't store full card numbers
- Use secure payment gateways
- Follow PCI compliance
- Protect customer data

---

## ❓ Common Questions

**Q: How long does EFT take to clear?**
A: Instant EFT: Minutes. Normal EFT: Same day if before 2pm, next day if after.

**Q: What if customer doesn't use invoice reference?**
A: Check amount and date. Match to invoice. Add note about reference.

**Q: Can I accept payment before sending invoice?**
A: Yes! Record payment, then create invoice, link them together.

**Q: What about payment processing fees?**
A: 
- EFT: Free
- Card: 2.5-3.5% (Yoco, PayFast)
- Mobile: 1.5-2.5% (SnapScan)
- Cash: Free

**Q: How do I handle foreign currency?**
A: BizPilot uses ZAR only. Convert to Rands before recording.

**Q: Can customers pay in installments?**
A: Yes! Record each payment. System tracks total and balance.

**Q: What if payment amount doesn't match invoice?**
A: 
- Under-payment: Record partial, follow up
- Over-payment: Record full, issue credit for difference

**Q: How do I void a payment?**
A: Click payment → "Cancel Payment" → Confirm. Status changes to cancelled.

---

## 🔒 Security Best Practices

### Protect Payment Information:

1. **Never Store**:
   - Full card numbers
   - CVV codes
   - PINs

2. **Always Use**:
   - Secure connections (HTTPS)
   - Payment gateways (PayFast, Yoco)
   - Encrypted storage

3. **Be Careful With**:
   - Email (don't send bank details)
   - SMS (can be intercepted)
   - Public WiFi

4. **Best Practices**:
   - Use BizPilot's secure payment methods
   - Don't write down passwords
   - Log out when done
   - Change passwords regularly

---

## ✅ Payment Processing Checklist

**Daily:**
- [ ] Check bank account
- [ ] Record new payments
- [ ] Match payments to invoices
- [ ] Update payment statuses
- [ ] Bank cash received

**Weekly:**
- [ ] Review outstanding payments
- [ ] Follow up on overdue
- [ ] Check payment methods working
- [ ] Review failed payments

**Monthly:**
- [ ] Bank reconciliation
- [ ] Export payment report
- [ ] Calculate total revenue
- [ ] Submit VAT return (if applicable)
- [ ] Archive statements

---

## 📞 Payment Issues?

### Contact Payment Providers:

**Yoco:**
- Phone: 087 550 5905
- Email: hello@yoco.com
- Hours: 8am-5pm Mon-Fri

**PayFast:**
- Phone: 021 469 0573
- Email: support@payfast.co.za
- Hours: 8am-5pm Mon-Fri

**SnapScan:**
- Email: help@snapscan.co.za
- Website: www.snapscan.co.za/support

### BizPilot Support:
- Email: support@bizpilot.co.za
- In-app: Click help icon
- Docs: docs.bizpilot.co.za

---

## 🎉 You're Ready!

You now know how to:
- ✅ Set up payment methods
- ✅ Record all types of payments
- ✅ Track payment status
- ✅ Handle refunds
- ✅ Reconcile with bank
- ✅ Keep accurate records

**Remember**: Record every payment promptly and accurately. Your future self (and your accountant) will thank you! 📊

---

**Next Steps:**
- Read: [Invoicing Guide](USER_GUIDE_INVOICING.md)
- Read: [VAT Compliance Guide](USER_GUIDE_VAT.md)
- Watch: Payment tutorials (coming soon)

*Last Updated: January 27, 2025*
