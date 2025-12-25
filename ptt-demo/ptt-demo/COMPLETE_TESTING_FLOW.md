# 🧪 COMPLETE TESTING FLOW - PTT DEMO
## Step-by-Step Guide with POC & Organization Features

---

## 📋 **PREREQUISITES**

### **Step 1: Clean Database**

**Option A - Via Supabase Dashboard:**
1. Open browser: https://supabase.com/dashboard
2. Login and select your project
3. Go to **SQL Editor** (left sidebar)
4. Copy the content from `scripts/reset-database.sql`
5. Paste and click **"Run"**
6. Wait for success message

**Option B - Via Command Line:**
```bash
cd /Users/chetanmittal/Desktop/xaults/export-import/ptt-demo/ptt-demo

# Reset database
export PGPASSWORD="xaultschetan123"
psql "postgresql://postgres:xaultschetan123@db.foiaqmhvdxoeimmcutwy.supabase.co:6543/postgres" -f scripts/reset-database.sql

# Re-run all migrations
./scripts/apply-migrations.sh
```

### **Step 2: Start Development Server**
```bash
cd /Users/chetanmittal/Desktop/xaults/export-import/ptt-demo/ptt-demo
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

---

## 🔄 **PHASE 1: USER REGISTRATION & ORGANIZATION SETUP**

---

### **Test 1.1: Register ICICI Bank - User 1 (Maker) - POC**

**What we're testing:**
- First bank user becomes POC
- Organization auto-created with POC details

**Steps:**
1. Open browser: http://localhost:3000/register
2. Fill the form:
   - **Email:** `rajesh@icicibank.com`
   - **Full Name:** `Rajesh Kumar`
   - **Password:** `Test123!`
   - **Confirm Password:** `Test123!`
   - **Role:** Select `Bank`
   - **Organization Name:** `ICICI Bank`
   - **Phone Number:** `+91-9876543210`
   - **Geography / Country:** `India`
   - **Bank Account Number:** `100200300400`
   - **IFSC / SWIFT Code:** `ICIC0001234`
   - **Bank Role:** Select `Maker` ⭐
3. Click **"Create Account"**

**Expected Result:**
- ✅ Success message appears
- ✅ Automatically logged in
- ✅ Redirected to: http://localhost:3000/bank/dashboard
- ✅ Dashboard shows "Welcome, Rajesh Kumar"

**Verification (Supabase SQL Editor):**
```sql
-- Check organization was created with POC info
SELECT
  name,
  type,
  poc_name,
  poc_email,
  poc_phone,
  treasury_balance
FROM organizations
WHERE name = 'ICICI Bank';
```

**Expected Output:**
```
name         | type | poc_name      | poc_email              | poc_phone       | treasury_balance
-------------|------|---------------|------------------------|-----------------|------------------
ICICI Bank   | bank | Rajesh Kumar  | rajesh@icicibank.com  | +91-9876543210  | 0
```

```sql
-- Check user was created and linked to organization
SELECT
  u.name,
  u.email,
  u.role,
  u.bank_role,
  u.is_poc,
  o.name as org_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'rajesh@icicibank.com';
