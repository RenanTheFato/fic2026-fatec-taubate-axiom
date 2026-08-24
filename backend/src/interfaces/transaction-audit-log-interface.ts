import { AuditSource } from "../models/transaction-audit-log-model.js";
import { TransactionStatus } from "../models/transaction-model.js";

export interface TransactionAuditLogInterface{
  id: string,
  transaction_id: string,
  previous_status: TransactionStatus | null,
  new_status: TransactionStatus,
  source: AuditSource,
  performed_by: string | null,
  reason: string | null,
  created_at: Date
}
