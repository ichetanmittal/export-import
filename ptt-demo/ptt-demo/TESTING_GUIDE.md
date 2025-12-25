# 🧪 COMPLETE TESTING GUIDE - PTT DEMO

**Follow this sequence step-by-step to test all features systematically.**

---

## 📋 **PREREQUISITES**

### **1. Clean Database:**

**Option A - Via Supabase Dashboard (RECOMMENDED):**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `scripts/reset-database.sql`
3. Paste and execute
4. Go to Storage → Delete bucket `ptt-documents` (if exists)
5. Refresh the page

**Option B - Via Command Line:**
```bash
# Navigate to project directory
cd /Users/chetanmittal/Desktop/xaults/export-import/ptt-demo/ptt-demo

# Reset and re-run migrations
export SUPABASE_ACCESS_TOKEN="sbp_84a3abd692bcf744c946f10f1849392f51588374"
export SUPABASE_DB_PASSWORD="xaultschetan123"

# Execute reset script
psql "postgresql://postgres:xaultschetan123@db.foiaqmhvdxoeimmcutwy.supabase.co:6543/postgres" -f scripts/reset-database.sql

# Re-run migrations
./scripts/apply-migrations.sh
```

### **2. Start Development Server:**
```bash
npm run dev
```

Server should start at: http://localhost:3000

---

## 🔄 **TESTING SEQUENCE**

---

## **PHASE 1: SETUP (Organization-Based Model)**

### **Test 1.1: Create Bank Organization + Users**

**What to test:** Multi-user bank with shared treasury

**Steps:**
1. **Register First Bank User (Maker):**
   - Go to: http://localhost:3000/login → Register
   - Email: `bank.maker@icici.com`
   - Password: `Test123!`
   - Name: `Rajesh Kumar`
   - Role: `Bank`
   - Organization: `ICICI Bank`
   - Phone: `+91-9876543210`
   - Geography: `India`
   - Bank Account: `100200300400`
   - IFSC: `ICIC0001234`

2. **Register Second Bank User (Checker):**
   - Logout → Register again
   - Email: `bank.checker@icici.com`
   - Password: `Test123!`
   - Name: `Priya Sharma`
   - Role: `Bank`
   - Organization: `ICICI Bank` ← **SAME ORGANIZATION**
   - Phone: `+91-9876543211`
   - Geography: `India`
   - Bank Account: `100200300401`
   - IFSC: `ICIC0001234`

**Expected Result:**
- ✅ Both users created successfully
- ✅ Both belong to same organization
- ✅ Organization `ICICI Bank` auto-created in `organizations` table

**How to verify:**
```sql
-- In Supabase SQL Editor:
SELECT o.name, o.type, COUNT(u.id) as user_count, o.treasury_balance
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
WHERE o.type = 'bank'
GROUP BY o.id;
```
Expected: 1 organization with 2 users

---

### **Test 1.2: Set Bank Treasury**

**What to test:** Organization-level treasury

**Steps:**
1. **Via SQL (Supabase Dashboard):**
```sql
-- Set ICICI Bank treasury to $10,000,000
UPDATE organizations
SET treasury_balance = 10000000
WHERE name = 'ICICI Bank';
```

2. **Verify via API:**
   - Login as either bank user
   - Check dashboard - should show $10M treasury

**Expected Result:**
- ✅ Both bank users see same $10M treasury
- ✅ Treasury is shared across users

---

## **PHASE 2: CLIENT ONBOARDING (NEW FEATURE)**

### **Test 2.1: Bank Invites Importer**

**What to test:** Issuing - Client management

**Steps:**
1. Login as bank user (Rajesh or Priya)
2. Go to: **Manage Importers** (NEW PAGE)
3. Click **"+ Invite Importer"**
4. Fill form:
   - Company Name: `GF Machining Solutions Pvt Ltd`
   - Company Email: `info@gfmachining.in`
   - Phone: `+91-8765432100`
   - Geography: `Asia Pacific`
   - Country: `India`
   - Credit Limit: `5000000` ($5M)
   - POC Name: `Amit Singh`
   - POC Email: `amit.singh@gfmachining.in`
   - POC Phone: `+91-9988776655`
   - Temporary Password: `Import123!`
5. Click **"Invite Importer"**

**Expected Result:**
- ✅ Success message shown
- ✅ Alert with credentials displayed
- ✅ Importer appears in table
- ✅ Credit limit shows: $5M / $0 used / 0% utilization

**Verify in DB:**
```sql
-- Check organization created
SELECT * FROM organizations WHERE name = 'GF Machining Solutions Pvt Ltd';

-- Check bank-client relationship
SELECT bc.*, b.name as bank_name, c.name as client_name
FROM bank_clients bc
JOIN organizations b ON bc.bank_org_id = b.id
JOIN organizations c ON bc.client_org_id = c.id;
```

