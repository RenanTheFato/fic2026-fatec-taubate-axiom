import { VolunteerArea, VolunteerPeriod, VolunteerStatus } from "../models/volunteer-model.js";

export interface VolunteerInterface{
  id: string,
  user_id: string,
  phone: string,
  city: string | null,
  area: VolunteerArea,
  availability: VolunteerPeriod[],
  about: string,
  status: VolunteerStatus,
  review_note: string | null,
  reviewed_at: Date | null,
  reviewed_by: string | null,
  created_at: Date,
  updated_at: Date
}
