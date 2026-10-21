import { RegistrationStatus } from "../models/registration-model.js";

export interface RegistrationInterface{
  id: string,
  event_id: string,
  transaction_id: string | null,
  ticket_code: string,
  participant_name: string,
  participant_email: string,
  participant_phone: string | null,
  status: RegistrationStatus,
  checked_in_at: Date | null,
  checked_in_by: string | null,
  cancelled_at: Date | null,
  created_at: Date,
  updated_at: Date
}