```

**Expected Output:**
```
name          | email                 | role | bank_role | is_poc | org_name
--------------|----------------------|------|-----------|--------|----------
Rajesh Kumar  | rajesh@icicibank.com | bank | maker     | true   | ICICI Bank
```

---

### **Test 1.2: Register ICICI Bank - User 2 (Checker)**

**What we're testing:**
- Second user joins same organization
- POC remains as first user (Rajesh)
- Multi-user bank with shared treasury

**Steps:**
1. Click profile/logout (top-right corner)
2. Go to: http://localhost:3000/register
3. Fill the form:
   - **Email:** `priya@icicibank.com`
   - **Full Name:** `Priya Sharma`
   - **Password:** `Test123!`
   - **Confirm Password:** `Test123!`
   - **Role:** Select `Bank`
   - **Organization Name:** `ICICI Bank` ⭐ **SAME AS BEFORE**
   - **Phone Number:** `+91-9876543211`
   - **Geography / Country:** `India`
   - **Bank Account Number:** `100200300401`
   - **IFSC / SWIFT Code:** `ICIC0001234`
   - **Bank Role:** Select `Checker` ⭐
4. Click **"Create Account"**

**Expected Result:**
- ✅ Success message
- ✅ Redirected to bank dashboard
- ✅ Both users now share same organization

**Verification:**
```sql
-- Check both users belong to same organization
SELECT
  u.name,
  u.email,
  u.bank_role,
  u.is_poc,
  o.name as org_name,
  o.poc_name,
  o.poc_email
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE o.name = 'ICICI Bank'
ORDER BY u.created_at;
```

**Expected Output:**
```
name          | email                 | bank_role | is_poc | org_name   | poc_name     | poc_email
--------------|----------------------|-----------|--------|------------|--------------|--------------------
Rajesh Kumar  | rajesh@icicibank.com | maker     | true   | ICICI Bank | Rajesh Kumar | rajesh@icicibank.com
Priya Sharma  | priya@icicibank.com  | checker   | true   | ICICI Bank | Rajesh Kumar | rajesh@icicibank.com
```

**Key Point:** POC is still Rajesh (first user), not Priya!

---

### **Test 1.3: Register DBS Bank - User 1 (Admin) - POC**

**What we're testing:**
- Second bank organization
- Inter-bank POC visibility

**Steps:**
1. Logout
2. Go to: http://localhost:3000/register
3. Fill the form:
   - **Email:** `michael@dbs.com`
   - **Full Name:** `Michael Tan`
   - **Password:** `Test123!`
   - **Confirm Password:** `Test123!`
   - **Role:** Select `Bank`
   - **Organization Name:** `DBS Bank Singapore`
   - **Phone Number:** `+65-91234567`
   - **Geography / Country:** `Singapore`
   - **Bank Account Number:** `200300400500`
   - **IFSC / SWIFT Code:** `DBSSSGSG`
   - **Bank Role:** Select `Admin`
4. Click **"Create Account"**

**Expected Result:**
- ✅ Second bank organization created
- ✅ Michael is POC for DBS Bank

**Verification:**
```sql
-- Check both bank organizations exist
SELECT
  name,
  type,
  poc_name,
  poc_email,
  poc_phone,
  geography,
  treasury_balance
FROM organizations
WHERE type = 'bank'
ORDER BY created_at;
```

**Expected Output:**
```
name              | type | poc_name      | poc_email             | poc_phone      | geography  | treasury_balance
------------------|------|---------------|-----------------------|----------------|------------|------------------
ICICI Bank        | bank | Rajesh Kumar  | rajesh@icicibank.com  | +91-9876543210 | India      | 0
DBS Bank Singapore| bank | Michael Tan   | michael@dbs.com       | +65-91234567   | Singapore  | 0
```

---

### **Test 1.4: Register Funder (HDFC Capital)**

**What we're testing:**
- Funder organization creation
- Funder POC capture

**Steps:**
1. Logout
2. Go to: http://localhost:3000/register
3. Fill the form:
   - **Email:** `amit@hdfccapital.com`
   - **Full Name:** `Amit Patel`
   - **Password:** `Test123!`
   - **Confirm Password:** `Test123!`
   - **Role:** Select `Funder`
   - **Organization Name:** `HDFC Capital`
   - **Phone Number:** `+91-9988776655`
   - **Geography / Country:** `India`
   - **Bank Account Number:** `300400500600`
   - **IFSC / SWIFT Code:** `HDFC0001234`
   - **Funder Role:** Select `Admin`
4. Click **"Create Account"**

**Expected Result:**
- ✅ Funder organization created
- ✅ Redirected to funder dashboard

---

## 🔄 **PHASE 2: SET TREASURY BALANCES**

### **Test 2.1: Add Treasury to ICICI Bank**

**Steps:**
1. Go to Supabase SQL Editor
2. Run:
```sql
-- Add 10 crore to ICICI Bank treasury
UPDATE organizations
SET treasury_balance = 100000000
WHERE name = 'ICICI Bank';

