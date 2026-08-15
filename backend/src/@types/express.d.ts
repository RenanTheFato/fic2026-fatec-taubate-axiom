import "express";

declare global {
  namespace Express {
    interface Request {
      user?: Partial<{
        id: string,
        email: string,
        name: string,
        role: "admin" | "staff" | "volunteer";
        created_at: Date,
        updated_at: Date
      }>
    }
  }
}