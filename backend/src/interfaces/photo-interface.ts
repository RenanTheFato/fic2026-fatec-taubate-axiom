import { PhotoType } from "../models/photo-model.js";

export interface PhotoInterface{
  id: string,
  name: string,
  mime_type: PhotoType,
  width: number,
  height: number,
  size: number,
  data: Buffer,
  uploaded_by: string | null,
  created_at: Date,
  updated_at: Date
}
