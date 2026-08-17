import "express";
import type { UserRole } from "../models/user-model.js";

declare global {
  namespace Express {
    interface Request {
      user?: Partial<{
        id: string,
        email: string,
        name: string,
        role: UserRole;
        created_at: Date,
        updated_at: Date
      }>
    }
  }
}
