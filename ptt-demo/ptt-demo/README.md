# PTT (Promissory Trade Token) Demo Application

A complete Next.js application demonstrating the lifecycle of Promissory Trade Tokens in international trade finance.

## Overview

This application simulates a **blockchain-inspired digital trade finance platform** where importers, exporters, banks, and funders interact through Promissory Trade Tokens (PTTs). The system enables secure, transparent, and efficient international trade transactions with automated discounting and settlement workflows.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT-based auth
- **UI:** React, TailwindCSS
- **Language:** TypeScript

## Complete PTT Lifecycle Flow

### 1. PTT Request (Importer → Bank)
- Importer requests a PTT for their trade transaction
- Provides trade details: amount, currency, maturity date, INCOTERMS, trade description
- Status: `requested`

### 2. PTT Issuance (Bank)
- Bank reviews pending PTT requests
- Issues PTT with bank backing (treasury/credit line)
- Status: `active`
- Ownership: Importer

### 3. PTT Locking (Importer)
- Importer locks PTT with specific conditions
- Sets exporter, shipping details, payment terms
- Status: `locked`

### 4. PTT Transfer to Exporter (Importer → Exporter)
- Importer transfers locked PTT to Exporter
- Ownership: Exporter
- Status: `transferred`

### 5. Document Upload (Exporter)
- Exporter uploads shipping documents (Bill of Lading, Invoice, etc.)
- Documents stored for importer review
- Status: `documents_submitted`

### 6. Document Approval (Importer)
- Importer reviews and approves shipping documents
- PTT becomes redeemable at maturity
- Status: `redeemable`

### 7. Discounting (Exporter → Funder)
- Exporter creates discount offer (e.g., 5% discount)
- Lists PTT in marketplace for early liquidity
- Funders view available offers with discount rates
- Funder accepts offer and pays discounted amount
- Status: `discounted`
- Ownership: Funder

### 8. Settlement at Maturity (Bank → Funder)
- At maturity date, bank triggers settlement
- Bank pays face value to current owner (Funder)
- Status: `settled`
- PTT lifecycle complete

## User Roles & Portals

### Importer (`/importer/dashboard`)
- Request new PTTs
- View owned PTTs
- Lock and transfer PTTs to exporters
- Review and approve shipping documents

### Bank (`/bank/dashboard`)
- View pending PTT requests
- Issue PTTs with backing
- Monitor settlements
- Trigger settlement payments at maturity

### Exporter (`/exporter/dashboard`)
- View received PTTs
- Upload shipping documents
- Create discount offers
- Monitor offer status

### Funder (`/funder/dashboard`)
- Browse marketplace of discount offers
- Accept offers and purchase PTTs
- View portfolio of owned PTTs
- Track expected returns and maturity dates

## Demo Credentials

```
Importer: importer@demo.com / password123
Bank:     bank@globaltradebank.com / password123
Exporter: exporter@asia.com / password123
Funder:   funder@gift.com / password123
```

## Key Features

- **Role-based Authentication**: Secure login with role-specific dashboards
- **Real-time Stats**: Live calculations of portfolio value, expected returns
- **Marketplace**: Dynamic discounting marketplace for PTT trading
- **Ownership Tracking**: Complete audit trail of PTT transfers
- **Status Management**: State machine for PTT lifecycle states
- **Settlement Workflow**: Three-stage settlement (trigger → pay → confirm)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/user-by-email` - Find user by email

### PTT Management
- `POST /api/ptt/request` - Request new PTT
- `POST /api/ptt/issue` - Issue PTT (Bank)
- `POST /api/ptt/lock` - Lock PTT with conditions
- `POST /api/ptt/transfer` - Transfer PTT ownership
- `GET /api/ptt/[id]` - Get PTT details
- `GET /api/ptt/user/[userId]` - Get user's PTTs
- `GET /api/ptt/requests` - Get all PTT requests (Bank)

### Documents
- `POST /api/documents/upload` - Upload documents
- `POST /api/documents/approve` - Approve documents (marks PTT redeemable)

### Discounting
- `POST /api/discounting/offer` - Create discount offer
- `GET /api/discounting/marketplace` - Get marketplace offers
- `POST /api/discounting/accept` - Accept offer and purchase PTT

### Settlement
- `POST /api/settlement/trigger` - Trigger settlement
- `POST /api/settlement/process-payment` - Process payment
- `POST /api/settlement/confirm` - Confirm settlement completion

## Database Schema

7 core tables:
- `users` - User accounts with roles
- `ptt_tokens` - Main PTT records
- `ptt_requests` - PTT issuance requests
- `ptt_transfers` - Transfer history
- `trade_documents` - Shipping documents
- `discounting_offers` - Marketplace offers
- `settlements` - Settlement records

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ptt-demo/ptt-demo
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to: `ptt-demo/ptt-demo`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (update with Vercel URL)
5. Deploy

## Project Status

**Completion: ~95%** ✅

### What's Working ✅
- Complete authentication system
- All 4 role-based portals
- Full PTT lifecycle (request → issue → lock → transfer → approve → discount → settle)
- **Supabase Storage integration for file uploads** 🆕
- **Document upload with file validation** 🆕
- **Document review and download with signed URLs** 🆕
- Marketplace with discount offers
- Ownership transfer tracking
- Settlement workflow
- Real-time calculations and stats

### Optional Enhancements
- Automated settlement triggers (cron jobs)
- Email notifications
- Advanced analytics dashboard
- Enhanced security policies for file access

## File Upload Feature 🆕

The application now supports **real file uploads** using Supabase Storage:

### Exporter Upload Flow
1. Navigate to **Upload Documents** page
2. Select a transferred PTT
3. Choose document type (Commercial Invoice, Bill of Lading, etc.)
4. Upload file (max 10MB: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX)
5. View uploaded documents with approval status

### Importer Review Flow
1. Navigate to **Review Documents** page
2. Click "View Docs" on any PTT
3. See all uploaded documents with details
4. **Download files** using secure signed URLs
5. Approve all documents to mark PTT as redeemable

**Setup Required:** See `SUPABASE-STORAGE-SETUP.md` for complete setup instructions.

## Testing the Complete Flow

1. **Login as Importer** → Request PTT
2. **Login as Bank** → Issue PTT
3. **Login as Importer** → Lock & Transfer PTT to Exporter
4. **Login as Exporter** → Upload actual document files 🆕
5. **Login as Importer** → View and download documents → Approve 🆕
6. **Login as Exporter** → Create discount offer
7. **Login as Funder** → Accept offer from marketplace
8. **Settlement** → Manual API calls (or cron automation)

## Documentation

- `README.md` - This file (overview and setup)
- `PROGRESS.md` - Development progress tracker
- `IMPLEMENTATION-SUMMARY.md` - Technical implementation details
- `SUPABASE-STORAGE-SETUP.md` - **File upload setup guide** 🆕
- `database-schema.sql` - Complete database schema
- `database-storage-setup.sql` - **Storage bucket setup** 🆕
- `database-rls-policies.sql` - Security policies

## License

MIT

## Support

For issues or questions, please open a GitHub issue.

---

**Built with Next.js 16 | Powered by Supabase**

Last Updated: 2025-11-29
