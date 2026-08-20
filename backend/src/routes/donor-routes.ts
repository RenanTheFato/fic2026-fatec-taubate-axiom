import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateDonorController } from "../controllers/donor/create-donor-controller.js";

export const donorRoutes = Router()

donorRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new CreateDonorController().handle(req, res)
})
