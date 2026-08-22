import { CampaignStatus } from "../models/campaign-model.js";

export interface CampaignInterface{
  id: string,
  title: string,
  slug: string,
  description: string | null,
  goal_amount: string,
  raised_amount: string,
  starts_at: Date,
  ends_at: Date | null,
  status: CampaignStatus,
  created_at: Date,
  updated_at: Date
}