-- Verify
SELECT name, treasury_balance FROM organizations WHERE name = 'ICICI Bank';
```

**Expected Output:**
```
name       | treasury_balance
-----------|------------------
ICICI Bank | 100000000
```

### **Test 2.2: Add Treasury to DBS Bank**

```sql
-- Add 5 crore to DBS Bank treasury
UPDATE organizations
SET treasury_balance = 50000000
WHERE name = 'DBS Bank Singapore';

-- Verify
SELECT name, treasury_balance FROM organizations WHERE type = 'bank';
```

---

## 🔄 **PHASE 3: CLIENT ONBOARDING (POC for Clients)**

### **Test 3.1: ICICI Bank Invites Importer**

**What we're testing:**
- Bank inviting importer client
- POC creation for importer
- Credit limit assignment

**Steps:**
1. Login as Rajesh (ICICI Bank): http://localhost:3000/login
   - Email: `rajesh@icicibank.com`
   - Password: `Test123!`

2. Go to: **Manage Importers** (from left menu under "ISSUING" section)

3. Click **"+ Invite Importer"** button

4. Fill the form:
   - **Company Name:** `ABC Importers Ltd`
   - **Company Email:** `contact@abcimporters.com`
   - **Phone:** `+91-9123456789`
   - **Geography / Region:** `Western India`
   - **Country:** `India`
   - **Credit Limit:** `5000000` (50 lakhs)
   - **POC Name:** `Ramesh Gupta`
   - **POC Email:** `ramesh@abcimporters.com`
   - **POC Phone:** `+91-9111222333`
   - **Temporary Password:** `Importer123!`

5. Click **"Invite Importer"**

**Expected Result:**
- ✅ Success message
- ✅ Alert popup showing credentials:
  ```
  Importer Credentials:
  Email: ramesh@abcimporters.com
  Password: Importer123!

  Please share these credentials securely with the importer.
  ```
- ✅ Importer appears in the table with:
  - Name: ABC Importers Ltd
  - POC: Ramesh Gupta (ramesh@abcimporters.com)
  - Credit Limit: ₹50,00,000
  - Available Credit: ₹50,00,000

**Verification:**
```sql
-- Check importer organization created with POC
SELECT
  name,
  type,
  poc_name,
  poc_email,
  poc_phone,
  geography,
  country,
  credit_limit
FROM organizations
WHERE name = 'ABC Importers Ltd';
```

**Expected Output:**
```
name              | type     | poc_name      | poc_email               | poc_phone      | geography      | country | credit_limit
------------------|----------|---------------|-------------------------|----------------|----------------|---------|-------------
ABC Importers Ltd | importer | Ramesh Gupta  | ramesh@abcimporters.com | +91-9111222333 | Western India  | India   | 5000000
```

```sql
-- Check POC user account created
SELECT
  u.name,
  u.email,
  u.role,
  u.is_poc,
  o.name as org_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'ramesh@abcimporters.com';
```

**Expected Output:**
```
name          | email                    | role     | is_poc | org_name
--------------|--------------------------|----------|--------|------------------
Ramesh Gupta  | ramesh@abcimporters.com  | importer | true   | ABC Importers Ltd
```

```sql
-- Check bank-client relationship created
SELECT
  b.name as bank_name,
  c.name as client_name,
  bc.relationship_type,
  bc.credit_limit,
  bc.credit_used
