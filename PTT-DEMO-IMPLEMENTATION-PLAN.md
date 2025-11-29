# PTT (Programmable Trade Token) - Demo Implementation Plan

**Version:** 1.0
**Date:** November 29, 2025
**Purpose:** Non-blockchain demo system for trade finance flow

---

## Table of Contents

1. [Overview](#overview)
2. [System Flow](#system-flow)
3. [User Portals](#user-portals)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Technology Stack](#technology-stack)
7. [Architecture](#architecture)
8. [Implementation Phases](#implementation-phases)
9. [Demo Data Strategy](#demo-data-strategy)

---

## Overview

### What We're Building

A **web-based trade finance platform** that replaces traditional blockchain/smart contract functionality with a conventional web application. The system manages Programmable Trade Tokens (PTT) through their complete lifecycle from issuance to settlement.

### Key Simplifications

| Blockchain Concept | Demo Replacement |
|-------------------|------------------|
| Smart Contract | Backend REST APIs with business logic |
| Token Transfer | Database record update (ownership change) |
| Immutable Ledger | Audit log table with timestamps |
| Automated Triggers | Scheduled jobs (Cron/Bull Queue) |
| Wallet Address | User ID + JWT authentication |
| Gas Fees | None (database transactions only) |
| On-chain Events | Email notifications |
| Carrier Portal | Removed - Exporter handles documents directly |
| WebSocket/Real-time | Removed - Standard HTTP polling/refresh |

---

## System Flow

### Complete Transaction Lifecycle

```
1. Importer → Importer's Bank: Request PTT issuance
2. Importer's Bank → Importer: Issue PTT (backed by treasury/OD)
3. Importer → System: Lock PTT with conditions (time/action/data)
4. System: Confirm PTT locked
5. Importer → Exporter: Transfer PTT (conditional payment)
6. Exporter: Arrange shipment (offline/manual)
7. Exporter: Obtain shipping documents (offline/manual)
8. Exporter → System: Upload documents (Invoice, BoL, Shipping Bill)
9. System → Importer: Request document approval
10. Importer → System: Approve documents
11. System: Mark PTT as Redeemable
12. Exporter → GIFT IBU: Offer PTT for discounting
13. GIFT IBU → Exporter: Pay discounted amount (instant liquidity)
14. Exporter → GIFT IBU: Transfer PTT ownership
15. System: Trigger settlement condition at maturity
16. Importer's Bank → GIFT IBU: Pay full PTT value
17. GIFT IBU → System: Confirm settlement complete
```

### Removed Steps (Not in Demo)

- **Step 6-7**: Carrier portal eliminated - Exporter handles documents directly
- **Real-time notifications**: Replaced with email + in-app notification list

---

## User Portals

We have **4 distinct web portals** (role-based access):

### 1. Importer Portal

**Primary User:** Import companies buying goods internationally

**Features:**
- Dashboard showing active PTTs and pending actions
- Request new PTT from bank
- Lock PTT with trade conditions (amount, maturity date, terms)
- Transfer PTT to exporter
- Review and approve uploaded shipping documents
- View transaction history and audit trail

**Key Pages:**
```
/importer/dashboard
/importer/ptt/request
/importer/ptt/[id]/lock
/importer/ptt/[id]/transfer
/importer/documents/review
/importer/history
```

---

### 2. Importer's Bank Portal (Token Issuer)

**Primary User:** Banks issuing PTTs backed by credit facilities

**Features:**
- Queue of PTT issuance requests from importers
- Credit limit management and verification
- Issue PTT tokens backed by treasury/overdraft limits
- Monitor outstanding PTTs and exposure
- Execute final settlement payments at maturity
- Generate reports and analytics

**Key Pages:**
```
/bank/dashboard
/bank/requests
/bank/ptt/issue
/bank/ptt/outstanding
/bank/settlements/pending
/bank/analytics
```

---

### 3. Exporter Portal

**Primary User:** Export companies selling goods internationally

**Features:**
- Dashboard showing received PTTs
- Upload shipping documents (Invoice, Bill of Lading, etc.)
- Track document approval status
- Offer redeemable PTTs for discounting
- Transfer PTT ownership to funders
- Track payment status and settlement

**Key Pages:**
```
/exporter/dashboard
/exporter/ptt/received
/exporter/documents/upload
/exporter/discounting/offer
/exporter/discounting/marketplace
/exporter/payments
```

---

### 4. GIFT IBU Portal (Funder)

**Primary User:** International Banking Units providing liquidity

**Features:**
- Browse marketplace of available PTTs for discounting
- Discount calculator (time to maturity, discount rate)
- Make discount offers to exporters
- Portfolio dashboard of owned PTTs
- Track settlement status and maturity dates
- View returns and analytics

**Key Pages:**
```
/funder/dashboard
/funder/marketplace
/funder/calculator
/funder/portfolio
/funder/settlements
/funder/analytics
```

---

## API Endpoints

All APIs follow RESTful conventions with JSON payloads.

### Authentication APIs

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

---

### PTT Management APIs

#### 1. Request PTT Issuance
```http
POST /api/ptt/request

Request Body:
{
  "importerId": "uuid",
  "amount": 100000.00,
  "currency": "USD",
  "tradeDetails": {
    "exporterId": "uuid",
    "description": "Import of electronics",
    "incoterms": "FOB"
  },
  "maturityDays": 90
}

Response:
{
  "requestId": "uuid",
  "status": "pending",
  "createdAt": "2025-11-29T10:00:00Z"
}
```

#### 2. Issue PTT (Bank Action)
```http
POST /api/ptt/issue

Request Body:
{
  "requestId": "uuid",
  "pttNumber": "PTT-2025-00001",
  "backingType": "treasury",
  "creditLimit": 100000.00,
  "approvedBy": "bank-user-id"
}

Response:
{
  "pttId": "uuid",
  "pttNumber": "PTT-2025-00001",
  "status": "issued",
  "amount": 100000.00,
  "maturityDate": "2026-02-27"
}
```

#### 3. Lock PTT with Conditions
```http
POST /api/ptt/lock

Request Body:
{
  "pttId": "uuid",
  "conditions": {
    "timeCondition": {
      "maturityDate": "2026-02-27"
    },
    "actionCondition": {
      "requireDocumentApproval": true,
      "requiredDocuments": ["invoice", "bill_of_lading", "shipping_bill"]
    },
    "dataCondition": {
      "minAmount": 100000.00,
      "beneficiary": "exporter-uuid"
    }
  }
}

Response:
{
  "lockId": "uuid",
  "status": "locked",
  "conditionsSet": 3
}
```

#### 4. Transfer PTT Ownership
```http
POST /api/ptt/transfer

Request Body:
{
  "pttId": "uuid",
  "fromUserId": "importer-uuid",
  "toUserId": "exporter-uuid",
  "transferType": "conditional_payment"
}

Response:
{
  "transferId": "uuid",
  "previousOwner": "importer-uuid",
  "newOwner": "exporter-uuid",
  "transferredAt": "2025-11-29T11:00:00Z"
}
```

#### 5. Get PTT Details
```http
GET /api/ptt/{pttId}

Response:
{
  "pttId": "uuid",
  "pttNumber": "PTT-2025-00001",
  "status": "transferred",
  "amount": 100000.00,
  "currency": "USD",
  "currentOwner": {
    "id": "uuid",
    "name": "ABC Exports Ltd",
    "role": "exporter"
  },
  "maturityDate": "2026-02-27",
  "conditions": [...],
  "history": [...]
}
```

---

### Document Management APIs

#### 6. Upload Documents
```http
POST /api/documents/upload
Content-Type: multipart/form-data

Form Data:
- pttId: uuid
- documentType: "invoice" | "bill_of_lading" | "shipping_bill"
- file: <binary>
- uploadedBy: uuid

Response:
{
  "documentId": "uuid",
  "pttId": "uuid",
  "fileName": "invoice_12345.pdf",
  "documentType": "invoice",
  "uploadedAt": "2025-11-29T12:00:00Z",
  "approvalStatus": "pending"
}
```

#### 7. Request Document Approval
```http
POST /api/documents/request-approval

Request Body:
{
  "pttId": "uuid",
  "documentIds": ["doc-uuid-1", "doc-uuid-2", "doc-uuid-3"],
  "requestedBy": "exporter-uuid"
}

Response:
{
  "approvalRequestId": "uuid",
  "status": "pending",
  "notificationSent": true,
  "approverUserId": "importer-uuid"
}
```

#### 8. Approve/Reject Documents
```http
POST /api/documents/approve

Request Body:
{
  "approvalRequestId": "uuid",
  "documentIds": ["doc-uuid-1", "doc-uuid-2"],
  "approved": true,
  "comments": "All documents verified and approved",
  "approvedBy": "importer-uuid"
}

Response:
{
  "status": "approved",
  "approvedAt": "2025-11-29T13:00:00Z",
  "documentsApproved": 3
}
```

#### 9. Get Documents for PTT
```http
GET /api/documents/{pttId}

Response:
{
  "pttId": "uuid",
  "documents": [
    {
      "id": "uuid",
      "type": "invoice",
      "fileName": "invoice_12345.pdf",
      "downloadUrl": "/api/documents/download/uuid",
      "approvalStatus": "approved",
      "uploadedAt": "2025-11-29T12:00:00Z"
    }
  ]
}
```

---

### Redemption & Status APIs

#### 10. Mark PTT as Redeemable
```http
POST /api/ptt/mark-redeemable

Request Body:
{
  "pttId": "uuid",
  "triggeredBy": "system" // Auto-triggered after approval
}

Response:
{
  "pttId": "uuid",
  "status": "redeemable",
  "markedAt": "2025-11-29T13:05:00Z"
}
```

#### 11. Check PTT Status
```http
GET /api/ptt/status/{pttId}

Response:
{
  "pttId": "uuid",
  "isRedeemable": true,
  "conditionsMet": [
    {
      "type": "action",
      "condition": "documentApproval",
      "met": true,
      "metAt": "2025-11-29T13:00:00Z"
    }
  ],
  "blockers": []
}
```

---

### Discounting APIs

#### 12. Create Discount Offer
```http
POST /api/discounting/offer

Request Body:
{
  "pttId": "uuid",
  "exporterId": "uuid",
  "askingPrice": 95000.00,
  "discountRate": 5.0,
  "maturityDate": "2026-02-27"
}

Response:
{
  "offerId": "uuid",
  "pttId": "uuid",
  "status": "available",
  "listedAt": "2025-11-29T14:00:00Z"
}
```

#### 13. Get Marketplace Listings
```http
GET /api/discounting/marketplace
Query Params: ?status=available&minAmount=50000&maxMaturity=2026-12-31

Response:
{
  "offers": [
    {
      "offerId": "uuid",
      "pttNumber": "PTT-2025-00001",
      "amount": 100000.00,
      "askingPrice": 95000.00,
      "discountRate": 5.0,
      "maturityDate": "2026-02-27",
      "daysToMaturity": 90,
      "exporter": {
        "name": "ABC Exports Ltd"
      }
    }
  ],
  "total": 15
}
```

#### 14. Accept Discount Offer
```http
POST /api/discounting/accept

Request Body:
{
  "offerId": "uuid",
  "funderId": "uuid",
  "acceptedPrice": 95000.00
}

Response:
{
  "dealId": "uuid",
  "status": "accepted",
  "paymentDue": 95000.00,
  "acceptedAt": "2025-11-29T14:30:00Z"
}
```

#### 15. Process Discount Payment
```http
POST /api/discounting/pay

Request Body:
{
  "dealId": "uuid",
  "funderId": "uuid",
  "amount": 95000.00,
  "paymentReference": "TXN-2025-99999"
}

Response:
{
  "paymentId": "uuid",
  "status": "paid",
  "transferInitiated": true,
  "paidAt": "2025-11-29T14:45:00Z"
}
```

---

### Settlement APIs

#### 16. Trigger Settlement
```http
POST /api/settlement/trigger

Request Body:
{
  "pttId": "uuid",
  "triggeredBy": "system" // Auto-triggered by scheduler
}

Response:
{
  "settlementId": "uuid",
  "pttId": "uuid",
  "status": "initiated",
  "paymentDue": 100000.00,
  "beneficiaryId": "funder-uuid",
  "triggeredAt": "2026-02-27T00:00:00Z"
}
```

#### 17. Process Settlement Payment
```http
POST /api/settlement/pay

Request Body:
{
  "settlementId": "uuid",
  "payerBankId": "bank-uuid",
  "amount": 100000.00,
  "beneficiaryId": "funder-uuid",
  "paymentReference": "SETTLEMENT-2026-00001"
}

Response:
{
  "paymentId": "uuid",
  "status": "completed",
  "paidAt": "2026-02-27T10:00:00Z"
}
```

#### 18. Confirm Settlement
```http
POST /api/settlement/confirm

Request Body:
{
  "settlementId": "uuid",
  "funderId": "uuid",
  "received": true
}

Response:
{
  "settlementId": "uuid",
  "status": "complete",
  "pttStatus": "settled",
  "closedAt": "2026-02-27T10:05:00Z"
}
```

---

### Supporting APIs

#### 19. Get User Profile
```http
GET /api/users/profile

Response:
{
  "userId": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "importer",
  "organization": "ABC Imports Inc"
}
```

#### 20. Get Transaction History
```http
GET /api/transactions/history
Query Params: ?userId=uuid&limit=20&offset=0

Response:
{
  "transactions": [
    {
      "id": "uuid",
      "type": "ptt_transfer",
      "pttNumber": "PTT-2025-00001",
      "amount": 100000.00,
      "from": "Importer",
      "to": "Exporter",
      "timestamp": "2025-11-29T11:00:00Z"
    }
  ],
  "total": 45
}
```

#### 21. Get Notifications
```http
GET /api/notifications
Query Params: ?userId=uuid&unreadOnly=true

Response:
{
  "notifications": [
    {
      "id": "uuid",
      "type": "approval_request",
      "title": "Document Approval Required",
      "message": "Exporter has uploaded documents for PTT-2025-00001",
      "relatedEntityId": "ptt-uuid",
      "isRead": false,
      "createdAt": "2025-11-29T12:30:00Z"
    }
  ]
}
```

#### 22. Get Dashboard Analytics
```http
GET /api/analytics/dashboard
Query Params: ?userId=uuid&role=importer

Response:
{
  "activePTTs": 5,
  "totalValue": 500000.00,
  "pendingApprovals": 2,
  "settledThisMonth": 3,
  "charts": {
    "pttsByStatus": {...},
    "valueOverTime": {...}
  }
}
```

---

## Database Schema

### Complete SQL Schema (PostgreSQL)

```sql
-- ==========================================
-- USERS & AUTHENTICATION
-- ==========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('importer', 'bank', 'exporter', 'funder')),
    organization VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ==========================================
-- PTT TOKENS (Core Entity)
-- ==========================================

CREATE TABLE ptt_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ptt_number VARCHAR(50) UNIQUE NOT NULL,
    issuer_bank_id UUID NOT NULL REFERENCES users(id),
    current_owner_id UUID NOT NULL REFERENCES users(id),
    original_importer_id UUID NOT NULL REFERENCES users(id),
    exporter_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'requested', 'issued', 'locked', 'transferred',
        'redeemable', 'discounted', 'settled', 'cancelled'
    )),
    maturity_date DATE NOT NULL,
    backing_type VARCHAR(20) NOT NULL CHECK (backing_type IN ('treasury', 'od_limit', 'credit')),
    trade_description TEXT,
    incoterms VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ptt_number ON ptt_tokens(ptt_number);
CREATE INDEX idx_ptt_status ON ptt_tokens(status);
CREATE INDEX idx_ptt_owner ON ptt_tokens(current_owner_id);
CREATE INDEX idx_ptt_maturity ON ptt_tokens(maturity_date);

-- ==========================================
-- PTT CONDITIONS
-- ==========================================

CREATE TABLE ptt_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
    condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('time', 'action', 'data')),
    condition_key VARCHAR(100) NOT NULL,
    condition_value TEXT NOT NULL,
    is_met BOOLEAN DEFAULT FALSE,
    met_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conditions_ptt ON ptt_conditions(ptt_id);
CREATE INDEX idx_conditions_type ON ptt_conditions(condition_type);

-- ==========================================
-- DOCUMENTS
-- ==========================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
    uploaded_by_id UUID NOT NULL REFERENCES users(id),
    document_type VARCHAR(30) NOT NULL CHECK (document_type IN (
        'invoice', 'bill_of_lading', 'ebl', 'awb',
        'shipping_bill', 'packing_list', 'other'
    )),
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_kb INTEGER,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by_id UUID REFERENCES users(id),
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_ptt ON documents(ptt_id);
CREATE INDEX idx_documents_approval ON documents(approval_status);

-- ==========================================
-- PTT TRANSFERS (Ownership History)
-- ==========================================

CREATE TABLE ptt_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    transfer_type VARCHAR(30) NOT NULL CHECK (transfer_type IN (
        'issuance', 'conditional_payment', 'discounting', 'settlement'
    )),
    amount DECIMAL(15,2),
    notes TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfers_ptt ON ptt_transfers(ptt_id);
CREATE INDEX idx_transfers_from ON ptt_transfers(from_user_id);
CREATE INDEX idx_transfers_to ON ptt_transfers(to_user_id);

-- ==========================================
-- DISCOUNTING OFFERS
-- ==========================================

CREATE TABLE discounting_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
    exporter_id UUID NOT NULL REFERENCES users(id),
    asking_price DECIMAL(15,2) NOT NULL,
    discount_rate DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN (
        'available', 'accepted', 'paid', 'cancelled'
    )),
    funder_id UUID REFERENCES users(id),
    accepted_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offers_ptt ON discounting_offers(ptt_id);
CREATE INDEX idx_offers_status ON discounting_offers(status);
CREATE INDEX idx_offers_funder ON discounting_offers(funder_id);

-- ==========================================
-- SETTLEMENTS
-- ==========================================

CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ptt_id UUID NOT NULL REFERENCES ptt_tokens(id) ON DELETE CASCADE,
    payer_bank_id UUID NOT NULL REFERENCES users(id),
    beneficiary_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'scheduled', 'triggered', 'paid', 'confirmed', 'completed', 'failed'
    )),
    scheduled_date DATE NOT NULL,
    triggered_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    confirmed_at TIMESTAMP NULL,
    payment_reference VARCHAR(100),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlements_ptt ON settlements(ptt_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_scheduled ON settlements(scheduled_date);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ==========================================
-- AUDIT LOGS
-- ==========================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ==========================================
-- SESSIONS (Optional - for JWT alternative)
-- ==========================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
```

---

## Technology Stack

### Frontend Stack

```yaml
Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: TailwindCSS
UI Components: shadcn/ui (or Material-UI)
State Management: Zustand (lightweight) or Redux Toolkit
API Client: Axios + React Query (TanStack Query)
Forms: React Hook Form + Zod validation
File Upload: React Dropzone
Date Handling: date-fns
Charts: Recharts or Chart.js
```

### Backend Stack

```yaml
Runtime: Node.js 20+
Framework: Express.js or NestJS
Language: TypeScript
Authentication: JWT (jsonwebtoken) + bcrypt
Validation: Zod or Joi
File Storage: AWS S3 SDK or MinIO
Database ORM: Prisma or TypeORM
Job Scheduling: node-cron or Bull Queue
Email: Nodemailer
Logging: Winston or Pino
API Documentation: Swagger (OpenAPI)
```

### Database & Infrastructure

```yaml
Database: PostgreSQL 15+
Caching: Redis (optional for demo)
File Storage: AWS S3 or Local MinIO
Containerization: Docker + Docker Compose
```

### Development Tools

```yaml
Package Manager: pnpm or npm
Linting: ESLint + Prettier
Git Hooks: Husky
API Testing: Postman or Thunder Client
Database Client: DBeaver or pgAdmin
```

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Frontend Layer                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │ Importer │ │   Bank   │ │ Exporter │ │ Funder  ││
│  │  Portal  │ │  Portal  │ │  Portal  │ │ Portal  ││
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│                                                       │
│     (Single Next.js app with role-based routing)     │
└────────────────────┬─────────────────────────────────┘
                     │ HTTPS/REST
                     ▼
        ┌────────────────────────┐
        │    API Gateway/BFF     │
        │   (Express/NestJS)     │
        │                        │
        │  - Authentication      │
        │  - Authorization       │
        │  - Rate Limiting       │
        │  - Request Validation  │
        └────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│ REST APIs    │         │ Cron Jobs    │
│ (Business    │         │ (Scheduled   │
│  Logic)      │         │  Triggers)   │
└──────┬───────┘         └──────┬───────┘
       │                        │
       ├──────────┬─────────────┤
       ▼          ▼             ▼
  ┌────────┐ ┌────────┐ ┌──────────┐
  │  PTT   │ │Document│ │Settlement│
  │Service │ │Service │ │ Service  │
  └───┬────┘ └───┬────┘ └────┬─────┘
      │          │           │
      └──────────┴───────────┘
                 │
                 ▼
        ┌────────────────┐
        │   PostgreSQL   │
        │   (Database)   │
        └────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  ┌──────────┐      ┌──────────┐
  │  Redis   │      │  AWS S3  │
  │ (Cache)  │      │ (Files)  │
  │(Optional)│      │          │
  └──────────┘      └──────────┘
```

### Folder Structure

```
project-root/
├── frontend/                 # Next.js application
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── importer/
│   │   │   ├── dashboard/
│   │   │   ├── ptt/
│   │   │   └── documents/
│   │   ├── bank/
│   │   ├── exporter/
│   │   ├── funder/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── shared/          # Shared components
│   │   └── features/        # Feature-specific components
│   ├── lib/
│   │   ├── api/             # API client
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/
│   └── package.json
│
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── ptt.controller.ts
│   │   │   ├── document.controller.ts
│   │   │   ├── discounting.controller.ts
│   │   │   └── settlement.controller.ts
│   │   ├── services/
│   │   │   ├── ptt.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── settlement.service.ts
│   │   ├── models/          # Database models (Prisma/TypeORM)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── routes/
│   │   │   ├── ptt.routes.ts
│   │   │   ├── document.routes.ts
│   │   │   └── discounting.routes.ts
│   │   ├── jobs/            # Scheduled jobs
│   │   │   └── settlement.cron.ts
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Implementation Phases

### Phase 1: Foundation & Setup (Week 1-2)

**Goals:** Project scaffolding, database, and authentication

**Tasks:**
- [ ] Initialize monorepo structure (frontend + backend)
- [ ] Setup PostgreSQL database and migrations
- [ ] Implement user authentication (JWT)
- [ ] Create user management APIs (CRUD)
- [ ] Build login/register pages
- [ ] Setup role-based access control middleware
- [ ] Configure environment variables
- [ ] Setup Docker Compose for local development

**Deliverables:**
- Working authentication system
- Database with all tables
- Role-based routing skeleton

---

### Phase 2: PTT Core Flow (Week 3-4)

**Goals:** Implement PTT issuance, locking, and transfer

**Tasks:**
- [ ] Build PTT request API (Step 1)
- [ ] Build PTT issuance API (Step 2)
- [ ] Build PTT locking with conditions API (Step 3-4)
- [ ] Build PTT transfer API (Step 5)
- [ ] Create Importer Dashboard
- [ ] Create Bank Dashboard and approval queue
- [ ] Build PTT request form (Importer)
- [ ] Build PTT issuance form (Bank)
- [ ] Build PTT locking interface (Importer)
- [ ] Implement email notifications for key events

**Deliverables:**
- Complete PTT lifecycle: Request → Issue → Lock → Transfer
- Working Importer and Bank portals
- Email notifications

---

### Phase 3: Document Management (Week 5-6)

**Goals:** Document upload, approval workflow

**Tasks:**
- [ ] Setup S3/MinIO for file storage
- [ ] Build document upload API
- [ ] Build document approval workflow APIs
- [ ] Create document upload interface (Exporter)
- [ ] Create document review interface (Importer)
- [ ] Implement file download endpoints
- [ ] Build Exporter Dashboard
- [ ] Auto-trigger PTT redeemable status after approval
- [ ] Add document validation (file types, sizes)

**Deliverables:**
- Complete document workflow (Steps 8-11)
- Working Exporter portal
- File storage system

---

### Phase 4: Discounting & Settlement (Week 7-8)

**Goals:** Marketplace, discounting, and settlement flows

**Tasks:**
- [ ] Build discounting offer APIs (Step 12)
- [ ] Build marketplace listing API (Step 13)
- [ ] Build discount acceptance and payment APIs (Step 14)
- [ ] Build settlement trigger system (cron job)
- [ ] Build settlement payment APIs (Steps 15-17)
- [ ] Create Funder Dashboard
- [ ] Create marketplace UI (Funder)
- [ ] Create discount calculator
- [ ] Create settlement tracking interface (Bank)
- [ ] Implement PTT status state machine validation

**Deliverables:**
- Complete discounting flow
- Working Funder portal
- Automated settlement scheduler
- Full transaction lifecycle complete

---

### Phase 5: Polish & Demo Preparation (Week 9-10)

**Goals:** UI polish, analytics, testing, and demo data

**Tasks:**
- [ ] Build analytics dashboards for all roles
- [ ] Add transaction history views
- [ ] Create audit log viewer
- [ ] Implement notification center
- [ ] Create demo data seeding script
- [ ] Write API documentation (Swagger)
- [ ] Perform end-to-end testing
- [ ] UI/UX refinements and responsiveness
- [ ] Create demo walkthrough guide
- [ ] Record demo video (optional)

**Deliverables:**
- Polished UI for all 4 portals
- Comprehensive analytics
- Demo data with 5+ PTT examples
- Documentation and demo guide

---

## Demo Data Strategy

### Seed Data Script

Create a comprehensive seed script that populates the database with realistic demo data:

```javascript
// seed.ts - Demo Data Seeding Script

const demoUsers = [
  {
    email: 'importer@demo.com',
    name: 'ABC Imports Inc',
    role: 'importer',
    organization: 'ABC Imports Inc'
  },
  {
    email: 'bank@demo.com',
    name: 'Global Trade Bank',
    role: 'bank',
    organization: 'Global Trade Bank'
  },
  {
    email: 'exporter@demo.com',
    name: 'XYZ Exports Ltd',
    role: 'exporter',
    organization: 'XYZ Exports Ltd'
  },
  {
    email: 'funder@demo.com',
    name: 'GIFT IBU Funder',
    role: 'funder',
    organization: 'GIFT International Banking Unit'
  }
];

const demoPTTs = [
  {
    // PTT #1: At document approval stage
    pttNumber: 'PTT-2025-00001',
    amount: 100000.00,
    status: 'transferred',
    maturityDate: '2026-02-27',
    currentStage: 'Documents uploaded, pending importer approval'
  },
  {
    // PTT #2: At discounting stage
    pttNumber: 'PTT-2025-00002',
    amount: 250000.00,
    status: 'redeemable',
    maturityDate: '2026-03-15',
    currentStage: 'Redeemable, listed for discounting'
  },
  {
    // PTT #3: At settlement stage
    pttNumber: 'PTT-2025-00003',
    amount: 150000.00,
    status: 'discounted',
    maturityDate: '2026-01-10',
    currentStage: 'Discounted, waiting for maturity settlement'
  },
  {
    // PTT #4: Fully completed
    pttNumber: 'PTT-2025-00004',
    amount: 200000.00,
    status: 'settled',
    maturityDate: '2025-11-15',
    currentStage: 'Fully settled and completed'
  },
  {
    // PTT #5: Just issued
    pttNumber: 'PTT-2025-00005',
    amount: 75000.00,
    status: 'issued',
    maturityDate: '2026-04-20',
    currentStage: 'Just issued, ready to lock and transfer'
  }
];
```

### Demo Login Credentials

```
Importer Portal:
- Email: importer@demo.com
- Password: Demo@123

Bank Portal:
- Email: bank@demo.com
- Password: Demo@123

Exporter Portal:
- Email: exporter@demo.com
- Password: Demo@123

Funder Portal:
- Email: funder@demo.com
- Password: Demo@123
```

### Demo Walkthrough Flow

**Scenario 1: Complete New PTT Transaction**
1. Login as Importer → Request new PTT
2. Login as Bank → Approve and issue PTT
3. Login as Importer → Lock PTT and transfer to exporter
4. Login as Exporter → Upload documents
5. Login as Importer → Approve documents
6. Login as Exporter → Offer for discounting
7. Login as Funder → Accept and pay
8. Wait for maturity (or manually trigger for demo)
9. Settlement completes automatically

**Scenario 2: Explore Existing PTTs**
- View PTT at different stages using seeded data
- Show marketplace with available offers
- Display analytics and dashboards

---

## PTT Status State Machine

### Status Flow Logic

```javascript
// Defines valid status transitions
const PTT_STATUS_TRANSITIONS = {
  'requested': ['issued', 'cancelled'],
  'issued': ['locked', 'cancelled'],
  'locked': ['transferred'],
  'transferred': ['redeemable'],
  'redeemable': ['discounted', 'settled'],
  'discounted': ['settled'],
  'settled': [], // Terminal state
  'cancelled': [] // Terminal state
};

// Validation function
function canTransitionTo(currentStatus, newStatus) {
  return PTT_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

// Usage in API
if (!canTransitionTo(ptt.status, 'redeemable')) {
  throw new Error('Invalid status transition');
}
```

### Condition Validation Logic

```javascript
// Check if all conditions are met for PTT to be redeemable
async function checkPTTConditions(pttId) {
  const conditions = await db.ptt_conditions.findMany({
    where: { ptt_id: pttId }
  });

  const allMet = conditions.every(condition => condition.is_met);

  if (allMet) {
    await markPTTAsRedeemable(pttId);
  }

  return {
    isRedeemable: allMet,
    conditions: conditions.map(c => ({
      type: c.condition_type,
      key: c.condition_key,
      met: c.is_met
    }))
  };
}
```

---

## Notification Strategy

Since we removed WebSockets, notifications will use:

### Email Notifications

Triggered for critical events:
- PTT issued
- PTT transferred to you
- Document approval required
- Documents approved/rejected
- Discount offer accepted
- Payment received
- Settlement due soon (3 days before)
- Settlement completed

### In-App Notification Center

- Simple notification list in each portal
- Badge count for unread notifications
- Mark as read functionality
- Links to related entities (PTT details, documents, etc.)
- Polling interval: 30 seconds for dashboard updates

```javascript
// Simple polling in frontend
useEffect(() => {
  const interval = setInterval(() => {
    fetchNotifications();
  }, 30000); // Poll every 30 seconds

  return () => clearInterval(interval);
}, []);
```

---

## Key Business Rules

### PTT Lifecycle Rules

1. **Issuance:** Only banks can issue PTTs
2. **Locking:** Only current owner can lock PTT with conditions
3. **Transfer:** Only current owner can transfer PTT
4. **Document Upload:** Only exporter can upload documents
5. **Document Approval:** Only original importer can approve
6. **Redeemable:** Auto-marked when all conditions met
7. **Discounting:** Only redeemable PTTs can be offered
8. **Settlement:** Auto-triggered on maturity date

### Validation Rules

- PTT amount must be > 0
- Maturity date must be future date
- All required documents must be uploaded before approval
- Discount rate must be between 0.1% and 20%
- Asking price must be <= PTT face value
- Settlement can only occur on/after maturity date

---

## Testing Strategy

### Unit Tests
- Service layer functions
- Status transition validation
- Condition checking logic
- Date calculations

### Integration Tests
- API endpoint testing
- Database transactions
- File upload/download
- Email sending

### E2E Tests (Cypress/Playwright)
- Complete PTT workflow
- Multi-role interactions
- Document upload flow
- Discounting flow

---

## Deployment Considerations

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ptt_demo

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# AWS S3 (or MinIO)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=ptt-documents

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Backend URL
BACKEND_URL=http://localhost:8000
```

### Docker Compose Setup

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ptt_demo
      POSTGRES_USER: pttuser
      POSTGRES_PASSWORD: pttpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://pttuser:pttpass@postgres:5432/ptt_demo
    depends_on:
      - postgres
      - redis
      - minio

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
  minio_data:
```

---

## Next Steps

To start implementation:

1. **Setup Project Structure**
   ```bash
   mkdir ptt-demo && cd ptt-demo
   npx create-next-app@latest frontend --typescript --tailwind --app
   mkdir backend && cd backend && npm init -y
   ```

2. **Initialize Database**
   - Copy SQL schema and run migrations
   - Setup Prisma or TypeORM

3. **Build Authentication First**
   - User model and APIs
   - JWT implementation
   - Protected routes

4. **Follow Phase-wise Implementation**
   - Phase 1 → Phase 2 → ... → Phase 5
   - Test each phase before moving to next

---

## Appendix

### Glossary

- **PTT:** Programmable Trade Token - Tokenized trade credit instrument
- **eBL:** Electronic Bill of Lading
- **AWB:** Air Waybill
- **BoL:** Bill of Lading
- **GIFT IBU:** Gujarat International Finance Tec-City International Banking Unit
- **OD Limit:** Overdraft Limit
- **Discounting:** Selling a financial instrument at less than face value for immediate liquidity
- **Maturity Date:** Date when the full PTT value becomes due
- **Redeemable:** PTT that has met all conditions and can be cashed

### References

- **Trade Finance Concepts:** https://www.trade.gov/trade-finance-guide
- **Next.js Documentation:** https://nextjs.org/docs
- **PostgreSQL Best Practices:** https://wiki.postgresql.org/wiki/Don%27t_Do_This
- **JWT Authentication:** https://jwt.io/introduction

---

**Document Version:** 1.0
**Last Updated:** November 29, 2025
**Author:** Development Team
**Status:** Ready for Implementation
