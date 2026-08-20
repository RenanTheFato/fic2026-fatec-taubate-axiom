import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateDonorController } from "../controllers/donor/create-donor-controller.js";
import { ListDonorsController } from "../controllers/donor/list-donors-controller.js";
import { GetDonorController } from "../controllers/donor/get-donor-controller.js";
import { GetDonorProfileController } from "../controllers/donor/get-donor-profile-controller.js";

export const donorRoutes = Router()

donorRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new CreateDonorController().handle(req, res)
})

donorRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "staff"), async(req: Request, res: Response) => {
  return new ListDonorsController().handle(req, res)
})

donorRoutes.get("/:id", AuthMiddleware, RoleMiddleware("admin", "staff"), async(req: Request, res: Response) => {
  return new GetDonorController().handle(req, res)
})

donorRoutes.get("/profile", AuthMiddleware, async(req: Request, res: Response) => {
  return new GetDonorProfileController().handle(req, res)
})