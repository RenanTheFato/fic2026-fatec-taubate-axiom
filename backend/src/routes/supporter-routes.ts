import { Router, Request, Response } from "express";
import { ListSupportersController } from "../controllers/supporter/list-supporters-controller.js";
import { ListCampaignSupportersController } from "../controllers/supporter/list-campaign-supporters-controller.js";
import { ListEventSupportersController } from "../controllers/supporter/list-event-supporters-controller.js";

export const supporterRoutes = Router()

// Público. Sai só o nome de quem marcou que queria aparecer, em ordem aleatória, e nunca o valor:
// as regras estão no ListSupportersService.

supporterRoutes.get("/list", async (req: Request, res: Response) => {
  return new ListSupportersController().handle(req, res)
})

supporterRoutes.get("/campaign/:slug", async (req: Request, res: Response) => {
  return new ListCampaignSupportersController().handle(req, res)
})

supporterRoutes.get("/event/:slug", async (req: Request, res: Response) => {
  return new ListEventSupportersController().handle(req, res)
})