FROM bank_clients bc
JOIN organizations b ON bc.bank_org_id = b.id
JOIN organizations c ON bc.client_org_id = c.id
WHERE c.name = 'ABC Importers Ltd';
```

**Expected Output:**
```
bank_name  | client_name       | relationship_type | credit_limit | credit_used
-----------|-------------------|-------------------|--------------|-------------
ICICI Bank | ABC Importers Ltd | issuing           | 5000000      | 0
```

---

### **Test 3.2: HDFC Capital Invites Exporter**

**What we're testing:**
- Funder inviting exporter client
- POC creation for exporter

**Steps:**
1. Logout and login as Amit (HDFC Capital):
   - Email: `amit@hdfccapital.com`
   - Password: `Test123!`

2. Go to: **Manage Exporters** (from left menu under "FINANCING" section)

3. Click **"+ Invite Exporter"**

4. Fill the form:
   - **Company Name:** `XYZ Exports Pvt Ltd`
   - **Company Email:** `info@xyzexports.com`
   - **Phone:** `+91-9876512345`
   - **Geography / Region:** `Southern India`
   - **Country:** `India`
   - **POC Name:** `Suresh Reddy`
   - **POC Email:** `suresh@xyzexports.com`
   - **POC Phone:** `+91-9444555666`
   - **Temporary Password:** `Exporter123!`

5. Click **"Invite Exporter"**

**Expected Result:**
- ✅ Success message with credentials
- ✅ Exporter appears in table with POC info

**Verification:**
```sql
-- Check all organizations with their POCs
SELECT
  name,
  type,
  poc_name,
  poc_email,
  geography
FROM organizations
ORDER BY type, created_at;
```

**Expected Output:**
```
name                | type     | poc_name      | poc_email                | geography
--------------------|----------|---------------|--------------------------|---------------
DBS Bank Singapore  | bank     | Michael Tan   | michael@dbs.com          | Singapore
ICICI Bank          | bank     | Rajesh Kumar  | rajesh@icicibank.com     | India
XYZ Exports Pvt Ltd | exporter | Suresh Reddy  | suresh@xyzexports.com    | Southern India
HDFC Capital        | funder   | Amit Patel    | amit@hdfccapital.com     | India
ABC Importers Ltd   | importer | Ramesh Gupta  | ramesh@abcimporters.com  | Western India
```

---

## 🔄 **PHASE 4: PTT LIFECYCLE WITH ORGANIZATION TRACKING**

### **Test 4.1: Importer Requests PTT**

**Steps:**
1. Logout and login as Ramesh (Importer):
   - Email: `ramesh@abcimporters.com`
   - Password: `Importer123!`

2. Go to: **Request PTT** (from left menu)

3. Fill the form:
   - **Exporter:** Search and select `XYZ Exports Pvt Ltd`
   - **Amount:** `2000000` (20 lakhs)
   - **Currency:** `INR`
   - **Maturity Date:** Select 90 days from today
   - **Trade Description:** `Import of electronic components`
   - **Incoterms:** `FOB`

4. Click **"Request PTT"**

**Expected Result:**
- ✅ PTT created with status "requested"
- ✅ PTT number generated (e.g., PTT-2025-001)

**Verification:**
```sql
-- Check PTT created with organization references
SELECT
  ptt_number,
  amount,
  status,
  i.name as issuer_bank,
  imp.name as importer_org,
  exp.name as exporter_org
FROM ptt_tokens p
LEFT JOIN organizations i ON p.issuer_bank_org_id = i.id
LEFT JOIN organizations imp ON p.original_importer_org_id = imp.id
LEFT JOIN organizations exp ON p.exporter_org_id = exp.id
ORDER BY p.created_at DESC
LIMIT 1;
```

---

### **Test 4.2: Bank Issues PTT (Maker-Checker)**

**Steps:**
1. Logout and login as Rajesh (ICICI Bank Maker):
   - Email: `rajesh@icicibank.com`
   - Password: `Test123!`

2. Go to: **Pending Approvals**

3. You should see the PTT request
4. Click **"Issue PTT"**
5. Select backing type: **Credit**
6. Click **"Confirm Issue"**

**Expected Result:**
- ✅ Action submitted for checker approval
- ✅ Toast: "Pending checker approval"

**Steps (continued):**
7. Logout and login as Priya (ICICI Bank Checker):
   - Email: `priya@icicibank.com`
   - Password: `Test123!`

8. Go to: **Pending Approvals**
9. You should see the issue action pending
10. Click **"Approve"**

**Expected Result:**
- ✅ PTT status changes to "issued"
- ✅ Credit deducted from ABC Importers Ltd
- ✅ **Organization-level tracking**: `original_importer_org_id` is set

**Verification:**
```sql
-- Check PTT issued with org references
SELECT
  p.ptt_number,
  p.status,
  p.amount,
  issuer.name as issuer_bank_org,
  importer.name as importer_org,
  bc.credit_used as importer_credit_used,
  bc.credit_limit as importer_credit_limit
