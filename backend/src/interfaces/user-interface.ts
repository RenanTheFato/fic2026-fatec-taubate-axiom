import { UserRole } from "../models/user-model.js";

export interface UserInterface{
  id: string,
  email: string,
  name: string,
  hashed_password: string,
  role: UserRole,
  created_at: Date,
  updated_at: Date
}