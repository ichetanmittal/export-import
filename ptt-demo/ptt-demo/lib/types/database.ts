// User Types
export type UserRole = 'importer' | 'bank' | 'exporter' | 'funder';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  organization: string | null; // Legacy field - kept for backward compatibility
  organization_id: string | null; // New - reference to organizations table
  phone: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  geography: string | null;
  balance: number; // Legacy - kept for backward compatibility
  credit_limit: number; // Legacy - kept for backward compatibility
  credit_used: number; // Legacy - kept for backward compatibility
  is_active: boolean;
  is_poc: boolean; // Point of Contact flag
  bank_role: 'maker' | 'checker' | 'admin' | null;
  funder_role: 'maker' | 'checker' | 'admin' | null;
  my_bank_id: string | null;
  created_at: string;
  updated_at: string;
}

// Organization Types
export type OrganizationType = 'bank' | 'importer' | 'exporter' | 'funder';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  treasury_balance: number;
  credit_limit: number;
  credit_used: number;
  email: string | null;
  phone: string | null;
  address: string | null;
  geography: string | null;
  country: string | null;
  swift_code: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  license_number: string | null;
  registration_number: string | null;
  poc_name: string | null;
  poc_email: string | null;
  poc_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Bank-Client Relationship Types
export type BankClientRelationshipType = 'issuing' | 'financing' | 'both';

export interface BankClient {
  id: string;
  bank_org_id: string;
  client_org_id: string;
  relationship_type: BankClientRelationshipType;
  credit_limit: number;
  credit_used: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Inter-Bank Limits Types
export interface InterBankLimit {
  id: string;
  issuing_bank_id: string;
  financing_bank_id: string;
  credit_limit: number;
  credit_used: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// PTT Types
export type PTTStatus =
  | 'requested'
  | 'issued'
  | 'locked'
  | 'transferred'
  | 'redeemable'
  | 'discounted'
  | 'settled'
  | 'cancelled';

export type BackingType = 'treasury' | 'od_limit' | 'credit';

export interface PTTToken {
  id: string;
  ptt_number: string;
  // Legacy user references (kept for backward compatibility)
  issuer_bank_id: string;
  current_owner_id: string;
  original_importer_id: string;
  exporter_id: string | null;
  exporter_bank_id: string | null;
  // New organization references
  issuer_bank_org_id: string | null;
  exporter_bank_org_id: string | null;
  original_importer_org_id: string | null;
  exporter_org_id: string | null;
  bank_client_id: string | null;
  // PTT details
  amount: number;
  currency: string;
  status: PTTStatus;
  maturity_date: string;
  backing_type: BackingType;
  trade_description: string | null;
  incoterms: string | null;
  created_at: string;
  updated_at: string;
}

// PTT Conditions
export type ConditionType = 'time' | 'action' | 'data';

export interface PTTCondition {
  id: string;
  ptt_id: string;
  condition_type: ConditionType;
  condition_key: string;
  condition_value: string;
  is_met: boolean;
  met_at: string | null;
  created_at: string;
}

// Documents
export type DocumentType =
  | 'invoice'
  | 'bill_of_lading'
  | 'ebl'
  | 'awb'
  | 'shipping_bill'
  | 'packing_list'
  | 'other';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Document {
  id: string;
  ptt_id: string;
  uploaded_by_id: string;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  file_size_kb: number | null;
  approval_status: ApprovalStatus;
  approved_by_id: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// Transfers
export type TransferType =
  | 'issuance'
  | 'conditional_payment'
  | 'discounting'
  | 'settlement';

export interface PTTTransfer {
  id: string;
  ptt_id: string;
  from_user_id: string | null;
  to_user_id: string;
  transfer_type: TransferType;
  amount: number | null;
  notes: string | null;
  executed_at: string;
}

// Discounting
export type OfferStatus = 'available' | 'accepted' | 'paid' | 'cancelled';

export interface DiscountingOffer {
  id: string;
  ptt_id: string;
  exporter_id: string; // Legacy user reference
  exporter_org_id: string | null; // New organization reference
  asking_price: number;
  discount_rate: number;
  status: OfferStatus;
  funder_id: string | null; // Legacy user reference
  funder_org_id: string | null; // New organization reference
  accepted_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

// Settlements
export type SettlementStatus =
  | 'scheduled'
  | 'triggered'
  | 'paid'
  | 'confirmed'
  | 'completed'
  | 'failed';

export interface Settlement {
  id: string;
  ptt_id: string;
  payer_bank_id: string; // Legacy user reference
  payer_bank_org_id: string | null; // New organization reference
  beneficiary_id: string; // Legacy user reference
  beneficiary_org_id: string | null; // New organization reference
  amount: number;
  status: SettlementStatus;
  scheduled_date: string;
  triggered_at: string | null;
  paid_at: string | null;
  confirmed_at: string | null;
  payment_reference: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Bank Actions (Maker-Checker) - Also used for funder actions
export type BankActionType = 'issue_ptt' | 'settle_ptt' | 'accept_offer';
export type BankActionStatus = 'pending' | 'approved' | 'rejected';

export interface PendingBankAction {
  id: string;
  action_type: BankActionType;
  ptt_id: string | null;
  initiated_by: string;
  approved_by: string | null;
  status: BankActionStatus;
  action_data: any;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Extended types with relations
export interface PTTWithDetails extends PTTToken {
  issuer_bank: User;
  current_owner: User;
  original_importer: User;
  exporter?: User;
  exporter_bank?: User;
  // New organization relations
  issuer_bank_org?: Organization;
  exporter_bank_org?: Organization;
  original_importer_org?: Organization;
  exporter_org?: Organization;
  bank_client?: BankClient;
  // Related data
  conditions: PTTCondition[];
  documents: Document[];
  transfers: PTTTransfer[];
}

export interface DiscountingOfferWithDetails extends DiscountingOffer {
  ptt: PTTToken;
  exporter: User;
  funder?: User;
  // New organization relations
  exporter_org?: Organization;
  funder_org?: Organization;
}

export interface PendingBankActionWithDetails extends PendingBankAction {
  ptt?: PTTToken;
  initiated_by_user: User;
  approved_by_user?: User;
}

// New extended types for organizations
export interface OrganizationWithDetails extends Organization {
  users?: User[];
  bank_clients?: BankClient[];
  issued_ptts?: PTTToken[];
}

export interface BankClientWithDetails extends BankClient {
  bank_org: Organization;
  client_org: Organization;
  ptts?: PTTToken[];
}

export interface InterBankLimitWithDetails extends InterBankLimit {
  issuing_bank: Organization;
  financing_bank: Organization;
}
