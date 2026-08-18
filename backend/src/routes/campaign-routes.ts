import { Router, Request, Response } from "express";
import { CreateCampaignController } from "../controllers/campaign/create-campaign-controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { ListCampaignsController } from "../controllers/campaign/list-campaigns-controller.js";

export const campaignRoutes = Router()

campaignRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new CreateCampaignController().handle(req, res)
})

campaignRoutes.get("/list", async(req: Request, res: Response) => {
  return new ListCampaignsController().handle(req, res)
})
