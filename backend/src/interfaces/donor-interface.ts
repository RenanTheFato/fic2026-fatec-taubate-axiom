import { DocumentType } from "../models/donor-model.js";

export interface DonorInterface{
  id: string,
  user_id: string | null,
  name: string,
  email: string,
  document: string | null,
  document_type: DocumentType | null,
  phone: string | null,
  created_at: Date,
  updated_at: Date
}
