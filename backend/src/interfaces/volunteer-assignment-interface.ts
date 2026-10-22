import { AssignmentStatus } from "../models/volunteer-assignment-model.js";

export interface VolunteerAssignmentInterface{
  id: string,
  shift_id: string,
  volunteer_id: string,
  status: AssignmentStatus,
  hours: string | null,
  checked_at: Date | null,
  checked_by: string | null,
  created_at: Date,
  updated_at: Date
}
