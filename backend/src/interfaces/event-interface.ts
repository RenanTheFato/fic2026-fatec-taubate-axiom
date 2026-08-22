export interface EventInterface{
  id: string,
  campaign_id: string | null,
  title: string,
  slug: string,
  description: string | null,
  location: string | null,
  starts_at: Date,
  ends_at: Date | null,
  ticket_price: string,
  capacity: number | null,
  taken_seats: number,
  status: string,
  created_at: Date,
  updated_at: Date
}
