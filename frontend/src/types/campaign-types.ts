// Espelha CampaignInterface do backend. `goal_amount` e `raised_amount` são
// DECIMAL, ou seja, string dos dois lados.
export type CampaignStatus = "draft" | "active" | "finished" | "cancelled"

export type Campaign = {
  id: string
  title: string
  slug: string
  description: string | null
  goal_amount: string
  raised_amount: string
  starts_at: string
  ends_at: string | null
  status: CampaignStatus
  created_at: string
  updated_at: string
}