FROM ptt_tokens p
JOIN organizations issuer ON p.issuer_bank_org_id = issuer.id
JOIN organizations importer ON p.original_importer_org_id = importer.id
LEFT JOIN bank_clients bc ON bc.client_org_id = importer.id
ORDER BY p.created_at DESC
LIMIT 1;
```

**Expected Output:**
```
ptt_number   | status | amount  | issuer_bank_org | importer_org      | importer_credit_used | importer_credit_limit
-------------|--------|---------|-----------------|-------------------|----------------------|----------------------
PTT-2025-001 | issued | 2000000 | ICICI Bank      | ABC Importers Ltd | 2000000              | 5000000
```

---

### **Test 4.3: Multi-User Bank Test (Critical!)**

**What we're testing:**
- ANY user from ICICI Bank can settle
- NOT tied to specific user who issued
- Treasury deducted from ORGANIZATION, not user

**Steps:**
1. Login as Ramesh (Importer)
2. Go to **Dashboard**
3. Click on the PTT
4. Upload a document (invoice)
5. Wait for bank approval
6. Create discount offer
7. Login as Amit (Funder)
8. Accept the offer
9. Pay the exporter

**Now the critical test:**

10. Logout and login as **Priya** (Checker - did NOT issue the PTT):
    - Email: `priya@icicibank.com`
    - Password: `Test123!`

11. Go to: **Settlements**

12. You should see the PTT ready for settlement
    - Beneficiary: XYZ Exports Pvt Ltd
    - POC: Suresh Reddy ⭐

13. Click **"Settle PTT"**

**Expected Result:**
- ✅ **Priya CAN settle** (even though Rajesh issued it)
- ✅ Settlement deducted from **ICICI Bank organization treasury**
- ✅ NOT from Priya's or Rajesh's individual balance
- ✅ Beneficiary POC visible: "Suresh Reddy (suresh@xyzexports.com)"

**Verification:**
```sql
-- Check settlement used organization treasury
SELECT
  s.amount,
  payer_bank.name as payer_bank,
  payer_bank.treasury_balance as bank_treasury_after,
  beneficiary.name as beneficiary_org,
  beneficiary.poc_name as beneficiary_poc,
  beneficiary.poc_email as beneficiary_poc_email
FROM settlements s
JOIN organizations payer_bank ON s.payer_bank_org_id = payer_bank.id
JOIN organizations beneficiary ON s.beneficiary_org_id = beneficiary.id
ORDER BY s.created_at DESC
LIMIT 1;
```

**Expected Output:**
```
amount  | payer_bank | bank_treasury_after | beneficiary_org     | beneficiary_poc | beneficiary_poc_email
--------|------------|---------------------|---------------------|-----------------|----------------------
2000000 | ICICI Bank | 98000000            | XYZ Exports Pvt Ltd | Suresh Reddy    | suresh@xyzexports.com
```

**This proves:**
- ✅ Multi-user banks work (Priya settled what Rajesh issued)
- ✅ Treasury at organization level
- ✅ POC visible during settlement

---

## 🔄 **PHASE 5: POC VISIBILITY VERIFICATION**

### **Test 5.1: View Client POCs**

**Steps:**
1. Login as Rajesh (ICICI Bank)
2. Go to: **Manage Importers**
3. Look at the table

**Expected to see:**
- Company Name: ABC Importers Ltd
- Contact: contact@abcimporters.com / +91-9123456789
- Geography: Western India / India
- **POC: Ramesh Gupta ⭐**
- **POC Email: ramesh@abcimporters.com ⭐**
- Credit: ₹30,00,000 / ₹50,00,000

**Verification:**
```sql
-- See all POC information for bank's clients
SELECT
  c.name as client_name,
  c.poc_name,
  c.poc_email,
  c.poc_phone,
  c.geography,
  bc.credit_limit,
  bc.credit_used
