// User Types
export type UserRole = 'importer' | 'bank' | 'exporter' | 'funder';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  organization: string | null;
  phone: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  geography: string | null;
  balance: number;
  credit_limit: number;
  credit_used: number;
  is_active: boolean;
  bank_role: 'maker' | 'checker' | 'admin' | null;
  funder_role: 'maker' | 'checker' | 'admin' | null;
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
  issuer_bank_id: string;
  current_owner_id: string;
  original_importer_id: string;
  exporter_id: string | null;
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
  exporter_id: string;
  asking_price: number;
  discount_rate: number;
  status: OfferStatus;
  funder_id: string | null;
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
  payer_bank_id: string;
  beneficiary_id: string;
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
  conditions: PTTCondition[];
  documents: Document[];
  transfers: PTTTransfer[];
}

export interface DiscountingOfferWithDetails extends DiscountingOffer {
  ptt: PTTToken;
  exporter: User;
  funder?: User;
}

export interface PendingBankActionWithDetails extends PendingBankAction {
  ptt?: PTTToken;
  initiated_by_user: User;
  approved_by_user?: User;
}