---

### **Test 2.2: Login as Importer**

**What to test:** Importer account created properly

**Steps:**
1. Logout from bank
2. Login with:
   - Email: `amit.singh@gfmachining.in`
   - Password: `Import123!`
3. Should land on: `/importer/dashboard`

**Expected Result:**
- ✅ Login successful
- ✅ Dashboard shows importer view
- ✅ Credit info visible: $5M limit

---

### **Test 2.3: Bank Invites Exporter (Financing)**

**What to test:** Financing - Client management

**Steps:**
1. Login as bank user
2. Go to: **Manage Exporters** (NEW PAGE)
3. Click **"+ Invite Exporter"**
4. Fill form:
   - Company Name: `S G Fabtex Pvt Ltd`
   - Company Email: `contact@sgfabtex.in`
   - Phone: `+91-7654321000`
   - Geography: `South Asia`
   - Country: `India`
   - POC Name: `Sunita Gupta`
   - POC Email: `sunita@sgfabtex.in`
   - POC Phone: `+91-9876543200`
   - Temporary Password: `Export123!`
5. Click **"Invite Exporter"**

**Expected Result:**
- ✅ Success message
- ✅ Exporter appears in table
- ✅ Geography visible: "South Asia / India"

---

### **Test 2.4: Create Funder Organization**

**What to test:** Funder setup

**Steps:**
1. Logout → Register
2. Email: `funder@giftcity.in`
3. Password: `Test123!`
4. Name: `Karan Mehta`
5. Role: `Funder`
6. Organization: `GIFT International Banking Unit`
7. Geography: `Gujarat, India`

**Expected Result:**
- ✅ Funder account created
- ✅ Organization created

**Set Funder Treasury:**
```sql
UPDATE organizations
SET treasury_balance = 20000000
WHERE name = 'GIFT International Banking Unit';
```

---

## **PHASE 3: PTT LIFECYCLE (WITH ORGANIZATIONS)**

### **Test 3.1: Request PTT**

**What to test:** Organization-level credit tracking

**Steps:**
1. Login as Importer (amit.singh@gfmachining.in)
2. Go to: **Request PTT**
3. Fill form:
   - Amount: `1000000` ($1M)
   - Currency: USD
   - Maturity Days: `90`
   - Exporter: `S G Fabtex Pvt Ltd` (from dropdown)
   - Trade Description: `Machinery parts import`
   - INCOTERMS: `FOB`
4. Submit

**Expected Result:**
- ✅ PTT request created
- ✅ Status: `requested`
- ✅ Shows in bank pending approvals

**Verify:**
```sql
SELECT
  ptt_number,
  original_importer_org_id,
  amount,
  status
FROM ptt_tokens
ORDER BY created_at DESC
LIMIT 1;
```
Should show organization ID, not null.

---

### **Test 3.2: Issue PTT (Bank)**

**What to test:** Organization treasury & credit tracking

**Steps:**
1. Login as Bank user (Rajesh - Maker)
2. Go to: **Pending Approvals**
3. Find the PTT request
4. Click **"Issue PTT"**
5. Select backing: `Treasury`
6. Confirm

**Expected Result:**
- ✅ PTT issued successfully
- ✅ Importer org credit used: $1M (out of $5M)
- ✅ Status changed to: `issued`

**Verify Organization Credit:**
```sql
SELECT
  name,
  credit_limit,
  credit_used,
  (credit_limit - credit_used) as available_credit
FROM organizations
WHERE name = 'GF Machining Solutions Pvt Ltd';
```
Should show: limit=$5M, used=$1M, available=$4M

---

### **Test 3.3: Lock & Transfer PTT**

**What to test:** Ownership transfer to exporter org

**Steps:**
1. Login as Importer
2. Go to dashboard → Find issued PTT
3. Click on PTT → **Lock PTT**
4. Set exporter: `S G Fabtex Pvt Ltd`
5. Add condition (shipping details)
6. Submit

**Expected Result:**
- ✅ PTT locked and transferred
- ✅ Current owner: Exporter organization
- ✅ Status: `transferred`

---

### **Test 3.4: Upload Documents (Exporter)**

**What to test:** Document management

**Steps:**
1. Logout → Login as Exporter (sunita@sgfabtex.in)
2. Go to: **Upload Documents**
3. Find the transferred PTT
4. Upload document:
   - Type: `Commercial Invoice`
   - File: Any PDF/image
5. Submit

**Expected Result:**
- ✅ Document uploaded to Supabase Storage
- ✅ Shows in documents list
- ✅ Status: `documents_submitted`

---

### **Test 3.5: Approve Documents (Importer)**

**What to test:** Document approval flow