FROM bank_clients bc
JOIN organizations b ON bc.bank_org_id = b.id
JOIN organizations c ON bc.client_org_id = c.id
WHERE b.name = 'ICICI Bank';
```

---

### **Test 5.2: Inter-Bank POC Visibility**

**What we're testing:**
- Banks can see other banks' POC info

**Verification:**
```sql
-- See all bank POCs (for inter-bank communication)
SELECT
  name as bank_name,
  poc_name,
  poc_email,
  poc_phone,
  geography
FROM organizations
WHERE type = 'bank'
ORDER BY name;
```

**Expected Output:**
```
bank_name          | poc_name     | poc_email             | poc_phone      | geography
-------------------|--------------|----------------------|----------------|----------
DBS Bank Singapore | Michael Tan  | michael@dbs.com      | +65-91234567   | Singapore
ICICI Bank         | Rajesh Kumar | rajesh@icicibank.com | +91-9876543210 | India
```

**Use Case:**
- When DBS Bank wants to contact ICICI Bank for inter-bank settlement
- They can see: "Contact Rajesh Kumar at rajesh@icicibank.com or +91-9876543210"

---

## ✅ **SUCCESS CRITERIA**

You should have:
- ✅ 2 banks (ICICI with 2 users, DBS with 1 user)
- ✅ 1 funder (HDFC Capital)
- ✅ 1 importer (ABC Importers Ltd) with POC
- ✅ 1 exporter (XYZ Exports Pvt Ltd) with POC
- ✅ All organizations have POC information
- ✅ Multi-user bank works (Priya can settle Rajesh's PTT)
- ✅ Treasury at organization level
- ✅ POC visible in client management
- ✅ POC visible for inter-bank communication

---

## 🐛 **TROUBLESHOOTING**

### **Issue: "Organization already exists" error**
**Solution:**
- Use exact same organization name to add users to existing org
- Check spelling and capitalization

### **Issue: Can't see POC info**
**Solution:**
```sql
-- Manually update POC if needed
UPDATE organizations
SET
  poc_name = 'Your Name',
  poc_email = 'your@email.com',
  poc_phone = '+91-1234567890'
WHERE name = 'Your Organization Name';
```

### **Issue: Settlement fails**
**Solution:**
- Check organization has sufficient treasury
- Verify organization_id is set for users
- Check settlement API logs

---

## 📊 **USEFUL QUERIES**

### **See all organizations with POCs:**
```sql
SELECT
  name,
  type,
  poc_name,
  poc_email,
  poc_phone,
  treasury_balance,
  credit_limit,
  credit_used
FROM organizations
ORDER BY type, name;
```

### **See all users and their organizations:**
```sql
SELECT
  u.name as user_name,
  u.email,
  u.role,
  u.bank_role,
  u.is_poc,
  o.name as org_name,
  o.poc_name as org_poc
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY o.name, u.created_at;
```

### **See all bank-client relationships:**
```sql
SELECT
  b.name as bank,
  c.name as client,
  c.poc_name as client_poc,
  c.poc_email as client_poc_email,
  bc.relationship_type,
  bc.credit_limit,
  bc.credit_used
FROM bank_clients bc
JOIN organizations b ON bc.bank_org_id = b.id
JOIN organizations c ON bc.client_org_id = c.id
ORDER BY b.name, c.name;
```

---

**🎉 Happy Testing!**
