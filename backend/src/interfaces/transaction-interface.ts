import { PaymentMethod, TransactionStatus, TransactionType } from "../models/transaction-model.js";

export interface TransactionInterface{
  id: string,
  type: TransactionType,
  status: TransactionStatus,
  amount: string,
  payment_method: PaymentMethod | null,
  donor_id: string,
  campaign_id: string | null,
  event_id: string | null,
  gateway_checkout_id: string | null,
  gateway_payment_id: string | null,
  checkout_url: string | null,
  notes: string | null,
  confirmed_at: Date | null,
  refunded_at: Date | null,
  created_at: Date,
  updated_at: Date
}