**Steps:**
1. Login as Importer
2. Go to: **Review Documents**
3. Find PTT with documents
4. Click **"View Docs"**
5. Download document (verify it works)
6. Click **"Approve All Documents"**

**Expected Result:**
- ✅ Documents approved
- ✅ PTT status: `redeemable`

---

### **Test 3.6: Create Discount Offer (Exporter)**

**What to test:** Financing workflow

**Steps:**
1. Login as Exporter
2. Go to: **Discount Offers**
3. Find redeemable PTT
4. Click **"Create Offer"**
5. Set:
   - Asking Price: `950000` ($950K for $1M PTT)
   - Discount Rate: `5%`
6. Submit

**Expected Result:**
- ✅ Offer created
- ✅ Shows in funder dashboard

---

### **Test 3.7: Accept Offer (Funder)**

**What to test:** Funder org treasury & ownership transfer

**Steps:**
1. Login as Funder
2. Go to: **Dashboard** (was "Marketplace")
3. See "Available Discount Offers" section
4. Find the offer ($950K for $1M PTT)
5. Click **"Accept Offer"**
6. Confirm payment

**Expected Result:**
- ✅ Offer accepted
- ✅ Funder org treasury decreased by $950K
- ✅ PTT ownership transferred to funder org
- ✅ Status: `discounted`

**Verify:**
```sql
SELECT
  treasury_balance
FROM organizations
WHERE name = 'GIFT International Banking Unit';
```
Should be: $20M - $950K = $19.05M

---

### **Test 3.8: Settlement (Bank)**

**What to test:** CRITICAL - Organization treasury settlement

**Steps:**
1. Login as Bank user
2. Go to: **Settlements**
3. Find discounted PTT (ready for settlement)
4. Click **"Settle"**
5. Confirm

**Expected Result:**
- ✅ Settlement successful
- ✅ Bank org treasury decreased by $1M (face value)
- ✅ Funder org treasury increased by $1M
- ✅ Importer org credit used decreased by $1M
- ✅ Status: `settled`

**CRITICAL VERIFICATION - This proves the fix worked:**
```sql
-- Bank treasury should be deducted
SELECT name, treasury_balance
FROM organizations
WHERE name = 'ICICI Bank';
-- Should show: $10M - $1M = $9M

-- Funder treasury should be credited
SELECT name, treasury_balance
FROM organizations
WHERE name = 'GIFT International Banking Unit';
-- Should show: $19.05M + $1M = $20.05M

-- Importer credit should be freed
SELECT name, credit_limit, credit_used
FROM organizations
WHERE name = 'GF Machining Solutions Pvt Ltd';
-- Should show: limit=$5M, used=$0, available=$5M
```

**THIS IS THE KEY TEST** - If settlement deducts from bank organization (not individual user), the fix is working! ✅

---

## **PHASE 4: MULTI-USER BANK TEST (CRITICAL)**

### **Test 4.1: Second Bank User Can Settle**

**What to test:** Shared treasury across bank users

**Steps:**
1. Create another PTT (repeat steps 3.1-3.7)
2. This time, let Rajesh (Maker) issue the PTT
3. When it's ready for settlement, login as Priya (Checker)
4. Go to Settlements
5. Settle the PTT

**Expected Result:**
- ✅ Priya can settle PTT issued by Rajesh
- ✅ Settlement deducts from ICICI Bank organization treasury
- ✅ NOT from Rajesh's or Priya's individual balance

**This proves the critical fix!** Before, only the user who issued could settle. Now, any user from the bank organization can settle.

---

## **PHASE 5: NEW FEATURES TESTING**

### **Test 5.1: Credit Limit Management**

**Steps:**
1. Login as Bank
2. Go to: **Manage Importers**
3. Find importer
4. Click **"Edit Limit"**
5. Change from $5M to $10M
6. Click **"Save"**

**Expected Result:**
- ✅ Limit updated immediately
- ✅ Available credit recalculated
- ✅ Change visible in importer dashboard

---

### **Test 5.2: Menu Structure**

**What to test:** Issuing/Financing sections

**Steps:**
1. Login as Bank
2. Check sidebar menu

**Expected Sections:**
```
Dashboard
─── ISSUING ───
  ✅ Manage Importers
  ✅ Outstanding PTTs
  ✅ Pending Approvals
─── FINANCING ───
  ✅ Manage Exporters
  ✅ Settlements
─── OPERATIONS ───
  ✅ Documents
  ✅ Blacklist
```

---

### **Test 5.3: Geography Visibility**

**What to test:** Exporter geography displayed

**Steps:**
1. Check Manage Exporters page
2. Check Manage Importers page

**Expected:**
- ✅ Geography column visible
- ✅ Shows "South Asia / India" format
- ✅ Sortable/filterable

---

### **Test 5.4: Funder Manage Exporters**

