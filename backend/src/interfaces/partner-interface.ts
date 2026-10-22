import { PartnerInterest, PartnerStatus } from "../models/partner-model.js";

export interface PartnerInterface{
  id: string,
  user_id: string | null,
  company_name: string,
  document: string | null,
  phone: string | null,
  website: string | null,
  logo_url: string | null,
  interests: PartnerInterest[],
  message: string | null,
  public_listing: boolean,
  status: PartnerStatus,
  review_note: string | null,
  reviewed_at: Date | null,
  reviewed_by: string | null,
  created_at: Date,
  updated_at: Date
}
