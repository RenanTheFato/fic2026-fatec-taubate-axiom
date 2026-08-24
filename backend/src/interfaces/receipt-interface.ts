import { ReceiptStatus } from "../models/receipt-model.js";
import { TransactionType } from "../models/transaction-model.js";

export interface ReceiptInterface{
  id: string,
  transaction_id: string,
  sequence: number,
  number: string,
  status: ReceiptStatus,
  donor_name: string,
  donor_document: string | null,
  amount: string,
  transaction_type: TransactionType,
  issued_at: Date,
  cancelled_at: Date | null,
  previous_hash: string | null,
  hash: string,
  created_at: Date,
  updated_at: Date
}