**Steps:**
1. Login as Funder
2. Go to: **Manage Exporters** (NEW)
3. Click **"+ Invite Exporter"**
4. Create another exporter

**Expected:**
- ✅ Funder can onboard exporters
- ✅ Financing relationship created
- ✅ Geography tracked

---

## **PHASE 6: EDGE CASES & VALIDATION**

### **Test 6.1: Credit Limit Validation**

**Steps:**
1. Login as Importer (with $5M limit)
2. Try to request PTT for $6M (exceeds limit)

**Expected:**
- ❌ Request should fail
- ✅ Error: "Exceeds available credit"

---

### **Test 6.2: Blacklist Functionality**

**Steps:**
1. Login as Bank
2. Go to: **Blacklist**
3. Add exporter to blacklist
4. Login as Importer
5. Try to request PTT with blacklisted exporter

**Expected:**
- ❌ Request should fail
- ✅ Error: "Exporter is blacklisted"

---

### **Test 6.3: Maker-Checker Workflow**

**Steps:**
1. Update bank users to set roles:
```sql
UPDATE users
SET bank_role = 'maker'
WHERE email = 'bank.maker@icici.com';

UPDATE users
SET bank_role = 'checker'
WHERE email = 'bank.checker@icici.com';
```

2. Login as Maker → Try to settle PTT
3. Should create pending action
4. Login as Checker → Approve settlement

**Expected:**
- ✅ Maker creates pending action
- ✅ Checker can approve/reject
- ✅ Settlement executes after approval

---

## **PHASE 7: DATA INTEGRITY CHECKS**

### **Test 7.1: Verify Organization References**

Run these SQL queries to verify data integrity:

```sql
-- All PTTs should have organization references
SELECT
  COUNT(*) as total_ptts,
  COUNT(issuer_bank_org_id) as with_bank_org,
  COUNT(original_importer_org_id) as with_importer_org
FROM ptt_tokens;

-- All users should have organization_id
SELECT
  role,
  COUNT(*) as total,
  COUNT(organization_id) as with_org_id
FROM users
GROUP BY role;

-- Bank-client relationships should exist
SELECT
  COUNT(*) as total_relationships
FROM bank_clients;

-- Organization balances should be consistent
SELECT
  name,
  type,
  treasury_balance,
  credit_limit,
  credit_used
FROM organizations
ORDER BY type, name;
```

---

## 📊 **TESTING CHECKLIST**

Use this to track your progress:

### **Critical Fixes Verified:**
- [ ] Organizations table exists and populated
- [ ] Multiple users in same bank organization
- [ ] Shared treasury across bank users
- [ ] Settlement deducts from organization (not user)
- [ ] Credit tracked at organization level
- [ ] PTTs reference organizations

### **New Features Verified:**
- [ ] Bank can invite importers
- [ ] Bank can invite exporters
- [ ] Funder can invite exporters
- [ ] Credit limit assignment works
- [ ] Geography tracking visible
- [ ] Menu structure updated (Issuing/Financing)
- [ ] Marketplace terminology removed

### **Full PTT Lifecycle:**
- [ ] Request (org-level credit check)
- [ ] Issue (org credit incremented)
- [ ] Lock & Transfer
- [ ] Upload Documents
- [ ] Approve Documents
- [ ] Create Discount Offer
- [ ] Accept Offer (org treasury used)
- [ ] Settlement (org treasury settlement)

### **Multi-User Tests:**
- [ ] User A issues PTT
- [ ] User B can settle same PTT
- [ ] Both see same treasury
- [ ] Organization balance correct

---

## 🐛 **IF YOU FIND ISSUES:**

1. **Check Supabase Logs:**
   - Dashboard → Logs → API Logs

2. **Check Browser Console:**
   - F12 → Console tab
   - Look for errors

3. **Check Database:**
```sql
-- See recent PTTs with org references
SELECT * FROM ptt_tokens ORDER BY created_at DESC LIMIT 5;

-- See organizations
SELECT * FROM organizations;

-- See bank-client relationships
SELECT * FROM bank_clients;
```

4. **Report Format:**
   - What you were testing
   - Expected result
   - Actual result
   - Error message (if any)
   - Browser console errors

---

## ✅ **SUCCESS CRITERIA**

You can consider testing successful when:

1. ✅ Multiple bank users share same treasury
2. ✅ Any bank user can settle PTTs issued by the organization
3. ✅ Settlement deducts from organization treasury (not user balance)
4. ✅ Credit limits work at organization level
5. ✅ Client onboarding creates proper relationships
6. ✅ Geography tracking visible everywhere
7. ✅ No "marketplace" terminology visible to users
8. ✅ All menu sections (Issuing/Financing) work

---

**Good luck with testing! 🚀**

_If everything works as described, all critical flaws are fixed and new features are working!_
