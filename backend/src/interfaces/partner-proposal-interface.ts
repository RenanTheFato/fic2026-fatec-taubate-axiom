import { ProposalKind, ProposalStatus } from "../models/partner-proposal-model.js";

export interface PartnerProposalInterface{
  id: string,
  partner_id: string,
  kind: ProposalKind,
  title: string,
  description: string,
  amount: string | null,
  campaign_id: string | null,
  event_id: string | null,
  status: ProposalStatus,
  response_note: string | null,
  reviewed_at: Date | null,
  reviewed_by: string | null,
  transaction_id: string | null,
  created_at: Date,
  updated_at: Date
}
