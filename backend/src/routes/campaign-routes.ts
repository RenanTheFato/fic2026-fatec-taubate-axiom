import { Router, Request, Response } from "express";
import { CreateCampaignController } from "../controllers/campaign/create-campaign-controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { ListCampaignsController } from "../controllers/campaign/list-campaigns-controller.js";
import { GetCampaignBySlugController } from "../controllers/campaign/get-campaign-by-slug-controller.js";
import { PublishCampaignController } from "../controllers/campaign/publish-campaign-controller.js";
import { ListAllCampaignsController } from "../controllers/campaign/list-all-campaigns-controller.js";

export const campaignRoutes = Router()

campaignRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new CreateCampaignController().handle(req, res)
})

campaignRoutes.get("/list", async (req: Request, res: Response) => {
  return new ListCampaignsController().handle(req, res)
})

campaignRoutes.get("/list-all", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new ListAllCampaignsController().handle(req, res)
})

campaignRoutes.get("/:slug", async (req: Request, res: Response) => {
  return new GetCampaignBySlugController().handle(req, res)
})

campaignRoutes.patch("/publish/:campaign_id", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new PublishCampaignController().handle(req, res)
})
