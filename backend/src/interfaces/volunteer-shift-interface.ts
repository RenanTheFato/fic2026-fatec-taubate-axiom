import { VolunteerArea } from "../models/volunteer-model.js";
import { ShiftStatus } from "../models/volunteer-shift-model.js";

export interface VolunteerShiftInterface{
  id: string,
  activity: string,
  area: VolunteerArea,
  place: string,
  coordinator: string,
  description: string | null,
  starts_at: Date,
  ends_at: Date,
  slots: number,
  taken_slots: number,
  status: ShiftStatus,
  created_by: string | null,
  created_at: Date,
  updated_at: Date
}
