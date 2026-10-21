import { ContactChannel, ContactStatus } from "../models/contact-message-model.js";

export interface ContactMessageInterface{
  id: string,
  channel: ContactChannel,
  subject: string | null,
  name: string,
  email: string,
  phone: string | null,
  message: string | null,
  status: ContactStatus,
  resolved_at: Date | null,
  resolved_by: string | null,
  created_at: Date,
  updated_at: Date
}
