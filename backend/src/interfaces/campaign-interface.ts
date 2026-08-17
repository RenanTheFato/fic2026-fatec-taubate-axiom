export interface CampaignInterface{
  id: string,
  title: string,
  slug: string,
  description: string | null,
  goal_amount: string,
  raised_amount: string,
  starts_at: Date,
  ends_at: Date | null,
  status: string,
  created_at: Date,
  updated_at: Date
}
