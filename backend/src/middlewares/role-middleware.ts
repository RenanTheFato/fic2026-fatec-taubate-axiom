import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/user-model.js";

export function RoleMiddleware(...allowedRoles: UserRole[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const role = req.user?.role

    if (!role) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "You don't have permission to perform this action" })
    }

    next()
  }
}
