-- PTT Demo Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Users Table
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

-- PTT Tokens Table
CREATE TABLE ptt_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ptt_number VARCHAR(50) UNIQUE NOT NULL,
    issuer_bank_id UUID NOT NULL REFERENCES users(id),
    current_owner_id UUID NOT NULL REFERENCES users(id),
    original_importer_id UUID NOT NULL REFERENCES users(id),
    exporter_id UUID REFERENCES users(id),
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

-- PTT Conditions Table
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

-- Documents Table
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

-- PTT Transfers Table
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

-- Discounting Offers Table
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

-- Settlements Table
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

-- Create Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_ptt_number ON ptt_tokens(ptt_number);
CREATE INDEX idx_ptt_status ON ptt_tokens(status);
CREATE INDEX idx_ptt_owner ON ptt_tokens(current_owner_id);
CREATE INDEX idx_ptt_maturity ON ptt_tokens(maturity_date);
CREATE INDEX idx_conditions_ptt ON ptt_conditions(ptt_id);
CREATE INDEX idx_documents_ptt ON documents(ptt_id);
CREATE INDEX idx_documents_approval ON documents(approval_status);
CREATE INDEX idx_transfers_ptt ON ptt_transfers(ptt_id);
CREATE INDEX idx_offers_ptt ON discounting_offers(ptt_id);
CREATE INDEX idx_offers_status ON discounting_offers(status);
CREATE INDEX idx_settlements_ptt ON settlements(ptt_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_scheduled ON settlements(scheduled_date);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptt_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptt_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptt_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounting_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Create Storage Bucket for Documents
INSERT INTO storage.buckets (id, name, public) VALUES ('ptt-documents', 'ptt-documents', false);
